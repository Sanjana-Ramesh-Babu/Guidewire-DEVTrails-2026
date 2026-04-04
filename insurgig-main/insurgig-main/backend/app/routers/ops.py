from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.bootstrap import seed_zones, zone_by_name
from app.config import settings
from app.database import get_db
from app.models import Claim, FraudRingAlert, Rider, ScheduledEvent, TriggerAudit, TriggerOverride, Zone, ZoneAlert
from app.schemas import AnalystAction, RingResolveBody, RiderOut, ScheduledEventCreate, TriggerToggleBody, ZoneAlertCreate
from app.services.trigger_service import evaluate_all_triggers, summarize_triggers

router = APIRouter(prefix="/ops", tags=["ops"])


@router.get("/overview")
def ops_overview(db: Session = Depends(get_db)):
    seed_zones(db)
    today = date.today()
    riders_n = db.query(func.count(Rider.id)).scalar() or 0
    claims_today = (
        db.query(func.count(Claim.id)).filter(func.date(Claim.created_at) == today).scalar() or 0
    )
    payouts_today = (
        db.query(func.coalesce(func.sum(Claim.payout_amount), 0.0))
        .filter(func.date(Claim.created_at) == today, Claim.status == "paid")
        .scalar()
        or 0.0
    )
    fraud_n = db.query(func.count(FraudRingAlert.id)).filter(FraudRingAlert.resolved.is_(False)).scalar() or 0
    analyst_n = (
        db.query(func.count(Claim.id))
        .filter(Claim.routing == "analyst_review", Claim.status == "processing")
        .scalar()
        or 0
    )
    pool = db.query(func.coalesce(func.sum(Rider.premium), 0.0)).scalar() or 0.0
    return {
        "active_riders": int(riders_n),
        "claims_today": int(claims_today),
        "payouts_today": float(payouts_today),
        "fraud_alerts_open": int(fraud_n),
        "analyst_queue_pending": int(analyst_n),
        "premium_pool_proxy": round(float(pool) * 0.1, 2),
    }


@router.get("/meta")
def ops_meta():
    """Runtime configuration exposed for the ops console (values come from environment / settings)."""
    return {
        "ring_window_minutes": settings.ring_window_minutes,
        "ring_claim_threshold": settings.ring_claim_threshold,
        "soft_trigger_threshold": settings.soft_trigger_threshold,
        "category_a_multiplier": settings.category_a_multiplier,
    }


@router.get("/riders")
def ops_riders_list(db: Session = Depends(get_db), limit: int = 500):
    rows = db.query(Rider).order_by(Rider.created_at.desc()).limit(min(max(1, limit), 2000)).all()
    out = []
    for r in rows:
        base = RiderOut.model_validate(r).model_dump()
        base.update(
            {
                "trust_bonus": r.trust_bonus,
                "claims_submitted": r.claims_submitted,
                "claims_approved": r.claims_approved,
                "created_at": r.created_at.isoformat(),
            }
        )
        out.append(base)
    return out


