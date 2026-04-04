"""EOI stage history – audit trail for pipeline stage transitions

Revision ID: 022_eoi_stage_history
Revises: 021_eoi_unique
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "022_eoi_stage_history"
down_revision: Union[str, None] = "021_eoi_unique"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS eoi_stage_history (
            id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
            eoi_id      UUID         NOT NULL REFERENCES expressions_of_interest(id) ON DELETE CASCADE,
            status      VARCHAR(30)  NOT NULL,
            changed_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
            changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_eoi_stage_history_eoi ON eoi_stage_history(eoi_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_eoi_stage_history_eoi_status ON eoi_stage_history(eoi_id, status);")

    # Seed history for existing EOIs that don't already have an entry
    op.execute("""
        INSERT INTO eoi_stage_history (eoi_id, status, changed_at)
        SELECT id, status, COALESCE(created_at, NOW())
        FROM expressions_of_interest e
        WHERE NOT EXISTS (
            SELECT 1 FROM eoi_stage_history h WHERE h.eoi_id = e.id
        );
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS eoi_stage_history;")
