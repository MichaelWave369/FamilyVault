import hashlib
import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.auth import get_current_user
from familyvault.config import settings
from familyvault.crypto import decrypt_text, encrypt_text
from familyvault.db import get_db
from familyvault.models import FamilyMember, MedicalFile, Profile, User
from familyvault.rbac import ensure_not_child, require_role
from familyvault.schemas import ProfileIn

router = APIRouter(tags=['medical'])
Path(settings.storage_path).mkdir(parents=True, exist_ok=True)

@router.get('/api/families/{family_id}/profiles')
def profiles(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = require_role(db, family_id, user.id, 'teen'); ensure_not_child(m)
    return db.scalars(select(Profile).where(Profile.family_id == family_id)).all()

@router.post('/api/families/{family_id}/profiles')
def create_profile(family_id: int, payload: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = require_role(db, family_id, user.id, 'adult'); ensure_not_child(m)
    p = Profile(family_id=family_id, member_id=payload.member_id, dob=payload.dob, blood_type=payload.blood_type, notes=encrypt_text(payload.notes or ''), created_by=user.id)
    db.add(p); db.commit(); db.refresh(p); return p

@router.get('/api/profiles/{profile_id}')
def get_profile(profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.get(Profile, profile_id); m = require_role(db, p.family_id, user.id, 'teen'); ensure_not_child(m)
    return {'id': p.id, 'notes': decrypt_text(p.notes) if p.notes else ''}

@router.post('/api/profiles/{profile_id}/files')
def upload_file(profile_id: int, file: UploadFile = File(...), note: str = '', user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.get(Profile, profile_id); m = require_role(db, p.family_id, user.id, 'adult'); ensure_not_child(m)
    data = file.file.read(); sha = hashlib.sha256(data).hexdigest(); path = os.path.join(settings.storage_path, f'{sha}_{file.filename}')
    with open(path, 'wb') as f: f.write(data)
    rec = MedicalFile(profile_id=profile_id, filename=file.filename, mime=file.content_type or 'application/octet-stream', size=len(data), sha256=sha, stored_path=path, note=encrypt_text(note), created_by=user.id)
    db.add(rec); db.commit(); db.refresh(rec); return {'id': rec.id, 'sha256': sha}

@router.get('/api/files/{file_id}/download')
def download(file_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.get(MedicalFile, file_id)
    p = db.get(Profile, f.profile_id)
    m = require_role(db, p.family_id, user.id, 'teen'); ensure_not_child(m)
    if not os.path.exists(f.stored_path):
        raise HTTPException(status_code=404, detail='File missing')
    return FileResponse(f.stored_path, filename=f.filename)
