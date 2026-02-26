from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.auth import get_current_user
from familyvault.db import get_db
from familyvault.models import Chore, ChoreAssignment, FamilyMember, User
from familyvault.rbac import require_role
from familyvault.schemas import AssignmentIn, ChoreIn

router = APIRouter(tags=['chores'])

@router.get('/api/families/{family_id}/chores')
def list_chores(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'child')
    return db.scalars(select(Chore).where(Chore.family_id == family_id)).all()

@router.post('/api/families/{family_id}/chores')
def create_chore(family_id: int, payload: ChoreIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    c = Chore(family_id=family_id, created_by=user.id, **payload.model_dump())
    db.add(c); db.commit(); db.refresh(c); return c

@router.post('/api/chores/{chore_id}/assign')
def assign(chore_id: int, payload: AssignmentIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chore = db.get(Chore, chore_id); require_role(db, chore.family_id, user.id, 'adult')
    db.get(FamilyMember, payload.assignee_member_id)
    a = ChoreAssignment(chore_id=chore_id, assignee_member_id=payload.assignee_member_id, due_at=payload.due_at)
    db.add(a); db.commit(); db.refresh(a); return a

@router.post('/api/assignments/{assignment_id}/complete')
def complete(assignment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.get(ChoreAssignment, assignment_id)
    chore = db.get(Chore, a.chore_id)
    member = require_role(db, chore.family_id, user.id, 'child')
    if member.id != a.assignee_member_id and member.role not in {'adult', 'admin', 'owner'}:
        return {'ok': False}
    a.status = 'completed'; a.completed_at = datetime.utcnow(); a.completed_by = user.id
    db.commit(); return {'ok': True}
