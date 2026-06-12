"""remove IRR everywhere

Drops the IRR columns from ``opportunities`` (target_irr, expected_irr, actual_irr)
and ``properties`` (target_irr), and recreates the two analytics materialized views
that referenced them (mv_vault_summary, mv_top_opportunities) without the IRR columns.

The other materialized views and the refresh_analytics_views() function are unchanged
(they never referenced IRR), so they are left in place.

Irreversible: the downgrade re-creates the columns (nullable) and the original views,
but the historical IRR data is not recoverable.

Revision ID: 074_remove_irr
Revises: 62db48849e24
Create Date: 2026-06-12

"""
from collections.abc import Sequence
from typing import Union

from alembic import op

revision: str = "074_remove_irr"
down_revision: Union[str, None] = "62db48849e24"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Drop the analytics MVs that reference the IRR columns ──
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_vault_summary CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_top_opportunities CASCADE;")

    # ── 2. Drop the IRR columns ──
    op.execute(
        "ALTER TABLE opportunities "
        "DROP COLUMN IF EXISTS target_irr, "
        "DROP COLUMN IF EXISTS expected_irr, "
        "DROP COLUMN IF EXISTS actual_irr;"
    )
    op.execute("ALTER TABLE properties DROP COLUMN IF EXISTS target_irr;")

    # ── 3. Recreate the MVs without the IRR columns ──
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


def downgrade() -> None:
    # ── 1. Drop the IRR-less MVs ──
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_vault_summary CASCADE;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_top_opportunities CASCADE;")

    # ── 2. Re-add the columns (nullable; historical data is not recoverable) ──
    op.execute(
        "ALTER TABLE opportunities "
        "ADD COLUMN target_irr NUMERIC(5, 2), "
        "ADD COLUMN expected_irr NUMERIC(5, 2), "
        "ADD COLUMN actual_irr NUMERIC(5, 2);"
    )
    op.execute("ALTER TABLE properties ADD COLUMN target_irr NUMERIC(5, 2);")

    # ── 3. Recreate the original MVs (with IRR columns) ──
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
