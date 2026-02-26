import os

os.environ['POSTGRES_URL'] = 'sqlite:///./test.db'

from fastapi.testclient import TestClient

from familyvault.db import Base, engine
from familyvault.main import app


client = TestClient(app)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def register(email='owner@example.com', password='secret123', name='Owner'):
    return client.post('/api/auth/register', json={'email': email, 'password': password, 'name': name})


def auth_headers(token):
    return {'Authorization': f'Bearer {token}'}


def test_healthz():
    r = client.get('/api/healthz')
    assert r.status_code == 200
    assert r.json()['status'] == 'ok'


def test_register_login():
    r = register()
    assert r.status_code == 200
    l = client.post('/api/auth/login', json={'email': 'owner@example.com', 'password': 'secret123'})
    assert l.status_code == 200
    assert 'access_token' in l.json()


def test_child_rbac_denied_medical_and_vault():
    owner = register('o2@example.com', 'secret123', 'Owner2').json()
    owner_h = auth_headers(owner['access_token'])
    fam = client.post('/api/families', headers=owner_h, json={'name': 'Home'}).json()
    inv = client.post(f"/api/families/{fam['id']}/invite", headers=owner_h, json={'email': 'kid@example.com', 'role': 'child'}).json()

    child = register('kid@example.com', 'secret123', 'Kid').json()
    child_h = auth_headers(child['access_token'])
    client.post('/api/invites/accept', headers=child_h, json={'token': inv['token']})

    m = client.get(f"/api/families/{fam['id']}/profiles", headers=child_h)
    v = client.get(f"/api/families/{fam['id']}/vault/folders", headers=child_h)
    assert m.status_code == 403
    assert v.status_code == 403
