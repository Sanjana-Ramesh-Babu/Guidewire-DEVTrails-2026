from __future__ import annotations

from datetime import datetime, timedelta

import networkx as nx

try:
    import community.community_louvain as louvain
except ImportError:
    import community as louvain  # type: ignore
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Claim, FraudRingAlert, Rider


def detect_ring_for_zone(db: Session, zone: str, window_minutes: int | None = None) -> tuple[bool, float, list[int]]:
    window_minutes = window_minutes or settings.ring_window_minutes
    since = datetime.utcnow() - timedelta(minutes=window_minutes)
    claims = (
        db.query(Claim)
        .filter(Claim.zone == zone, Claim.created_at >= since)
        .order_by(Claim.created_at.asc())
        .all()
    )
    if len(claims) < settings.ring_claim_threshold:
        return False, 0.0, []

    G = nx.Graph()
    rider_ids = list({c.rider_id for c in claims})
    for rid in rider_ids:
        G.add_node(rid)

    riders = {r.id: r for r in db.query(Rider).filter(Rider.id.in_(rider_ids)).all()}

    for i, a in enumerate(claims):
        for b in claims[i + 1 :]:
            if a.rider_id == b.rider_id:
                continue
            w = 0.0
            ra, rb = riders.get(a.rider_id), riders.get(b.rider_id)
            if ra and rb:
                if ra.device_family_hash and ra.device_family_hash == rb.device_family_hash:
                    w += 1.0
                dt_reg = abs((ra.created_at - rb.created_at).total_seconds())
                if dt_reg < 48 * 3600:
                    w += 0.6
            dt_claim = abs((a.created_at - b.created_at).total_seconds())
            if dt_claim < 180:
                w += 0.4
            if w > 0:
                e = G.get_edge_data(a.rider_id, b.rider_id)
                cur = e["weight"] if e else 0.0
                G.add_edge(a.rider_id, b.rider_id, weight=cur + w)

    if G.number_of_edges() == 0:
        return False, 0.0, rider_ids

    partition = louvain.best_partition(G, weight="weight")
    clusters: dict[int, list[int]] = {}
    for node, comm in partition.items():
        clusters.setdefault(comm, []).append(node)
    largest = max(clusters.values(), key=len)
    density = nx.density(G.subgraph(largest)) if len(largest) > 1 else 0.0
    suspicious = len(largest) >= settings.ring_claim_threshold and density >= 0.25
    return suspicious, float(density), largest


def maybe_create_ring_alert(db: Session, zone: str) -> FraudRingAlert | None:
    flag, density, nodes = detect_ring_for_zone(db, zone)
    if not flag:
        return None
    recent = datetime.utcnow() - timedelta(hours=1)
    existing = (
        db.query(FraudRingAlert)
        .filter(FraudRingAlert.zone_name == zone, FraudRingAlert.resolved.is_(False), FraudRingAlert.created_at >= recent)
        .first()
    )
    if existing:
        return existing
    alert = FraudRingAlert(
        zone_name=zone,
        window_started=datetime.utcnow() - timedelta(minutes=settings.ring_window_minutes),
        claim_count=len(nodes),
        density_score=density,
        payload={"rider_ids": nodes},
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
