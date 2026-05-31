"""Add maps_url and location_usps to opportunities table.

Adds 2 new nullable columns:
  - maps_url: TEXT — Google Maps share link or embed URL
  - location_usps: JSONB — array of {text, category} location selling points

Also surfaces latitude/longitude (already exist on the model from migration 011)
so the create/update API can now receive them. No column change needed for those.

Revision ID: 051_maps_and_usps
Revises: 050_property_specs
Create Date: 2026-05-31 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision: str = "051_maps_and_usps"
down_revision: Union[str, None] = "050_property_specs"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.add_column(
        "opportunities",
        sa.Column("maps_url", sa.Text(), nullable=True),
    )
    op.add_column(
        "opportunities",
        sa.Column("location_usps", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("opportunities", "location_usps")
    op.drop_column("opportunities", "maps_url")
