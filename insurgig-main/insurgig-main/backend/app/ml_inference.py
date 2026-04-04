from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np

from app.config import ARTIFACTS_DIR

_TIERS = ["starter", "casual", "fulltime", "power"]
_SOFT_IDS = ["T10", "T11", "T12", "T13", "T14", "T15", "T16"]


def _load(name: str):
    path = ARTIFACTS_DIR / name
    if not path.exists():
        return None
    return joblib.load(path)


def predict_baseline(
    dow: int,
    hour_band: int,
    zone_risk: float,
    rain_mm: float,
    platform_swiggy: bool,
    tenure_weeks: int,
    prior_week_avg: float,
    peak: int,
) -> float:
    model = _load("baseline_xgb.pkl")
    if model is None:
        return float(max(200, prior_week_avg * 0.95 + (1 - zone_risk) * 50))
    X = np.array(
        [[dow, hour_band, zone_risk, rain_mm, 1 if platform_swiggy else 0, tenure_weeks, prior_week_avg, peak]]
    )
    return float(max(0, model.predict(X)[0]))


def predict_tier(weekly_hours: float, monthly_earnings: float, zones_count: int, session_hours: float, tenure_weeks: int) -> str:
    model = _load("tier_lgbm.pkl")
    monthly_k = monthly_earnings / 1000.0
    if model is None:
        if weekly_hours >= 60 and monthly_earnings >= 25000:
            return "power"
        if weekly_hours >= 40 and monthly_earnings >= 15000:
            return "fulltime"
        if weekly_hours >= 20 and monthly_earnings >= 8000:
            return "casual"
        return "starter"
    X = np.array([[weekly_hours, monthly_k, zones_count, session_hours, tenure_weeks]])
    idx = int(model.predict(X)[0])
    idx = max(0, min(3, idx))
    return _TIERS[idx]


def trust_score_from_isolation(
    gps_precision: float,
    accel_variance: float,
    cell_match: float,
    session_regularity: float,
    claim_timing_sec: float,
    ring_proxy: float,
) -> tuple[float, list[str]]:
    model = _load("trust_iforest.pkl")
    flags: list[str] = []
    if model is None:
        s = 100.0
        if gps_precision >= 0.95:
            s -= 25
            flags.append("GPS precision unusually high")
        if accel_variance < 0.5:
            s -= 20
            flags.append("Low IMU variance")
        if cell_match < 0.5:
            s -= 25
            flags.append("Cell tower mismatch")
        if session_regularity < 0.5:
            s -= 20
            flags.append("Weak platform session signal")
        if claim_timing_sec < 90:
            s -= 15
            flags.append("Claim latency very short")
        s = max(0, min(100, s))
        return s, flags

    X = np.array([[gps_precision, accel_variance, cell_match, session_regularity, claim_timing_sec, ring_proxy]])
    raw = float(model.score_samples(X)[0])
    score = float(max(0, min(100, 42 + raw * 195)))
    pred = model.predict(X)[0]
    if pred == -1:
        score = min(score, 55.0)
        flags.append("Isolation Forest: outlier vs normal rider distribution")
    if gps_precision >= 0.95:
        flags.append("GPS precision unusually high")
    if accel_variance < 0.5:
        flags.append("Low IMU variance")
    return float(score), flags


def soft_trigger_probs(metrics_vector: np.ndarray) -> dict[str, float]:
    model = _load("soft_triggers_gbc.pkl")
    if model is None:
        return {tid: 0.0 for tid in _SOFT_IDS}
    X = metrics_vector.reshape(1, -1)
    proba_list = model.predict_proba(X)
    out = {}
    for i, tid in enumerate(_SOFT_IDS):
        arr = np.asarray(proba_list[i])
        out[tid] = float(arr[0, 1]) if arr.shape[1] > 1 else float(arr[0, 0])
    return out


def stack_multiplier(fired_count: int, has_t6: bool) -> float:
    if has_t6:
        return 2.5
    if fired_count >= 3:
        return min(2.5, 1.8 + 0.05 * fired_count)
    if fired_count == 2:
        return 1.4
    return 1.0
