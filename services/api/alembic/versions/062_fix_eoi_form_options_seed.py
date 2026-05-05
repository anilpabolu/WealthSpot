"""Re-seed missing investment_timeline and funding_source EOI form options.

Migration 058 seeded all four field groups in a single INSERT, but the rows for
investment_timeline and funding_source are absent from the live database.
This migration re-inserts them using ON CONFLICT DO NOTHING so it is safe to
run even if some rows already exist.

Revision ID: 062_fix_eoi_form_options_seed
Revises: 061_app_images
Create Date: 2026-05-05
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "062_fix_eoi_form_options_seed"
down_revision: Union[str, None] = "061_app_images"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO eoi_form_options (field_name, value, label, sort_order) VALUES
        ('investment_timeline', 'immediate',   'Immediate (within 2 weeks)', 1),
        ('investment_timeline', '1-3_months',  '1\u20133 Months',                2),
        ('investment_timeline', '3-6_months',  '3\u20136 Months',                3),
        ('investment_timeline', 'exploring',   'Just Exploring',             4),
        ('funding_source',      'own_funds',   'Own Funds',                  1),
        ('funding_source',      'bank_loan',   'Bank Loan',                  2),
        ('funding_source',      'both',        'Both',                       3)
        ON CONFLICT (field_name, value) DO NOTHING
    """)


def downgrade() -> None:
    # Intentionally a no-op: removing seed data on rollback would break the UI
    pass
