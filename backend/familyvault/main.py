from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from familyvault.config import settings
from familyvault.db import Base, engine
from familyvault.routes import auth, calendar, chores, expenses, families, medical, shopping, vault

Base.metadata.create_all(bind=engine)

app = FastAPI(title='FamilyVault', version='0.2.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

for route_module in [auth, families, calendar, chores, shopping, expenses, medical, vault]:
    app.include_router(route_module.router)


@app.get('/api/healthz')
def healthz():
    return {'status': 'ok', 'version': '0.2.0'}
