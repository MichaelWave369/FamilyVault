from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.auth import get_current_user
from familyvault.db import get_db
from familyvault.models import Chore, ChoreAssignment, FamilyMember, User
from familyvault.rbac import require_role
from familyvault.resources import get_or_404
from familyvault.schemas import AssignmentIn, ChoreIn

router = APIRouter(tags=['chores'])


def _assignment_summary(db: Session, assignment: ChoreAssignment) -> dict:
    chore = get_or_404(db, Chore, assignment.chore_id)
    assignee = get_or_404(db, FamilyMember, assignment.assignee_member_id, 'Assignee not found')
    return {
        'id': assignment.id,
        'chore_id': assignment.chore_id,
        'chore_title': chore.title,
        'assignee_member_id': assignment.assignee_member_id,
        'assignee_name': assignee.display_name,
        'due_at': assignment.due_at,
        'status': assignment.status,
        'completed_at': assignment.completed_at,
    }


@router.get('/api/families/{family_id}/chores')
def list_chores(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'child')
    return db.scalars(select(Chore).where(Chore.family_id == family_id)).all()


@router.get('/api/families/{family_id}/assignments')
def list_assignments(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'child')
    chore_ids = select(Chore.id).where(Chore.family_id == family_id)
    rows = db.scalars(
        select(ChoreAssignment)
        .where(ChoreAssignment.chore_id.in_(chore_ids))
        .order_by(ChoreAssignment.status.asc(), ChoreAssignment.due_at.asc())
    ).all()
    return [_assignment_summary(db, assignment) for assignment in rows]


@router.post('/api/families/{family_id}/chores')
def create_chore(family_id: int, payload: ChoreIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    chore = Chore(family_id=family_id, created_by=user.id, **payload.model_dump())
    db.add(chore)
    db.commit()
    db.refresh(chore)
    return chore


@router.post('/api/chores/{chore_id}/assign')
def assign(chore_id: int, payload: AssignmentIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chore = get_or_404(db, Chore, chore_id)
    require_role(db, chore.family_id, user.id, 'adult')
    assignee = get_or_404(db, FamilyMember, payload.assignee_member_id, 'Assignee not found')
    if assignee.family_id != chore.family_id:
        raise HTTPException(status_code=400, detail='Assignee must belong to the same family')
    assignment = ChoreAssignment(
        chore_id=chore_id,
        assignee_member_id=payload.assignee_member_id,
        due_at=payload.due_at,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return _assignment_summary(db, assignment)


@router.post('/api/assignments/{assignment_id}/complete')
def complete(assignment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = get_or_404(db, ChoreAssignment, assignment_id)
    chore = get_or_404(db, Chore, assignment.chore_id)
    member = require_role(db, chore.family_id, user.id, 'child')
    if member.id != assignment.assignee_member_id and member.role not in {'adult', 'admin', 'owner'}:
        raise HTTPException(status_code=403, detail='Only the assignee or an adult may complete this chore')
    assignment.status = 'completed'
    assignment.completed_at = datetime.utcnow()
    assignment.completed_by = user.id
    db.commit()
    return {'ok': True}
