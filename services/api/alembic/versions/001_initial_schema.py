"""Initial schema – all 10 tables

Revision ID: 001_initial
Revises: 
Create Date: 2025-07-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB


# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -- extensions ----------------------------------------------------------
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # -- users ---------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("clerk_id", sa.String(255), unique=True, index=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("avatar_url", sa.Text()),
        sa.Column("role", sa.String(20), nullable=False, server_default="investor"),
        sa.Column("kyc_status", sa.String(20), nullable=False, server_default="NOT_STARTED"),
        sa.Column("pan_number", sa.String(10)),
        sa.Column("aadhaar_hash", sa.String(64)),
        sa.Column("referral_code", sa.String(12), unique=True),
        sa.Column("referred_by", UUID(as_uuid=True)),
        sa.Column("wealth_pass_active", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_users_role", "users", ["role"])
    op.create_index("idx_users_referral_code", "users", ["referral_code"])

    # -- kyc_documents -------------------------------------------------------
    op.create_table(
        "kyc_documents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("document_type", sa.String(50), nullable=False),
        sa.Column("s3_key", sa.Text(), nullable=False),
        sa.Column("verification_status", sa.String(20), server_default="PENDING"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        comment="KYC identity documents uploaded by users",
    )

    # -- builders ------------------------------------------------------------
    op.create_table(
        "builders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("rera_number", sa.String(50)),
        sa.Column("cin", sa.String(21)),
        sa.Column("gstin", sa.String(15)),
        sa.Column("website", sa.Text()),
        sa.Column("logo_url", sa.Text()),
        sa.Column("description", sa.Text()),
        sa.Column("verified", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # -- properties ----------------------------------------------------------
    op.create_table(
        "properties",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("builder_id", UUID(as_uuid=True), sa.ForeignKey("builders.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("slug", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("tagline", sa.String(500)),
        sa.Column("description", sa.Text()),
        sa.Column("asset_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft", index=True),
        # location
        sa.Column("city", sa.String(100), nullable=False, index=True),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("locality", sa.String(255)),
        sa.Column("address", sa.Text()),
        sa.Column("latitude", sa.Numeric(10, 7)),
        sa.Column("longitude", sa.Numeric(10, 7)),
        # financial
        sa.Column("target_amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("raised_amount", sa.Numeric(15, 2), server_default="0"),
        sa.Column("min_investment", sa.Numeric(12, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_units", sa.Integer(), nullable=False),
        sa.Column("sold_units", sa.Integer(), server_default="0"),
        sa.Column("target_irr", sa.Numeric(5, 2), nullable=False),
        sa.Column("rental_yield", sa.Numeric(5, 2)),
        # details
        sa.Column("area_sqft", sa.Integer()),
        sa.Column("bedrooms", sa.Integer()),
        sa.Column("possession_date", sa.String(20)),
        sa.Column("rera_id", sa.String(50)),
        # media
        sa.Column("cover_image", sa.Text()),
        sa.Column("gallery", ARRAY(sa.Text())),
        sa.Column("documents", JSONB()),
        sa.Column("amenities", ARRAY(sa.String(100))),
        # counts
        sa.Column("investor_count", sa.Integer(), server_default="0"),
        # timestamps
        sa.Column("launch_date", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # -- investments ---------------------------------------------------------
    op.create_table(
        "investments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("property_id", UUID(as_uuid=True), sa.ForeignKey("properties.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("units", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="initiated", index=True),
        sa.Column("razorpay_order_id", sa.String(100)),
        sa.Column("razorpay_payment_id", sa.String(100)),
        sa.Column("payment_metadata", JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_investments_razorpay_order_id", "investments", ["razorpay_order_id"])

    # -- transactions --------------------------------------------------------
    op.create_table(
        "transactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("investment_id", UUID(as_uuid=True), sa.ForeignKey("investments.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("reference_id", sa.String(255)),
        sa.Column("metadata", JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_transactions_type", "transactions", ["type"])

    # -- community_posts -----------------------------------------------------
    op.create_table(
        "community_posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("post_type", sa.String(20), server_default="discussion"),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50)),
        sa.Column("tags", JSONB()),
        sa.Column("upvotes", sa.Integer(), server_default="0"),
        sa.Column("reply_count", sa.Integer(), server_default="0"),
        sa.Column("is_pinned", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_community_posts_category", "community_posts", ["category"])

    # -- community_replies ---------------------------------------------------
    op.create_table(
        "community_replies",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("upvotes", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # -- referrals -----------------------------------------------------------
    op.create_table(
        "referrals",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("referrer_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("referee_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("code_used", sa.String(12), nullable=False),
        sa.Column("reward_amount", sa.Integer(), server_default="0"),
        sa.Column("reward_claimed", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # -- audit_logs ----------------------------------------------------------
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("actor_id", UUID(as_uuid=True)),
        sa.Column("action", sa.String(100), nullable=False, index=True),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.String(255)),
        sa.Column("details", JSONB()),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("user_agent", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), index=True),
    )
    op.create_index("idx_audit_logs_resource", "audit_logs", ["resource_type", "resource_id"])

    # -- loans ---------------------------------------------------------------
    op.create_table(
        "loans",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("lender_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("property_id", UUID(as_uuid=True), sa.ForeignKey("properties.id"), nullable=False, index=True),
        sa.Column("principal", sa.Integer(), nullable=False),
        sa.Column("interest_rate", sa.Float(), nullable=False),
        sa.Column("tenure_months", sa.Integer(), nullable=False),
        sa.Column("amount_repaid", sa.Integer(), server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("next_payment_date", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_loans_status", "loans", ["status"])

    # -- updated_at trigger ---------------------------------------------------
    op.execute("""
        CREATE OR REPLACE FUNCTION trigger_set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    for table in ("users", "properties", "investments", "community_posts"):
        op.execute(f"""
            CREATE TRIGGER set_updated_at_{table}
            BEFORE UPDATE ON {table}
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
        """)


def downgrade() -> None:
    for table in ("users", "properties", "investments", "community_posts"):
        op.execute(f"DROP TRIGGER IF EXISTS set_updated_at_{table} ON {table}")
    op.execute("DROP FUNCTION IF EXISTS trigger_set_updated_at()")

    op.drop_table("loans")
    op.drop_table("audit_logs")
    op.drop_table("referrals")
    op.drop_table("community_replies")
    op.drop_table("community_posts")
    op.drop_table("transactions")
    op.drop_table("investments")
    op.drop_table("properties")
    op.drop_table("builders")
    op.drop_table("kyc_documents")
    op.drop_table("users")
