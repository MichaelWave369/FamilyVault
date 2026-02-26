# Security Policy

Please report vulnerabilities privately to maintainers before public disclosure.

## Best practices
- Set strong `JWT_SECRET` and `FAMILYVAULT_MASTER_KEY`.
- Run behind TLS reverse proxy in production.
- Restrict trusted origins with `CORS_ORIGINS`.
