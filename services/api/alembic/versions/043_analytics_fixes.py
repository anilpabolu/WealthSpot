"""Fix analytics: invested_at NOT NULL, recreate MVs with corrected SQL

Revision ID: 043_analytics_fixes
Revises: 042_property_appreciation
Create Date: 2026-04-19

Changes:
- Backfill NULL invested_at in opportunity_investments with created_at
- Add NOT NULL constraint to invested_at
- Recreate materialized views with corrected SQL:
  - mv_vault_summary: use live investor count from opportunity_investments
  - mv_monthly_investment_trends: remove investments table UNION (double-counting)
  - mv_geographic_distribution: use live investor count
  - mv_investor_growth: use primary_role instead of legacy role column
  - mv_top_opportunities: use live investor count
- Rebuild unique indexes
- Update refresh_analytics_views() function
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "043_analytics_fixes"
down_revision: Union[str, None] = "042_property_appreciation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Fix invested_at: backfill NULLs and add NOT NULL ──
    op.execute(
        "UPDATE opportunity_investments SET invested_at = created_at WHERE invested_at IS NULL"
    )
    op.alter_column(
        "opportunity_investments",
        "invested_at",
        nullable=False,
        existing_type=sa.DateTime(timezone=True),
    )

    # ── 2. Recreate materialized views with corrected SQL ──

    # Drop all existing MVs (order doesn't matter, no dependencies)
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_vault_summary CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_monthly_investment_trends CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_geographic_distribution CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_investor_growth CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_top_opportunities CASCADE;")

    # 2a. Vault Summary – use live investor count from opportunity_investments
    op.execute("""
        CREATE MATERIALIZED VIEW mv_vault_summary AS
        SELECT
            o.vault_type,
            COUNT(*)                                             AS total_opportunities,
            COUNT(*) FILTER (WHERE o.status = 'active')          AS active_opportunities,
            COUNT(*) FILTER (WHERE o.status = 'funding')         AS funding_opportunities,
            COUNT(*) FILTER (WHERE o.status = 'funded')          AS funded_opportunities,
            COUNT(*) FILTER (WHERE o.status = 'closed')          AS closed_opportunities,
            COALESCE(SUM(o.target_amount), 0)                    AS total_target_amount,
            COALESCE(SUM(o.raised_amount), 0)                    AS total_raised_amount,
            COALESCE(AVG(o.target_irr), 0)                       AS avg_target_irr,
            COALESCE(AVG(o.expected_irr), 0)                     AS avg_expected_irr,
            COALESCE(AVG(o.actual_irr), 0)                       AS avg_actual_irr,
            COUNT(DISTINCT o.creator_id)                         AS unique_creators,
            COALESCE(inv_agg.total_investors, 0)                 AS total_investors
        FROM opportunities o
        LEFT JOIN (
            SELECT o2.vault_type,
                   COUNT(DISTINCT oi.user_id) AS total_investors
            FROM opportunity_investments oi
            JOIN opportunities o2 ON o2.id = oi.opportunity_id
            WHERE oi.status = 'confirmed'
            GROUP BY o2.vault_type
        ) inv_agg ON inv_agg.vault_type = o.vault_type
        GROUP BY o.vault_type, inv_agg.total_investors;
    """)
    op.execute(
        "CREATE UNIQUE INDEX idx_mv_vault_summary_type ON mv_vault_summary (vault_type);"
    )

    # 2b. Monthly Investment Trends – only opportunity_investments (no UNION)
    op.execute("""
        CREATE MATERIALIZED VIEW mv_monthly_investment_trends AS
        SELECT
            date_trunc('month', oi.created_at)::date             AS month,
            o.vault_type,
            COUNT(*)                                             AS investment_count,
            COALESCE(SUM(oi.amount), 0)                          AS total_amount,
            COUNT(DISTINCT oi.user_id)                           AS unique_investors
        FROM opportunity_investments oi
        JOIN opportunities o ON o.id = oi.opportunity_id
        WHERE oi.status = 'confirmed'
        GROUP BY date_trunc('month', oi.created_at)::date, o.vault_type;
    """)
    op.execute(
        "CREATE UNIQUE INDEX idx_mv_monthly_trends_month_vault "
        "ON mv_monthly_investment_trends (month, vault_type);"
    )

    # 2c. Geographic Distribution – use live investor count
    op.execute("""
        CREATE MATERIALIZED VIEW mv_geographic_distribution AS
        SELECT
            COALESCE(o.city, 'Unknown')                          AS city,
            COALESCE(o.state, 'Unknown')                         AS state,
            o.vault_type,
            COUNT(*)                                             AS opportunity_count,
            COALESCE(SUM(o.target_amount), 0)                    AS total_target,
            COALESCE(SUM(o.raised_amount), 0)                    AS total_raised,
            COALESCE(inv_agg.total_investors, 0)                 AS total_investors
        FROM opportunities o
        LEFT JOIN (
            SELECT COALESCE(o2.city, 'Unknown') AS city,
                   COALESCE(o2.state, 'Unknown') AS state,
                   o2.vault_type,
                   COUNT(DISTINCT oi.user_id) AS total_investors
            FROM opportunity_investments oi
            JOIN opportunities o2 ON o2.id = oi.opportunity_id
            WHERE oi.status = 'confirmed'
            GROUP BY COALESCE(o2.city, 'Unknown'), COALESCE(o2.state, 'Unknown'), o2.vault_type
        ) inv_agg ON inv_agg.city = COALESCE(o.city, 'Unknown')
                 AND inv_agg.state = COALESCE(o.state, 'Unknown')
                 AND inv_agg.vault_type = o.vault_type
        GROUP BY COALESCE(o.city, 'Unknown'), COALESCE(o.state, 'Unknown'),
                 o.vault_type, inv_agg.total_investors;
    """)
    op.execute(
        "CREATE UNIQUE INDEX idx_mv_geo_city_state_vault "
        "ON mv_geographic_distribution (city, state, vault_type);"
    )

    # 2d. Investor Growth – use primary_role instead of legacy role
    op.execute("""
        CREATE MATERIALIZED VIEW mv_investor_growth AS
        SELECT
            date_trunc('month', u.created_at)::date              AS month,
            COUNT(*)                                             AS new_users,
            COUNT(*) FILTER (WHERE u.primary_role = 'investor')  AS new_investors,
            COUNT(*) FILTER (WHERE u.primary_role = 'builder')   AS new_builders,
            COUNT(*) FILTER (WHERE u.kyc_status = 'APPROVED')    AS kyc_approved,
            COUNT(*) FILTER (WHERE u.kyc_status = 'IN_PROGRESS'
                                OR u.kyc_status = 'UNDER_REVIEW') AS kyc_in_progress
        FROM users u
        WHERE u.is_active = true
        GROUP BY date_trunc('month', u.created_at)::date;
    """)
    op.execute(
        "CREATE UNIQUE INDEX idx_mv_investor_growth_month ON mv_investor_growth (month);"
    )

    # 2e. Top Opportunities – use live investor count
    op.execute("""
        CREATE MATERIALIZED VIEW mv_top_opportunities AS
        SELECT
            o.id,
            o.title,
            o.slug,
            o.vault_type,
            o.status,
            o.city,
            o.state,
            o.target_amount,
            o.raised_amount,
            o.target_irr,
            o.expected_irr,
            o.actual_irr,
            COALESCE(inv_cnt.cnt, 0)                             AS investor_count,
            o.created_at,
            CASE WHEN o.target_amount > 0
                 THEN ROUND((o.raised_amount / o.target_amount) * 100, 1)
                 ELSE 0 END                                      AS funding_pct,
            c.company_name                                       AS company_name,
            u.full_name                                          AS creator_name
        FROM opportunities o
        LEFT JOIN companies c ON c.id = o.company_id
        LEFT JOIN users u ON u.id = o.creator_id
        LEFT JOIN (
            SELECT opportunity_id, COUNT(DISTINCT user_id) AS cnt
            FROM opportunity_investments
            WHERE status = 'confirmed'
            GROUP BY opportunity_id
        ) inv_cnt ON inv_cnt.opportunity_id = o.id
        WHERE o.status NOT IN ('draft', 'rejected');
    """)
    op.execute("CREATE UNIQUE INDEX idx_mv_top_opp_id ON mv_top_opportunities (id);")

    # ── 3. Update index on users for new column ──
    op.execute("DROP INDEX IF EXISTS idx_users_role_created;")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_users_primary_role_created "
        "ON users (primary_role, created_at);"
    )

    # ── 4. Update the refresh function to match ──
    op.execute("""
        CREATE OR REPLACE FUNCTION refresh_analytics_views()
        RETURNS void AS $$
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vault_summary;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_investment_trends;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_geographic_distribution;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_investor_growth;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_eoi_funnel;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_opportunities;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_transaction_revenue;
        END;
        $$ LANGUAGE plpgsql;
    """)


def downgrade() -> None:
    # Restore original MVs by running 023 upgrade logic
    # (simplified: just drop and let 023 recreate if re-run)
    op.execute("DROP INDEX IF EXISTS idx_users_primary_role_created;")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_users_role_created ON users (role, created_at);"
    )

    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_top_opportunities CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_investor_growth CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_geographic_distribution CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_monthly_investment_trends CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_vault_summary CASCADE;")

    op.alter_column(
        "opportunity_investments",
        "invested_at",
        nullable=True,
        existing_type=sa.DateTime(timezone=True),
    )
