import re
from datetime import date

from sqlalchemy.orm import Session

from app.models import MutualAidEntry, Zone, ZoneMetrics


def seed_zones(db: Session) -> None:
    if db.query(Zone).first():
        return
    rows = [
        ("Koramangala", "Bengaluru", 12.9352, 77.6245, 1.18),
        ("HSR Layout", "Bengaluru", 12.9116, 77.6473, 1.08),
        ("Whitefield", "Bengaluru", 12.9698, 77.7500, 0.92),
        ("Indiranagar", "Bengaluru", 12.9784, 77.6408, 1.0),
        ("Andheri", "Mumbai", 19.1136, 72.8697, 1.12),
        ("Anna Nagar", "Chennai", 13.0846, 80.2705, 1.05),
        ("Connaught Place", "Delhi", 28.6304, 77.2177, 1.1),
    ]
    for name, city, lat, lon, risk in rows:
        db.add(Zone(name=name, city=city, lat=lat, lon=lon, risk_multiplier=risk))
    db.commit()
    for name, *_ in rows:
        db.add(ZoneMetrics(zone_name=name))
    db.commit()


def zone_by_name(db: Session, name: str) -> Zone | None:
    return db.query(Zone).filter(Zone.name == name).one_or_none()


def generate_upi(name: str) -> str:
    first = re.sub(r"[^a-z]", "", (name.split()[0] if name else "rider").lower()) or "rider"
    suffix = abs(hash(name + first)) % 9000 + 1000
    return f"{first}{suffix}@upi"


def ensure_mutual_seed(db: Session) -> None:
    """Starting pool balances per zone (single seed row per zone)."""
    zones = [z.name for z in db.query(Zone).all()]
    today = date.today()
    for zn in zones:
        exists = db.query(MutualAidEntry).filter(MutualAidEntry.zone_name == zn).first()
        if not exists:
            db.add(MutualAidEntry(zone_name=zn, rider_id=None, week_start=today, amount=4200.0))
    db.commit()
