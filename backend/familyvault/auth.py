import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from familyvault.config import settings
from familyvault.db import get_db
from familyvault.models import RefreshSession, User

ph = PasswordHasher()
security = HTTPBearer()


def _utcnow() -> datetime:
    return datetime.utcnow()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return ph.verify(password_hash, password)
    except Exception:
        return False


def _encode_token(*, user_id: int, token_type: str, minutes: int, session_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user_id),
        'type': token_type,
        'sid': session_id,
        'iat': now,
        'exp': now + timedelta(minutes=minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm='HS256')


def decode_token(token: str, expected: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=['HS256'])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail='Invalid token') from exc
    if payload.get('type') != expected or not payload.get('sid') or not payload.get('sub'):
        raise HTTPException(status_code=401, detail='Invalid token type')
    return payload


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _request_metadata(request: Request) -> tuple[str | None, str | None]:
    ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent')
    return ip, user_agent[:500] if user_agent else None


def create_session(db: Session, user: User, request: Request) -> tuple[str, str, RefreshSession]:
    session_id = secrets.token_urlsafe(32)
    expires_at = _utcnow() + timedelta(minutes=settings.jwt_refresh_minutes)
    refresh_token = _encode_token(
        user_id=user.id,
        token_type='refresh',
        minutes=settings.jwt_refresh_minutes,
        session_id=session_id,
    )
    ip, user_agent = _request_metadata(request)
    session = RefreshSession(
        id=session_id,
        user_id=user.id,
        token_hash=_token_hash(refresh_token),
        expires_at=expires_at,
        ip=ip,
        user_agent=user_agent,
    )
    db.add(session)
    db.commit()
    access_token = _encode_token(
        user_id=user.id,
        token_type='access',
        minutes=settings.jwt_access_minutes,
        session_id=session_id,
    )
    return access_token, refresh_token, session


def rotate_session(db: Session, refresh_token: str, request: Request) -> tuple[str, str, RefreshSession]:
    payload = decode_token(refresh_token, 'refresh')
    session = db.get(RefreshSession, payload['sid'])
    now = _utcnow()
    if (
        not session
        or session.revoked_at is not None
        or session.expires_at <= now
        or not hmac.compare_digest(session.token_hash, _token_hash(refresh_token))
    ):
        raise HTTPException(status_code=401, detail='Refresh session is no longer valid')

    user = db.get(User, int(payload['sub']))
    if not user or user.id != session.user_id:
        raise HTTPException(status_code=401, detail='User not found')

    session.revoked_at = now
    session.last_used_at = now
    new_access, new_refresh, replacement = create_session(db, user, request)
    session.replaced_by = replacement.id
    db.add(session)
    db.commit()
    return new_access, new_refresh, replacement


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token, 'refresh')
    except HTTPException:
        return
    session = db.get(RefreshSession, payload['sid'])
    if session and session.revoked_at is None:
        session.revoked_at = _utcnow()
        db.commit()


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=settings.jwt_refresh_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite='lax',
        path='/api/auth',
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path='/api/auth',
        secure=settings.cookie_secure,
        httponly=True,
        samesite='lax',
    )


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(cred.credentials, 'access')
    session = db.get(RefreshSession, payload['sid'])
    if not session or session.revoked_at is not None or session.expires_at <= _utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Session expired or revoked')
    user = db.get(User, int(payload['sub']))
    if not user or user.id != session.user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    return user
