from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.audit import log_action
from familyvault.auth import decode_token, get_current_user, hash_password, token_pair, verify_password
from familyvault.db import get_db
from familyvault.models import User
from familyvault.schemas import LoginIn, RegisterIn

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/register')
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=400, detail='Email already exists')
    user = User(email=payload.email, password_hash=hash_password(payload.password), name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return token_pair(user)


@router.post('/login')
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    log_action(db, 'auth.login', 'user', target_id=str(user.id), actor_user_id=user.id, request=request)
    return token_pair(user)


@router.post('/refresh')
def refresh(data: dict, db: Session = Depends(get_db)):
    payload = decode_token(data.get('refresh_token', ''), 'refresh')
    user = db.get(User, int(payload['sub']))
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return token_pair(user)


@router.post('/logout')
def logout():
    return {'ok': True}


@router.get('/me')
def me(user: User = Depends(get_current_user)):
    return {'id': user.id, 'email': user.email, 'name': user.name}
