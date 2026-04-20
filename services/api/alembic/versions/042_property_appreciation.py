"""Add property appreciation support.

- properties.current_unit_price (nullable) for admin-set appreciated price
- appreciation_events.property_id (nullable FK) to support property appreciation logs
- appreciation_events.opportunity_id made nullable (one of the two must be set)
- CHECK constraint ensures at least one target is set

Revision ID: 042_property_appreciation
Revises: 041_shield_assessments
Create Date: 2026-04-19

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "042_property_appreciation"
down_revision: Union[str, None] = "041_shield_assessments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add current_unit_price to properties
    op.add_column(
        "properties",
        sa.Column("current_unit_price", sa.Numeric(12, 2), nullable=True),
    )

    # 2. Add property_id FK to appreciation_events
    op.add_column(
        "appreciation_events",
        sa.Column(
            "property_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_appreciation_events_property_id",
        "appreciation_events",
        "properties",
        ["property_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_appreciation_events_property_id",
        "appreciation_events",
        ["property_id"],
    )

    # 3. Make opportunity_id nullable (was NOT NULL before)
    op.alter_column(
        "appreciation_events",
        "opportunity_id",
        existing_type=sa.dialects.postgresql.UUID(as_uuid=True),
        nullable=True,
    )

    # 4. CHECK: at least one of opportunity_id / property_id must be set
    op.execute(
        """
        ALTER TABLE appreciation_events
        ADD CONSTRAINT ck_appreciation_events_target
        CHECK (opportunity_id IS NOT NULL OR property_id IS NOT NULL)
        """
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE appreciation_events DROP CONSTRAINT IF EXISTS ck_appreciation_events_target"
    )
    op.alter_column(
        "appreciation_events",
        "opportunity_id",
        existing_type=sa.dialects.postgresql.UUID(as_uuid=True),
        nullable=False,
    )
    op.drop_index("ix_appreciation_events_property_id", table_name="appreciation_events")
    op.drop_constraint(
        "fk_appreciation_events_property_id",
        "appreciation_events",
        type_="foreignkey",
    )
    op.drop_column("appreciation_events", "property_id")
    op.drop_column("properties", "current_unit_price")
