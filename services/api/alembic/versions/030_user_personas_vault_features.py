"""Add multi-role persona columns, vault feature flags, and admin invites

Wires up the schema from database/027_user_personas_vault_features.sql that was
missing from the Alembic chain, plus the vault-config inserts from
026_vault_feature_flags.sql.

Revision ID: 030_personas_vff
Revises: 029_video_toggle_cms_seed
Create Date: 2025-06-06
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

from alembic import op

revision = "030_personas_vff"
down_revision = "029_video_toggle_cms_seed"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1a. ALTER users — multi-role persona columns ─────────────────────
    op.add_column("users", sa.Column("roles", JSONB, nullable=False, server_default='["investor"]'))
    op.add_column("users", sa.Column("primary_role", sa.String(50), nullable=False, server_default="investor"))
    op.add_column("users", sa.Column("builder_approved", sa.Boolean, nullable=False, server_default="false"))
    op.add_column("users", sa.Column("builder_approved_at", sa.DateTime(timezone=True)))
    op.add_column("users", sa.Column("builder_approved_by", UUID(as_uuid=True), sa.ForeignKey("users.id")))
    op.add_column("users", sa.Column("persona_selected_at", sa.DateTime(timezone=True)))

    # Migrate existing single-role data → roles array
    op.execute(sa.text("""
        UPDATE users
        SET roles = jsonb_build_array(role::text),
            primary_role = role::text
        WHERE roles = '["investor"]'
          AND role::text != 'investor'
    """))

    # Indexes
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_users_primary_role ON users (primary_role)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_users_builder_approved ON users (builder_approved) WHERE builder_approved = true"))

    # ── 1b. vault_feature_flags table ────────────────────────────────────
    op.create_table(
        "vault_feature_flags",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("vault_type", sa.String(50), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("feature_key", sa.String(100), nullable=False),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("vault_type", "role", "feature_key"),
    )
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_vff_vault_role ON vault_feature_flags (vault_type, role)"))

    # ── 1c. admin_invites table ──────────────────────────────────────────
    op.create_table(
        "admin_invites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("invited_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token", sa.String(255), nullable=False, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites (token)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON admin_invites (email)"))

    # ── 1d. Seed vault-feature flags (120 rows) ─────────────────────────
    op.execute(sa.text("""
        INSERT INTO vault_feature_flags (vault_type, role, feature_key, enabled) VALUES
        ('wealth','investor','view_opportunities',true),('wealth','investor','express_interest',true),
        ('wealth','investor','invest',true),('wealth','investor','create_opportunities',false),
        ('wealth','investor','community_posts',true),('wealth','investor','profiling',true),
        ('wealth','investor','referrals',true),('wealth','investor','analytics',true),
        ('wealth','investor','kyc_verification',true),('wealth','investor','builder_questions',false),
        ('wealth','builder','view_opportunities',true),('wealth','builder','express_interest',false),
        ('wealth','builder','invest',false),('wealth','builder','create_opportunities',true),
        ('wealth','builder','community_posts',true),('wealth','builder','profiling',false),
        ('wealth','builder','referrals',true),('wealth','builder','analytics',true),
        ('wealth','builder','kyc_verification',true),('wealth','builder','builder_questions',true),
        ('wealth','admin','view_opportunities',true),('wealth','admin','express_interest',false),
        ('wealth','admin','invest',false),('wealth','admin','create_opportunities',true),
        ('wealth','admin','community_posts',true),('wealth','admin','profiling',false),
        ('wealth','admin','referrals',true),('wealth','admin','analytics',true),
        ('wealth','admin','kyc_verification',true),('wealth','admin','builder_questions',true),
        ('wealth','super_admin','view_opportunities',true),('wealth','super_admin','express_interest',true),
        ('wealth','super_admin','invest',true),('wealth','super_admin','create_opportunities',true),
        ('wealth','super_admin','community_posts',true),('wealth','super_admin','profiling',true),
        ('wealth','super_admin','referrals',true),('wealth','super_admin','analytics',true),
        ('wealth','super_admin','kyc_verification',true),('wealth','super_admin','builder_questions',true),
        ('opportunity','investor','view_opportunities',true),('opportunity','investor','express_interest',true),
        ('opportunity','investor','invest',true),('opportunity','investor','create_opportunities',false),
        ('opportunity','investor','community_posts',true),('opportunity','investor','profiling',true),
        ('opportunity','investor','referrals',true),('opportunity','investor','analytics',true),
        ('opportunity','investor','kyc_verification',true),('opportunity','investor','builder_questions',false),
        ('opportunity','builder','view_opportunities',true),('opportunity','builder','express_interest',false),
        ('opportunity','builder','invest',false),('opportunity','builder','create_opportunities',true),
        ('opportunity','builder','community_posts',true),('opportunity','builder','profiling',false),
        ('opportunity','builder','referrals',true),('opportunity','builder','analytics',true),
        ('opportunity','builder','kyc_verification',true),('opportunity','builder','builder_questions',true),
        ('opportunity','admin','view_opportunities',true),('opportunity','admin','express_interest',false),
        ('opportunity','admin','invest',false),('opportunity','admin','create_opportunities',true),
        ('opportunity','admin','community_posts',true),('opportunity','admin','profiling',false),
        ('opportunity','admin','referrals',true),('opportunity','admin','analytics',true),
        ('opportunity','admin','kyc_verification',true),('opportunity','admin','builder_questions',true),
        ('opportunity','super_admin','view_opportunities',true),('opportunity','super_admin','express_interest',true),
        ('opportunity','super_admin','invest',true),('opportunity','super_admin','create_opportunities',true),
        ('opportunity','super_admin','community_posts',true),('opportunity','super_admin','profiling',true),
        ('opportunity','super_admin','referrals',true),('opportunity','super_admin','analytics',true),
        ('opportunity','super_admin','kyc_verification',true),('opportunity','super_admin','builder_questions',true),
        ('community','investor','view_opportunities',true),('community','investor','express_interest',true),
        ('community','investor','invest',false),('community','investor','create_opportunities',false),
        ('community','investor','community_posts',true),('community','investor','profiling',true),
        ('community','investor','referrals',true),('community','investor','analytics',false),
        ('community','investor','kyc_verification',true),('community','investor','builder_questions',false),
        ('community','builder','view_opportunities',true),('community','builder','express_interest',false),
        ('community','builder','invest',false),('community','builder','create_opportunities',true),
        ('community','builder','community_posts',true),('community','builder','profiling',false),
        ('community','builder','referrals',true),('community','builder','analytics',false),
        ('community','builder','kyc_verification',true),('community','builder','builder_questions',true),
        ('community','admin','view_opportunities',true),('community','admin','express_interest',false),
        ('community','admin','invest',false),('community','admin','create_opportunities',true),
        ('community','admin','community_posts',true),('community','admin','profiling',false),
        ('community','admin','referrals',true),('community','admin','analytics',true),
        ('community','admin','kyc_verification',true),('community','admin','builder_questions',true),
        ('community','super_admin','view_opportunities',true),('community','super_admin','express_interest',true),
        ('community','super_admin','invest',true),('community','super_admin','create_opportunities',true),
        ('community','super_admin','community_posts',true),('community','super_admin','profiling',true),
        ('community','super_admin','referrals',true),('community','super_admin','analytics',true),
        ('community','super_admin','kyc_verification',true),('community','super_admin','builder_questions',true)
        ON CONFLICT (vault_type, role, feature_key) DO NOTHING
    """))

    # ── 1e. Vault config inserts (026_vault_feature_flags.sql) ───────────
    op.execute(sa.text("""
        INSERT INTO platform_configs (id, section, key, value, description, is_active, created_at, updated_at)
        VALUES
          (gen_random_uuid(), 'vaults', 'opportunity_vault_enabled', '{"enabled": false}'::jsonb,
           'Toggle Opportunity Vault availability platform-wide', true, now(), now()),
          (gen_random_uuid(), 'vaults', 'community_vault_enabled', '{"enabled": false}'::jsonb,
           'Toggle Community Vault availability platform-wide', true, now(), now())
        ON CONFLICT DO NOTHING
    """))


def downgrade() -> None:
    op.drop_table("admin_invites")
    op.drop_table("vault_feature_flags")
    op.drop_column("users", "persona_selected_at")
    op.drop_column("users", "builder_approved_by")
    op.drop_column("users", "builder_approved_at")
    op.drop_column("users", "builder_approved")
    op.drop_column("users", "primary_role")
    op.drop_column("users", "roles")
    op.execute(sa.text("""
        DELETE FROM platform_configs
        WHERE section = 'vaults'
          AND key IN ('opportunity_vault_enabled', 'community_vault_enabled')
    """))
