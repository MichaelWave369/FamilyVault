from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from familyvault.auth import get_current_user
from familyvault.db import get_db
from familyvault.models import Expense, ExpenseAccount, User
from familyvault.rbac import require_role
from familyvault.resources import get_or_404
from familyvault.schemas import ExpenseAccountIn, ExpenseIn

router = APIRouter(tags=['expenses'])


@router.get('/api/families/{family_id}/accounts')
def accounts(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    return db.scalars(select(ExpenseAccount).where(ExpenseAccount.family_id == family_id)).all()


@router.post('/api/families/{family_id}/accounts')
def create_account(family_id: int, payload: ExpenseAccountIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    account = ExpenseAccount(family_id=family_id, created_by=user.id, **payload.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get('/api/accounts/{account_id}/expenses')
def list_exp(account_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = get_or_404(db, ExpenseAccount, account_id)
    require_role(db, account.family_id, user.id, 'adult')
    return db.scalars(select(Expense).where(Expense.account_id == account_id)).all()


@router.post('/api/accounts/{account_id}/expenses')
def add_exp(account_id: int, payload: ExpenseIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = get_or_404(db, ExpenseAccount, account_id)
    require_role(db, account.family_id, user.id, 'adult')
    expense = Expense(account_id=account_id, created_by=user.id, **payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get('/api/accounts/{account_id}/summary')
def summary(
    account_id: int,
    month: int | None = Query(default=None, ge=1, le=12),
    year: int | None = Query(default=None, ge=2000, le=2200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = get_or_404(db, ExpenseAccount, account_id)
    require_role(db, account.family_id, user.id, 'adult')
    now = datetime.utcnow()
    selected_month = month or now.month
    selected_year = year or now.year
    total = db.scalar(
        select(func.sum(Expense.amount_cents)).where(
            Expense.account_id == account_id,
            extract('month', Expense.spent_at) == selected_month,
            extract('year', Expense.spent_at) == selected_year,
        )
    ) or 0
    return {
        'account_id': account_id,
        'month': selected_month,
        'year': selected_year,
        'total_cents': int(total),
    }
