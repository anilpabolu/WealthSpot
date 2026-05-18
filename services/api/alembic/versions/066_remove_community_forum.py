"""Remove community forum feature and schema.

Revision ID: 066_remove_community_forum
Revises: 065_missing_user_columns
Create Date: 2026-05-18
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "066_remove_community_forum"
down_revision: Union[str, None] = "065_missing_user_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Clean records that point to forum resources before dropping forum tables.
    op.execute(
        """
        DELETE FROM notifications
        WHERE type = 'community_reply';
        """
    )
    op.execute(
        """
        DELETE FROM approval_requests
        WHERE category = 'community_answer'
           OR resource_type = 'community_reply';
        """
    )
    op.execute(
        """
        DELETE FROM user_activities
        WHERE resource_type IN ('community_post', 'community_reply');
        """
    )
    op.execute(
        """
        DELETE FROM platform_configs
        WHERE section = 'community'
          AND key IN ('post_max_words', 'post_min_words');
        """
    )

    # Hard-delete forum tables.
    op.execute("DROP TABLE IF EXISTS community_reply_likes CASCADE")
    op.execute("DROP TABLE IF EXISTS community_post_likes CASCADE")
    op.execute("DROP TABLE IF EXISTS community_replies CASCADE")
    op.execute("DROP TABLE IF EXISTS community_posts CASCADE")


def downgrade() -> None:
    raise RuntimeError("Downgrade is not supported for 066_remove_community_forum")
