"""Add property specification columns to properties table.

Mirrors the columns added to opportunities in migration 050, now also
available on the canonical properties record so that the mobile/web
property-detail pages can display full specs without requiring an
active opportunity to exist for the listing.

New columns:
  - property_type: VARCHAR(30) — flat | villa | plot | commercial | warehouse | mixed_use
  - price_per_sqft: NUMERIC(10,2) — representative listed rate per sq.ft
  - total_project_area_sqft: NUMERIC(15,2) — total construction/land footprint
  - property_specs: JSONB — discriminated union per property type (units, configs, areas)
  - property_amenities: TEXT[] — selected amenity keys from master list

Revision ID: 057_property_specs_on_properties
Revises: 056_amenity_cost_eoi_config
Create Date: 2026-04-30 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

from alembic import op

revision: str = "057_property_specs_on_properties"
down_revision: Union[str, None] = "056_amenity_cost_eoi_config"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.add_column(
        "properties",
        sa.Column("property_type", sa.String(30), nullable=True),
    )
    op.add_column(
        "properties",
        sa.Column("price_per_sqft", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "properties",
        sa.Column("total_project_area_sqft", sa.Numeric(15, 2), nullable=True),
    )
    op.add_column(
        "properties",
        sa.Column("property_specs", JSONB, nullable=True),
    )
    op.add_column(
        "properties",
        sa.Column("property_amenities", ARRAY(sa.Text()), nullable=True),
    )

    # Index on property_type for filtering/searching by type
    op.create_index(
        "ix_properties_property_type",
        "properties",
        ["property_type"],
        unique=False,
    )

    # Seed: property_empty_section_mode — controls empty-section display on property detail pages
    op.execute("""
        INSERT INTO platform_configs (section, key, value, is_active)
        VALUES ('content', 'property_empty_section_mode', '"show_placeholder"'::jsonb, true)
        ON CONFLICT (section, key) DO NOTHING
    """)


def downgrade() -> None:
    op.drop_index("ix_properties_property_type", table_name="properties")
    op.drop_column("properties", "property_amenities")
    op.drop_column("properties", "property_specs")
    op.drop_column("properties", "total_project_area_sqft")
    op.drop_column("properties", "price_per_sqft")
    op.drop_column("properties", "property_type")
