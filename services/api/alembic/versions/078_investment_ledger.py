"""add investment ledger tables

Revision ID: 078_investment_ledger
Revises: 077_intrinsic_value_md
Create Date: 2026-06-13 18:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "078_investment_ledger"
down_revision: Union[str, None] = "077_intrinsic_value_md"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "investment_ledger_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("opportunity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("opportunity_investment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("legacy_investment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("registered_name", sa.String(length=255), nullable=True),
        sa.Column("opportunity_code", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("configuration", sa.String(length=255), nullable=True),
        sa.Column("base_value", sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column("gst", sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column("gst_paid", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("total_value", sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column("referred_by", sa.String(length=255), nullable=True),
        sa.Column("type_of_investment", sa.String(length=100), nullable=True),
        sa.Column("extra_sqft", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("sweep_on_oc_loan", sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column("latest_updates", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["opportunity_investment_id"], ["opportunity_investments.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["legacy_investment_id"], ["investments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_investment_ledger_entries_user_id", "investment_ledger_entries", ["user_id"]
    )
    op.create_index(
        "ix_investment_ledger_entries_opportunity_investment_id",
        "investment_ledger_entries",
        ["opportunity_investment_id"],
    )
    op.create_index(
        "ix_investment_ledger_entries_legacy_investment_id",
        "investment_ledger_entries",
        ["legacy_investment_id"],
    )

    op.create_table(
        "investment_ledger_collateral",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project", sa.String(length=255), nullable=True),
        sa.Column("unit_no", sa.String(length=50), nullable=True),
        sa.Column("configuration", sa.String(length=100), nullable=True),
        sa.Column("sbua", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("unit_cost", sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["entry_id"], ["investment_ledger_entries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_investment_ledger_collateral_entry_id", "investment_ledger_collateral", ["entry_id"]
    )

    op.create_table(
        "investment_ledger_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("s3_key", sa.Text(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=True),
        sa.Column("content_type", sa.String(length=100), nullable=True),
        sa.Column("size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["entry_id"], ["investment_ledger_entries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_investment_ledger_documents_entry_id", "investment_ledger_documents", ["entry_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_investment_ledger_documents_entry_id", "investment_ledger_documents")
    op.drop_table("investment_ledger_documents")
    op.drop_index("ix_investment_ledger_collateral_entry_id", "investment_ledger_collateral")
    op.drop_table("investment_ledger_collateral")
    op.drop_index("ix_investment_ledger_entries_legacy_investment_id", "investment_ledger_entries")
    op.drop_index(
        "ix_investment_ledger_entries_opportunity_investment_id", "investment_ledger_entries"
    )
    op.drop_index("ix_investment_ledger_entries_user_id", "investment_ledger_entries")
    op.drop_table("investment_ledger_entries")
