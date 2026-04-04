from __future__ import annotations

import random
import string
import time
from datetime import datetime, timedelta

import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import OtpChallenge
from app.phone_util import normalize_phone
from app.schemas import OtpSendBody, OtpVerifyBody, OtpVerifyResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _purge_expired(db: Session) -> None:
    db.query(OtpChallenge).filter(OtpChallenge.expires_at < datetime.utcnow()).delete()
    db.commit()


@router.post("/otp/send")
def send_otp(body: OtpSendBody, db: Session = Depends(get_db)):
    try:
        phone = normalize_phone(body.phone)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    _purge_expired(db)
    db.query(OtpChallenge).filter(OtpChallenge.phone == phone).delete()
    db.commit()
    code = "".join(random.choices(string.digits, k=6))
    exp = datetime.utcnow() + timedelta(seconds=settings.otp_ttl_seconds)
    db.add(OtpChallenge(phone=phone, code=code, expires_at=exp))
    db.commit()
    resp: dict = {"ok": True, "expires_in": settings.otp_ttl_seconds}
    if settings.expose_otp_in_response:
        resp["demo_otp"] = code
    return resp


@router.post("/otp/verify", response_model=OtpVerifyResponse)
def verify_otp(body: OtpVerifyBody, db: Session = Depends(get_db)):
    try:
        phone = normalize_phone(body.phone)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    row = (
        db.query(OtpChallenge)
        .filter(OtpChallenge.phone == phone, OtpChallenge.code == body.code.strip())
        .one_or_none()
    )
    if not row or row.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired code")
    db.delete(row)
    db.commit()
    token = jwt.encode(
        {"sub": phone, "typ": "phone_ok", "exp": int(time.time()) + 3600},
        settings.jwt_secret,
        algorithm="HS256",
    )
    return OtpVerifyResponse(token=token, expires_in=3600)


def decode_phone_verification_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as e:
        raise HTTPException(401, "Invalid verification session") from e
    if payload.get("typ") != "phone_ok":
        raise HTTPException(401, "Invalid verification session")
    sub = payload.get("sub")
    if not isinstance(sub, str):
        raise HTTPException(401, "Invalid verification session")
    return sub
