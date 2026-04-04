"""Lightweight SQLite column adds for existing dev databases."""

from sqlalchemy import inspect, text

from app.database import Base


def ensure_schema(engine) -> None:
    Base.metadata.create_all(bind=engine)
    if not str(engine.url).startswith("sqlite"):
        return
    insp = inspect(engine)
    if "riders" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("riders")}
    alters: list[str] = []
    if "phone" not in cols:
        alters.append("ALTER TABLE riders ADD COLUMN phone VARCHAR(24)")
    if "phone_verified" not in cols:
        alters.append("ALTER TABLE riders ADD COLUMN phone_verified BOOLEAN DEFAULT 0")
    if "last_premium_payment_at" not in cols:
        alters.append("ALTER TABLE riders ADD COLUMN last_premium_payment_at DATETIME")
    if not alters:
        return
    with engine.begin() as conn:
        for stmt in alters:
            conn.execute(text(stmt))
