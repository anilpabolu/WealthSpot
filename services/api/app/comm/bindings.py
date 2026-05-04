"""Binding loader with 10-second TTL cache."""

from __future__ import annotations

import logging
import time
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger(__name__)

# Simple in-process TTL cache: key → (expiry_ts, value)
_cache: dict[str, tuple[float, list[Any]]] = {}
_TTL = 10.0  # seconds


async def load_active_bindings(
    event_name: str, version: int, session: AsyncSession
) -> list[Any]:
    """Return all enabled CommBinding rows for (event_name, version), TTL-cached."""
    key = f"{event_name}:{version}"
    now = time.monotonic()
    entry = _cache.get(key)
    if entry and entry[0] > now:
        return entry[1]

    from app.comm.models import CommBinding

    stmt = select(CommBinding).where(
        CommBinding.event_name == event_name,
        CommBinding.event_version == version,
        CommBinding.enabled.is_(True),
        CommBinding.deleted_at.is_(None),
    )
    result = await session.execute(stmt)
    rows = list(result.scalars().all())
    _cache[key] = (now + _TTL, rows)
    log.debug("bindings cache updated key=%s count=%d", key, len(rows))
    return rows


def invalidate_bindings_cache(event_name: str | None = None, version: int | None = None) -> None:
    """Explicitly evict one or all binding cache entries."""
    if event_name is not None and version is not None:
        _cache.pop(f"{event_name}:{version}", None)
    else:
        _cache.clear()
