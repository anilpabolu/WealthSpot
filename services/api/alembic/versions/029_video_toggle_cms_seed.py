"""Video toggle configs + CMS seed data for top 10 pages

Adds 4 per-category video toggle configs to platform_configs.
Seeds ~80 site_content entries for the top 10 pages.

Revision ID: 029_video_toggle_cms_seed
Revises: 028_site_content
Create Date: 2025-06-05
"""

from pathlib import Path

from alembic import op

revision = "029_video_toggle_cms_seed"
down_revision = "028_site_content"
branch_labels = None
depends_on = None

_SQL = (Path(__file__).resolve().parent.parent.parent / "database" / "029_video_toggle_cms_seed.sql").read_text()


def upgrade() -> None:
    conn = op.get_bind()
    # asyncpg does not allow multiple commands in a single prepared statement,
    # so split the SQL file on semicolons and execute each statement separately.
    for stmt in _SQL.split(";"):
        stmt = stmt.strip()
        if stmt and not stmt.startswith("--"):
            conn.exec_driver_sql(stmt)


def downgrade() -> None:
    conn = op.get_bind()
    # Remove video toggle configs
    conn.exec_driver_sql("""
        DELETE FROM platform_configs
        WHERE section = 'content'
          AND key IN ('intro_videos_enabled', 'vault_videos_enabled',
                      'property_videos_enabled', 'video_management_enabled');
    """)
    # Remove seeded CMS entries (only the ones we added)
    conn.exec_driver_sql("""
        DELETE FROM site_content
        WHERE (page, section_tag) IN (
            ('landing','hero_badge'),('landing','hero_title'),('landing','hero_subtitle'),
            ('landing','hero_italic'),('landing','hero_cta_primary'),('landing','hero_cta_secondary'),
            ('landing','thesis_label'),('landing','thesis_badge'),('landing','thesis_heading'),
            ('landing','thesis_core_belief'),('landing','thesis_promise'),('landing','thesis_gold'),
            ('landing','stat_members'),('landing','stat_capital'),('landing','stat_opportunities'),
            ('landing','stat_markets'),('landing','stat_investors'),
            ('landing','closing_heading'),('landing','closing_body'),
            ('landing','closing_cta_1'),('landing','closing_cta_2'),
            ('landing','intro_label'),('landing','intro_heading'),
            ('landing','intro_body_1'),('landing','intro_body_2'),
            ('landing','approach_check_1'),('landing','approach_check_2'),('landing','approach_check_3'),
            ('landing','vaults_label'),('landing','vaults_heading'),
            ('landing','identities_label'),('landing','identities_heading'),
            ('marketplace','hero_badge'),('marketplace','hero_title'),('marketplace','hero_subtitle'),
            ('marketplace','empty_title'),('marketplace','empty_message'),
            ('vaults','hero_badge'),('vaults','hero_title'),('vaults','hero_subtitle'),
            ('vaults','pillars_label'),('vaults','pillars_heading'),('vaults','pillars_subtitle'),
            ('vaults','video_error'),('vaults','video_retry'),
            ('investor_dashboard','hero_badge'),('investor_dashboard','hero_title'),
            ('investor_dashboard','hero_subtitle'),('investor_dashboard','section_txns'),
            ('investor_dashboard','section_reco'),('investor_dashboard','section_actions'),
            ('investor_dashboard','empty_txns_title'),('investor_dashboard','empty_txns_msg'),
            ('builder_dashboard','hero_badge'),('builder_dashboard','hero_title'),
            ('builder_dashboard','hero_subtitle'),('builder_dashboard','cta_add'),
            ('builder_dashboard','section_properties'),('builder_dashboard','empty_title'),
            ('builder_dashboard','empty_message'),('builder_dashboard','error_message'),
            ('builder_dashboard','verify_title'),('builder_dashboard','verify_message'),
            ('community','hero_badge'),('community','hero_title'),('community','hero_subtitle'),
            ('community','cta_discussion'),('community','cta_question'),('community','cta_insight'),
            ('community','empty_search_title'),('community','empty_search_msg'),
            ('community','empty_title'),('community','empty_message'),
            ('referral','hero_badge'),('referral','hero_title'),('referral','hero_subtitle'),
            ('referral','code_label'),('referral','hiw_heading'),
            ('referral','hiw_step1_title'),('referral','hiw_step1_desc'),
            ('referral','hiw_step2_title'),('referral','hiw_step2_desc'),
            ('referral','hiw_step3_title'),('referral','hiw_step3_desc'),
            ('referral','history_heading'),('referral','empty_title'),('referral','empty_message'),
            ('portfolio','hero_badge'),('portfolio','hero_title'),('portfolio','hero_subtitle'),
            ('portfolio','section_vaults'),('portfolio','section_alloc'),('portfolio','section_returns'),
            ('portfolio','section_holdings'),('portfolio','section_activity'),('portfolio','section_txns'),
            ('portfolio','empty_holdings'),('portfolio','empty_holdings_msg'),
            ('portfolio','empty_txns'),('portfolio','empty_txns_msg'),
            ('onboarding','ready_heading'),('onboarding','ready_subtitle'),('onboarding','ready_cta'),
            ('onboarding','signup_heading'),('onboarding','signup_subtitle'),('onboarding','signup_cta'),
            ('persona','title'),('persona','subtitle'),
            ('persona','investor_title'),('persona','investor_desc'),
            ('persona','builder_title'),('persona','builder_desc'),('persona','builder_notice')
        );
    """)
