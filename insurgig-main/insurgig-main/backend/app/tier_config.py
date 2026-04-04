import json
from functools import lru_cache
from pathlib import Path

_DATA = Path(__file__).resolve().parent / "data" / "tiers.json"


@lru_cache
def load_tiers() -> dict:
    with open(_DATA, encoding="utf-8") as f:
        return json.load(f)


def tier_premium_cap_coverage(tier_key: str) -> tuple[float, float, float]:
    t = load_tiers().get(tier_key, load_tiers()["starter"])
    return t["weekly_premium"], t["coverage_cap"], t["coverage_pct"]


def compute_weekly_premium(tier_key: str, zone_risk: float, tenure_weeks: int) -> float:
    base, _, _ = tier_premium_cap_coverage(tier_key)
    tenure_discount = min(tenure_weeks * 0.004, 0.12)
    return round(base * zone_risk * (1 - tenure_discount), 2)
