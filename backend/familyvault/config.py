from typing import Literal

from cryptography.fernet import Fernet
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_INSECURE_VALUES = {
    'change-me',
    'dev-secret-change-me',
    'replace-me',
    'replace-with-a-random-secret',
    'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    app_name: str = 'FamilyVault'
    environment: Literal['development', 'test', 'production'] = 'development'
    postgres_url: str = 'sqlite:///./familyvault.db'
    jwt_secret: str
    jwt_access_minutes: int = 15
    jwt_refresh_minutes: int = 60 * 24 * 7
    cors_origins: str = 'http://localhost:5173'
    familyvault_master_key: str
    storage_path: str = './storage'
    max_upload_bytes: int = 10 * 1024 * 1024
    refresh_cookie_name: str = 'familyvault_refresh'

    @field_validator('jwt_secret')
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 32 or value in _INSECURE_VALUES:
            raise ValueError('JWT_SECRET must be a unique random value of at least 32 characters')
        return value

    @field_validator('familyvault_master_key')
    @classmethod
    def validate_master_key(cls, value: str) -> str:
        value = value.strip()
        if value in _INSECURE_VALUES:
            raise ValueError('FAMILYVAULT_MASTER_KEY must not use a published example key')
        try:
            Fernet(value.encode())
        except Exception as exc:
            raise ValueError('FAMILYVAULT_MASTER_KEY must be a valid Fernet key') from exc
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]

    @property
    def cookie_secure(self) -> bool:
        return self.environment == 'production'


settings = Settings()
