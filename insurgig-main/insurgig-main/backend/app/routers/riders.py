from __future__ import annotations

import random
import string
from datetime import date, datetime, timedelta

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.bootstrap import ensure_mutual_seed, generate_upi, seed_zones, zone_by_name
from app.config import settings
from app.database import get_db
from app.ml_inference import predict_tier
from app.models import Claim, MutualAidEntry, OtpChallenge, PolicyWeek, Rider, ScheduledEvent
from app.phone_util import mask_phone, normalize_phone
from app.schemas import OtpSendBody, OtpVerifyBody, RiderAccountOut, RiderCreate, RiderOut
from app.services.forecast_display import build_forecast_entries
from app.services.onboarding_chat import render_onboarding_messages
from app.services.trigger_service import evaluate_all_triggers, summarize_triggers
from app.tier_config import compute_weekly_premium, tier_premium_cap_coverage

router = APIRouter(prefix="/riders", tags=["riders"])


def _week_monday(d: date | None = None) -> date:
    today = d or date.today()
    return today - timedelta(days=today.weekday())


def _week_payment_state(r: Rider, db: Session) -> tuple[bool, float]:
    if not (r.phone and r.phone_verified):
        return True, 0.0
    monday = _week_monday()
    pw = (
        db.query(PolicyWeek)
        .filter(PolicyWeek.rider_id == r.id, PolicyWeek.week_start == monday)
        .one_or_none()
    )
    if pw is None:
        return True, 0.0
    if pw.paid:
        return True, 0.0
    return False, float(r.premium)


def _to_account_out(r: Rider, db: Session) -> RiderAccountOut:
    paid, out = _week_payment_state(r, db)
    base = RiderOut.model_validate(r).model_dump()
    return RiderAccountOut(
        **base,
        phone_masked=mask_phone(r.phone),
        current_week_premium_paid=paid,
        outstanding_premium=out,
    )


def _purge_expired_otp(db: Session) -> None:
    db.query(OtpChallenge).filter(OtpChallenge.expires_at < datetime.utcnow()).delete()
    db.commit()


@router.post("/login/otp/send")
def rider_login_otp_send(body: OtpSendBody, db: Session = Depends(get_db)):
    """Send OTP only if a rider account exists for this mobile (login flow)."""
    try:
        phone = normalize_phone(body.phone)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    if not db.query(Rider).filter(Rider.phone == phone).first():
        raise HTTPException(404, "No account found for this mobile number")
    _purge_expired_otp(db)
    db.query(OtpChallenge).filter(OtpChallenge.phone == phone).delete()
    db.commit()
    code = "".join(random.choices(string.digits, k=6))
    exp = datetime.utcnow() + timedelta(seconds=settings.otp_ttl_seconds)
    db.add(OtpChallenge(phone=phone, code=code, expires_at=exp))
    db.commit()
    resp: dict = {"ok": True, "expires_in": settings.otp_ttl_seconds}
    if settings.expose_otp_in_response:
        resp["demo_otp"] = code
    return resp


@router.post("/login/verify", response_model=RiderAccountOut)
def rider_login_verify(body: OtpVerifyBody, db: Session = Depends(get_db)):
    try:
        phone = normalize_phone(body.phone)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    row = (
        db.query(OtpChallenge)
        .filter(OtpChallenge.phone == phone, OtpChallenge.code == body.code.strip())
        .one_or_none()
    )
    if not row or row.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired code")
    db.delete(row)
    db.commit()
    rider = db.query(Rider).filter(Rider.phone == phone).one_or_none()
    if not rider:
        raise HTTPException(404, "Account not found")
    seed_zones(db)
    db.refresh(rider)
    return _to_account_out(rider, db)


