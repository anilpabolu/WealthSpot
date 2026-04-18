"""Create vault_explorers table for explicit exploration tracking.

Revision ID: 040_vault_explorers
Revises: 039_appreciation
Create Date: 2026-04-18

Tracks when a user clicks "Explore" on a vault.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "040_vault_explorers"
down_revision = "039_appreciation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vault_explorers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vault_type", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.UniqueConstraint("user_id", "vault_type", name="uq_vault_explorer_user_vault"),
    )
    op.create_index("ix_vault_explorers_vault_type", "vault_explorers", ["vault_type"])


def downgrade() -> None:
    op.drop_index("ix_vault_explorers_vault_type")
    op.drop_table("vault_explorers")
