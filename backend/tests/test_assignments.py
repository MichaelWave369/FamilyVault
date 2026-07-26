import os

os.environ['ENVIRONMENT'] = 'test'
os.environ['POSTGRES_URL'] = 'sqlite:////tmp/familyvault-test.db'
os.environ['JWT_SECRET'] = 'test-jwt-secret-that-is-long-random-and-never-used-in-production'
os.environ['FAMILYVAULT_MASTER_KEY'] = 'Mig4V6uBnlVaoLNJbVCrJ7D4ZQMvS6pt__QzE3wHzh0='
os.environ['STORAGE_PATH'] = '/tmp/familyvault-test-storage'

import pytest
from fastapi.testclient import TestClient

from familyvault.db import Base, engine
from familyvault.main import app

PASSWORD = 'correct horse battery staple'


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def auth_headers(token: str) -> dict[str, str]:
    return {'Authorization': f'Bearer {token}'}


def test_family_assignments_endpoint_returns_frontend_summary():
    client = TestClient(app)
    registered = client.post(
        '/api/auth/register',
        json={'email': 'owner@example.com', 'password': PASSWORD, 'name': 'Owner'},
    )
    assert registered.status_code == 200, registered.text
    token = registered.json()['access_token']
    headers = auth_headers(token)

    family = client.post('/api/families', headers=headers, json={'name': 'Home'}).json()
    member = client.get(f"/api/families/{family['id']}/members", headers=headers).json()[0]
    chore = client.post(
        f"/api/families/{family['id']}/chores",
        headers=headers,
        json={'title': 'Feed the pets', 'points': 10},
    ).json()
    assigned = client.post(
        f"/api/chores/{chore['id']}/assign",
        headers=headers,
        json={'assignee_member_id': member['id'], 'due_at': '2026-08-01T18:00:00'},
    )
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()['chore_title'] == 'Feed the pets'
    assert assigned.json()['assignee_name'] == 'Owner'

    listed = client.get(f"/api/families/{family['id']}/assignments", headers=headers)
    assert listed.status_code == 200, listed.text
    assert listed.json()[0]['id'] == assigned.json()['id']
    assert listed.json()[0]['status'] == 'pending'
