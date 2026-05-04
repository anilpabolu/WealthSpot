"""Encryption + signed-token utilities for the comm platform.

- `encrypt_provider_config` / `decrypt_provider_config` — Fernet-wrap provider
  credential JSON before it goes into `comm.providers.config_encrypted`. Reuses
  the project-wide `Settings.encryption_key`.
- `make_unsubscribe_token` / `verify_unsubscribe_token` — RFC 8058 one-click-
  compatible signed tokens for the public preference center.
- `make_preferences_token` / `verify_preferences_token` — preference center
  authenticated access tokens.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from cryptography.fernet import Fernet, InvalidToken
from itsdangerous import BadSignature, URLSafeTimedSerializer

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_UNSUB_SALT = "comm.unsubscribe.v1"
_PREF_SALT = "comm.preferences.v1"


def _fernet() -> Fernet:
    settings = get_settings()
    if not settings.encryption_key:
        raise RuntimeError(
            "ENCRYPTION_KEY is not configured; required to encrypt comm provider credentials"
        )
    return Fernet(settings.encryption_key.encode())


def encrypt_provider_config(config: dict[str, Any]) -> dict[str, Any]:
    """Encrypt a provider config dict. Returns `{"v": 1, "ct": "<token>"}`."""
    raw = json.dumps(config, sort_keys=True, separators=(",", ":")).encode()
    token = _fernet().encrypt(raw).decode()
    return {"v": 1, "ct": token}


def decrypt_provider_config(payload: dict[str, Any]) -> dict[str, Any]:
    """Inverse of `encrypt_provider_config`. Raises on tamper / wrong key."""
    if not isinstance(payload, dict) or payload.get("v") != 1 or "ct" not in payload:
        raise ValueError("Unexpected provider config payload shape")
    try:
        raw = _fernet().decrypt(payload["ct"].encode())
    except InvalidToken as exc:
        raise ValueError("Failed to decrypt provider config (key mismatch or tampered)") from exc
    return json.loads(raw)


def _serializer(salt: str) -> URLSafeTimedSerializer:
    settings = get_settings()
    return URLSafeTimedSerializer(secret_key=settings.jwt_secret_key, salt=salt)


def make_unsubscribe_token(user_id: str, channel: str, event_category: str | None = None) -> str:
    """Issue a signed token for one-click unsubscribe (RFC 8058)."""
    payload: dict[str, str] = {"u": user_id, "c": channel}
    if event_category:
        payload["ec"] = event_category
    return _serializer(_UNSUB_SALT).dumps(payload)


def verify_unsubscribe_token(token: str, *, max_age_seconds: int = 60 * 60 * 24 * 365) -> dict:
    """Verify and decode an unsubscribe token. Default lifetime: 1 year."""
    try:
        return _serializer(_UNSUB_SALT).loads(token, max_age=max_age_seconds)
    except BadSignature as exc:
        raise ValueError("Invalid unsubscribe token") from exc


def make_preferences_token(user_id: str) -> str:
    """Issue a signed token for the public preference center."""
    return _serializer(_PREF_SALT).dumps({"u": user_id})


def verify_preferences_token(token: str, *, max_age_seconds: int = 60 * 60 * 24 * 30) -> dict:
    """Verify a preference-center token. Default lifetime: 30 days."""
    try:
        return _serializer(_PREF_SALT).loads(token, max_age=max_age_seconds)
    except BadSignature as exc:
        raise ValueError("Invalid preferences token") from exc
