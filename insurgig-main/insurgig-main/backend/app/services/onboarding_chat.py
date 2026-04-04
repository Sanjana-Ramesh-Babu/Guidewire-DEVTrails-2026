from __future__ import annotations

import json
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent / "data" / "whatsapp_onboarding.json"


def load_onboarding_template() -> dict:
    with open(_DATA, encoding="utf-8") as f:
        return json.load(f)


def render_onboarding_messages(
    name: str,
    zone: str,
    city: str,
    premium: float,
    coverage_cap: float,
    upi_id: str,
) -> list[dict]:
    data = load_onboarding_template()
    out: list[dict] = []
    ctx = {
        "name": name,
        "zone": zone,
        "city": city,
        "premium": f"{premium:.0f}",
        "coverage_cap": f"{coverage_cap:,.0f}",
        "upi_id": upi_id,
    }
    for row in data.get("messages", []):
        tpl = row.get("template", "")
        text = tpl
        for k, v in ctx.items():
            text = text.replace("{{" + k + "}}", v)
        msg: dict = {"from": row["from"], "text": text}
        if row.get("button"):
            msg["button"] = row["button"]
        out.append(msg)
    return out
