"""Community enhancements – likes tables, reply approval flow, platform configs

Revision ID: 004_community
Revises: 001_initial
Create Date: 2025-07-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers
revision: str = "004_community"
down_revision: Union[str, None] = "003_rbac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. community_post_likes ───────────────────────────────────────────────
    op.create_table(
        "community_post_likes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("post_id", "user_id", name="uq_post_like"),
    )
    op.create_index("idx_community_post_likes_post", "community_post_likes", ["post_id"])
    op.create_index("idx_community_post_likes_user", "community_post_likes", ["user_id"])

    # ── 2. community_reply_likes ──────────────────────────────────────────────
    op.create_table(
        "community_reply_likes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("reply_id", UUID(as_uuid=True), sa.ForeignKey("community_replies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("reply_id", "user_id", name="uq_reply_like"),
    )
    op.create_index("idx_community_reply_likes_reply", "community_reply_likes", ["reply_id"])
    op.create_index("idx_community_reply_likes_user", "community_reply_likes", ["user_id"])

    # ── 3. Add approval columns to community_replies ──────────────────────────
    op.add_column(
        "community_replies",
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "community_replies",
        sa.Column(
            "approval_request_id",
            UUID(as_uuid=True),
            sa.ForeignKey("approval_requests.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # ── 4. Platform config seed ───────────────────────────────────────────────
    op.execute("""
        INSERT INTO platform_configs (section, key, value, description)
        SELECT 'community', 'post_max_words', '300'::jsonb, 'Maximum word count for a community post body'
        WHERE NOT EXISTS (SELECT 1 FROM platform_configs WHERE section = 'community' AND key = 'post_max_words')
    """)
    op.execute("""
        INSERT INTO platform_configs (section, key, value, description)
        SELECT 'community', 'post_min_words', '10'::jsonb, 'Minimum word count for a community post body'
        WHERE NOT EXISTS (SELECT 1 FROM platform_configs WHERE section = 'community' AND key = 'post_min_words')
    """)


def downgrade() -> None:
    op.execute("DELETE FROM platform_configs WHERE section = 'community' AND key IN ('post_max_words', 'post_min_words')")
    op.drop_column("community_replies", "approval_request_id")
    op.drop_column("community_replies", "is_approved")
    op.drop_index("idx_community_reply_likes_user", "community_reply_likes")
    op.drop_index("idx_community_reply_likes_reply", "community_reply_likes")
    op.drop_table("community_reply_likes")
    op.drop_index("idx_community_post_likes_user", "community_post_likes")
    op.drop_index("idx_community_post_likes_post", "community_post_likes")
    op.drop_table("community_post_likes")
