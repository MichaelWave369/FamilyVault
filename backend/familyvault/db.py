from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from familyvault.config import settings


class Base(DeclarativeBase):
    pass


connect_args = {'check_same_thread': False} if settings.postgres_url.startswith('sqlite') else {}
engine = create_engine(settings.postgres_url, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
