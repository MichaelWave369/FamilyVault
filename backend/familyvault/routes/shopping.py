from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.auth import get_current_user
from familyvault.db import get_db
from familyvault.models import ShoppingItem, ShoppingList, User
from familyvault.rbac import require_role
from familyvault.schemas import ShoppingItemIn, ShoppingItemPatch, ShoppingListIn

router = APIRouter(tags=['shopping'])

@router.get('/api/families/{family_id}/lists')
def lists(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'guest')
    return db.scalars(select(ShoppingList).where(ShoppingList.family_id == family_id)).all()

@router.post('/api/families/{family_id}/lists')
def create_list(family_id: int, payload: ShoppingListIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'child')
    li = ShoppingList(family_id=family_id, name=payload.name, created_by=user.id)
    db.add(li); db.commit(); db.refresh(li); return li

@router.post('/api/lists/{list_id}/items')
def add_item(list_id: int, payload: ShoppingItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    li = db.get(ShoppingList, list_id); require_role(db, li.family_id, user.id, 'child')
    item = ShoppingItem(list_id=list_id, created_by=user.id, **payload.model_dump())
    db.add(item); db.commit(); db.refresh(item); return item

@router.patch('/api/items/{item_id}')
def patch_item(item_id: int, payload: ShoppingItemPatch, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(ShoppingItem, item_id); li = db.get(ShoppingList, item.list_id); require_role(db, li.family_id, user.id, 'child')
    for k, v in payload.model_dump(exclude_none=True).items(): setattr(item, k, v)
    item.updated_at = datetime.utcnow(); db.commit(); return item

@router.delete('/api/items/{item_id}')
def del_item(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(ShoppingItem, item_id); li = db.get(ShoppingList, item.list_id); require_role(db, li.family_id, user.id, 'child')
    db.delete(item); db.commit(); return {'ok': True}
