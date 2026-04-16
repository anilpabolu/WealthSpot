"""Add project_phase column to opportunities.

Revision ID: 038_project_phase
Revises: 037_builder_updates
"""

from alembic import op
import sqlalchemy as sa

revision = "038_project_phase"
down_revision = "037_builder_updates"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "opportunities",
        sa.Column("project_phase", sa.String(50), nullable=True),
    )
    # Seed the rera_display_enabled platform config (defaults ON)
    op.execute("""
        INSERT INTO platform_configs (section, key, value, is_active)
        VALUES ('content', 'rera_display_enabled', 'true'::jsonb, true)
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    op.drop_column("opportunities", "project_phase")
    op.execute("DELETE FROM platform_configs WHERE key = 'rera_display_enabled'")
