from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.bootstrap import zone_by_name
from app.database import get_db
from app.ml_inference import predict_baseline, trust_score_from_isolation
from app.models import Claim, Rider
from app.schemas import ClaimCreate, ClaimOut
from app.services.ring_service import detect_ring_for_zone, maybe_create_ring_alert
from app.services.trigger_service import evaluate_all_triggers, refresh_zone_metrics_simulation, summarize_triggers

router = APIRouter(prefix="/claims", tags=["claims"])


def _resolve_baseline(
    rider: Rider,
    zone_risk: float,
    rain_mm: float,
    dow: int,
    hour_band: int,
    peak: int,
) -> tuple[float, str]:
    community = max(80.0, rider.monthly_earnings / 48.0)
    swiggy = rider.platform in ("swiggy", "both")
    ml = predict_baseline(
        dow,
        hour_band,
        zone_risk,
        rain_mm,
        swiggy,
        rider.tenure_weeks,
        rider.last_week_avg_earnings_4h or community,
        peak,
    )
    if rider.tenure_weeks < 2:
        return round(community * 0.95, 2), "zone_community"
    if rider.tenure_weeks < 7:
        return round(ml * 0.4 + community * 0.6, 2), "blended"
    return round(ml, 2), "personal_xgboost"


def _mock_actual(baseline: float, fired_count: int, order_vel: float) -> float:
    if fired_count == 0:
        return round(baseline * min(1.0, 0.82 + 0.12 * order_vel), 2)
    stress = min(1.0, fired_count * 0.22 + max(0.0, 1.0 - order_vel) * 0.45)
    return round(baseline * max(0.0, 0.08 + (1.0 - stress) * 0.35), 2)


@router.post("/submit", response_model=ClaimOut)
async def submit_claim(body: ClaimCreate, db: Session = Depends(get_db)):
    rider = db.query(Rider).filter(Rider.public_id == body.rider_public_id).one_or_none()
    if not rider:
        raise HTTPException(404, "Rider not found")

    today = date.today()
    existing = (
        db.query(Claim)
        .filter(Claim.rider_id == rider.id, func.date(Claim.created_at) == today)
        .first()
    )
    if existing:
        raise HTTPException(409, "One claim per calendar day — see existing claim")

    refresh_zone_metrics_simulation(db, rider.zone)
    z = zone_by_name(db, rider.zone)
    if not z:
        raise HTTPException(400, "Zone not found")

    trig_rows = await evaluate_all_triggers(db, z.city, rider.zone, z.lat, z.lon)
    summary = summarize_triggers(trig_rows)
    fired_ids = summary["fired_ids"]
    mult = float(summary["stacked_multiplier"])

    now = datetime.utcnow()
    dow = now.weekday()
    hour = now.hour
    hour_band = 0 if hour < 11 else 1 if hour < 15 else 2 if hour < 21 else 3
    peak = 1 if (11 <= hour <= 14) or (19 <= hour <= 22) else 0

    rain_mm = 0.0
    for t in summary["triggers"]:
        if t["id"] == "T1" and "Rain" in t["detail"]:
            try:
                rain_mm = float(t["detail"].split("Rain ")[1].split("mm")[0])
            except (IndexError, ValueError):
                rain_mm = 0.0

    baseline, baseline_src = _resolve_baseline(rider, z.risk_multiplier, rain_mm, dow, hour_band, peak)

    from app.services.trigger_service import get_zone_metrics_row

    zm = get_zone_metrics_row(db, rider.zone)
    actual = _mock_actual(baseline, len(fired_ids), zm.order_velocity_ratio)

    loss = max(0.0, baseline - actual)
    raw_payout = round(loss * rider.coverage_pct * mult, 2)
    payout = min(raw_payout, rider.coverage_cap)

    sig = body.signals
    if sig.mock_location_enabled:
        sig.gps_precision = 0.99

    suspicious, _, _ = detect_ring_for_zone(db, rider.zone)
    ring_flagged = suspicious
    if suspicious:
        maybe_create_ring_alert(db, rider.zone)
    ring_proxy = 1.0 if ring_flagged else 0.0

    trust_raw, tflags = trust_score_from_isolation(
        sig.gps_precision,
        sig.accel_variance,
        sig.cell_tower_match_score,
        sig.platform_session_score,
        sig.claim_latency_sec,
        1.0 if ring_flagged else 0.0,
    )
    trust = min(100.0, trust_raw + rider.trust_bonus)
    if ring_flagged:
        routing = "analyst_review"
        trust_display = min(trust, 35.0)
    elif rider.claims_submitted < 3:
        routing = "soft_hold"
        trust_display = trust
    elif trust > 75:
        routing = "auto_approve"
        trust_display = trust
    elif trust > 40:
        routing = "soft_hold"
        trust_display = trust
    else:
        routing = "analyst_review"
        trust_display = trust

    status = "paid" if routing == "auto_approve" else "processing"
    pay_amount = payout if status == "paid" else 0.0

    claim = Claim(
        rider_id=rider.id,
        zone=rider.zone,
        city=z.city,
        status=status,
        routing=routing,
        tcs_score=trust_display,
        payout_amount=pay_amount,
        baseline_income=baseline,
        actual_income=actual,
        severity_multiplier=mult,
        fired_trigger_ids=list(fired_ids),
        breakdown={
            "baseline_source": baseline_src,
            "loss": loss,
            "coverage_pct": rider.coverage_pct,
            "tier": rider.tier,
            "tcs_flags": tflags,
            "first_three_hold": rider.claims_submitted < 3,
            "expected_payout": payout,
        },
        signals=sig.model_dump(),
        ring_flagged=ring_flagged,
    )
    db.add(claim)
    rider.claims_submitted += 1
    if status == "paid":
        rider.claims_approved += 1
    db.commit()
    db.refresh(claim)

    return ClaimOut(
        public_id=claim.public_id,
        status=claim.status,
        routing=claim.routing,
        tcs_score=claim.tcs_score,
        payout_amount=payout,
        baseline_income=claim.baseline_income,
        actual_income=claim.actual_income,
        severity_multiplier=claim.severity_multiplier,
        fired_trigger_ids=list(fired_ids),
        breakdown=claim.breakdown or {},
        ring_flagged=ring_flagged,
        triggers=summary["triggers"],
    )


