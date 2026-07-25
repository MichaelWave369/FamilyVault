# FamilyVault v0.2 hardening branch

FamilyVault is a privacy-first, self-hosted family organizer for shared calendars, chores, shopping, expenses, medical records, and explicitly shared vault entries.

## Current status

The backend is an MVP with security hardening and automated tests. The React app now has working registration, login, protected routes, revocable cookie-backed sessions, family creation, and family switching. The individual module screens remain early and should not be described as a finished consumer product yet.

## Security model

- Passwords are hashed with Argon2.
- Access tokens are short-lived and held in browser memory.
- Refresh tokens are stored only in an `HttpOnly` cookie and rotate on every refresh.
- Refresh sessions are persisted and revoked on rotation or logout.
- Vault secrets and medical notes use authenticated Fernet encryption at rest.
- Medical uploads are encrypted before they are written to disk and verified by SHA-256 when downloaded.
- Vault entries are private to their creator by default. Another adult must receive an explicit `read` or `write` grant, unless they are a family admin or owner.
- Family roles are `guest`, `child`, `teen`, `adult`, `admin`, and `owner`; invitation payloads cannot create new admins or owners.
- Audit records are created for authentication, invitations, and vault reads.

This is server-side encryption, not end-to-end encryption. A fully compromised live application server can access the encryption key and decrypted data. E2EE remains a future design goal.

## Required secrets

FamilyVault refuses to start with missing, weak, or published example secrets.

Generate a JWT secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Generate the Fernet master key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Never rotate `FAMILYVAULT_MASTER_KEY` without a data-reencryption plan. Losing it makes encrypted vault and medical data unrecoverable.

## Local development

### Backend

```bash
cp .env.example .env
# Fill JWT_SECRET and FAMILYVAULT_MASTER_KEY first.
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
pytest -q tests
uvicorn familyvault.main:app --host 0.0.0.0 --port 8000 --reload
```

### Web

```bash
cd web
npm install
npm run dev
```

The default web API URL is `http://localhost:8000`. Override it with `VITE_API_URL`.

## Docker

Set the required environment values, then start the backend and PostgreSQL:

```bash
export POSTGRES_PASSWORD="use-a-unique-database-password"
export JWT_SECRET="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export FAMILYVAULT_MASTER_KEY="$(python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')"
docker compose up --build
```

The compose file persists both PostgreSQL data and encrypted medical-file storage.

## Test coverage added in v0.2

The suite covers:

- registration and authenticated identity
- refresh-token rotation, replay rejection, and logout revocation
- password and event validation
- child-role denial for medical and vault resources
- private-by-default vault entries with read/write grants
- cross-family chore-assignment rejection
- encrypted medical-file storage and verified download
- safe 404 responses for missing resources

## Production checklist

Before exposing FamilyVault to real households:

- run behind HTTPS only
- set `ENVIRONMENT=production` so cookies require TLS
- restrict `CORS_ORIGINS` to the deployed web origin
- use managed secret storage rather than shell history or committed files
- add database backups and test restoration
- add rate limiting, email verification, account recovery, and multi-factor authentication
- complete a dedicated security review before storing irreplaceable credentials or regulated medical data
