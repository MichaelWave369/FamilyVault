from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from familyvault.config import settings
from familyvault.db import Base, engine
from familyvault.routes import auth, calendar, chores, expenses, families, medical, shopping, vault

Base.metadata.create_all(bind=engine)

app = FastAPI(title='FamilyVault')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(',')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

for r in [auth.router, families.router, calendar.router, chores.router, shopping.router, expenses.router, medical.router, vault.router]:
    app.include_router(r)


@app.get('/api/healthz')
def healthz():
    return {'status': 'ok'}
