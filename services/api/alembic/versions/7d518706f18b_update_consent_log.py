"""update consent log for granular consents

Revision ID: 7d518706f18b
Revises: 7d518706f18a
Create Date: 2026-05-29 23:45:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7d518706f18b"
down_revision: Union[str, None] = "7d518706f18a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new columns
    op.add_column("consent_logs", sa.Column("context", sa.String(length=50), nullable=True))
    op.add_column(
        "consent_logs",
        sa.Column("consent_version", sa.String(length=50), nullable=True, server_default="v1.0"),
    )
    op.add_column(
        "consent_logs",
        sa.Column(
            "regulatory_accepted", sa.Boolean(), nullable=True, server_default=sa.text("false")
        ),
    )
    op.add_column(
        "consent_logs",
        sa.Column("privacy_accepted", sa.Boolean(), nullable=True, server_default=sa.text("false")),
    )
    op.add_column(
        "consent_logs",
        sa.Column(
            "communication_accepted", sa.Boolean(), nullable=True, server_default=sa.text("false")
        ),
    )

    # Migrate data
    op.execute("UPDATE consent_logs SET context = consent_type")

    # Make them non-nullable
    op.alter_column("consent_logs", "context", existing_type=sa.String(length=50), nullable=False)
    op.alter_column(
        "consent_logs", "consent_version", existing_type=sa.String(length=50), nullable=False
    )
    op.alter_column(
        "consent_logs", "regulatory_accepted", existing_type=sa.Boolean(), nullable=False
    )
    op.alter_column("consent_logs", "privacy_accepted", existing_type=sa.Boolean(), nullable=False)
    op.alter_column(
        "consent_logs", "communication_accepted", existing_type=sa.Boolean(), nullable=False
    )

    # 2. Add new index on context
    op.create_index(op.f("ix_consent_logs_context"), "consent_logs", ["context"], unique=False)

    # 3. Drop old columns and indexes
    op.drop_index("ix_consent_logs_consent_type", table_name="consent_logs")
    op.drop_column("consent_logs", "consent_type")
    op.drop_column("consent_logs", "consented")


def downgrade() -> None:
    op.add_column(
        "consent_logs",
        sa.Column(
            "consented",
            sa.BOOLEAN(),
            autoincrement=False,
            nullable=True,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "consent_logs",
        sa.Column("consent_type", sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    )

    op.execute("UPDATE consent_logs SET consent_type = context, consented = regulatory_accepted")

    op.alter_column("consent_logs", "consented", existing_type=sa.BOOLEAN(), nullable=False)
    op.alter_column(
        "consent_logs", "consent_type", existing_type=sa.VARCHAR(length=50), nullable=False
    )

    op.create_index("ix_consent_logs_consent_type", "consent_logs", ["consent_type"], unique=False)

    op.drop_index(op.f("ix_consent_logs_context"), table_name="consent_logs")

    op.drop_column("consent_logs", "communication_accepted")
    op.drop_column("consent_logs", "privacy_accepted")
    op.drop_column("consent_logs", "regulatory_accepted")
    op.drop_column("consent_logs", "consent_version")
    op.drop_column("consent_logs", "context")
