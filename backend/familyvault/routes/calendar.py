from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.auth import get_current_user
from familyvault.db import get_db
from familyvault.models import Calendar, Event, User
from familyvault.rbac import require_role
from familyvault.schemas import CalendarIn, EventIn

router = APIRouter(tags=['calendar'])

@router.get('/api/families/{family_id}/calendars')
def list_cal(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'guest')
    return db.scalars(select(Calendar).where(Calendar.family_id == family_id)).all()

@router.post('/api/families/{family_id}/calendars')
def add_cal(family_id: int, payload: CalendarIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    obj = Calendar(family_id=family_id, name=payload.name, color=payload.color, created_by=user.id)
    db.add(obj); db.commit(); db.refresh(obj); return obj

@router.get('/api/calendars/{cal_id}/events')
def list_events(cal_id: int, from_: datetime | None = None, to: datetime | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cal = db.get(Calendar, cal_id); require_role(db, cal.family_id, user.id, 'guest')
    q = select(Event).where(Event.calendar_id == cal_id)
    if from_:
        q = q.where(Event.start_at >= from_)
    if to:
        q = q.where(Event.end_at <= to)
    return db.scalars(q).all()

@router.post('/api/calendars/{cal_id}/events')
def create_event(cal_id: int, payload: EventIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cal = db.get(Calendar, cal_id); require_role(db, cal.family_id, user.id, 'adult')
    e = Event(calendar_id=cal_id, created_by=user.id, **payload.model_dump())
    db.add(e); db.commit(); db.refresh(e); return e

@router.put('/api/events/{event_id}')
def update_event(event_id: int, payload: EventIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    e = db.get(Event, event_id); cal = db.get(Calendar, e.calendar_id); require_role(db, cal.family_id, user.id, 'adult')
    for k, v in payload.model_dump().items(): setattr(e, k, v)
    e.updated_at = datetime.utcnow(); db.commit(); return e

@router.delete('/api/events/{event_id}')
def delete_event(event_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    e = db.get(Event, event_id); cal = db.get(Calendar, e.calendar_id); require_role(db, cal.family_id, user.id, 'adult')
    db.delete(e); db.commit(); return {'ok': True}
