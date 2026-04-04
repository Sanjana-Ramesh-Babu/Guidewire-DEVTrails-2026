from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

import httpx
import numpy as np
from sqlalchemy.orm import Session

from app.config import settings
from app.ml_inference import soft_trigger_probs, stack_multiplier
from app.models import ScheduledEvent, TriggerOverride, ZoneAlert, ZoneMetrics


@dataclass
class TriggerRow:
    id: str
    name: str
    category: str
    fired: bool
    severity: float
    detail: str
    source: str


def _override_blocks(db: Session, trigger_id: str, zone: str) -> bool:
    q = (
        db.query(TriggerOverride)
        .filter(TriggerOverride.trigger_id == trigger_id, TriggerOverride.disabled.is_(True))
        .all()
    )
    for o in q:
        if o.zone_name == "*" or o.zone_name == zone:
            return True
    return False


async def fetch_openweather(city: str) -> dict[str, Any]:
    key = settings.openweather_api_key
    if not key:
        return {}
    async with httpx.AsyncClient(timeout=12.0) as client:
        r = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": f"{city},IN", "appid": key, "units": "metric"},
        )
        if r.status_code != 200:
            return {}
        return r.json()


async def fetch_aqicn(lat: float, lon: float) -> float | None:
    tok = settings.aqicn_token
    if not tok:
        return None
    async with httpx.AsyncClient(timeout=12.0) as client:
        r = await client.get(
            f"https://api.waqi.info/feed/geo:{lat};{lon}/",
            params={"token": tok},
        )
        if r.status_code != 200:
            return None
        data = r.json()
        try:
            return float(data["data"]["aqi"])
        except (KeyError, TypeError, ValueError):
            return None


def get_zone_metrics_row(db: Session, zone: str) -> ZoneMetrics:
    row = db.query(ZoneMetrics).filter(ZoneMetrics.zone_name == zone).one_or_none()
    if row is None:
        row = ZoneMetrics(zone_name=zone)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def refresh_zone_metrics_simulation(db: Session, zone: str) -> ZoneMetrics:
    """Time-varying pseudo-live metrics (deterministic per hour) — no static UI numbers."""
    row = get_zone_metrics_row(db, zone)
    h = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    seed = hash(f"{zone}:{h.isoformat()}") % (2**31)
    rng = np.random.default_rng(seed)
    row.restaurant_density_pct = float(rng.uniform(55, 99))
    row.avg_pickup_wait_min = float(rng.uniform(8, 22))
    row.order_velocity_ratio = float(rng.uniform(0.25, 1.08))
    row.rider_to_order_ratio = float(rng.uniform(0.75, 2.1))
    row.fuel_stress_index = float(rng.uniform(0, 0.95))
    row.grid_outage_hours = float(rng.uniform(0, 3.5))
    row.platform_activity_ratio = float(rng.uniform(0.05, 1.0))
    row.app_outage_minutes = float(rng.uniform(0, 45))
    row.telecom_blackout = float(rng.uniform(0, 0.25))
    row.traffic_delay_ratio = float(rng.uniform(0.9, 1.55))
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


