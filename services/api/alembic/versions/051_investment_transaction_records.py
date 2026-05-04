"""Add investment_transaction_records table.

Stores per-holding transaction records for each investor, including
uploaded acknowledgement documents with OCR-extracted metadata.

Revision ID: 051_inv_txn_records
Revises: 050_property_specs
Create Date: 2026-04-27 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from alembic import op

revision: str = "051_inv_txn_records"
down_revision: Union[str, None] = "050_property_specs"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.create_table(
        "investment_transaction_records",
        sa.Column("id", PG_UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", PG_UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "opportunity_investment_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("opportunity_investments.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "legacy_investment_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("investments.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("transaction_date", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("reference_number", sa.String(100), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("acknowledgement_s3_key", sa.String(500), nullable=True),
        sa.Column("ocr_raw_text", sa.Text, nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    op.create_index(
        "ix_investment_txn_records_user_id",
        "investment_transaction_records",
        ["user_id"],
    )
    op.create_index(
        "ix_investment_txn_records_opp_inv_id",
        "investment_transaction_records",
        ["opportunity_investment_id"],
    )
    op.create_index(
        "ix_investment_txn_records_legacy_inv_id",
        "investment_transaction_records",
        ["legacy_investment_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_investment_txn_records_legacy_inv_id", table_name="investment_transaction_records")
    op.drop_index("ix_investment_txn_records_opp_inv_id", table_name="investment_transaction_records")
    op.drop_index("ix_investment_txn_records_user_id", table_name="investment_transaction_records")
    op.drop_table("investment_transaction_records")
