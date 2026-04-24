"""Add safe listing category data updates.

Revision ID: 045_safe_listing_category
Revises: 044_safe_vault_profiling
Create Date: 2026-04-23
"""

from collections.abc import Sequence
from pathlib import Path
from typing import Union

from alembic import op

revision: str = "045_safe_listing_category"
down_revision: Union[str, None] = "044_safe_vault_profiling"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    sql_path = Path(__file__).parent.parent.parent / "database" / "045_safe_listing_category.sql"
    sql = sql_path.read_text(encoding="utf-8")
    sql = sql.replace("BEGIN;", "").replace("COMMIT;", "")
    bind = op.get_bind()
    for statement in sql.split(";"):
        statement = statement.strip()
        if statement:
            bind.exec_driver_sql(statement)


def downgrade() -> None:
    op.execute(
        """
        UPDATE approval_requests ar
        SET category = 'opportunity_listing',
            updated_at = NOW()
        WHERE ar.category = 'safe_listing'
          AND (
            COALESCE(ar.payload ->> 'vault_type', '') = 'safe'
            OR EXISTS (
              SELECT 1
              FROM opportunities o
              WHERE o.id::text = ar.resource_id
                AND o.vault_type = 'safe'
            )
          )
        """
    )
    op.execute("DELETE FROM vault_feature_flags WHERE vault_type = 'safe'")
    op.execute("DELETE FROM app_videos WHERE page = 'vaults' AND section_tag = 'safe_vault_intro'")