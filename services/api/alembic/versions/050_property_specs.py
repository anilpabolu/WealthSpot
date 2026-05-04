"""Add property specification columns to opportunities table.

Adds 5 new nullable columns:
  - property_type: VARCHAR(30) — flat | villa | plot | commercial | warehouse | mixed_use
  - price_per_sqft: NUMERIC(10,2) — representative listed rate per sq.ft
  - total_project_area_sqft: NUMERIC(15,2) — total construction/land footprint
  - property_specs: JSONB — discriminated union per property type (units, configs, areas)
  - property_amenities: TEXT[] — selected amenity keys from master list

Revision ID: 050_property_specs
Revises: 049_comm_seed
Create Date: 2026-04-27 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

from alembic import op

revision: str = "050_property_specs"
down_revision: Union[str, None] = "049_comm_seed"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.add_column(
        "opportunities",
        sa.Column("property_type", sa.String(30), nullable=True),
    )
    op.add_column(
        "opportunities",
        sa.Column("price_per_sqft", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "opportunities",
        sa.Column("total_project_area_sqft", sa.Numeric(15, 2), nullable=True),
    )
    op.add_column(
        "opportunities",
        sa.Column("property_specs", JSONB, nullable=True),
    )
    op.add_column(
        "opportunities",
        sa.Column("property_amenities", ARRAY(sa.Text()), nullable=True),
    )

    # Index on property_type for filtering/searching by type
    op.create_index(
        "ix_opportunities_property_type",
        "opportunities",
        ["property_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_opportunities_property_type", table_name="opportunities")
    op.drop_column("opportunities", "property_amenities")
    op.drop_column("opportunities", "property_specs")
    op.drop_column("opportunities", "total_project_area_sqft")
    op.drop_column("opportunities", "price_per_sqft")
    op.drop_column("opportunities", "property_type")
