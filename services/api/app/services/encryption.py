"""
Fernet symmetric encryption service for sensitive data (bank details, etc.).
Uses ENCRYPTION_KEY from environment – generate with:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""

import logging

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        key = get_settings().encryption_key
        if not key:
            raise RuntimeError(
                "ENCRYPTION_KEY is not set. Generate one with: "
                "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        _fernet = Fernet(key.encode())
    return _fernet


def encrypt(plaintext: str) -> str:
    """Encrypt a string and return the base64-encoded ciphertext."""
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt a base64-encoded ciphertext back to plaintext."""
    try:
        return _get_fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        logger.error("Failed to decrypt value – invalid token or wrong key")
        return "••••••••"


def mask_account_number(account_number: str) -> str:
    """Show only last 4 digits: ••••••••4521"""
    if len(account_number) <= 4:
        return account_number
    return "••••••••" + account_number[-4:]
