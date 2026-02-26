from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from familyvault.config import settings
from familyvault.db import get_db
from familyvault.models import User

ph = PasswordHasher()
security = HTTPBearer()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return ph.verify(password_hash, password)
    except Exception:
        return False


def create_token(sub: str, ttype: str, minutes: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {'sub': sub, 'type': ttype, 'iat': now, 'exp': now + timedelta(minutes=minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm='HS256')


def decode_token(token: str, expected: str):
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=['HS256'])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail='Invalid token') from exc
    if payload.get('type') != expected:
        raise HTTPException(status_code=401, detail='Invalid token type')
    return payload


def token_pair(user: User):
    return {
        'access_token': create_token(str(user.id), 'access', settings.jwt_access_minutes),
        'refresh_token': create_token(str(user.id), 'refresh', settings.jwt_refresh_minutes),
        'token_type': 'bearer',
    }


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(cred.credentials, 'access')
    user = db.get(User, int(payload['sub']))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    return user