@router.post("/{claim_public_id}/finalize-soft-hold")
def finalize_soft_hold(claim_public_id: str, db: Session = Depends(get_db)):
    c = db.query(Claim).filter(Claim.public_id == claim_public_id).one_or_none()
    if not c:
        raise HTTPException(404, "Claim not found")
    if c.routing != "soft_hold" or c.status == "paid":
        raise HTTPException(400, "Claim not eligible for soft-hold finalization")
    rider = db.query(Rider).filter(Rider.id == c.rider_id).one()
    loss = max(0.0, c.baseline_income - c.actual_income)
    payout = min(
        rider.coverage_cap,
        round(loss * rider.coverage_pct * c.severity_multiplier, 2),
    )
    c.payout_amount = payout
    c.status = "paid"
    rider.claims_approved += 1
    db.commit()
    return {"ok": True, "status": c.status, "payout_amount": payout}


@router.get("/rider/{public_id}")
def list_claims(public_id: str, db: Session = Depends(get_db)):
    rider = db.query(Rider).filter(Rider.public_id == public_id).one_or_none()
    if not rider:
        raise HTTPException(404, "Rider not found")
    rows = db.query(Claim).filter(Claim.rider_id == rider.id).order_by(Claim.created_at.desc()).limit(50).all()
    return [
        {
            "public_id": c.public_id,
            "created_at": c.created_at.isoformat(),
            "status": c.status,
            "routing": c.routing,
            "payout_amount": c.payout_amount,
            "baseline_income": c.baseline_income,
            "actual_income": c.actual_income,
            "severity_multiplier": c.severity_multiplier,
            "fired_trigger_ids": c.fired_trigger_ids or [],
            "breakdown": c.breakdown or {},
        }
        for c in rows
    ]
