# FamilyVault v0.1 MVP

Privacy-first, self-hosted family organizer (calendar, expenses, chores, shopping, medical records, and vault sharing).

## Security Notice
- **v0.1 uses server-side encryption at rest, not end-to-end encryption (E2EE).**
- Sensitive fields (medical notes + vault payloads) are encrypted with `FAMILYVAULT_MASTER_KEY`.
- Users are responsible for legal/compliance requirements in their jurisdiction.
- FamilyVault is not medical advice.

## Threat model & limitations
- Protects data at rest in DB backups and basic compromise scenarios.
- Does **not** protect against a fully compromised application server with live key access.
- Refresh token is stored in localStorage for MVP simplicity (XSS risk).

## Roadmap (security)
- E2EE for vault and medical modules
- Key versioning + online key rotation
- Hardware-backed key management integrations

## Local dev
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn familyvault.main:app --host 0.0.0.0 --port 8000 --reload
```

### Web
```bash
cd web
npm install
npm run dev
```

## Docker
```bash
docker compose up --build
```
(Compose v0.1 runs backend + postgres; run web locally with Vite.)
