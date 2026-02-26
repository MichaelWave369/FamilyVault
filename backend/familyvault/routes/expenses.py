from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from familyvault.auth import get_current_user
from familyvault.db import get_db
from familyvault.models import Expense, ExpenseAccount, User
from familyvault.rbac import require_role
from familyvault.schemas import ExpenseAccountIn, ExpenseIn

router = APIRouter(tags=['expenses'])

@router.get('/api/families/{family_id}/accounts')
def accounts(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    return db.scalars(select(ExpenseAccount).where(ExpenseAccount.family_id == family_id)).all()

@router.post('/api/families/{family_id}/accounts')
def create_account(family_id: int, payload: ExpenseAccountIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    a = ExpenseAccount(family_id=family_id, created_by=user.id, **payload.model_dump())
    db.add(a); db.commit(); db.refresh(a); return a

@router.get('/api/accounts/{account_id}/expenses')
def list_exp(account_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.get(ExpenseAccount, account_id); require_role(db, a.family_id, user.id, 'adult')
    return db.scalars(select(Expense).where(Expense.account_id == account_id)).all()

@router.post('/api/accounts/{account_id}/expenses')
def add_exp(account_id: int, payload: ExpenseIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.get(ExpenseAccount, account_id); require_role(db, a.family_id, user.id, 'adult')
    e = Expense(account_id=account_id, created_by=user.id, **payload.model_dump())
    db.add(e); db.commit(); db.refresh(e); return e

@router.get('/api/accounts/{account_id}/summary')
def summary(account_id: int, month: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.get(ExpenseAccount, account_id); require_role(db, a.family_id, user.id, 'adult')
    m = month or datetime.utcnow().month
    total = db.scalar(select(func.sum(Expense.amount_cents)).where(Expense.account_id == account_id, extract('month', Expense.spent_at) == m)) or 0
    return {'account_id': account_id, 'month': m, 'total_cents': int(total)}
