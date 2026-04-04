"""
Train and persist ML artifacts for InsurGig (synthetic data per README ranges).
Run from backend/: python scripts/train_models.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, IsolationForest
from sklearn.multioutput import MultiOutputClassifier

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)

RNG = np.random.default_rng(42)


def train_baseline_xgb():
    import xgboost as xgb

    n = 8000
    dow = RNG.integers(0, 7, n)
    hour_band = RNG.integers(0, 4, n)
    zone_tier = RNG.random(n) * 1.3 + 0.85
    rain = RNG.random(n) * 50
    platform = RNG.integers(0, 2, n)
    tenure = RNG.integers(1, 52, n)
    prior_week = RNG.normal(650, 180, n).clip(200, 2500)
    peak = RNG.integers(0, 2, n)

    base = (
        120
        + dow * 18
        + hour_band * 95
        + zone_tier * 220
        - rain * 2.8
        + platform * 45
        + np.log1p(tenure) * 35
        + prior_week * 0.12
        + peak * 140
    )
    noise = RNG.normal(0, 85, n)
    y = np.clip(base + noise, 80, 3200)

    X = np.column_stack([dow, hour_band, zone_tier, rain, platform, tenure, prior_week, peak])
    model = xgb.XGBRegressor(
        n_estimators=120,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.85,
        random_state=42,
    )
    model.fit(X, y)
    joblib.dump(model, ART / "baseline_xgb.pkl")
    joblib.dump(
        ["dow", "hour_band", "zone_tier", "rain_mm", "platform", "tenure_weeks", "prior_week_avg", "peak"],
        ART / "baseline_features.pkl",
    )
    print("Wrote baseline_xgb.pkl")


def train_tier_lgbm():
    from lightgbm import LGBMClassifier

    n = 5000
    hours = RNG.uniform(5, 70, n)
    monthly_k = RNG.uniform(8, 38, n)
    zones_n = RNG.integers(1, 8, n)
    session_h = RNG.uniform(2, 14, n)
    tenure = RNG.integers(1, 40, n)

    y = np.zeros(n, dtype=int)
    for i in range(n):
        if tenure[i] < 12 and hours[i] < 25:
            y[i] = 0  # starter
        elif hours[i] < 20:
            y[i] = 1  # casual
        elif hours[i] >= 60 and monthly_k[i] >= 25:
            y[i] = 3  # power
        elif hours[i] >= 38:
            y[i] = 2  # fulltime
        else:
            y[i] = 1

    X = np.column_stack([hours, monthly_k, zones_n, session_h, tenure])
    model = LGBMClassifier(
        n_estimators=120,
        learning_rate=0.05,
        num_leaves=31,
        random_state=42,
        verbose=-1,
    )
    model.fit(X, y)
    joblib.dump(model, ART / "tier_lgbm.pkl")
    joblib.dump(
        ["weekly_hours", "monthly_earnings_k", "zones_count", "session_hours", "tenure_weeks"],
        ART / "tier_features.pkl",
    )
    print("Wrote tier_lgbm.pkl")


def train_trust_isolation():
    n = 4000
    gps_precision = RNG.uniform(0.45, 0.88, n)
    accel_var = RNG.uniform(1.2, 4.5, n)
    cell_match = RNG.uniform(0.6, 1.0, n)
    session_reg = RNG.uniform(0.55, 1.0, n)
    claim_timing = RNG.uniform(120, 900, n)
    ring_proxy = RNG.uniform(0, 0.15, n)

    X = np.column_stack([gps_precision, accel_var, cell_match, session_reg, claim_timing, ring_proxy])
    model = IsolationForest(n_estimators=200, contamination=0.06, random_state=42)
    model.fit(X)
    joblib.dump(model, ART / "trust_iforest.pkl")
    joblib.dump(
        ["gps_precision", "accel_variance", "cell_match", "session_regularity", "claim_timing_sec", "ring_proxy"],
        ART / "trust_features.pkl",
    )
    print("Wrote trust_iforest.pkl")


def train_soft_triggers():
    n = 6000
    restaurant_density = RNG.uniform(35, 100, n)
    order_vel = RNG.uniform(0.2, 1.15, n)
    rider_ratio = RNG.uniform(0.7, 2.4, n)
    fuel = RNG.uniform(0, 1, n)
    grid = RNG.uniform(0, 4, n)
    plat_act = RNG.uniform(0, 1.05, n)
    app_out = RNG.uniform(0, 90, n)
    telecom = RNG.uniform(0, 1, n)

    X = np.column_stack(
        [restaurant_density, order_vel, rider_ratio, fuel, grid, plat_act, app_out, telecom]
    )

    def label_t10(row):
        return 1 if row[3] > 0.72 else 0

    def label_t11(row):
        return 1 if row[0] < 58 else 0

    def label_t12(row):
        return 1 if row[1] < 0.38 else 0

    def label_t13(row):
        return 1 if row[2] > 1.75 else 0

    def label_t14(row):
        return 1 if row[4] > 2.0 else 0

    def label_t15(row):
        return 1 if row[6] > 0.85 or row[5] < 0.08 else 0

    def label_t16(row):
        return 1 if row[5] > 0.35 and row[7] < 0.2 else 0

    Y = np.zeros((n, 7), dtype=int)
    for i in range(n):
        r = X[i]
        Y[i] = [
            label_t10(r),
            label_t11(r),
            label_t12(r),
            label_t13(r),
            label_t14(r),
            label_t15(r),
            label_t16(r),
        ]

    base = GradientBoostingClassifier(random_state=42, max_depth=4, n_estimators=80)
    model = MultiOutputClassifier(base)
    model.fit(X, Y)
    joblib.dump(model, ART / "soft_triggers_gbc.pkl")
    joblib.dump(
        [
            "restaurant_density_pct",
            "order_velocity_ratio",
            "rider_to_order_ratio",
            "fuel_stress",
            "grid_outage_h",
            "platform_activity_ratio",
            "app_outage_min",
            "telecom_blackout",
        ],
        ART / "soft_trigger_features.pkl",
    )
    print("Wrote soft_triggers_gbc.pkl")


if __name__ == "__main__":
    train_baseline_xgb()
    train_tier_lgbm()
    train_trust_isolation()
    train_soft_triggers()
    print("All models saved to", ART)
