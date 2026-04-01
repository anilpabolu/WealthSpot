"""Expression of Interest system – EOI, builder questions, comm mappings

Revision ID: 017_eoi_system
Revises: 016_company_vault_type
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "017_eoi_system"
down_revision: Union[str, None] = "016_company_vault_type"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Builder Questions (per opportunity) ──────────────────────────────
    op.create_table(
        "builder_questions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("opportunity_id", UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("creator_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_text", sa.Text, nullable=False),
        sa.Column("question_type", sa.String(30), nullable=False, server_default="text"),  # text, select, number, boolean
        sa.Column("options", JSONB, nullable=True),  # for select-type questions
        sa.Column("is_required", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── Expressions of Interest ──────────────────────────────────────────
    op.create_table(
        "expressions_of_interest",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("opportunity_id", UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True),
        # Standard platform questions
        sa.Column("investment_amount", sa.Numeric(15, 2), nullable=True),
        sa.Column("num_units", sa.Integer, nullable=True),
        sa.Column("investment_timeline", sa.String(50), nullable=True),  # immediate, 1-3 months, 3-6 months, exploring
        sa.Column("funding_source", sa.String(50), nullable=True),  # own_funds, bank_loan, both
        sa.Column("purpose", sa.String(50), nullable=True),  # self_use, investment, rental_income
        sa.Column("preferred_contact", sa.String(30), nullable=True),  # phone, email, whatsapp
        sa.Column("best_time_to_contact", sa.String(50), nullable=True),
        sa.Column("communication_consent", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("additional_notes", sa.Text, nullable=True),
        # Status tracking
        sa.Column("status", sa.String(30), nullable=False, server_default="submitted"),  # submitted, builder_connected, token_paid, closed
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── EOI Question Answers (builder custom question answers) ───────────
    op.create_table(
        "eoi_question_answers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("eoi_id", UUID(as_uuid=True), sa.ForeignKey("expressions_of_interest.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("question_id", UUID(as_uuid=True), sa.ForeignKey("builder_questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answer_text", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── Opportunity Communication Mappings ───────────────────────────────
    op.create_table(
        "opportunity_comm_mappings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("opportunity_id", UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(30), nullable=False),  # builder, handler, admin, platform_admin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("opportunity_id", "user_id", "role", name="uq_comm_mapping_opp_user_role"),
    )

    # ── Add closing_date to opportunities for lifecycle ──────────────────
    op.add_column("opportunities", sa.Column("closing_date", sa.DateTime(timezone=True), nullable=True))

    # ── Performance indexes ──────────────────────────────────────────────
    op.create_index("ix_eoi_opp_user", "expressions_of_interest", ["opportunity_id", "user_id"])
    op.create_index("ix_eoi_status", "expressions_of_interest", ["status"])
    op.create_index("ix_builder_q_sort", "builder_questions", ["opportunity_id", "sort_order"])


def downgrade() -> None:
    op.drop_index("ix_builder_q_sort")
    op.drop_index("ix_eoi_status")
    op.drop_index("ix_eoi_opp_user")
    op.drop_column("opportunities", "closing_date")
    op.drop_table("opportunity_comm_mappings")
    op.drop_table("eoi_question_answers")
    op.drop_table("expressions_of_interest")
    op.drop_table("builder_questions")
