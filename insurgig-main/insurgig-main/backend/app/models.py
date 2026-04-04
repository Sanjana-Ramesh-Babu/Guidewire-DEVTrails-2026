import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    city: Mapped[str] = mapped_column(String(64), index=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    risk_multiplier: Mapped[float] = mapped_column(Float, default=1.0)


class Rider(Base):
    __tablename__ = "riders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=_uuid, index=True)
    name: Mapped[str] = mapped_column(String(256))
    zone: Mapped[str] = mapped_column(String(128), index=True)
    city: Mapped[str] = mapped_column(String(64), index=True)
    platform: Mapped[str] = mapped_column(String(32))
    weekly_hours: Mapped[float] = mapped_column(Float)
    monthly_earnings: Mapped[float] = mapped_column(Float)
    tenure_weeks: Mapped[int] = mapped_column(Integer, default=1)
    tier: Mapped[str] = mapped_column(String(32))
    premium: Mapped[float] = mapped_column(Float)
    coverage_cap: Mapped[float] = mapped_column(Float)
    coverage_pct: Mapped[float] = mapped_column(Float)
    upi_id: Mapped[str] = mapped_column(String(128))
    phone: Mapped[str | None] = mapped_column(String(24), nullable=True, index=True)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_premium_payment_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    device_family_hash: Mapped[str] = mapped_column(String(64), default="")
    trust_bonus: Mapped[int] = mapped_column(Integer, default=0)
    claims_submitted: Mapped[int] = mapped_column(Integer, default=0)
    claims_approved: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_week_avg_earnings_4h: Mapped[float] = mapped_column(Float, default=0.0)


class OtpChallenge(Base):
    __tablename__ = "otp_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(String(24), index=True)
    code: Mapped[str] = mapped_column(String(8))
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ScheduledEvent(Base):
    __tablename__ = "scheduled_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_date: Mapped[date] = mapped_column(Date, index=True)
    event_type: Mapped[str] = mapped_column(String(64))
    title: Mapped[str] = mapped_column(String(256))
    city: Mapped[str] = mapped_column(String(64), default="")
    armed: Mapped[bool] = mapped_column(Boolean, default=True)


class ZoneAlert(Base):
    __tablename__ = "zone_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_name: Mapped[str] = mapped_column(String(128), index=True)
    alert_type: Mapped[str] = mapped_column(String(64))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, default="")


class ZoneMetrics(Base):
    __tablename__ = "zone_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    restaurant_density_pct: Mapped[float] = mapped_column(Float, default=92.0)
    avg_pickup_wait_min: Mapped[float] = mapped_column(Float, default=12.0)
    order_velocity_ratio: Mapped[float] = mapped_column(Float, default=1.0)
    rider_to_order_ratio: Mapped[float] = mapped_column(Float, default=1.0)
    fuel_stress_index: Mapped[float] = mapped_column(Float, default=0.15)
    grid_outage_hours: Mapped[float] = mapped_column(Float, default=0.0)
    platform_activity_ratio: Mapped[float] = mapped_column(Float, default=1.0)
    app_outage_minutes: Mapped[float] = mapped_column(Float, default=0.0)
    telecom_blackout: Mapped[float] = mapped_column(Float, default=0.0)
    traffic_delay_ratio: Mapped[float] = mapped_column(Float, default=1.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TriggerOverride(Base):
    __tablename__ = "trigger_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trigger_id: Mapped[str] = mapped_column(String(8), index=True)
    zone_name: Mapped[str] = mapped_column(String(128), default="*")
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)


class TriggerAudit(Base):
    __tablename__ = "trigger_audit"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    operator: Mapped[str] = mapped_column(String(128))
    trigger_id: Mapped[str] = mapped_column(String(8))
    action: Mapped[str] = mapped_column(String(64))
    reason: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=_uuid, index=True)
    rider_id: Mapped[int] = mapped_column(ForeignKey("riders.id"), index=True)
    zone: Mapped[str] = mapped_column(String(128))
    city: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="processing")
    routing: Mapped[str] = mapped_column(String(32), default="soft_hold")
    tcs_score: Mapped[float] = mapped_column(Float, nullable=True)
    payout_amount: Mapped[float] = mapped_column(Float, default=0.0)
    baseline_income: Mapped[float] = mapped_column(Float, default=0.0)
    actual_income: Mapped[float] = mapped_column(Float, default=0.0)
    severity_multiplier: Mapped[float] = mapped_column(Float, default=1.0)
    fired_trigger_ids: Mapped[list | None] = mapped_column(JSON, default=None)
    breakdown: Mapped[dict | None] = mapped_column(JSON, default=None)
    signals: Mapped[dict | None] = mapped_column(JSON, default=None)
    ring_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    rider_note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    rider = relationship("Rider")


class FraudRingAlert(Base):
    __tablename__ = "fraud_ring_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=_uuid)
    zone_name: Mapped[str] = mapped_column(String(128))
    window_started: Mapped[datetime] = mapped_column(DateTime)
    claim_count: Mapped[int] = mapped_column(Integer)
    density_score: Mapped[float] = mapped_column(Float)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MutualAidEntry(Base):
    __tablename__ = "mutual_aid_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_name: Mapped[str] = mapped_column(String(128), index=True)
    rider_id: Mapped[int] = mapped_column(ForeignKey("riders.id"), nullable=True)
    week_start: Mapped[date] = mapped_column(Date)
    amount: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PolicyWeek(Base):
    __tablename__ = "policy_weeks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rider_id: Mapped[int] = mapped_column(ForeignKey("riders.id"), index=True)
    week_start: Mapped[date] = mapped_column(Date, index=True)
    premium: Mapped[float] = mapped_column(Float)
    tier: Mapped[str] = mapped_column(String(32))
    paid: Mapped[bool] = mapped_column(Boolean, default=True)
