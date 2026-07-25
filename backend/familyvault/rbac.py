from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.models import FamilyMember

ROLE_LEVEL = {'guest': 0, 'child': 1, 'teen': 2, 'adult': 3, 'admin': 4, 'owner': 5}


def get_membership(db: Session, family_id: int, user_id: int) -> FamilyMember:
    member = db.scalar(
        select(FamilyMember).where(
            FamilyMember.family_id == family_id,
            FamilyMember.user_id == user_id,
        )
    )
    if not member:
        raise HTTPException(status_code=403, detail='Not a family member')
    if member.role not in ROLE_LEVEL:
        raise HTTPException(status_code=403, detail='Invalid family role')
    return member


def require_role(db: Session, family_id: int, user_id: int, min_role: str) -> FamilyMember:
    if min_role not in ROLE_LEVEL:
        raise RuntimeError(f'Unknown minimum role: {min_role}')
    member = get_membership(db, family_id, user_id)
    if ROLE_LEVEL[member.role] < ROLE_LEVEL[min_role]:
        raise HTTPException(status_code=403, detail='Insufficient role')
    return member


def ensure_not_child(member: FamilyMember):
    if ROLE_LEVEL.get(member.role, -1) < ROLE_LEVEL['teen']:
        raise HTTPException(status_code=403, detail='This resource is not available to child accounts')
