from typing import TypeVar

from fastapi import HTTPException
from sqlalchemy.orm import Session

from familyvault.db import Base

ModelT = TypeVar('ModelT', bound=Base)


def get_or_404(db: Session, model: type[ModelT], object_id: int, detail: str | None = None) -> ModelT:
    obj = db.get(model, object_id)
    if obj is None:
        raise HTTPException(status_code=404, detail=detail or f'{model.__name__} not found')
    return obj
