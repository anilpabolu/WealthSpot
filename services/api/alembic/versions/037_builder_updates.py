"""Create builder_updates + builder_update_attachments tables.

Revision ID: 037_builder_updates
Revises: 036_vault_explorer_metric
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "037_builder_updates"
down_revision = "036_vault_explorer_metric"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "builder_updates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("opportunity_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("creator_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_builder_updates_opportunity_id", "builder_updates", ["opportunity_id"])

    op.create_table(
        "builder_update_attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("update_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("builder_updates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.Text),
        sa.Column("s3_key", sa.Text, nullable=False),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column("content_type", sa.String(100)),
        sa.Column("size_bytes", sa.BigInteger),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_builder_update_attachments_update_id", "builder_update_attachments", ["update_id"])


def downgrade() -> None:
    op.drop_table("builder_update_attachments")
    op.drop_table("builder_updates")