@router.get("/payouts/recent")
def recent_payouts(db: Session = Depends(get_db), limit: int = 20):
    rows = (
        db.query(Claim, Rider)
        .join(Rider, Claim.rider_id == Rider.id)
        .order_by(Claim.created_at.desc())
        .limit(limit)
        .all()
    )
    out = []
    for c, r in rows:
        ago = datetime.utcnow() - c.created_at
        mins = max(0, int(ago.total_seconds() // 60))
        out.append(
            {
                "rider": r.name,
                "amount": c.payout_amount,
                "trigger": ", ".join(c.fired_trigger_ids or []) or "—",
                "zone": c.zone,
                "time_ago_min": mins,
                "status": c.status,
            }
        )
    return out


@router.get("/triggers/status")
async def triggers_status_grid(db: Session = Depends(get_db), city: str | None = None):
    seed_zones(db)
    zones = db.query(Zone).all()
    if city:
        zones = [z for z in zones if z.city == city]
    agg: dict[str, dict] = {}
    for z in zones:
        rows = await evaluate_all_triggers(db, z.city, z.name, z.lat, z.lon)
        summ = summarize_triggers(rows)
        for t in summ["triggers"]:
            tid = t["id"]
            if tid not in agg:
                agg[tid] = {"trigger": tid, "name": t["name"], "category": t["category"], "active_zones": 0, "fired_zones": 0}
            agg[tid]["active_zones"] += 1
            if t["fired"]:
                agg[tid]["fired_zones"] += 1
    return list(agg.values())


@router.get("/trigger-overrides")
def list_trigger_overrides(db: Session = Depends(get_db)):
    rows = db.query(TriggerOverride).all()
    return [
        {"trigger_id": r.trigger_id, "zone_name": r.zone_name, "disabled": r.disabled} for r in rows
    ]


@router.post("/triggers/toggle")
def toggle_trigger(body: TriggerToggleBody, db: Session = Depends(get_db)):
    row = (
        db.query(TriggerOverride)
        .filter(TriggerOverride.trigger_id == body.trigger_id, TriggerOverride.zone_name == body.zone_name)
        .one_or_none()
    )
    if row:
        row.disabled = body.disabled
    else:
        row = TriggerOverride(trigger_id=body.trigger_id, zone_name=body.zone_name, disabled=body.disabled)
        db.add(row)
    db.add(
        TriggerAudit(
            operator=body.operator,
            trigger_id=body.trigger_id,
            action="disabled" if body.disabled else "enabled",
            reason=body.reason,
        )
    )
    db.commit()
    return {"ok": True}


@router.get("/triggers/audit")
def trigger_audit(db: Session = Depends(get_db), limit: int = 50):
    rows = db.query(TriggerAudit).order_by(TriggerAudit.created_at.desc()).limit(limit).all()
    return [
        {
            "time": r.created_at.isoformat(),
            "operator": r.operator,
            "trigger": r.trigger_id,
            "action": r.action,
            "reason": r.reason,
        }
        for r in rows
    ]


@router.post("/scheduled-events")
def add_scheduled_event(body: ScheduledEventCreate, db: Session = Depends(get_db)):
    e = ScheduledEvent(
        event_date=body.event_date,
        event_type=body.event_type,
        title=body.title,
        city=body.city,
        armed=body.armed,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"id": e.id}


@router.get("/scheduled-events")
def list_scheduled(db: Session = Depends(get_db)):
    rows = db.query(ScheduledEvent).order_by(ScheduledEvent.event_date.desc()).limit(100).all()
    return [
        {
            "id": r.id,
            "event_date": r.event_date.isoformat(),
            "event_type": r.event_type,
            "title": r.title,
            "city": r.city,
            "armed": r.armed,
        }
        for r in rows
    ]


@router.post("/zone-alerts")
def add_zone_alert(body: ZoneAlertCreate, db: Session = Depends(get_db)):
    z = ZoneAlert(zone_name=body.zone_name, alert_type=body.alert_type, active=body.active, notes=body.notes)
    db.add(z)
    db.commit()
    db.refresh(z)
    return {"id": z.id}


@router.get("/fraud-rings")
def fraud_rings(db: Session = Depends(get_db)):
    rows = db.query(FraudRingAlert).filter(FraudRingAlert.resolved.is_(False)).order_by(FraudRingAlert.created_at.desc()).all()
    return [
        {
            "public_id": r.public_id,
            "zone": r.zone_name,
            "claims": f"{r.claim_count} claims in window",
            "density": f"{r.density_score:.2f}",
            "accounts": r.claim_count,
            "created_at": r.created_at.isoformat(),
            "payload": r.payload,
        }
        for r in rows
    ]


@router.post("/fraud-rings/resolve")
def resolve_ring(body: RingResolveBody, db: Session = Depends(get_db)):
    r = db.query(FraudRingAlert).filter(FraudRingAlert.public_id == body.alert_public_id).one_or_none()
    if not r:
        raise HTTPException(404, "Alert not found")
    r.resolved = body.resolved
    db.commit()
    return {"ok": True}


@router.get("/analyst-queue")
def analyst_queue(db: Session = Depends(get_db)):
    rows = (
        db.query(Claim, Rider)
        .join(Rider, Claim.rider_id == Rider.id)
        .filter(Claim.routing == "analyst_review", Claim.status == "processing")
        .order_by(Claim.created_at.asc())
        .limit(100)
        .all()
    )
    out = []
    for c, r in rows:
        sigs = c.signals or {}
        out.append(
            {
                "claim_public_id": c.public_id,
                "rider": r.name,
                "trigger": ", ".join(c.fired_trigger_ids or []),
                "zone": c.zone,
                "tcs_score": c.tcs_score,
                "created_at": c.created_at.isoformat(),
                "signals_plain": [
                    {"name": "GPS precision high", "flag": sigs.get("gps_precision", 0) >= 0.95},
                    {"name": "IMU low variance", "flag": sigs.get("accel_variance", 2) < 0.5},
                    {"name": "Ring flagged", "flag": c.ring_flagged},
                ],
                "ring_flagged": c.ring_flagged,
            }
        )
    return out


@router.post("/analyst/action")
def analyst_action(body: AnalystAction, db: Session = Depends(get_db)):
    c = db.query(Claim).filter(Claim.public_id == body.claim_public_id).one_or_none()
    if not c:
        raise HTTPException(404, "Claim not found")
    rider = db.query(Rider).filter(Rider.id == c.rider_id).one()
    if body.action == "approve":
        loss = max(0.0, c.baseline_income - c.actual_income)
        payout = min(
            rider.coverage_cap,
            round(loss * rider.coverage_pct * c.severity_multiplier, 2),
        )
        c.payout_amount = payout
        c.status = "paid"
        rider.claims_approved += 1
        rider.trust_bonus = min(30, rider.trust_bonus + 10)
    else:
        c.status = "rejected"
        c.payout_amount = 0.0
    db.commit()
    return {"ok": True, "status": c.status, "payout_amount": c.payout_amount}


@router.post("/zone-metrics/refresh")
def refresh_metrics(zone: str, db: Session = Depends(get_db)):
    from app.services.trigger_service import refresh_zone_metrics_simulation

    refresh_zone_metrics_simulation(db, zone)
    return {"ok": True, "zone": zone}
