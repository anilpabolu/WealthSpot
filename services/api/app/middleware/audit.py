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
                details=details,
                ip_address=ip_address,
                user_agent=user_agent,
                created_at=datetime.now(timezone.utc),
            )
        )
        await session.commit()
