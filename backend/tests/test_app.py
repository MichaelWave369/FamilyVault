import os
from pathlib import Path

os.environ['ENVIRONMENT'] = 'test'
os.environ['POSTGRES_URL'] = 'sqlite:////tmp/familyvault-test.db'
os.environ['JWT_SECRET'] = 'test-jwt-secret-that-is-long-random-and-never-used-in-production'
os.environ['FAMILYVAULT_MASTER_KEY'] = 'Mig4V6uBnlVaoLNJbVCrJ7D4ZQMvS6pt__QzE3wHzh0='
os.environ['STORAGE_PATH'] = '/tmp/familyvault-test-storage'

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from familyvault.config import settings
from familyvault.db import Base, SessionLocal, engine
from familyvault.main import app
from familyvault.models import MedicalFile

PASSWORD = 'correct horse battery staple'


@pytest.fixture(autouse=True)
def reset_state():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    storage = Path(settings.storage_path)
    storage.mkdir(parents=True, exist_ok=True)
    for path in storage.iterdir():
        if path.is_file():
            path.unlink()
    yield


def register(client: TestClient, email: str, name: str = 'User', password: str = PASSWORD) -> str:
    response = client.post('/api/auth/register', json={'email': email, 'password': password, 'name': name})
    assert response.status_code == 200, response.text
    assert 'refresh_token' not in response.json()
    return response.json()['access_token']


def headers(token: str) -> dict[str, str]:
    return {'Authorization': f'Bearer {token}'}


def create_family(client: TestClient, token: str, name: str = 'Home') -> dict:
    response = client.post('/api/families', headers=headers(token), json={'name': name})
    assert response.status_code == 200, response.text
    return response.json()


def invite_and_join(
    owner_client: TestClient,
    owner_token: str,
    family_id: int,
    email: str,
    role: str = 'adult',
    name: str = 'Member',
) -> tuple[TestClient, str, int]:
    invite = owner_client.post(
        f'/api/families/{family_id}/invite',
        headers=headers(owner_token),
        json={'email': email, 'role': role},
    )
    assert invite.status_code == 200, invite.text
    member_client = TestClient(app)
    member_token = register(member_client, email, name)
    accepted = member_client.post(
        '/api/invites/accept',
        headers=headers(member_token),
        json={'token': invite.json()['token']},
    )
    assert accepted.status_code == 200, accepted.text
    members = owner_client.get(f'/api/families/{family_id}/members', headers=headers(owner_token))
    member_id = next(row['id'] for row in members.json() if row['display_name'] == name)
    return member_client, member_token, member_id


def test_healthz():
    with TestClient(app) as client:
        response = client.get('/api/healthz')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok', 'version': '0.2.0'}


def test_auth_uses_http_only_rotating_refresh_cookie_and_logout_revokes_it():
    client = TestClient(app)
    access = register(client, 'owner@example.com', 'Owner')
    assert client.get('/api/auth/me', headers=headers(access)).status_code == 200
    old_refresh = client.cookies.get(settings.refresh_cookie_name)
    assert old_refresh

    refreshed = client.post('/api/auth/refresh')
    assert refreshed.status_code == 200, refreshed.text
    new_refresh = client.cookies.get(settings.refresh_cookie_name)
    assert new_refresh and new_refresh != old_refresh
    assert 'refresh_token' not in refreshed.json()

    replay_client = TestClient(app)
    replay = replay_client.post(
        '/api/auth/refresh',
        headers={'cookie': f'{settings.refresh_cookie_name}={old_refresh}'},
    )
    assert replay.status_code == 401

    logged_out = client.post('/api/auth/logout')
    assert logged_out.status_code == 200
    assert client.post('/api/auth/refresh').status_code == 401


def test_input_validation_rejects_weak_password_and_invalid_event_times():
    client = TestClient(app)
    weak = client.post(
        '/api/auth/register',
        json={'email': 'weak@example.com', 'password': 'short', 'name': 'Weak'},
    )
    assert weak.status_code == 422

    token = register(client, 'owner@example.com', 'Owner')
    family = create_family(client, token)
    calendar = client.post(
        f"/api/families/{family['id']}/calendars",
        headers=headers(token),
        json={'name': 'Family'},
    ).json()
    invalid = client.post(
        f"/api/calendars/{calendar['id']}/events",
        headers=headers(token),
        json={
            'title': 'Backwards',
            'start_at': '2026-08-01T12:00:00',
            'end_at': '2026-08-01T11:00:00',
        },
    )
    assert invalid.status_code == 422


def test_child_role_is_denied_medical_and_vault():
    owner_client = TestClient(app)
    owner_token = register(owner_client, 'owner@example.com', 'Owner')
    family = create_family(owner_client, owner_token)
    child_client, child_token, _ = invite_and_join(
        owner_client,
        owner_token,
        family['id'],
        'kid@example.com',
        role='child',
        name='Kid',
    )
    assert child_client.get(
        f"/api/families/{family['id']}/profiles", headers=headers(child_token)
    ).status_code == 403
    assert child_client.get(
        f"/api/families/{family['id']}/vault/folders", headers=headers(child_token)
    ).status_code == 403


