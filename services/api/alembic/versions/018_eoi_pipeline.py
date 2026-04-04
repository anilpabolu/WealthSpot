"""EOI pipeline statuses – referrer_id column + pipeline indexes

Revision ID: 018_eoi_pipeline
Revises: 017_eoi_system
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "018_eoi_pipeline"
down_revision: Union[str, None] = "017_eoi_system"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add referrer_id to expressions_of_interest (idempotent)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'expressions_of_interest' AND column_name = 'referrer_id'
            ) THEN
                ALTER TABLE expressions_of_interest
                    ADD COLUMN referrer_id UUID REFERENCES users(id) ON DELETE SET NULL;
            END IF;
        END $$;
    """)

    # Pipeline indexes (idempotent via IF NOT EXISTS)
    op.execute("CREATE INDEX IF NOT EXISTS idx_eoi_status ON expressions_of_interest(status);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_eoi_opportunity_status ON expressions_of_interest(opportunity_id, status);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_eoi_opportunity_status;")
    op.execute("DROP INDEX IF EXISTS idx_eoi_status;")
    op.drop_column("expressions_of_interest", "referrer_id")
