"""
Audit logging middleware – records all state-changing requests.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from sqlalchemy import insert

from app.core.database import async_session_factory
from app.models.community import AuditLog

# Keys whose values must be redacted in audit details
_SENSITIVE_KEYS = frozenset({
    "pan_number", "pan", "aadhaar", "aadhaar_number",
    "bank_account_number", "account_number", "ifsc_code",
    "otp", "otp_hash", "email_otp_hash", "phone_otp_hash",
    "password", "password_hash", "secret", "token",
    "razorpay_signature", "razorpay_key_secret",
})


def _redact_sensitive(data: dict[str, Any] | None) -> dict[str, Any] | None:
    """Deep-redact sensitive fields from audit detail dicts."""
    if not data:
        return data
    redacted: dict[str, Any] = {}
    for key, value in data.items():
        if key.lower() in _SENSITIVE_KEYS:
            redacted[key] = "***REDACTED***"
        elif isinstance(value, dict):
            redacted[key] = _redact_sensitive(value)
        else:
            redacted[key] = value
    return redacted


async def log_audit_event(
    *,
    actor_id: uuid.UUID | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    """Fire-and-forget audit log entry."""
    ip_address = None
    user_agent = None
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    async with async_session_factory() as session:
        await session.execute(
            insert(AuditLog).values(
                id=uuid.uuid4(),
                actor_id=actor_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=_redact_sensitive(details),
                ip_address=ip_address,
                user_agent=user_agent,
                created_at=datetime.now(timezone.utc),
            )
        )
        await session.commit()
