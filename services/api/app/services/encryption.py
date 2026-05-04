"""
Fernet symmetric encryption + HMAC helpers for sensitive data.

`encrypt`/`decrypt` are reversible — use for values that need to be read back
(PAN, bank details). `hmac_sha256` is a one-way keyed hash — use for values
that only need equality lookup (Aadhaar). The ENCRYPTION_KEY env var doubles
as the HMAC key, so rotating one rotates the other.

Generate ENCRYPTION_KEY with:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""

import hashlib
import hmac
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
                'python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
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


def hmac_sha256(value: str) -> str:
    """Keyed hash (HMAC-SHA256) using ENCRYPTION_KEY. Hex-encoded.

    Use for values that only need equality lookup (Aadhaar number, OTP target
    hashes). Resists rainbow-table / dump-precompute attacks because the key
    is server-side.
    """
    key = get_settings().encryption_key
    if not key:
        raise RuntimeError("ENCRYPTION_KEY is not set; cannot compute HMAC")
    return hmac.new(key.encode(), value.encode(), hashlib.sha256).hexdigest()


def mask_account_number(account_number: str) -> str:
    """Show only last 4 digits: ••••••••4521"""
    if len(account_number) <= 4:
        return account_number
    return "••••••••" + account_number[-4:]


def mask_pan(pan: str) -> str:
    """Show first 2 + last 2 chars: AB****1Z"""
    if len(pan) <= 4:
        return "****"
    return pan[:2] + "****" + pan[-2:]
