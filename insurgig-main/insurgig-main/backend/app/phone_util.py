from __future__ import annotations

import re


def normalize_phone(raw: str) -> str:
    s = (raw or "").strip()
    digits = re.sub(r"\D", "", s)
    if len(digits) == 10:
        return "+91" + digits
    if len(digits) == 12 and digits.startswith("91"):
        return "+" + digits
    if len(digits) == 11 and digits.startswith("0"):
        return "+91" + digits[1:]
    if s.startswith("+") and len(digits) >= 10:
        return "+" + digits
    raise ValueError("Enter a valid 10-digit mobile number")


def mask_phone(phone: str | None) -> str | None:
    if not phone or len(phone) < 4:
        return None
    tail = phone[-4:]
    return f"{phone[:3]} **** {tail}" if len(phone) > 7 else f"****{tail}"
