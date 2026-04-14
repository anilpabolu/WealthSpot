"""
Vault feature flags router — matrix CRUD + SSE stream.
"""

import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_super_admin
from app.models.user import User
from app.models.vault_feature_flag import VaultFeatureFlag
from app.schemas.vault_feature import (
    MyFeatureFlags,
    VaultFeatureFlagRead,
    VaultFeatureMatrixUpdate,
)

router = APIRouter(prefix="/vault-features", tags=["vault-features"])

# ── SSE subscribers (in-process; for multi-worker use Redis pub/sub) ─────────
_sse_subscribers: list[asyncio.Queue] = []


async def _broadcast_sse(data: dict) -> None:
    """Send a feature-update event to all connected SSE clients."""
    payload = json.dumps(data)
    dead: list[asyncio.Queue] = []
    for q in _sse_subscribers:
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        _sse_subscribers.remove(q)


@router.get("/matrix", response_model=list[VaultFeatureFlagRead])
async def get_feature_matrix(
    _user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> list[VaultFeatureFlag]:
    """Return all vault feature flags (120 rows) for the matrix grid."""
    result = await db.execute(
        select(VaultFeatureFlag).order_by(
            VaultFeatureFlag.vault_type,
            VaultFeatureFlag.role,
            VaultFeatureFlag.feature_key,
        )
    )
    return list(result.scalars().all())


@router.get("/my-features", response_model=MyFeatureFlags)
async def get_my_features(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MyFeatureFlags:
    """Return feature flags relevant to the current user's roles."""
    user_roles = user.roles or ["investor"]

    result = await db.execute(
        select(VaultFeatureFlag).where(
            VaultFeatureFlag.role.in_(user_roles),
            VaultFeatureFlag.enabled.is_(True),
        )
    )
    flags = result.scalars().all()

    out = MyFeatureFlags()
    for flag in flags:
        vault_dict = getattr(out, flag.vault_type, None)
        if vault_dict is not None:
            # If feature already present (from another role), OR it (any-role-enables)
            vault_dict[flag.feature_key] = True

    return out


@router.put("/matrix", response_model=list[VaultFeatureFlagRead])
async def update_feature_matrix(
    body: VaultFeatureMatrixUpdate,
    user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> list[VaultFeatureFlag]:
    """Bulk-update vault feature toggles. Super-admin only."""
    from datetime import datetime, timezone

    for upd in body.updates:
        await db.execute(
            update(VaultFeatureFlag)
            .where(
                VaultFeatureFlag.vault_type == upd.vault_type,
                VaultFeatureFlag.role == upd.role,
                VaultFeatureFlag.feature_key == upd.feature_key,
            )
            .values(
                enabled=upd.enabled,
                updated_by=user.id,
                updated_at=datetime.now(timezone.utc),
            )
        )

    await db.flush()

    # Broadcast changes via SSE
    await _broadcast_sse({
        "type": "feature_matrix_update",
        "updates": [u.model_dump() for u in body.updates],
    })

    # Return full matrix
    result = await db.execute(
        select(VaultFeatureFlag).order_by(
            VaultFeatureFlag.vault_type,
            VaultFeatureFlag.role,
            VaultFeatureFlag.feature_key,
        )
    )
    return list(result.scalars().all())


@router.get("/stream")
async def feature_stream(
    _user: User = Depends(get_current_user),
) -> StreamingResponse:
    """SSE endpoint — streams feature flag changes in real time."""
    queue: asyncio.Queue = asyncio.Queue(maxsize=50)
    _sse_subscribers.append(queue)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Initial keepalive
            yield "event: connected\ndata: {}\n\n"
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"event: update\ndata: {data}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            if queue in _sse_subscribers:
                _sse_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
