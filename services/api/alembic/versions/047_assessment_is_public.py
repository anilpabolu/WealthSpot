"""Add is_public to opportunity_assessments

Revision ID: 047_assessment_is_public
Revises: 046_opportunity_funding_dates
Create Date: 2025-01-01 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "047_assessment_is_public"
down_revision: Union[str, None] = "046_opportunity_funding_dates"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.add_column(
        "opportunity_assessments",
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default="true"),
    )


def downgrade() -> None:
    op.drop_column("opportunity_assessments", "is_public")
