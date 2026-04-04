from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RiderCreate(BaseModel):
    name: str
    zone: str
    platform: str = Field(pattern="^(zomato|swiggy|both)$")
    weekly_hours: float
    monthly_earnings: float
    tenure_weeks: int = 1
    device_family_hash: str = ""
    phone: str
    upi_id: str = Field(min_length=3, max_length=128)
    verification_token: str

    @field_validator("upi_id")
    @classmethod
    def upi_shape(cls, v: str) -> str:
        s = v.strip()
        if "@" not in s:
            raise ValueError("UPI ID should look like name@bank or name@upi")
        return s


class OtpSendBody(BaseModel):
    phone: str


class OtpVerifyBody(BaseModel):
    phone: str
    code: str = Field(min_length=4, max_length=8)


class OtpVerifyResponse(BaseModel):
    token: str
    expires_in: int


class RiderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: str
    name: str
    zone: str
    city: str
    platform: str
    weekly_hours: float
    monthly_earnings: float
    tenure_weeks: int
    tier: str
    premium: float
    coverage_cap: float
    coverage_pct: float
    upi_id: str


class RiderAccountOut(RiderOut):
    phone_masked: str | None = None
    current_week_premium_paid: bool = True
    outstanding_premium: float = 0.0


class ClaimSignals(BaseModel):
    gps_precision: float = 0.7
    accel_variance: float = 2.0
    cell_tower_match_score: float = 1.0
    platform_session_score: float = 1.0
    claim_latency_sec: float = 300.0
    mock_location_enabled: bool = False


class ClaimCreate(BaseModel):
    rider_public_id: str
    signals: ClaimSignals = Field(default_factory=ClaimSignals)


class ClaimOut(BaseModel):
    public_id: str
    status: str
    routing: str
    tcs_score: float | None
    payout_amount: float
    baseline_income: float
    actual_income: float
    severity_multiplier: float
    fired_trigger_ids: list[str]
    breakdown: dict[str, Any]
    ring_flagged: bool
    triggers: list[dict[str, Any]] | None = None


class ScheduledEventCreate(BaseModel):
    event_date: date
    event_type: str
    title: str
    city: str = ""
    armed: bool = True


class ZoneAlertCreate(BaseModel):
    zone_name: str
    alert_type: str
    active: bool = True
    notes: str = ""


class TriggerToggleBody(BaseModel):
    trigger_id: str
    zone_name: str = "*"
    disabled: bool
    operator: str = "ops_console"
    reason: str = ""


class AnalystAction(BaseModel):
    claim_public_id: str
    action: str = Field(pattern="^(approve|reject)$")
    operator: str = "analyst"
    note: str = ""


class RingResolveBody(BaseModel):
    alert_public_id: str
    resolved: bool = True