@router.post("/register", response_model=RiderAccountOut)
def register_rider(body: RiderCreate, db: Session = Depends(get_db)):
    from app.routers.auth import decode_phone_verification_token

    seed_zones(db)
    try:
        phone = normalize_phone(body.phone)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    verified_phone = decode_phone_verification_token(body.verification_token)
    if verified_phone != phone:
        raise HTTPException(400, "Phone number does not match OTP verification")

    if db.query(Rider).filter(Rider.phone == phone).first():
        raise HTTPException(409, "This mobile number already has an account")

    z = zone_by_name(db, body.zone)
    if not z:
        raise HTTPException(400, f"Unknown zone: {body.zone}")

    zones_count = min(7, max(1, int(2 + body.weekly_hours // 12)))
    session_hours = min(14.0, max(2.0, body.weekly_hours / 5.0))
    tier = predict_tier(body.weekly_hours, body.monthly_earnings, zones_count, session_hours, body.tenure_weeks)
    _, cap, cov_pct = tier_premium_cap_coverage(tier)
    premium = compute_weekly_premium(tier, z.risk_multiplier, body.tenure_weeks)

    upi = body.upi_id.strip() or generate_upi(body.name)

    rider = Rider(
        name=body.name,
        zone=body.zone,
        city=z.city,
        platform=body.platform,
        weekly_hours=body.weekly_hours,
        monthly_earnings=body.monthly_earnings,
        tenure_weeks=body.tenure_weeks,
        tier=tier,
        premium=premium,
        coverage_cap=cap,
        coverage_pct=cov_pct,
        upi_id=upi,
        phone=phone,
        phone_verified=True,
        device_family_hash=body.device_family_hash or "",
        last_week_avg_earnings_4h=max(120.0, body.monthly_earnings / 48.0),
    )
    db.add(rider)
    db.commit()
    db.refresh(rider)

    monday = _week_monday()
    for i in range(4):
        ws = monday - timedelta(weeks=i)
        adj = round(premium * (1 - 0.018 * i), 2)
        is_current_week = i == 0
        db.add(PolicyWeek(rider_id=rider.id, week_start=ws, premium=adj, tier=tier, paid=not is_current_week))
    db.commit()
    ensure_mutual_seed(db)
    db.refresh(rider)
    return _to_account_out(rider, db)


@router.get("/{public_id}/onboarding-chat")
def rider_onboarding_chat(public_id: str, db: Session = Depends(get_db)):
    r = db.query(Rider).filter(Rider.public_id == public_id).one_or_none()
    if not r:
        raise HTTPException(404, "Rider not found")
    return {"messages": render_onboarding_messages(r.name, r.zone, r.city, r.premium, r.coverage_cap, r.upi_id)}


@router.post("/{public_id}/pay-week-premium")
def pay_week_premium(public_id: str, db: Session = Depends(get_db)):
    r = db.query(Rider).filter(Rider.public_id == public_id).one_or_none()
    if not r:
        raise HTTPException(404, "Rider not found")
    monday = _week_monday()
    pw = (
        db.query(PolicyWeek)
        .filter(PolicyWeek.rider_id == r.id, PolicyWeek.week_start == monday)
        .one_or_none()
    )
    if pw is None:
        pw = PolicyWeek(
            rider_id=r.id,
            week_start=monday,
            premium=r.premium,
            tier=r.tier,
            paid=False,
        )
        db.add(pw)
        db.flush()
    if pw.paid:
        db.commit()
        return {"ok": True, "already_paid": True, "amount": 0.0}

    pw.paid = True
    r.last_premium_payment_at = datetime.utcnow()

    exists_ma = (
        db.query(MutualAidEntry)
        .filter(MutualAidEntry.rider_id == r.id, MutualAidEntry.week_start == monday)
        .first()
    )
    if not exists_ma:
        db.add(
            MutualAidEntry(
                zone_name=r.zone,
                rider_id=r.id,
                week_start=monday,
                amount=round(r.premium * 0.1, 2),
            )
        )
    db.commit()
    return {"ok": True, "already_paid": False, "amount": float(pw.premium)}


@router.get("/{public_id}", response_model=RiderAccountOut)
def get_rider(public_id: str, db: Session = Depends(get_db)):
    r = db.query(Rider).filter(Rider.public_id == public_id).one_or_none()
    if not r:
        raise HTTPException(404, "Rider not found")
    return _to_account_out(r, db)


@router.get("/{public_id}/dashboard")
async def rider_dashboard(public_id: str, db: Session = Depends(get_db)):
    r = db.query(Rider).filter(Rider.public_id == public_id).one_or_none()
    if not r:
        raise HTTPException(404, "Rider not found")
    z = zone_by_name(db, r.zone)
    if not z:
        raise HTTPException(400, "Zone missing")

    trig_rows = await evaluate_all_triggers(db, z.city, r.zone, z.lat, z.lon)
    summary = summarize_triggers(trig_rows)

    until = date.today() + timedelta(days=7)
    rider_city = z.city
    upcoming = (
        db.query(ScheduledEvent)
        .filter(
            ScheduledEvent.event_date >= date.today(),
            ScheduledEvent.event_date <= until,
            ScheduledEvent.armed.is_(True),
        )
        .filter(or_(ScheduledEvent.city == "", ScheduledEvent.city == rider_city))
        .order_by(ScheduledEvent.event_date.asc())
        .all()
    )
    forecast = build_forecast_entries(upcoming, rider_city)

    claims_m = int(db.query(func.count(Claim.id)).filter(Claim.rider_id == r.id, Claim.status == "paid").scalar() or 0)
    pool = (
        db.query(func.coalesce(func.sum(MutualAidEntry.amount), 0.0))
        .filter(MutualAidEntry.zone_name == r.zone)
        .scalar()
    )

    return {
        "rider": _to_account_out(r, db).model_dump(),
        "triggers": summary,
        "risk_forecast": forecast,
        "stats": {
            "claims_paid": claims_m,
            "weeks_covered": max(1, r.tenure_weeks),
            "earned_month_proxy": round(r.monthly_earnings * 0.18, 2),
        },
        "mutual_aid_pool_zone": float(pool or 0),
    }


@router.get("/{public_id}/premium-history")
def premium_history(public_id: str, db: Session = Depends(get_db)):
    r = db.query(Rider).filter(Rider.public_id == public_id).one_or_none()
    if not r:
        raise HTTPException(404, "Rider not found")
    rows = (
        db.query(PolicyWeek)
        .filter(PolicyWeek.rider_id == r.id)
        .order_by(PolicyWeek.week_start.desc())
        .limit(8)
        .all()
    )
    from app.tier_config import load_tiers

    tiers = load_tiers()
    return [
        {
            "week_start": row.week_start.isoformat(),
            "tier_label": tiers.get(row.tier, {}).get("label", row.tier),
            "amount": row.premium,
            "status": "Paid" if row.paid else "Due",
        }
        for row in rows
    ]


@router.get("/{public_id}/earnings")
def earnings_insights(public_id: str, db: Session = Depends(get_db)):
    r = db.query(Rider).filter(Rider.public_id == public_id).one_or_none()
    if not r:
        raise HTTPException(404, "Rider not found")
    rng = np.random.default_rng(abs(hash(r.public_id)) % (2**32))
    base = max(80.0, r.monthly_earnings / 48.0)
    series = []
    for i in range(8):
        noise = float(rng.normal(0, base * 0.04))
        series.append(
            {"week": f"W{i + 1}", "value": round(max(50.0, base * (0.78 + i * 0.028) + noise), 2)}
        )
    series[-1]["value"] = round(base, 2)
    last_claim = (
        db.query(Claim).filter(Claim.rider_id == r.id).order_by(Claim.created_at.desc()).first()
    )
    if last_claim and last_claim.status == "paid":
        ratio = min(1.0, last_claim.actual_income / max(1.0, last_claim.baseline_income))
        recovery_pct = round(max(0.35, 1.0 - ratio) * 100, 1)
    else:
        recovery_pct = 100.0
    return {
        "baseline_per_4h": round(base, 2),
        "series": series,
        "recovery_pct": recovery_pct,
        "last_disruption": last_claim.created_at.date().isoformat() if last_claim else None,
    }
