"""
Vault Analytics router – admin-only metrics & dashboard data.

All endpoints query materialized views for fast aggregation.
Falls back to direct queries if views don't exist yet.
"""

from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import require_super_admin
from app.models.user import User
from app.schemas.analytics import (
    EOIFunnelItem,
    EOIFunnelResponse,
    FullAnalyticsResponse,
    GeoCityItem,
    GeoDistributionResponse,
    InvestmentTrendsResponse,
    InvestorAnalyticsResponse,
    InvestorGrowthPoint,
    MonthlyTrendPoint,
    RevenueBreakdownResponse,
    TopOpportunitiesResponse,
    TopOpportunityItem,
    TransactionRevenueItem,
    VaultSummaryItem,
    VaultSummaryResponse,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── Helper: safe materialized-view query with direct-query fallback ──────────

async def _safe_mv_query(db: AsyncSession, mv_sql: str, fallback_sql: str) -> list[dict[str, Any]]:
    """Try querying a materialized view; fall back to direct SQL."""
    try:
        result = await db.execute(text(mv_sql))
    except Exception:
        await db.rollback()
        result = await db.execute(text(fallback_sql))
    rows = result.mappings().all()
    return [dict(r) for r in rows]


# ── 1. Vault Summary ────────────────────────────────────────────────────────

VAULT_SUMMARY_MV = """
SELECT vault_type, total_opportunities, active_opportunities,
       funding_opportunities, funded_opportunities, closed_opportunities,
       total_target_amount, total_raised_amount,
       avg_target_irr, avg_expected_irr, avg_actual_irr,
       unique_creators, total_investors
FROM mv_vault_summary ORDER BY vault_type
"""

VAULT_SUMMARY_DIRECT = """
SELECT
    o.vault_type,
    COUNT(*)::int                                         AS total_opportunities,
    COUNT(*) FILTER (WHERE o.status = 'active')::int      AS active_opportunities,
    COUNT(*) FILTER (WHERE o.status = 'funding')::int     AS funding_opportunities,
    COUNT(*) FILTER (WHERE o.status = 'funded')::int      AS funded_opportunities,
    COUNT(*) FILTER (WHERE o.status = 'closed')::int      AS closed_opportunities,
    COALESCE(SUM(o.target_amount), 0)                     AS total_target_amount,
    COALESCE(SUM(o.raised_amount), 0)                     AS total_raised_amount,
    COALESCE(AVG(o.target_irr), 0)                        AS avg_target_irr,
    COALESCE(AVG(o.expected_irr), 0)                      AS avg_expected_irr,
    COALESCE(AVG(o.actual_irr), 0)                        AS avg_actual_irr,
    COUNT(DISTINCT o.creator_id)::int                     AS unique_creators,
    COALESCE(SUM(o.investor_count), 0)::int               AS total_investors
FROM opportunities o
GROUP BY o.vault_type ORDER BY o.vault_type
"""


@router.get("/vault-summary", response_model=VaultSummaryResponse)
async def vault_summary(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> VaultSummaryResponse:
    rows = await _safe_mv_query(db, VAULT_SUMMARY_MV, VAULT_SUMMARY_DIRECT)

    vaults: list[VaultSummaryItem] = []
    platform_aum = Decimal("0")
    total_inv = 0
    total_opp = 0

    for r in rows:
        target = Decimal(str(r["total_target_amount"]))
        raised = Decimal(str(r["total_raised_amount"]))
        funding_pct = (raised / target * 100).quantize(Decimal("0.1")) if target > 0 else Decimal("0")
        item = VaultSummaryItem(
            vault_type=r["vault_type"],
            total_opportunities=r["total_opportunities"],
            active_opportunities=r["active_opportunities"],
            funding_opportunities=r["funding_opportunities"],
            funded_opportunities=r["funded_opportunities"],
            closed_opportunities=r["closed_opportunities"],
            total_target_amount=target,
            total_raised_amount=raised,
            avg_target_irr=Decimal(str(r["avg_target_irr"])),
            avg_expected_irr=Decimal(str(r["avg_expected_irr"])),
            avg_actual_irr=Decimal(str(r["avg_actual_irr"])),
            unique_creators=r["unique_creators"],
            total_investors=r["total_investors"] or 0,
            funding_pct=funding_pct,
        )
        vaults.append(item)
        platform_aum += raised
        total_inv += item.total_investors
        total_opp += item.total_opportunities

    avg_deal = (platform_aum / total_opp).quantize(Decimal("0.01")) if total_opp > 0 else Decimal("0")

    return VaultSummaryResponse(
        vaults=vaults,
        platform_aum=platform_aum,
        total_investors=total_inv,
        total_opportunities=total_opp,
        avg_deal_size=avg_deal,
    )


# ── 2. Monthly Investment Trends ────────────────────────────────────────────

TRENDS_MV = """
SELECT to_char(month, 'YYYY-MM') AS month, vault_type,
       investment_count, total_amount, unique_investors
FROM mv_monthly_investment_trends ORDER BY month
"""

TRENDS_DIRECT = """
SELECT to_char(date_trunc('month', oi.created_at), 'YYYY-MM') AS month,
       o.vault_type,
       COUNT(*)::int              AS investment_count,
       COALESCE(SUM(oi.amount),0) AS total_amount,
       COUNT(DISTINCT oi.user_id)::int AS unique_investors
FROM opportunity_investments oi
JOIN opportunities o ON o.id = oi.opportunity_id
WHERE oi.status = 'confirmed'
GROUP BY date_trunc('month', oi.created_at), o.vault_type

UNION ALL

SELECT to_char(date_trunc('month', i.created_at), 'YYYY-MM') AS month,
       'wealth' AS vault_type,
       COUNT(*)::int              AS investment_count,
       COALESCE(SUM(i.amount),0)  AS total_amount,
       COUNT(DISTINCT i.user_id)::int AS unique_investors
FROM investments i
WHERE i.status IN ('confirmed','payment_received')
GROUP BY date_trunc('month', i.created_at)
ORDER BY month
"""


@router.get("/investment-trends", response_model=InvestmentTrendsResponse)
async def investment_trends(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
    months: int = Query(12, ge=1, le=60),
) -> InvestmentTrendsResponse:
    rows = await _safe_mv_query(db, TRENDS_MV, TRENDS_DIRECT)

    points: list[MonthlyTrendPoint] = []
    total_vol = Decimal("0")
    peak_month, peak_amt = None, Decimal("0")
    month_totals: dict[str, Decimal] = {}

    for r in rows:
        amt = Decimal(str(r["total_amount"]))
        points.append(MonthlyTrendPoint(
            month=r["month"],
            vault_type=r["vault_type"],
            investment_count=r["investment_count"],
            total_amount=amt,
            unique_investors=r["unique_investors"],
        ))
        total_vol += amt
        month_totals[r["month"]] = month_totals.get(r["month"], Decimal("0")) + amt

    # find peak
    for m, a in month_totals.items():
        if a > peak_amt:
            peak_month, peak_amt = m, a

    n_months = max(len(month_totals), 1)
    avg_monthly = (total_vol / n_months).quantize(Decimal("0.01"))

    # limit to recent N months
    all_months = sorted(month_totals.keys())
    cutoff_months = set(all_months[-months:]) if len(all_months) > months else set(all_months)
    filtered = [p for p in points if p.month in cutoff_months]

    return InvestmentTrendsResponse(
        trends=filtered,
        total_volume=total_vol,
        avg_monthly_volume=avg_monthly,
        peak_month=peak_month,
        peak_amount=peak_amt,
    )


# ── 3. Geographic Distribution ──────────────────────────────────────────────

GEO_MV = """
SELECT city, state, vault_type, opportunity_count,
       total_target, total_raised, total_investors
FROM mv_geographic_distribution ORDER BY total_raised DESC
"""

GEO_DIRECT = """
SELECT
    COALESCE(o.city, 'Unknown')  AS city,
    COALESCE(o.state, 'Unknown') AS state,
    o.vault_type,
    COUNT(*)::int                AS opportunity_count,
    COALESCE(SUM(o.target_amount),0) AS total_target,
    COALESCE(SUM(o.raised_amount),0) AS total_raised,
    COALESCE(SUM(o.investor_count),0)::int AS total_investors
FROM opportunities o
GROUP BY COALESCE(o.city,'Unknown'), COALESCE(o.state,'Unknown'), o.vault_type
ORDER BY total_raised DESC
"""


@router.get("/geographic", response_model=GeoDistributionResponse)
async def geographic_distribution(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> GeoDistributionResponse:
    rows = await _safe_mv_query(db, GEO_MV, GEO_DIRECT)
    cities: list[GeoCityItem] = [
        GeoCityItem(
            city=r["city"],
            state=r["state"],
            vault_type=r["vault_type"],
            opportunity_count=r["opportunity_count"],
            total_target=Decimal(str(r["total_target"])),
            total_raised=Decimal(str(r["total_raised"])),
            total_investors=r["total_investors"] or 0,
        )
        for r in rows
    ]

    unique_cities = set(c.city for c in cities if c.city != "Unknown")
    top = cities[0].city if cities else None

    return GeoDistributionResponse(
        cities=cities,
        top_city=top,
        total_cities=len(unique_cities),
    )


# ── 4. Investor Analytics ───────────────────────────────────────────────────

INVESTOR_MV = """
SELECT to_char(month, 'YYYY-MM') AS month,
       new_users, new_investors, new_builders,
       kyc_approved, kyc_in_progress
FROM mv_investor_growth ORDER BY month
"""

INVESTOR_DIRECT = """
SELECT
    to_char(date_trunc('month', u.created_at), 'YYYY-MM')     AS month,
    COUNT(*)::int                                              AS new_users,
    COUNT(*) FILTER (WHERE u.role = 'investor')::int           AS new_investors,
    COUNT(*) FILTER (WHERE u.role = 'builder')::int            AS new_builders,
    COUNT(*) FILTER (WHERE u.kyc_status = 'APPROVED')::int     AS kyc_approved,
    COUNT(*) FILTER (WHERE u.kyc_status IN ('IN_PROGRESS','UNDER_REVIEW'))::int AS kyc_in_progress
FROM users u
WHERE u.is_active = true
GROUP BY date_trunc('month', u.created_at)
ORDER BY month
"""


@router.get("/investors", response_model=InvestorAnalyticsResponse)
async def investor_analytics(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> InvestorAnalyticsResponse:
    rows = await _safe_mv_query(db, INVESTOR_MV, INVESTOR_DIRECT)

    growth: list[InvestorGrowthPoint] = []
    cum_users, cum_inv = 0, 0
    total_users, total_inv, total_bld = 0, 0, 0
    total_kyc_approved, total_kyc_ip = 0, 0

    for r in rows:
        cum_users += r["new_users"]
        cum_inv += r["new_investors"]
        growth.append(InvestorGrowthPoint(
            month=r["month"],
            new_users=r["new_users"],
            new_investors=r["new_investors"],
            new_builders=r["new_builders"],
            kyc_approved=r["kyc_approved"],
            kyc_in_progress=r["kyc_in_progress"],
            cumulative_users=cum_users,
            cumulative_investors=cum_inv,
        ))
        total_users += r["new_users"]
        total_inv += r["new_investors"]
        total_bld += r["new_builders"]
        total_kyc_approved += r["kyc_approved"]
        total_kyc_ip += r["kyc_in_progress"]

    kyc_rate = Decimal("0")
    if total_users > 0:
        kyc_rate = (Decimal(str(total_kyc_approved)) / Decimal(str(total_users)) * 100).quantize(Decimal("0.1"))

    n_months = max(len(growth), 1)
    avg_signups = (Decimal(str(total_users)) / n_months).quantize(Decimal("0.1"))

    return InvestorAnalyticsResponse(
        growth=growth,
        total_users=total_users,
        total_investors=total_inv,
        total_builders=total_bld,
        kyc_completion_rate=kyc_rate,
        avg_monthly_signups=avg_signups,
    )


# ── 5. EOI Funnel ───────────────────────────────────────────────────────────

EOI_MV = "SELECT status, vault_type, eoi_count, total_interest_amount, avg_interest_amount FROM mv_eoi_funnel"

EOI_DIRECT = """
SELECT
    e.status,
    o.vault_type,
    COUNT(*)::int                          AS eoi_count,
    COALESCE(SUM(e.investment_amount), 0)  AS total_interest_amount,
    COALESCE(AVG(e.investment_amount), 0)  AS avg_interest_amount
FROM expressions_of_interest e
JOIN opportunities o ON o.id = e.opportunity_id
GROUP BY e.status, o.vault_type
"""


@router.get("/eoi-funnel", response_model=EOIFunnelResponse)
async def eoi_funnel(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> EOIFunnelResponse:
    rows = await _safe_mv_query(db, EOI_MV, EOI_DIRECT)

    items: list[EOIFunnelItem] = []
    total_eois, total_interest = 0, Decimal("0")
    submitted, closed = 0, 0

    for r in rows:
        items.append(EOIFunnelItem(
            status=r["status"],
            vault_type=r["vault_type"],
            eoi_count=r["eoi_count"],
            total_interest_amount=Decimal(str(r["total_interest_amount"])),
            avg_interest_amount=Decimal(str(r["avg_interest_amount"])),
        ))
        total_eois += r["eoi_count"]
        total_interest += Decimal(str(r["total_interest_amount"]))
        if r["status"] == "submitted":
            submitted += r["eoi_count"]
        if r["status"] in ("closed", "deal_completed"):
            closed += r["eoi_count"]

    conv = Decimal("0")
    if submitted > 0:
        conv = (Decimal(str(closed)) / Decimal(str(submitted)) * 100).quantize(Decimal("0.1"))

    return EOIFunnelResponse(
        funnel=items,
        total_eois=total_eois,
        total_interest=total_interest,
        conversion_rate=conv,
    )


# ── 6. Top Opportunities ────────────────────────────────────────────────────

TOP_OPP_MV = """
SELECT id, title, slug, vault_type, status, city, state,
       target_amount, raised_amount, target_irr, expected_irr, actual_irr,
       investor_count, funding_pct, company_name, creator_name, created_at
FROM mv_top_opportunities
ORDER BY raised_amount DESC LIMIT :lim
"""

TOP_OPP_DIRECT = """
SELECT
    o.id::text, o.title, o.slug, o.vault_type, o.status,
    o.city, o.state, o.target_amount, o.raised_amount,
    o.target_irr, o.expected_irr, o.actual_irr, o.investor_count,
    CASE WHEN o.target_amount > 0
         THEN ROUND((o.raised_amount / o.target_amount)*100, 1)
         ELSE 0 END AS funding_pct,
    c.company_name, u.full_name AS creator_name, o.created_at
FROM opportunities o
LEFT JOIN companies c ON c.id = o.company_id
LEFT JOIN users u ON u.id = o.creator_id
WHERE o.status NOT IN ('draft','rejected')
ORDER BY o.raised_amount DESC LIMIT :lim
"""


@router.get("/top-opportunities", response_model=TopOpportunitiesResponse)
async def top_opportunities(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
    limit: int = Query(10, ge=1, le=50),
) -> TopOpportunitiesResponse:
    try:
        result = await db.execute(text(TOP_OPP_MV), {"lim": limit})
    except Exception:
        await db.rollback()
        result = await db.execute(text(TOP_OPP_DIRECT), {"lim": limit})

    rows = result.mappings().all()
    items = [
        TopOpportunityItem(
            id=str(r["id"]),
            title=r["title"],
            slug=r["slug"],
            vault_type=r["vault_type"],
            status=r["status"],
            city=r.get("city"),
            state=r.get("state"),
            target_amount=Decimal(str(r["target_amount"])) if r["target_amount"] else None,
            raised_amount=Decimal(str(r["raised_amount"])) if r["raised_amount"] else Decimal("0"),
            target_irr=Decimal(str(r["target_irr"])) if r.get("target_irr") else None,
            expected_irr=Decimal(str(r["expected_irr"])) if r.get("expected_irr") else None,
            actual_irr=Decimal(str(r["actual_irr"])) if r.get("actual_irr") else None,
            investor_count=r["investor_count"] or 0,
            funding_pct=Decimal(str(r["funding_pct"])) if r["funding_pct"] else Decimal("0"),
            company_name=r.get("company_name"),
            creator_name=r.get("creator_name"),
            created_at=r["created_at"],
        )
        for r in rows
    ]
    return TopOpportunitiesResponse(opportunities=items, total=len(items))


# ── 7. Revenue Breakdown ────────────────────────────────────────────────────

REVENUE_MV = """
SELECT to_char(month, 'YYYY-MM') AS month, txn_type, txn_count, total_amount
FROM mv_transaction_revenue ORDER BY month
"""

REVENUE_DIRECT = """
SELECT
    to_char(date_trunc('month', t.created_at), 'YYYY-MM') AS month,
    t.type AS txn_type,
    COUNT(*)::int AS txn_count,
    COALESCE(SUM(t.amount),0) AS total_amount
FROM transactions t
GROUP BY date_trunc('month', t.created_at), t.type
ORDER BY month
"""


@router.get("/revenue", response_model=RevenueBreakdownResponse)
async def revenue_breakdown(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> RevenueBreakdownResponse:
    rows = await _safe_mv_query(db, REVENUE_MV, REVENUE_DIRECT)

    items: list[TransactionRevenueItem] = []
    by_type: dict[str, Decimal] = {}
    total = Decimal("0")

    for r in rows:
        amt = Decimal(str(r["total_amount"]))
        items.append(TransactionRevenueItem(
            month=r["month"],
            txn_type=r["txn_type"],
            txn_count=r["txn_count"],
            total_amount=amt,
        ))
        by_type[r["txn_type"]] = by_type.get(r["txn_type"], Decimal("0")) + amt
        total += amt

    return RevenueBreakdownResponse(monthly=items, by_type=by_type, total_revenue=total)


# ── 8. Refresh Materialized Views ───────────────────────────────────────────

@router.post("/refresh")
async def refresh_views(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> dict[str, str]:
    """Trigger a concurrent refresh of all analytics materialized views."""
    try:
        await db.execute(text("SELECT refresh_analytics_views()"))
        return {"status": "ok", "message": "All analytics views refreshed"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Refresh failed: {exc}")


# ── 9. Full Dashboard (single call) ─────────────────────────────────────────

@router.get("/dashboard", response_model=FullAnalyticsResponse)
async def full_analytics_dashboard(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> FullAnalyticsResponse:
    """Single endpoint returning the complete analytics dashboard payload."""
    vs = await vault_summary(db=db, _admin=_admin)
    it = await investment_trends(db=db, _admin=_admin, months=12)
    geo = await geographic_distribution(db=db, _admin=_admin)
    inv = await investor_analytics(db=db, _admin=_admin)
    eoi = await eoi_funnel(db=db, _admin=_admin)
    top = await top_opportunities(db=db, _admin=_admin, limit=10)
    rev = await revenue_breakdown(db=db, _admin=_admin)

    return FullAnalyticsResponse(
        vault_summary=vs,
        investment_trends=it,
        geographic=geo,
        investors=inv,
        eoi_funnel=eoi,
        top_opportunities=top,
        revenue=rev,
    )
