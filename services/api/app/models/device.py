"""
UserDevice — a registered mobile (or web push) device for a user.

Each row is one (user, device) pair keyed by the platform-issued push token.
Used by the notifications service to fan out a single notification across all
of a user's devices, and to revoke a token when the device unregisters.

# TENANCY: workspace-scope candidate — devices are user-owned, but a future
# multi-workspace model would need (workspace_id, user_id, token) so a single
# user-on-many-workspaces still routes correctly.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DevicePlatform(str, PyEnum):
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"


class UserDevice(Base):
    __tablename__ = "user_devices"
    __table_args__ = (UniqueConstraint("user_id", "push_token", name="uq_user_devices_user_token"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Expo push token (ExponentPushToken[...]) or, for direct APNs/FCM use,
    # the platform-native token string.
    push_token: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[DevicePlatform] = mapped_column(
        Enum(DevicePlatform, native_enum=False, length=10),
        nullable=False,
    )
    # Optional: device model string + app version, useful for support triage.
    device_label: Mapped[str | None] = mapped_column(String(120))
    app_version: Mapped[str | None] = mapped_column(String(40))
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    user = relationship("User", lazy="select")
