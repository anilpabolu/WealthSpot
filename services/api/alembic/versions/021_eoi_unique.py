"""Deduplicate EOIs and add unique constraint (user_id, opportunity_id)

Revision ID: 021_eoi_unique
Revises: 020_app_videos
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "021_eoi_unique"
down_revision: Union[str, None] = "020_app_videos"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Deduplicate EOIs keeping earliest per user+opportunity
    op.execute("""
        DELETE FROM eoi_question_answers
        WHERE eoi_id IN (
            SELECT id FROM expressions_of_interest
            WHERE id NOT IN (
                SELECT DISTINCT ON (user_id, opportunity_id) id
                FROM expressions_of_interest
                ORDER BY user_id, opportunity_id, created_at ASC
            )
        );
    """)
    op.execute("""
        DELETE FROM expressions_of_interest
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, opportunity_id) id
            FROM expressions_of_interest
            ORDER BY user_id, opportunity_id, created_at ASC
        );
    """)

    # Add unique constraint (idempotent – skip if already exists)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_eoi_user_opportunity'
            ) THEN
                ALTER TABLE expressions_of_interest
                    ADD CONSTRAINT uq_eoi_user_opportunity UNIQUE (user_id, opportunity_id);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE expressions_of_interest DROP CONSTRAINT IF EXISTS uq_eoi_user_opportunity;")
