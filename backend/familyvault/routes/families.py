import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.audit import log_action
from familyvault.auth import get_current_user
from familyvault.db import get_db
from familyvault.models import Family, FamilyMember, Invite, User
from familyvault.rbac import require_role
from familyvault.schemas import FamilyIn, InviteAcceptIn, InviteIn

router = APIRouter(tags=['families'])


@router.get('/api/families')
def families(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.scalars(select(FamilyMember).where(FamilyMember.user_id == user.id)).all()
    out = []
    for m in memberships:
        f = db.get(Family, m.family_id)
        out.append({'id': f.id, 'name': f.name, 'role': m.role})
    return out


@router.post('/api/families')
def create_family(payload: FamilyIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    family = Family(name=payload.name)
    db.add(family)
    db.commit()
    db.refresh(family)
    db.add(FamilyMember(family_id=family.id, user_id=user.id, role='owner', display_name=user.name))
    db.commit()
    return {'id': family.id, 'name': family.name}


@router.post('/api/families/{family_id}/invite')
def invite(family_id: int, payload: InviteIn, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'admin')
    inv = Invite(family_id=family_id, email=payload.email, role=payload.role, token=secrets.token_urlsafe(24), expires_at=datetime.utcnow() + timedelta(days=7))
    db.add(inv)
    db.commit()
    log_action(db, 'family.invite.created', 'invite', target_id=str(inv.id), family_id=family_id, actor_user_id=user.id, request=request)
    return {'token': inv.token, 'expires_at': inv.expires_at}


@router.post('/api/invites/accept')
def accept(payload: InviteAcceptIn, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.scalar(select(Invite).where(Invite.token == payload.token))
    if not inv or inv.accepted_at or inv.expires_at < datetime.utcnow() or inv.email != user.email:
        raise HTTPException(status_code=400, detail='Invalid invite')
    db.add(FamilyMember(family_id=inv.family_id, user_id=user.id, role=inv.role, display_name=user.name))
    inv.accepted_at = datetime.utcnow()
    db.commit()
    log_action(db, 'family.invite.accepted', 'invite', target_id=str(inv.id), family_id=inv.family_id, actor_user_id=user.id, request=request)
    return {'ok': True}
