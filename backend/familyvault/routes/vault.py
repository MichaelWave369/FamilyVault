from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.audit import log_action
from familyvault.auth import get_current_user
from familyvault.crypto import decrypt_payload, encrypt_payload
from familyvault.db import get_db
from familyvault.models import User, VaultFolder, VaultItem
from familyvault.rbac import require_role
from familyvault.schemas import FolderIn, VaultItemIn

router = APIRouter(tags=['vault'])

@router.get('/api/families/{family_id}/vault/folders')
def folders(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    return db.scalars(select(VaultFolder).where(VaultFolder.family_id == family_id)).all()

@router.post('/api/families/{family_id}/vault/folders')
def create_folder(family_id: int, payload: FolderIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    f = VaultFolder(family_id=family_id, name=payload.name, created_by=user.id)
    db.add(f); db.commit(); db.refresh(f); return f

@router.get('/api/folders/{folder_id}/items')
def items(folder_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.get(VaultFolder, folder_id); require_role(db, folder.family_id, user.id, 'adult')
    return db.scalars(select(VaultItem).where(VaultItem.folder_id == folder_id)).all()

@router.post('/api/folders/{folder_id}/items')
def create_item(folder_id: int, payload: VaultItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.get(VaultFolder, folder_id); require_role(db, folder.family_id, user.id, 'adult')
    secret = {'secret': payload.secret, 'totp_seed': payload.totp_seed, 'notes': payload.notes}
    i = VaultItem(folder_id=folder_id, title=payload.title, username=payload.username, url=payload.url, encrypted_payload=encrypt_payload(secret), created_by=user.id)
    db.add(i); db.commit(); db.refresh(i); return i

@router.get('/api/vault/items/{item_id}')
def get_item(item_id: int, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    i = db.get(VaultItem, item_id)
    folder = db.get(VaultFolder, i.folder_id)
    require_role(db, folder.family_id, user.id, 'adult')
    log_action(db, 'vault.read', 'vault_item', target_id=str(item_id), family_id=folder.family_id, actor_user_id=user.id, request=request)
    return {'id': i.id, 'title': i.title, 'username': i.username, 'url': i.url, 'payload': decrypt_payload(i.encrypted_payload)}

@router.put('/api/vault/items/{item_id}')
def update_item(item_id: int, payload: VaultItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    i = db.get(VaultItem, item_id); folder = db.get(VaultFolder, i.folder_id); require_role(db, folder.family_id, user.id, 'adult')
    i.title = payload.title; i.username = payload.username; i.url = payload.url
    i.encrypted_payload = encrypt_payload({'secret': payload.secret, 'totp_seed': payload.totp_seed, 'notes': payload.notes})
    i.updated_at = datetime.utcnow(); db.commit(); return i

@router.delete('/api/vault/items/{item_id}')
def delete_item(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    i = db.get(VaultItem, item_id)
    if not i:
        raise HTTPException(status_code=404)
    folder = db.get(VaultFolder, i.folder_id); require_role(db, folder.family_id, user.id, 'adult')
    db.delete(i); db.commit(); return {'ok': True}
