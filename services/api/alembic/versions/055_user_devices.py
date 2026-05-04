"""Create user_devices table for push-notification routing.

Each row is a (user_id, push_token) pair. The platform column lets the
notifications fan-out service decide which provider (APNs / FCM / Web Push)
should deliver the message; for Expo push tokens, both APNs and FCM are
fronted by Expo's relay.

Revision ID: 055_user_devices
Revises: 054_opportunity_documents_table
Create Date: 2026-04-28 14:00:00.000000

# TENANCY: workspace-scope candidate — see note on app/models/device.py.
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision: str = "055_user_devices"
down_revision: Union[str, None] = "054_opportunity_documents_table"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.create_table(
        "user_devices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("push_token", sa.Text, nullable=False),
        sa.Column("platform", sa.String(10), nullable=False),
        sa.Column("device_label", sa.String(120), nullable=True),
        sa.Column("app_version", sa.String(40), nullable=True),
        sa.Column(
            "last_active_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "user_id", "push_token", name="uq_user_devices_user_token"
        ),
    )
    op.create_index(
        "ix_user_devices_user_id",
        "user_devices",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_devices_user_id", "user_devices")
    op.drop_table("user_devices")
