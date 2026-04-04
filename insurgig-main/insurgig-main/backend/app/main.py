from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.bootstrap import ensure_mutual_seed, seed_zones
from app.config import settings
from app.database import engine, get_db
from app.models import Zone
from app.routers import auth, claims, ops, riders, triggers_http
from app.sqlite_migrate import ensure_schema
from app.tier_config import load_tiers


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_schema(engine)
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        seed_zones(db)
        ensure_mutual_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="InsurGig API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(riders.router)
app.include_router(claims.router)
app.include_router(triggers_http.router)
app.include_router(ops.router)


@app.get("/catalog/zones")
def catalog_zones(db: Session = Depends(get_db)):
    seed_zones(db)
    rows = db.query(Zone).order_by(Zone.name).all()
    return [
        {
            "name": z.name,
            "city": z.city,
            "lat": z.lat,
            "lon": z.lon,
            "risk_multiplier": z.risk_multiplier,
        }
        for z in rows
    ]


@app.get("/catalog/tiers")
def catalog_tiers():
    return load_tiers()


@app.get("/health")
def health():
    return {"status": "ok"}
