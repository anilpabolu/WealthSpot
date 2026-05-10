"""Add avatar_s3_key and other missing columns to users table.

Revision ID: 065_missing_user_columns
Revises: 064_missing_opportunity_columns
Create Date: 2026-05-10
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "065_missing_user_columns"
down_revision: Union[str, None] = "064_missing_opportunity_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # avatar_s3_key — used in User model but missing from DB
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_s3_key TEXT")


def downgrade() -> None:
    op.drop_column("users", "avatar_s3_key")
