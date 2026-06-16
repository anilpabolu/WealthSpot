"""add user_visit_logs table

Revision ID: 079_user_visit_logs
Revises: 078_investment_ledger
Create Date: 2026-06-16 12:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "079_user_visit_logs"
down_revision: Union[str, None] = "078_investment_ledger"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_visit_logs",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "source_type",
            sa.String(20),
            nullable=False,
            index=True,
            comment="Category: 'vault' or 'opportunity'",
        ),
        sa.Column(
            "source_id",
            sa.String(100),
            nullable=False,
            index=True,
            comment="Vault slug or opportunity UUID",
        ),
        sa.Column(
            "action",
            sa.String(50),
            nullable=False,
            server_default="view",
        ),
        sa.Column(
            "visit_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Total views by this user",
        ),
        sa.Column("last_visited_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "source_type", "source_id", name="uq_user_source_visit"),
    )


def downgrade() -> None:
    op.drop_table("user_visit_logs")
