from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.audit import log_action
from familyvault.auth import (
    clear_refresh_cookie,
    create_session,
    get_current_user,
    hash_password,
    revoke_refresh_token,
    rotate_session,
    set_refresh_cookie,
    verify_password,
)
from familyvault.config import settings
from familyvault.db import get_db
from familyvault.models import User
from familyvault.schemas import LoginIn, RegisterIn

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/register')
def register(payload: RegisterIn, request: Request, response: Response, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=400, detail='Email already exists')
    user = User(email=email, password_hash=hash_password(payload.password), name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token, refresh_token, _ = create_session(db, user, request)
    set_refresh_cookie(response, refresh_token)
    log_action(db, 'auth.register', 'user', target_id=str(user.id), actor_user_id=user.id, request=request)
    return {'access_token': access_token, 'token_type': 'bearer'}


@router.post('/login')
def login(payload: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    access_token, refresh_token, _ = create_session(db, user, request)
    set_refresh_cookie(response, refresh_token)
    log_action(db, 'auth.login', 'user', target_id=str(user.id), actor_user_id=user.id, request=request)
    return {'access_token': access_token, 'token_type': 'bearer'}


@router.post('/refresh')
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if not refresh_token:
        raise HTTPException(status_code=401, detail='Refresh cookie missing')
    access_token, new_refresh_token, _ = rotate_session(db, refresh_token, request)
    set_refresh_cookie(response, new_refresh_token)
    return {'access_token': access_token, 'token_type': 'bearer'}


@router.post('/logout')
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if refresh_token:
        revoke_refresh_token(db, refresh_token)
    clear_refresh_cookie(response)
    return {'ok': True}


@router.get('/me')
def me(user: User = Depends(get_current_user)):
    return {'id': user.id, 'email': user.email, 'name': user.name}
