"""Site content CMS table and seed data

Creates the site_content table for dynamic CMS text management.
Seeds initial content entries for major pages.

Revision ID: 028_site_content
Revises: 027_move_profile_q
Create Date: 2025-06-04
"""

from alembic import op

revision = "028_site_content"
down_revision = "027_move_profile_q"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── Create site_content table ────────────────────────────────────────
    conn.exec_driver_sql("""
        CREATE TABLE IF NOT EXISTS site_content (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            page VARCHAR(100) NOT NULL,
            section_tag VARCHAR(100) NOT NULL,
            content_type VARCHAR(20) DEFAULT 'text',
            value TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            updated_by UUID,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            CONSTRAINT uq_site_content_page_section UNIQUE (page, section_tag)
        );
        CREATE INDEX IF NOT EXISTS ix_site_content_page ON site_content(page);
    """)

    # ── Seed initial content for major pages ─────────────────────────────
    conn.exec_driver_sql("""
        INSERT INTO site_content (page, section_tag, value, description) VALUES
        -- Landing page
        ('landing', 'hero_title', 'Invest Smarter, Together', 'Main hero heading'),
        ('landing', 'hero_subtitle', 'Join India''s premier wealth building community', 'Hero subtext'),
        ('landing', 'cta_button', 'Get Started', 'Primary call-to-action button text'),
        ('landing', 'features_heading', 'Why WealthSpot?', 'Features section heading'),
        -- Marketplace
        ('marketplace', 'page_title', 'Marketplace', 'Marketplace page heading'),
        ('marketplace', 'page_subtitle', 'Discover curated investment opportunities across all vaults', 'Marketplace description'),
        -- Vaults
        ('vaults', 'wealth_title', 'Wealth Vault', 'Wealth vault display name'),
        ('vaults', 'wealth_desc', 'Real estate and structured investment opportunities', 'Wealth vault description'),
        ('vaults', 'opportunity_title', 'Opportunity Vault', 'Opportunity vault display name'),
        ('vaults', 'opportunity_desc', 'Startup and growth-stage investment deals', 'Opportunity vault description'),
        ('vaults', 'community_title', 'Community Vault', 'Community vault display name'),
        ('vaults', 'community_desc', 'Community-driven projects and collaborations', 'Community vault description'),
        -- Dashboard
        ('dashboard', 'welcome_title', 'Welcome back', 'Dashboard greeting'),
        ('dashboard', 'portfolio_heading', 'Your Portfolio', 'Portfolio section heading'),
        -- About
        ('about', 'mission_title', 'Our Mission', 'About page mission heading'),
        ('about', 'mission_text', 'Democratizing wealth creation through community-powered investing.', 'Mission statement')
        ON CONFLICT (page, section_tag) DO NOTHING;
    """)


def downgrade() -> None:
    conn = op.get_bind()
    conn.exec_driver_sql("DROP TABLE IF EXISTS site_content;")
