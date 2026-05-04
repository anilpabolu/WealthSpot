"""In-app notification channel — writes to the existing Notification model."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger(__name__)


async def write_in_app(
    user_id: str | uuid.UUID,
    title: str,
    body: str,
    data: dict[str, Any] | None,
    session: AsyncSession,
) -> None:
    """Persist an in-app notification using the existing Notification ORM model."""
    try:
        from app.models.notification import Notification  # type: ignore[import-not-found]

        notif = Notification(
            user_id=user_id,
            title=title,
            body=body,
            data=data or {},
        )
        session.add(notif)
        await session.flush()
        log.debug("in_app notification written user_id=%s", user_id)
    except ImportError:
        # Notification model not available — write a CommMessage as fallback
        log.warning("Notification model not found; in_app message dropped for user_id=%s", user_id)
    except Exception as exc:
        log.error("Failed to write in_app notification: %s", exc, exc_info=True)
        raise
