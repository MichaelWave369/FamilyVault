import base64
import json

from cryptography.fernet import Fernet

from familyvault.config import settings


def _fernet() -> Fernet:
    key = settings.familyvault_master_key.encode()
    raw = base64.urlsafe_b64encode(base64.b64decode(key)) if len(key) != 44 else key
    return Fernet(raw)


def encrypt_text(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_text(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode()).decode()


def encrypt_payload(payload: dict) -> str:
    return encrypt_text(json.dumps(payload))


def decrypt_payload(payload: str) -> dict:
    return json.loads(decrypt_text(payload))
