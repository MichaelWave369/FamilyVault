from fastapi import Request
from sqlalchemy.orm import Session

from familyvault.models import AuditLog


def log_action(
    db: Session,
    action: str,
    target_type: str,
    *,
    target_id: str | None = None,
    family_id: int | None = None,
    actor_user_id: int | None = None,
    meta: dict | None = None,
    request: Request | None = None,
):
    ip = request.client.host if request and request.client else None
    db.add(
        AuditLog(
            family_id=family_id,
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            meta_json=meta,
            ip=ip,
        )
    )
    db.commit()
