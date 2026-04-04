"""Build rider-scoped forecast lines from ScheduledEvent rows (city filter applied by caller)."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent / "data" / "forecast_event_labels.json"


@lru_cache
def _type_labels() -> dict[str, str]:
    with open(_DATA, encoding="utf-8") as f:
        return json.load(f)


def build_forecast_entries(events: list, rider_city: str) -> list[dict[str, str]]:
    labels = _type_labels()
    default_lab = labels.get("default", "Notice")
    seen: set[tuple[str, str, str, str]] = set()
    out: list[dict[str, str]] = []

    for e in events:
        key = (
            e.event_date.isoformat(),
            e.event_type or "",
            e.title or "",
            e.city or "",
        )
        if key in seen:
            continue
        seen.add(key)

        scope = (e.city or "").strip()
        place = scope if scope else rider_city
        raw_title = (e.title or "").strip()

        if scope:
            headline = raw_title or labels.get(e.event_type, default_lab)
            if place.lower() not in headline.lower():
                title = f"{headline} · {place}"
            else:
                title = headline
        else:
            base = raw_title
            if base:
                base = re.sub(r"\s*\([^)]*\)\s*$", "", base).strip()
            headline = base or labels.get(e.event_type, default_lab)
            title = f"{headline} · {rider_city}"

        out.append(
            {
                "date": e.event_date.isoformat(),
                "type": e.event_type or "",
                "title": title,
                "city": place,
            }
        )

    return out
