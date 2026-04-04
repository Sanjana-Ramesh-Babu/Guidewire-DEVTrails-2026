import json
from pathlib import Path

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.trigger_service import evaluate_all_triggers, summarize_triggers
from app.bootstrap import zone_by_name, seed_zones

router = APIRouter(prefix="/triggers", tags=["triggers"])
_CATALOG = Path(__file__).resolve().parents[1] / "data" / "triggers_catalog.json"


@router.get("/catalog")
def triggers_catalog():
    with open(_CATALOG, encoding="utf-8") as f:
        return json.load(f)


@router.get("/active")
async def triggers_active(city: str = Query(...), zone: str = Query(...), db: Session = Depends(get_db)):
    seed_zones(db)
    z = zone_by_name(db, zone)
    if not z:
        return {"error": f"unknown zone {zone}", "triggers": [], "fired_count": 0, "fired_ids": [], "stacked_multiplier": 1.0}
    rows = await evaluate_all_triggers(db, city, zone, z.lat, z.lon)
    return summarize_triggers(rows)