def test_vault_access_is_private_by_default_and_enforces_read_write_grants():
    owner_client = TestClient(app)
    owner_token = register(owner_client, 'owner@example.com', 'Owner')
    family = create_family(owner_client, owner_token)
    creator_client, creator_token, _ = invite_and_join(
        owner_client, owner_token, family['id'], 'creator@example.com', name='Creator'
    )
    reader_client, reader_token, reader_member_id = invite_and_join(
        owner_client, owner_token, family['id'], 'reader@example.com', name='Reader'
    )

    folder = creator_client.post(
        f"/api/families/{family['id']}/vault/folders",
        headers=headers(creator_token),
        json={'name': 'Private'},
    ).json()
    item = creator_client.post(
        f"/api/folders/{folder['id']}/items",
        headers=headers(creator_token),
        json={'title': 'Wi-Fi', 'username': 'home', 'secret': 'super-secret'},
    ).json()

    hidden = reader_client.get(f"/api/folders/{folder['id']}/items", headers=headers(reader_token))
    assert hidden.status_code == 200
    assert hidden.json() == []
    assert reader_client.get(
        f"/api/vault/items/{item['id']}", headers=headers(reader_token)
    ).status_code == 403

    grant_read = creator_client.post(
        f"/api/vault/items/{item['id']}/access",
        headers=headers(creator_token),
        json={'member_id': reader_member_id, 'permission': 'read'},
    )
    assert grant_read.status_code == 200, grant_read.text
    revealed = reader_client.get(f"/api/vault/items/{item['id']}", headers=headers(reader_token))
    assert revealed.status_code == 200
    assert revealed.json()['payload']['secret'] == 'super-secret'
    denied_write = reader_client.put(
        f"/api/vault/items/{item['id']}",
        headers=headers(reader_token),
        json={'title': 'Wi-Fi', 'username': 'home', 'secret': 'changed'},
    )
    assert denied_write.status_code == 403

    grant_write = creator_client.post(
        f"/api/vault/items/{item['id']}/access",
        headers=headers(creator_token),
        json={'member_id': reader_member_id, 'permission': 'write'},
    )
    assert grant_write.status_code == 200
    allowed_write = reader_client.put(
        f"/api/vault/items/{item['id']}",
        headers=headers(reader_token),
        json={'title': 'Wi-Fi', 'username': 'home', 'secret': 'changed'},
    )
    assert allowed_write.status_code == 200


def test_cross_family_chore_assignment_is_rejected():
    client_one = TestClient(app)
    token_one = register(client_one, 'one@example.com', 'One')
    family_one = create_family(client_one, token_one, 'One Home')
    chore = client_one.post(
        f"/api/families/{family_one['id']}/chores",
        headers=headers(token_one),
        json={'title': 'Dishes'},
    ).json()

    client_two = TestClient(app)
    token_two = register(client_two, 'two@example.com', 'Two')
    family_two = create_family(client_two, token_two, 'Two Home')
    other_member_id = client_two.get(
        f"/api/families/{family_two['id']}/members", headers=headers(token_two)
    ).json()[0]['id']

    response = client_one.post(
        f"/api/chores/{chore['id']}/assign",
        headers=headers(token_one),
        json={'assignee_member_id': other_member_id},
    )
    assert response.status_code == 400
    assert response.json()['detail'] == 'Assignee must belong to the same family'


def test_medical_uploads_are_encrypted_at_rest_and_integrity_checked():
    client = TestClient(app)
    token = register(client, 'owner@example.com', 'Owner')
    family = create_family(client, token)
    member_id = client.get(
        f"/api/families/{family['id']}/members", headers=headers(token)
    ).json()[0]['id']
    profile = client.post(
        f"/api/families/{family['id']}/profiles",
        headers=headers(token),
        json={'member_id': member_id, 'blood_type': 'O+', 'notes': 'Private note'},
    )
    assert profile.status_code == 200, profile.text

    plaintext = b'private medical document contents'
    uploaded = client.post(
        f"/api/profiles/{profile.json()['id']}/files",
        headers=headers(token),
        files={'file': ('record.txt', plaintext, 'text/plain')},
        data={'note': 'Lab report'},
    )
    assert uploaded.status_code == 200, uploaded.text
    assert uploaded.json()['encrypted'] is True

    with SessionLocal() as db:
        record = db.scalar(select(MedicalFile).where(MedicalFile.id == uploaded.json()['id']))
        stored = Path(record.stored_path).read_bytes()
    assert stored != plaintext
    assert plaintext not in stored

    downloaded = client.get(
        f"/api/files/{uploaded.json()['id']}/download",
        headers=headers(token),
    )
    assert downloaded.status_code == 200
    assert downloaded.content == plaintext
    assert downloaded.headers['x-content-type-options'] == 'nosniff'


def test_missing_resources_return_404_instead_of_server_errors():
    client = TestClient(app)
    token = register(client, 'owner@example.com', 'Owner')
    response = client.get('/api/calendars/999/events', headers=headers(token))
    assert response.status_code == 404
    response = client.delete('/api/items/999', headers=headers(token))
    assert response.status_code == 404
