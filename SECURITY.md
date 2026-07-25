# Security Policy

Please report vulnerabilities privately to the repository maintainer before public disclosure. Do not include real family records, credentials, medical information, encryption keys, refresh tokens, or access tokens in a report.

## Deployment requirements

- Use unique, randomly generated `JWT_SECRET`, `FAMILYVAULT_MASTER_KEY`, and database credentials.
- Never deploy with a secret copied from documentation, tests, commit history, or another environment.
- Run the production service behind TLS and set `ENVIRONMENT=production`.
- Restrict `CORS_ORIGINS` to known web origins.
- Keep encrypted medical storage on a persistent protected volume.
- Back up the database and encrypted-file volume together.
- Protect the master key separately from database and file backups.

## Known architectural limitation

FamilyVault v0.2 provides server-side authenticated encryption at rest. It is not end-to-end encrypted. A live application compromise with access to the master key can decrypt protected content.

## Supported disclosure information

A useful report includes the affected route or component, prerequisites, reproducible steps using synthetic data, expected behavior, observed behavior, and the security impact.
