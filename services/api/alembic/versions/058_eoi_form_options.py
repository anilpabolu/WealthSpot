"""Add eoi_form_options table – DB-driven EOI form option values.

Stores the selectable options for the Express Interest form fields:
  - investment_timeline
  - funding_source
  - purpose
  - preferred_contact

Each option has a field_name, value (key stored in EOI record), label (display text),
is_active (admin-toggleable), and sort_order for ordering.

Revision ID: 058_eoi_form_options
Revises: 057_property_specs_on_properties
Create Date: 2026-04-30 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "058_eoi_form_options"
down_revision: Union[str, None] = "057_property_specs_on_properties"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.create_table(
        "eoi_form_options",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("field_name", sa.String(50), nullable=False),
        sa.Column("value", sa.String(100), nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("field_name", "value", name="uq_eoi_form_options_field_value"),
    )
    op.create_index("ix_eoi_form_options_field_name", "eoi_form_options", ["field_name"])
    op.create_index("ix_eoi_form_options_field_active", "eoi_form_options", ["field_name", "is_active"])

    # Seed all form options
    op.execute("""
        INSERT INTO eoi_form_options (field_name, value, label, sort_order) VALUES
        -- investment_timeline
        ('investment_timeline', 'immediate',   'Immediate (within 2 weeks)', 1),
        ('investment_timeline', '1-3_months',  '1–3 Months',                 2),
        ('investment_timeline', '3-6_months',  '3–6 Months',                 3),
        ('investment_timeline', 'exploring',   'Just Exploring',              4),
        -- funding_source
        ('funding_source', 'own_funds',  'Own Funds',  1),
        ('funding_source', 'bank_loan',  'Bank Loan',  2),
        ('funding_source', 'both',       'Both',       3),
        -- purpose
        ('purpose', 'investment',    'Investment / Returns', 1),
        ('purpose', 'rental_income', 'Rental Income',        2),
        ('purpose', 'self_use',      'Self Use',             3),
        -- preferred_contact
        ('preferred_contact', 'phone',    'Phone Call', 1),
        ('preferred_contact', 'email',    'Email',      2),
        ('preferred_contact', 'whatsapp', 'WhatsApp',   3)
    """)


def downgrade() -> None:
    op.drop_index("ix_eoi_form_options_field_active", table_name="eoi_form_options")
    op.drop_index("ix_eoi_form_options_field_name", table_name="eoi_form_options")
    op.drop_table("eoi_form_options")
