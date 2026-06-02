"""Safety-net: idempotent ADD COLUMN IF NOT EXISTS for columns that caused 500 errors.

Each statement is idempotent — safe to run against a DB that already has the column.
This guards against migration-chain gaps where the chain head was updated but
intermediate migrations were skipped due to the deploy-api.yml `|| true` swallow.

Revision ID: 068_safety_net_columns
Revises: 067_maps_and_usps
Create Date: 2026-06-02
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "068_safety_net_columns"
down_revision: Union[str, None] = "067_maps_and_usps"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    # opportunity_assessments.is_public — added by 047_assessment_is_public
    op.execute(
        "ALTER TABLE opportunity_assessments "
        "ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true"
    )
    # opportunities.maps_url / location_usps — added by 067_maps_and_usps
    op.execute("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS maps_url TEXT")
    op.execute("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS location_usps JSONB")
    # opportunities.investment_mode — added by 059_investment_mode
    op.execute(
        "ALTER TABLE opportunities "
        "ADD COLUMN IF NOT EXISTS investment_mode VARCHAR(20) DEFAULT 'lumpsum'"
    )
    # opportunity_media assessment columns — added by 041_shield_assessments (or similar)
    op.execute(
        "ALTER TABLE opportunity_media "
        "ADD COLUMN IF NOT EXISTS assessment_category_code VARCHAR(30)"
    )
    op.execute(
        "ALTER TABLE opportunity_media "
        "ADD COLUMN IF NOT EXISTS assessment_subcategory_code VARCHAR(50)"
    )
    # opportunities.cover_image — added by 83740d25652a
    op.execute("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cover_image TEXT")
    # opportunities.safe_vault_data — added by 064_missing_opportunity_columns
    op.execute("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS safe_vault_data JSONB")


def downgrade() -> None:
    pass  # Safety-net migration — intentionally not reversible
