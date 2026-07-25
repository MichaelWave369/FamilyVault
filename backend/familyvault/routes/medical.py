import hashlib
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from familyvault.auth import get_current_user
from familyvault.config import settings
from familyvault.crypto import decrypt_bytes, decrypt_text, encrypt_bytes, encrypt_text
from familyvault.db import get_db
from familyvault.models import FamilyMember, MedicalFile, Profile, User
from familyvault.rbac import ensure_not_child, require_role
from familyvault.resources import get_or_404
from familyvault.schemas import ProfileIn

router = APIRouter(tags=['medical'])
storage_root = Path(settings.storage_path)
storage_root.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/json',
}


def _profile_summary(profile: Profile) -> dict:
    return {
        'id': profile.id,
        'family_id': profile.family_id,
        'member_id': profile.member_id,
        'dob': profile.dob,
        'blood_type': profile.blood_type,
    }


@router.get('/api/families/{family_id}/profiles')
def profiles(family_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = require_role(db, family_id, user.id, 'teen')
    ensure_not_child(member)
    rows = db.scalars(select(Profile).where(Profile.family_id == family_id)).all()
    return [_profile_summary(profile) for profile in rows]


@router.post('/api/families/{family_id}/profiles')
def create_profile(family_id: int, payload: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = require_role(db, family_id, user.id, 'adult')
    ensure_not_child(member)
    profile_member = get_or_404(db, FamilyMember, payload.member_id, 'Profile member not found')
    if profile_member.family_id != family_id:
        raise HTTPException(status_code=400, detail='Profile member must belong to the same family')
    existing = db.scalar(
        select(Profile).where(Profile.family_id == family_id, Profile.member_id == payload.member_id)
    )
    if existing:
        raise HTTPException(status_code=400, detail='A medical profile already exists for this member')
    profile = Profile(
        family_id=family_id,
        member_id=payload.member_id,
        dob=payload.dob,
        blood_type=payload.blood_type,
        notes=encrypt_text(payload.notes or ''),
        created_by=user.id,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _profile_summary(profile)


@router.get('/api/profiles/{profile_id}')
def get_profile(profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_404(db, Profile, profile_id)
    member = require_role(db, profile.family_id, user.id, 'teen')
    ensure_not_child(member)
    return {
        **_profile_summary(profile),
        'notes': decrypt_text(profile.notes) if profile.notes else '',
    }


@router.get('/api/profiles/{profile_id}/files')
def list_files(profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_404(db, Profile, profile_id)
    member = require_role(db, profile.family_id, user.id, 'teen')
    ensure_not_child(member)
    files = db.scalars(select(MedicalFile).where(MedicalFile.profile_id == profile_id)).all()
    return [
        {
            'id': item.id,
            'filename': item.filename,
            'mime': item.mime,
            'size': item.size,
            'sha256': item.sha256,
            'note': decrypt_text(item.note) if item.note else '',
        }
        for item in files
    ]


@router.post('/api/profiles/{profile_id}/files')
def upload_file(
    profile_id: int,
    file: UploadFile = File(...),
    note: str = '',
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_or_404(db, Profile, profile_id)
    member = require_role(db, profile.family_id, user.id, 'adult')
    ensure_not_child(member)
    mime = file.content_type or 'application/octet-stream'
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail='Unsupported medical file type')
    data = file.file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail='Medical file is too large')
    if not data:
        raise HTTPException(status_code=400, detail='Medical file is empty')
    sha = hashlib.sha256(data).hexdigest()
    encrypted_path = storage_root / f'{sha}.enc'
    encrypted_path.write_bytes(encrypt_bytes(data))
    safe_name = Path(file.filename or 'medical-file').name[:255]
    record = MedicalFile(
        profile_id=profile_id,
        filename=safe_name,
        mime=mime,
        size=len(data),
        sha256=sha,
        stored_path=str(encrypted_path),
        note=encrypt_text(note[:10_000]),
        created_by=user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {'id': record.id, 'sha256': sha, 'encrypted': True}


@router.get('/api/files/{file_id}/download')
def download(file_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    medical_file = get_or_404(db, MedicalFile, file_id)
    profile = get_or_404(db, Profile, medical_file.profile_id)
    member = require_role(db, profile.family_id, user.id, 'teen')
    ensure_not_child(member)
    path = Path(medical_file.stored_path)
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail='File missing')
    try:
        data = decrypt_bytes(path.read_bytes())
    except Exception as exc:
        raise HTTPException(status_code=500, detail='Stored file failed integrity verification') from exc
    if hashlib.sha256(data).hexdigest() != medical_file.sha256:
        raise HTTPException(status_code=500, detail='Stored file failed integrity verification')
    encoded_name = quote(medical_file.filename)
    return Response(
        content=data,
        media_type=medical_file.mime,
        headers={
            'Content-Disposition': f"attachment; filename*=UTF-8''{encoded_name}",
            'X-Content-Type-Options': 'nosniff',
        },
    )
