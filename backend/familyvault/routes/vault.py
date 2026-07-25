from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.audit import log_action
from familyvault.auth import get_current_user
from familyvault.crypto import decrypt_payload, encrypt_payload
from familyvault.db import get_db
from familyvault.models import FamilyMember, User, VaultAccess, VaultFolder, VaultItem
from familyvault.rbac import ROLE_LEVEL, require_role
from familyvault.resources import get_or_404
from familyvault.schemas import FolderIn, VaultAccessIn, VaultItemIn

router = APIRouter(tags=['vault'])


def _item_context(db: Session, item_id: int) -> tuple[VaultItem, VaultFolder]:
    item = get_or_404(db, VaultItem, item_id)
    folder = get_or_404(db, VaultFolder, item.folder_id)
    return item, folder


def _access_row(db: Session, item_id: int, member_id: int) -> VaultAccess | None:
    return db.scalar(
        select(VaultAccess).where(
            VaultAccess.vault_item_id == item_id,
            VaultAccess.member_id == member_id,
        )
    )


def _can_manage(item: VaultItem, member: FamilyMember) -> bool:
    return item.created_by == member.user_id or member.role in {'admin', 'owner'}


def _can_read(db: Session, item: VaultItem, member: FamilyMember) -> bool:
    return _can_manage(item, member) or _access_row(db, item.id, member.id) is not None


def _can_write(db: Session, item: VaultItem, member: FamilyMember) -> bool:
    if _can_manage(item, member):
        return True
    access = _access_row(db, item.id, member.id)
    return bool(access and access.permission == 'write')


def _summary(item: VaultItem) -> dict:
    return {
        'id': item.id,
        'folder_id': item.folder_id,
        'title': item.title,
        'username': item.username,
        'url': item.url,
        'created_by': item.created_by,
        'updated_at': item.updated_at,
    }


@router.get('/api/families/{family_id}/vault/folders')
def folders(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    return db.scalars(select(VaultFolder).where(VaultFolder.family_id == family_id)).all()


@router.post('/api/families/{family_id}/vault/folders')
def create_folder(family_id: int, payload: FolderIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(db, family_id, user.id, 'adult')
    folder = VaultFolder(family_id=family_id, name=payload.name, created_by=user.id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.get('/api/folders/{folder_id}/items')
def items(folder_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = get_or_404(db, VaultFolder, folder_id)
    member = require_role(db, folder.family_id, user.id, 'adult')
    rows = db.scalars(select(VaultItem).where(VaultItem.folder_id == folder_id)).all()
    return [_summary(item) for item in rows if _can_read(db, item, member)]


@router.post('/api/folders/{folder_id}/items')
def create_item(folder_id: int, payload: VaultItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = get_or_404(db, VaultFolder, folder_id)
    require_role(db, folder.family_id, user.id, 'adult')
    secret = {'secret': payload.secret, 'totp_seed': payload.totp_seed, 'notes': payload.notes}
    item = VaultItem(
        folder_id=folder_id,
        title=payload.title,
        username=payload.username,
        url=payload.url,
        encrypted_payload=encrypt_payload(secret),
        created_by=user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _summary(item)


@router.get('/api/vault/items/{item_id}')
def get_item(item_id: int, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item, folder = _item_context(db, item_id)
    member = require_role(db, folder.family_id, user.id, 'adult')
    if not _can_read(db, item, member):
        raise HTTPException(status_code=403, detail='Vault item has not been shared with this member')
    log_action(
        db,
        'vault.read',
        'vault_item',
        target_id=str(item_id),
        family_id=folder.family_id,
        actor_user_id=user.id,
        request=request,
    )
    return {**_summary(item), 'payload': decrypt_payload(item.encrypted_payload)}


@router.put('/api/vault/items/{item_id}')
def update_item(item_id: int, payload: VaultItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item, folder = _item_context(db, item_id)
    member = require_role(db, folder.family_id, user.id, 'adult')
    if not _can_write(db, item, member):
        raise HTTPException(status_code=403, detail='Write access is required')
    item.title = payload.title
    item.username = payload.username
    item.url = payload.url
    item.encrypted_payload = encrypt_payload(
        {'secret': payload.secret, 'totp_seed': payload.totp_seed, 'notes': payload.notes}
    )
    item.updated_at = datetime.utcnow()
    db.commit()
    return _summary(item)


@router.get('/api/vault/items/{item_id}/access')
def list_access(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item, folder = _item_context(db, item_id)
    member = require_role(db, folder.family_id, user.id, 'adult')
    if not _can_manage(item, member):
        raise HTTPException(status_code=403, detail='Only the creator or family administrators may manage access')
    rows = db.scalars(select(VaultAccess).where(VaultAccess.vault_item_id == item_id)).all()
    return [{'member_id': row.member_id, 'permission': row.permission} for row in rows]


@router.post('/api/vault/items/{item_id}/access')
def grant_access(item_id: int, payload: VaultAccessIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item, folder = _item_context(db, item_id)
    actor = require_role(db, folder.family_id, user.id, 'adult')
    if not _can_manage(item, actor):
        raise HTTPException(status_code=403, detail='Only the creator or family administrators may manage access')
    recipient = get_or_404(db, FamilyMember, payload.member_id, 'Recipient not found')
    if recipient.family_id != folder.family_id:
        raise HTTPException(status_code=400, detail='Recipient must belong to the same family')
    if ROLE_LEVEL.get(recipient.role, -1) < ROLE_LEVEL['adult']:
        raise HTTPException(status_code=400, detail='Vault access may only be granted to adult family roles')
    access = _access_row(db, item_id, recipient.id)
    if access:
        access.permission = payload.permission
    else:
        access = VaultAccess(vault_item_id=item_id, member_id=recipient.id, permission=payload.permission)
        db.add(access)
    db.commit()
    return {'member_id': recipient.id, 'permission': payload.permission}


@router.delete('/api/vault/items/{item_id}/access/{member_id}')
def revoke_access(item_id: int, member_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item, folder = _item_context(db, item_id)
    actor = require_role(db, folder.family_id, user.id, 'adult')
    if not _can_manage(item, actor):
        raise HTTPException(status_code=403, detail='Only the creator or family administrators may manage access')
    access = _access_row(db, item_id, member_id)
    if not access:
        raise HTTPException(status_code=404, detail='Vault access grant not found')
    db.delete(access)
    db.commit()
    return {'ok': True}


@router.delete('/api/vault/items/{item_id}')
def delete_item(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item, folder = _item_context(db, item_id)
    member = require_role(db, folder.family_id, user.id, 'adult')
    if not _can_manage(item, member):
        raise HTTPException(status_code=403, detail='Only the creator or family administrators may delete this item')
    for access in db.scalars(select(VaultAccess).where(VaultAccess.vault_item_id == item_id)).all():
        db.delete(access)
    db.delete(item)
    db.commit()
    return {'ok': True}
