"""
Device router — register / unregister mobile push tokens.

The mobile client calls POST /devices on app launch (after login) to enrol
its Expo push token, and DELETE /devices/{token} on sign-out so future
broadcasts skip the dead device. Tokens are scoped per user; re-posting an
existing (user, token) just refreshes `last_active_at`.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.device import DevicePlatform, UserDevice
from app.models.user import User

router = APIRouter(prefix="/devices", tags=["devices"])


class DeviceRegisterRequest(BaseModel):
    push_token: str = Field(min_length=8, max_length=512)
    platform: DevicePlatform
    device_label: str | None = Field(default=None, max_length=120)
    app_version: str | None = Field(default=None, max_length=40)


class DeviceOut(BaseModel):
    id: uuid.UUID
    platform: DevicePlatform
    device_label: str | None = None
    app_version: str | None = None
    last_active_at: Any

    model_config = {"from_attributes": True}


@router.post("", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
async def register_device(
    body: DeviceRegisterRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserDevice:
    """Register or refresh a push token for the authenticated user.

    Idempotent on (user_id, push_token) — duplicate posts update the
    last-seen timestamp and metadata instead of creating new rows.
    """
    now = datetime.now(UTC)
    stmt = (
        pg_insert(UserDevice)
        .values(
            user_id=user.id,
            push_token=body.push_token,
            platform=body.platform.value,
            device_label=body.device_label,
            app_version=body.app_version,
            last_active_at=now,
        )
        .on_conflict_do_update(
            constraint="uq_user_devices_user_token",
            set_={
                "platform": body.platform.value,
                "device_label": body.device_label,
                "app_version": body.app_version,
                "last_active_at": now,
            },
        )
        .returning(UserDevice.id)
    )
    result = await db.execute(stmt)
    row_id = result.scalar_one()
    fresh = await db.get(UserDevice, row_id)
    if fresh is None:
        # Should be unreachable — we just inserted/updated this row.
        raise HTTPException(status_code=500, detail="Device registration failed")
    return fresh


@router.delete("/{push_token:path}", status_code=status.HTTP_204_NO_CONTENT)
async def unregister_device(
    push_token: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a push token. Safe to call even if the token isn't on file."""
    await db.execute(
        delete(UserDevice).where(
            UserDevice.user_id == user.id,
            UserDevice.push_token == push_token,
        )
    )


@router.get("", response_model=list[DeviceOut])
async def list_my_devices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserDevice]:
    """List the user's registered devices (most recently active first)."""
    rows = (
        await db.execute(
            select(UserDevice)
            .where(UserDevice.user_id == user.id)
            .order_by(UserDevice.last_active_at.desc())
        )
    ).scalars().all()
    return list(rows)
