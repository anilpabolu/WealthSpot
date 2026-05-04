"""Append-only audit log helper for the comm platform.

Writes rows to `comm.audit_logs` via an existing AsyncSession. The table has
a PostgreSQL trigger that raises if any UPDATE or DELETE is attempted, so
every config change produces an immutable audit trail.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.comm.models import CommAuditLog


async def log_comm_audit(
    session: AsyncSession,
    *,
    actor_id: uuid.UUID,
    action: str,
    target_table: str,
    target_id: str,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> None:
    """Append a row to comm.audit_logs inside the caller's session."""
    entry = CommAuditLog(
        actor_id=actor_id,
        action=action,
        target_table=target_table,
        target_id=target_id,
        before=before,
        after=after,
        occurred_at=datetime.now(UTC),
        request_id=request_id,
    )
    session.add(entry)
