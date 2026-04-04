"""Analytics materialized views for Vault Analytics Dashboard

Revision ID: 023_analytics_views
Revises: 022_eoi_stage_history
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "023_analytics_views"
down_revision: Union[str, None] = "022_eoi_stage_history"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Vault Summary
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vault_summary AS
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
            SUM(o.investor_count)                                AS total_investors
        FROM opportunities o
        GROUP BY o.vault_type;
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vault_summary_type ON mv_vault_summary (vault_type);")

    # 2. Monthly Investment Trends
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_investment_trends AS
        SELECT
            date_trunc('month', oi.created_at)::date             AS month,
            o.vault_type,
            COUNT(*)                                             AS investment_count,
            COALESCE(SUM(oi.amount), 0)                          AS total_amount,
            COUNT(DISTINCT oi.user_id)                           AS unique_investors
        FROM opportunity_investments oi
        JOIN opportunities o ON o.id = oi.opportunity_id
        WHERE oi.status = 'confirmed'
        GROUP BY date_trunc('month', oi.created_at)::date, o.vault_type

        UNION ALL

        SELECT
            date_trunc('month', i.created_at)::date              AS month,
            'wealth'::varchar                                    AS vault_type,
            COUNT(*)                                             AS investment_count,
            COALESCE(SUM(i.amount), 0)                           AS total_amount,
            COUNT(DISTINCT i.user_id)                            AS unique_investors
        FROM investments i
        WHERE i.status IN ('confirmed', 'payment_received')
        GROUP BY date_trunc('month', i.created_at)::date;
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_trends_month_vault ON mv_monthly_investment_trends (month, vault_type);")

    # 3. Geographic Distribution
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_geographic_distribution AS
        SELECT
            COALESCE(o.city, 'Unknown')                          AS city,
            COALESCE(o.state, 'Unknown')                         AS state,
            o.vault_type,
            COUNT(*)                                             AS opportunity_count,
            COALESCE(SUM(o.target_amount), 0)                    AS total_target,
            COALESCE(SUM(o.raised_amount), 0)                    AS total_raised,
            SUM(o.investor_count)                                AS total_investors
        FROM opportunities o
        GROUP BY COALESCE(o.city, 'Unknown'), COALESCE(o.state, 'Unknown'), o.vault_type;
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_geo_city_state_vault ON mv_geographic_distribution (city, state, vault_type);")

    # 4. Investor Growth
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_investor_growth AS
        SELECT
            date_trunc('month', u.created_at)::date              AS month,
            COUNT(*)                                             AS new_users,
            COUNT(*) FILTER (WHERE u.role = 'investor')          AS new_investors,
            COUNT(*) FILTER (WHERE u.role = 'builder')           AS new_builders,
            COUNT(*) FILTER (WHERE u.kyc_status = 'APPROVED')    AS kyc_approved,
            COUNT(*) FILTER (WHERE u.kyc_status = 'IN_PROGRESS'
                                OR u.kyc_status = 'UNDER_REVIEW') AS kyc_in_progress
        FROM users u
        WHERE u.is_active = true
        GROUP BY date_trunc('month', u.created_at)::date;
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_investor_growth_month ON mv_investor_growth (month);")

    # 5. EOI Funnel
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_eoi_funnel AS
        SELECT
            e.status,
            o.vault_type,
            COUNT(*)                                             AS eoi_count,
            COALESCE(SUM(e.investment_amount), 0)                AS total_interest_amount,
            COALESCE(AVG(e.investment_amount), 0)                AS avg_interest_amount
        FROM expressions_of_interest e
        JOIN opportunities o ON o.id = e.opportunity_id
        GROUP BY e.status, o.vault_type;
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_eoi_funnel_status_vault ON mv_eoi_funnel (status, vault_type);")

    # 6. Top Opportunities
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_opportunities AS
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
            o.investor_count,
            o.created_at,
            CASE WHEN o.target_amount > 0
                 THEN ROUND((o.raised_amount / o.target_amount) * 100, 1)
                 ELSE 0 END                                      AS funding_pct,
            c.company_name                                       AS company_name,
            u.full_name                                          AS creator_name
        FROM opportunities o
        LEFT JOIN companies c ON c.id = o.company_id
        LEFT JOIN users u ON u.id = o.creator_id
        WHERE o.status NOT IN ('draft', 'rejected');
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_top_opp_id ON mv_top_opportunities (id);")

    # 7. Transaction Revenue
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_transaction_revenue AS
        SELECT
            date_trunc('month', t.created_at)::date              AS month,
            t.type                                               AS txn_type,
            COUNT(*)                                             AS txn_count,
            COALESCE(SUM(t.amount), 0)                           AS total_amount
        FROM transactions t
        GROUP BY date_trunc('month', t.created_at)::date, t.type;
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_txn_revenue_month_type ON mv_transaction_revenue (month, txn_type);")

    # 8. Analytics performance indexes on source tables
    op.execute("CREATE INDEX IF NOT EXISTS idx_opp_vault_status ON opportunities (vault_type, status);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_opp_inv_status_created ON opportunity_investments (status, created_at);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_inv_status_created ON investments (status, created_at);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_eoi_status_opid ON expressions_of_interest (status, opportunity_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_role_created ON users (role, created_at);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_txn_type_created ON transactions (type, created_at);")

    # 9. Function to refresh all analytics views
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
    op.execute("DROP FUNCTION IF EXISTS refresh_analytics_views();")
    op.execute("DROP INDEX IF EXISTS idx_txn_type_created;")
    op.execute("DROP INDEX IF EXISTS idx_users_role_created;")
    op.execute("DROP INDEX IF EXISTS idx_eoi_status_opid;")
    op.execute("DROP INDEX IF EXISTS idx_inv_status_created;")
    op.execute("DROP INDEX IF EXISTS idx_opp_inv_status_created;")
    op.execute("DROP INDEX IF EXISTS idx_opp_vault_status;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_transaction_revenue;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_top_opportunities;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_eoi_funnel;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_investor_growth;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_geographic_distribution;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_monthly_investment_trends;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_vault_summary;")
