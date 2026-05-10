"""Add safe_vault_data, template_s3_key, template_data columns to opportunities.

These columns were added to the ORM model but the corresponding migration was
never created, causing UndefinedColumnError on SELECT queries.

Revision ID: 064_missing_opportunity_columns
Revises: 063_opportunity_form_options
Create Date: 2026-05-10
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "064_missing_opportunity_columns"
down_revision: Union[str, None] = "063_opportunity_form_options"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use ADD COLUMN IF NOT EXISTS to be idempotent in case partial columns exist.
    op.execute(
        "ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS safe_vault_data JSONB"
    )
    op.execute(
        "ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS template_s3_key TEXT"
    )
    op.execute(
        "ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS template_data JSONB"
    )


def downgrade() -> None:
    op.drop_column("opportunities", "template_data")
    op.drop_column("opportunities", "template_s3_key")
    op.drop_column("opportunities", "safe_vault_data")