async def evaluate_all_triggers(db: Session, city: str, zone: str, lat: float, lon: float) -> list[TriggerRow]:
    owm = await fetch_openweather(city)
    rain_mm = float((owm.get("rain") or {}).get("1h", 0) or 0)
    temp_c = float(owm.get("main", {}).get("temp", 28) or 28)
    visibility_m = float(owm.get("visibility", 10000) or 10000)
    wind_ms = float(owm.get("wind", {}).get("speed", 0) or 0)
    wind_kph = wind_ms * 3.6
    heat_index_proxy = temp_c

    aqi = await fetch_aqicn(lat, lon)
    if aqi is None:
        aqi = float(owm.get("main", {}).get("humidity", 40) or 40)  # weak proxy only if no AQICN

    zm = get_zone_metrics_row(db, zone)
    metrics_vec = np.array(
        [
            zm.restaurant_density_pct,
            zm.order_velocity_ratio,
            zm.rider_to_order_ratio,
            zm.fuel_stress_index,
            zm.grid_outage_hours,
            zm.platform_activity_ratio,
            zm.app_outage_minutes,
            zm.telecom_blackout,
        ],
        dtype=float,
    )
    soft_p = soft_trigger_probs(metrics_vec)

    today = date.today()
    rows: list[TriggerRow] = []

    def add(t: TriggerRow):
        if _override_blocks(db, t.id, zone):
            rows.append(
                TriggerRow(
                    t.id,
                    t.name,
                    t.category,
                    False,
                    1.0,
                    "Manually disarmed for this zone",
                    t.source + " (override)",
                )
            )
        else:
            rows.append(t)

    t1_fired = rain_mm >= 40 or (aqi is not None and aqi >= 300) or heat_index_proxy >= 42 or visibility_m < 50
    if not owm and not settings.openweather_api_key:
        t1_fired = False
        heat_index_proxy = temp_c
    sev = 2.0 if rain_mm >= 40 or heat_index_proxy >= 42 or (aqi and aqi >= 300) else 1.4 if t1_fired else 1.0
    add(
        TriggerRow(
            "T1",
            "Extreme weather",
            "Environmental",
            bool(t1_fired),
            sev,
            f"Rain {rain_mm:.1f}mm/h, AQI {aqi if aqi is not None else 'n/a'}, temp {temp_c:.1f}°C, vis {visibility_m:.0f}m, wind {wind_kph:.0f}km/h",
            "OpenWeatherMap + AQICN",
        )
    )

    flood_proxy = rain_mm >= 25 and zm.traffic_delay_ratio >= 1.35
    add(
        TriggerRow(
            "T2",
            "Urban road flooding",
            "Environmental",
            flood_proxy,
            1.6 if flood_proxy else 1.0,
            f"Rain accumulation + traffic delay ratio {zm.traffic_delay_ratio:.2f} vs baseline 1.0",
            "OpenWeatherMap + zone traffic index",
        )
    )

    cyclone_armed = (
        db.query(ScheduledEvent)
        .filter(
            ScheduledEvent.event_type == "cyclone_watch",
            ScheduledEvent.armed.is_(True),
            ScheduledEvent.event_date >= today,
            ScheduledEvent.event_date <= today + timedelta(days=2),
        )
        .first()
    ) is not None
    add(
        TriggerRow(
            "T3",
            "Natural disaster alert",
            "Environmental",
            cyclone_armed,
            2.2 if cyclone_armed else 1.0,
            "IMD / scheduled cyclone watch entries in system" if cyclone_armed else "No armed cyclone watch in DB",
            settings.imd_alerts_url or "Scheduled events (DB)",
        )
    )

    t4_fired = zm.avg_pickup_wait_min >= 18 and zm.traffic_delay_ratio >= 1.2
    add(
        TriggerRow(
            "T4",
            "Zone friction / dead-time",
            "Environmental",
            t4_fired,
            1.35 if t4_fired else 1.0,
            f"Pickup wait {zm.avg_pickup_wait_min:.1f} min, congestion {zm.traffic_delay_ratio:.2f}x",
            "Mock restaurant delay + traffic index",
        )
    )

    curfew = (
        db.query(ZoneAlert)
        .filter(ZoneAlert.zone_name == zone, ZoneAlert.alert_type == "curfew", ZoneAlert.active.is_(True))
        .first()
    ) is not None
    add(
        TriggerRow(
            "T5",
            "Civic curfew / strike",
            "Social",
            curfew,
            1.8 if curfew else 1.0,
            "Active curfew flag for zone" if curfew else "No active curfew record",
            "Zone alerts (DB) + news ingestion placeholder",
        )
    )

    pandemic = (
        db.query(ZoneAlert)
        .filter(ZoneAlert.zone_name == zone, ZoneAlert.alert_type == "pandemic", ZoneAlert.active.is_(True))
        .first()
    ) is not None
    add(
        TriggerRow(
            "T6",
            "Pandemic / containment zone",
            "Social",
            pandemic,
            2.5 if pandemic else 1.0,
            "Category A — movement restriction" if pandemic else "No containment flag",
            "Government feed placeholder (DB)",
        )
    )

    dry = (
        db.query(ScheduledEvent)
        .filter(
            ScheduledEvent.event_type == "eci_dry_day",
            ScheduledEvent.event_date == today,
            ScheduledEvent.armed.is_(True),
        )
        .filter((ScheduledEvent.city == "") | (ScheduledEvent.city == city))
        .first()
    ) is not None
    add(
        TriggerRow(
            "T7",
            "Election / dry day restriction",
            "Social",
            dry,
            1.8 if dry else 1.0,
            "ECI-style dry day scheduled in system for today" if dry else f"No dry day for {today.isoformat()}",
            "Scheduled events (DB) — configure via Ops API",
        )
    )

    festival = (
        db.query(ZoneAlert)
        .filter(ZoneAlert.zone_name == zone, ZoneAlert.alert_type == "festival_closure", ZoneAlert.active.is_(True))
        .first()
    ) is not None
    add(
        TriggerRow(
            "T8",
            "Festival road closures",
            "Social",
            festival,
            1.5 if festival else 1.0,
            "Municipal / festival closure active" if festival else "No festival closure flag",
            "Municipal API placeholder (DB)",
        )
    )

    reg_ban = (
        db.query(ZoneAlert)
        .filter(ZoneAlert.zone_name == zone, ZoneAlert.alert_type == "vehicle_ban", ZoneAlert.active.is_(True))
        .first()
    ) is not None
    add(
        TriggerRow(
            "T9",
            "Regulatory vehicle ban",
            "Social",
            reg_ban,
            1.6 if reg_ban else 1.0,
            "Odd-even / VIP corridor (DB)" if reg_ban else "No ban flag",
            "Traffic advisory placeholder (DB)",
        )
    )

    for tid, name in [
        ("T10", "Fuel / CNG shortage"),
        ("T11", "LPG shortage cascade"),
        ("T12", "Peak hour demand collapse"),
        ("T13", "Labour oversupply surge"),
        ("T14", "Power grid outage"),
        ("T15", "Internet / telecom blackout"),
        ("T16", "Platform app outage"),
    ]:
        p = soft_p.get(tid, 0.0)
        fired = p >= settings.soft_trigger_threshold
        add(
            TriggerRow(
                tid,
                name,
                "Economic" if tid in ("T10", "T11", "T12", "T13") else "Infrastructure",
                fired,
                1.45 if fired else 1.0,
                f"Soft ML probability {p:.2f} (threshold {settings.soft_trigger_threshold})",
                "Gradient boosted multi-output (T10–T16)",
            )
        )

    return rows


def summarize_triggers(rows: list[TriggerRow]) -> dict[str, Any]:
    fired = [t for t in rows if t.fired]
    has_t6 = any(t.id == "T6" for t in fired)
    mult = stack_multiplier(len(fired), has_t6)
    return {
        "triggers": [t.__dict__ for t in rows],
        "fired_count": len(fired),
        "fired_ids": [t.id for t in fired],
        "stacked_multiplier": mult,
        "has_t6": has_t6,
    }
