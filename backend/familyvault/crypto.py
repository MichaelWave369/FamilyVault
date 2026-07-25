import json

from cryptography.fernet import Fernet

from familyvault.config import settings


_fernet = Fernet(settings.familyvault_master_key.encode())


def encrypt_bytes(plaintext: bytes) -> bytes:
    return _fernet.encrypt(plaintext)


def decrypt_bytes(ciphertext: bytes) -> bytes:
    return _fernet.decrypt(ciphertext)


def encrypt_text(plaintext: str) -> str:
    return encrypt_bytes(plaintext.encode()).decode()


def decrypt_text(ciphertext: str) -> str:
    return decrypt_bytes(ciphertext.encode()).decode()


def encrypt_payload(payload: dict) -> str:
    return encrypt_text(json.dumps(payload, separators=(',', ':')))


def decrypt_payload(payload: str) -> dict:
    return json.loads(decrypt_text(payload))
