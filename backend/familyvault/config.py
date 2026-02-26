from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    app_name: str = 'FamilyVault'
    postgres_url: str = 'sqlite:///./familyvault.db'
    jwt_secret: str = 'dev-secret-change-me'
    jwt_access_minutes: int = 15
    jwt_refresh_minutes: int = 60 * 24 * 7
    cors_origins: str = 'http://localhost:5173'
    familyvault_master_key: str = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='
    storage_path: str = './storage'


settings = Settings()
