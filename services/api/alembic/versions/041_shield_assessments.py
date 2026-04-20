"""Create WealthSpot Shield assessment + risk-flag tables.

Revision ID: 041_shield_assessments
Revises: 040_vault_explorers
Create Date: 2026-04-19

Adds:
- opportunity_assessments (one row per opportunity + sub-item)
- opportunity_risk_flags (free-form risk strip)
- assessment_category_code / assessment_subcategory_code columns on opportunity_media

The 7 categories and their sub-items live in shared TS/Py config
(packages/wealthspot-types/src/assessments.ts + services/api/app/core/assessments.py)
so we intentionally do NOT seed any rows in this migration.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "041_shield_assessments"
down_revision = "040_vault_explorers"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "opportunity_assessments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "opportunity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("category_code", sa.String(30), nullable=False),
        sa.Column("subcategory_code", sa.String(50), nullable=False),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default=sa.text("'not_started'"),
        ),
        sa.Column("builder_answer", postgresql.JSONB, nullable=True),
        sa.Column("reviewer_note", sa.Text, nullable=True),
        sa.Column(
            "reviewed_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("risk_severity", sa.String(10), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "opportunity_id",
            "subcategory_code",
            name="uq_oa_opportunity_subcategory",
        ),
    )
    op.create_index(
        "ix_oa_opportunity", "opportunity_assessments", ["opportunity_id"]
    )
    op.create_index("ix_oa_status", "opportunity_assessments", ["status"])
    op.create_index(
        "ix_oa_category", "opportunity_assessments", ["category_code"]
    )

    op.create_table(
        "opportunity_risk_flags",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "opportunity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("severity", sa.String(10), nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_orf_opportunity", "opportunity_risk_flags", ["opportunity_id"]
    )

    op.add_column(
        "opportunity_media",
        sa.Column("assessment_category_code", sa.String(30), nullable=True),
    )
    op.add_column(
        "opportunity_media",
        sa.Column("assessment_subcategory_code", sa.String(50), nullable=True),
    )
    op.create_index(
        "ix_om_assessment",
        "opportunity_media",
        ["opportunity_id", "assessment_category_code", "assessment_subcategory_code"],
    )


def downgrade() -> None:
    op.drop_index("ix_om_assessment", table_name="opportunity_media")
    op.drop_column("opportunity_media", "assessment_subcategory_code")
    op.drop_column("opportunity_media", "assessment_category_code")

    op.drop_index("ix_orf_opportunity", table_name="opportunity_risk_flags")
    op.drop_table("opportunity_risk_flags")

    op.drop_index("ix_oa_category", table_name="opportunity_assessments")
    op.drop_index("ix_oa_status", table_name="opportunity_assessments")
    op.drop_index("ix_oa_opportunity", table_name="opportunity_assessments")
    op.drop_table("opportunity_assessments")
