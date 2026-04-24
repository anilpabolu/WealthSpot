"""
Opportunities router – create, list, manage multi-vault opportunities.
"""

import math
import re
import uuid as _uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, get_optional_user, require_role
from app.models.approval import ApprovalCategory, ApprovalRequest
from app.models.opportunity import Opportunity, OpportunityStatus, VaultType
from app.models.opportunity_investment import OppInvestmentStatus, OpportunityInvestment
from app.models.opportunity_like import OpportunityLike, UserActivity
from app.models.profiling import UserProfileAnswer, VaultProfileQuestion
from app.models.property_referral import PropertyReferralCode
from app.models.user import User, UserRole
from app.schemas.opportunity import (
    OpportunityCreateRequest,
    OpportunityRead,
    OpportunityUpdateRequest,
    PaginatedOpportunities,
    VaultStatsResponse,
)

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


def _slugify(text: str) -> str:
    """Generate URL-safe slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    # Append short unique suffix to avoid collisions
    return f"{slug}-{_uuid.uuid4().hex[:6]}"


@router.get("", response_model=PaginatedOpportunities)
async def list_opportunities(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    vault_type: VaultType | None = Query(None),
    status: str | None = Query(None),
    city: str | None = Query(None),
    community_subtype: str | None = Query(
        None, description="Filter community opportunities: co_investor or co_partner"
    ),
    creator_id: str | None = Query(
        None, description="Filter by creator. Use 'me' for current user."
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedOpportunities:
    """List opportunities (public / marketplace-facing)."""
    query = select(Opportunity)
    count_query = select(func.count(Opportunity.id))

    # Resolve 'me' to current user's ID
    resolved_creator_id: _uuid.UUID | None = None
    if creator_id:
        if creator_id == "me":
            if not user:
                raise HTTPException(
                    status_code=401, detail="Authentication required for creator_id=me"
                )
            resolved_creator_id = user.id
        else:
            resolved_creator_id = _uuid.UUID(creator_id)

    # Hide archived opportunities unless explicitly requested
    if status != "archived":
        query = query.where(Opportunity.status != OpportunityStatus.ARCHIVED)
        count_query = count_query.where(Opportunity.status != OpportunityStatus.ARCHIVED)

    if vault_type:
        query = query.where(Opportunity.vault_type == vault_type)
        count_query = count_query.where(Opportunity.vault_type == vault_type)
    if status:
        parsed_statuses = []
        for s in status.split(","):
            try:
                parsed_statuses.append(OpportunityStatus(s.strip()))
            except ValueError:
                pass
        if len(parsed_statuses) == 1:
            query = query.where(Opportunity.status == parsed_statuses[0])
            count_query = count_query.where(Opportunity.status == parsed_statuses[0])
        elif parsed_statuses:
            query = query.where(Opportunity.status.in_(parsed_statuses))
            count_query = count_query.where(Opportunity.status.in_(parsed_statuses))
    if city:
        query = query.where(Opportunity.city == city)
        count_query = count_query.where(Opportunity.city == city)
    if community_subtype:
        query = query.where(Opportunity.community_subtype == community_subtype)
        count_query = count_query.where(Opportunity.community_subtype == community_subtype)
    if resolved_creator_id:
        query = query.where(Opportunity.creator_id == resolved_creator_id)
        count_query = count_query.where(Opportunity.creator_id == resolved_creator_id)

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = max(1, math.ceil(total / page_size))

    query = query.order_by(Opportunity.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    opps = result.scalars().all()

    # Compute live investor_count and raised_amount from OpportunityInvestment
    opp_ids = [o.id for o in opps]
    live_stats: dict[_uuid.UUID, tuple[int, float]] = {}
    if opp_ids:
        stats_q = (
            select(
                OpportunityInvestment.opportunity_id,
                func.count(func.distinct(OpportunityInvestment.user_id)).label("inv_count"),
                func.coalesce(func.sum(OpportunityInvestment.amount), 0).label("raised"),
            )
            .where(
                OpportunityInvestment.opportunity_id.in_(opp_ids),
                OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
            )
            .group_by(OpportunityInvestment.opportunity_id)
        )
        stats_result = await db.execute(stats_q)
        for row in stats_result.all():
            live_stats[row.opportunity_id] = (int(row.inv_count), float(row.raised))

    items = []
    for o in opps:
        read = OpportunityRead.model_validate(o)
        inv_count, raised = live_stats.get(o.id, (0, 0.0))
        read.investor_count = inv_count
        read.raised_amount = raised
        items.append(read)

    return PaginatedOpportunities(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ── Vault-level aggregated stats ────────────────────────────────────────────


def _compute_irr(investments: list, total_invested: float) -> float | None:
    """Compute a simplified actual IRR from investment returns."""
    if not investments or total_invested <= 0:
        return None
    total_returns = float(sum(inv.returns_amount or 0 for inv in investments))
    if total_returns <= 0:
        return None
    now = datetime.now(UTC)
    avg_days = sum((now - inv.invested_at).days for inv in investments if inv.invested_at) / len(
        investments
    )
    years = max(avg_days / 365.25, 0.25)
    return_ratio = total_returns / total_invested
    irr = ((1 + return_ratio) ** (1 / years) - 1) * 100
    return round(irr, 2)


@router.get("/vault-stats", response_model=list[VaultStatsResponse])
async def vault_stats(
    db: AsyncSession = Depends(get_db),
) -> list[VaultStatsResponse]:
    """Return aggregated stats per vault (total invested, investor count, IRR, explorer count)."""
    active_statuses = [
        OpportunityStatus.APPROVED,
        OpportunityStatus.ACTIVE,
        OpportunityStatus.FUNDING,
        OpportunityStatus.FUNDED,
        OpportunityStatus.CLOSED,
    ]

    # Single aggregation query for counts + investment stats per vault type
    agg_q = (
        select(
            Opportunity.vault_type,
            func.count(func.distinct(Opportunity.id)).label("opp_count"),
            func.coalesce(func.sum(OpportunityInvestment.amount), 0).label("total_invested"),
            func.count(func.distinct(OpportunityInvestment.user_id)).label("investor_count"),
        )
        .outerjoin(
            OpportunityInvestment,
            (OpportunityInvestment.opportunity_id == Opportunity.id)
            & (OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED),
        )
        .where(Opportunity.status.in_(active_statuses))
        .group_by(Opportunity.vault_type)
    )
    agg_result = await db.execute(agg_q)
    agg_rows = {row.vault_type: row for row in agg_result.fetchall()}

    # Average expected IRR per vault type
    irr_q = (
        select(
            Opportunity.vault_type,
            func.avg(Opportunity.expected_irr).label("avg_irr"),
        )
        .where(Opportunity.expected_irr.isnot(None))
        .group_by(Opportunity.vault_type)
    )
    irr_result = await db.execute(irr_q)
    irr_map = {row.vault_type: row.avg_irr for row in irr_result.fetchall()}

    # Compute actual IRR per vault type — single query for ALL vault types
    actual_irr_map: dict[VaultType, float | None] = {}
    inv_q = (
        select(OpportunityInvestment, Opportunity.vault_type)
        .join(Opportunity, Opportunity.id == OpportunityInvestment.opportunity_id)
        .where(
            Opportunity.status.in_(active_statuses),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
    )
    inv_result = await db.execute(inv_q)
    inv_by_vault: dict[VaultType, list] = {vt: [] for vt in VaultType}
    for inv, vault_type in inv_result.all():
        inv_by_vault[vault_type].append(inv)
    for vt in VaultType:
        agg_row = agg_rows.get(vt)
        total = float(agg_row.total_invested) if agg_row else 0.0
        actual_irr_map[vt] = _compute_irr(inv_by_vault[vt], total) if total > 0 else None

    # ── Explorer count ────────────────────────────────────────────────
    # Explorer = user who completed ALL active DNA profiling questions for
    # a vault but does NOT yet have a confirmed investment in that vault.
    # When an explorer invests, they convert from explorer → investor.

    # Step 1: total active questions per vault
    q_count_q = (
        select(
            VaultProfileQuestion.vault_type,
            func.count(VaultProfileQuestion.id).label("total_q"),
        )
        .where(VaultProfileQuestion.is_active.is_(True))
        .group_by(VaultProfileQuestion.vault_type)
    )
    q_count_result = await db.execute(q_count_q)
    total_q_map = {row.vault_type: int(row.total_q) for row in q_count_result.fetchall()}

    # Step 2: count answers per user per vault
    user_answer_q = select(
        UserProfileAnswer.vault_type,
        UserProfileAnswer.user_id,
        func.count(UserProfileAnswer.id).label("answered"),
    ).group_by(UserProfileAnswer.vault_type, UserProfileAnswer.user_id)
    user_answer_result = await db.execute(user_answer_q)

    # Collect user_ids who completed DNA per vault
    dna_complete_users: dict[str, set] = {}
    for row in user_answer_result.fetchall():
        vt_str = row.vault_type
        total_q = total_q_map.get(vt_str, 0)
        if total_q > 0 and int(row.answered) >= total_q:
            dna_complete_users.setdefault(vt_str, set()).add(row.user_id)

    # Step 3: user_ids with confirmed investments per vault
    invested_users_q = (
        select(
            Opportunity.vault_type,
            OpportunityInvestment.user_id,
        )
        .join(Opportunity, Opportunity.id == OpportunityInvestment.opportunity_id)
        .where(
            Opportunity.status.in_(active_statuses),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
        .distinct()
    )
    invested_result = await db.execute(invested_users_q)
    invested_users: dict[str, set] = {}
    for row in invested_result.fetchall():
        vt_str = row.vault_type.value if hasattr(row.vault_type, "value") else row.vault_type
        invested_users.setdefault(vt_str, set()).add(row.user_id)

    # Step 4: explorer = DNA complete MINUS invested
    explorer_map: dict[str, int] = {}
    for vt_str, dna_users in dna_complete_users.items():
        inv_users = invested_users.get(vt_str, set())
        explorer_map[vt_str] = len(dna_users - inv_users)

    # Platform users count (total registered users)
    platform_users_result = await db.execute(select(func.count(User.id)))
    platform_users_count = platform_users_result.scalar() or 0

    # New metrics: min_investment, cities, sectors per vault
    extra_q = (
        select(
            Opportunity.vault_type,
            func.min(Opportunity.min_investment).label("min_inv"),
            func.count(func.distinct(Opportunity.city)).label("cities"),
            func.count(func.distinct(Opportunity.industry)).label("sectors"),
        )
        .where(Opportunity.status.in_(active_statuses))
        .group_by(Opportunity.vault_type)
    )
    extra_result = await db.execute(extra_q)
    extra_map = {row.vault_type: row for row in extra_result.fetchall()}

    # Avg ticket size from confirmed investments per vault
    ticket_q = (
        select(
            Opportunity.vault_type,
            func.avg(OpportunityInvestment.amount).label("avg_ticket"),
        )
        .join(Opportunity, Opportunity.id == OpportunityInvestment.opportunity_id)
        .where(
            Opportunity.status.in_(active_statuses),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
        .group_by(Opportunity.vault_type)
    )
    ticket_result = await db.execute(ticket_q)
    ticket_map = {row.vault_type: float(row.avg_ticket) for row in ticket_result.fetchall()}

    # Co-investor / co-partner counts (community vault subtypes)
    co_q = (
        select(
            Opportunity.community_subtype,
            func.count(Opportunity.id).label("cnt"),
        )
        .where(
            Opportunity.status.in_(active_statuses),
            Opportunity.vault_type == VaultType.COMMUNITY,
            Opportunity.community_subtype.in_(["co_investor", "co_partner"]),
        )
        .group_by(Opportunity.community_subtype)
    )
    co_result = await db.execute(co_q)
    co_map = {row.community_subtype: int(row.cnt) for row in co_result.fetchall()}

    # ── Safe Vault specific aggregations ─────────────────────────────
    # avg_interest_rate, avg_tenure_months, mortgage_coverage_pct
    # from safe_vault_data JSONB — only approved/active listings
    safe_opps_q = (
        select(Opportunity.safe_vault_data)
        .where(
            Opportunity.vault_type == VaultType.SAFE,
            Opportunity.status.in_(active_statuses),
            Opportunity.safe_vault_data.isnot(None),
        )
    )
    safe_opps_result = await db.execute(safe_opps_q)
    safe_data_rows = [row[0] for row in safe_opps_result.fetchall() if row[0]]
    safe_count = len(safe_data_rows)
    safe_interest_rates = [float(d["interest_rate"]) for d in safe_data_rows if "interest_rate" in d]
    safe_tenures = [float(d["tenure_months"]) for d in safe_data_rows if "tenure_months" in d]
    safe_mortgage_count = sum(
        1 for d in safe_data_rows
        if isinstance(d.get("mortgage_agreement"), dict) and d["mortgage_agreement"].get("enabled")
    )
    avg_interest_rate = round(sum(safe_interest_rates) / len(safe_interest_rates), 2) if safe_interest_rates else None
    avg_tenure_months = round(sum(safe_tenures) / len(safe_tenures), 1) if safe_tenures else None
    mortgage_coverage_pct = round((safe_mortgage_count / safe_count) * 100, 1) if safe_count > 0 else None

    # ── Community Vault specific aggregations ────────────────────────
    # avg_project_size = avg target_amount for community opps
    # collaboration_rate = % community projects with >1 confirmed investor
    comm_size_q = (
        select(func.avg(Opportunity.target_amount).label("avg_size"))
        .where(
            Opportunity.vault_type == VaultType.COMMUNITY,
            Opportunity.status.in_(active_statuses),
            Opportunity.target_amount.isnot(None),
        )
    )
    comm_size_result = await db.execute(comm_size_q)
    comm_size_row = comm_size_result.fetchone()
    avg_project_size = round(float(comm_size_row.avg_size), 2) if comm_size_row and comm_size_row.avg_size else None

    # Count community opps with >1 distinct confirmed investor
    comm_collab_q = (
        select(
            OpportunityInvestment.opportunity_id,
            func.count(func.distinct(OpportunityInvestment.user_id)).label("inv_count"),
        )
        .join(Opportunity, Opportunity.id == OpportunityInvestment.opportunity_id)
        .where(
            Opportunity.vault_type == VaultType.COMMUNITY,
            Opportunity.status.in_(active_statuses),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
        .group_by(OpportunityInvestment.opportunity_id)
    )
    comm_collab_result = await db.execute(comm_collab_q)
    comm_collab_rows = comm_collab_result.fetchall()
    comm_total_opps = len(comm_collab_rows)
    comm_collab_opps = sum(1 for r in comm_collab_rows if int(r.inv_count) > 1)
    collaboration_rate = round((comm_collab_opps / comm_total_opps) * 100, 1) if comm_total_opps > 0 else None

    results = []
    for vt in VaultType:
        agg_row = agg_rows.get(vt)
        extra_row = extra_map.get(vt)
        results.append(
            VaultStatsResponse(
                vault_type=vt.value,
                total_invested=float(agg_row.total_invested) if agg_row else 0.0,
                investor_count=int(agg_row.investor_count) if agg_row else 0,
                opportunity_count=int(agg_row.opp_count) if agg_row else 0,
                expected_irr=round(float(irr_map[vt]), 2)
                if vt in irr_map and irr_map[vt]
                else None,
                actual_irr=actual_irr_map.get(vt),
                explorer_count=explorer_map.get(vt.value, 0),
                min_investment=float(extra_row.min_inv)
                if extra_row and extra_row.min_inv
                else None,
                avg_ticket_size=ticket_map.get(vt),
                cities_covered=int(extra_row.cities) if extra_row else 0,
                sectors_covered=int(extra_row.sectors) if extra_row else 0,
                co_investor_count=co_map.get("co_investor", 0) if vt == VaultType.COMMUNITY else 0,
                co_partner_count=co_map.get("co_partner", 0) if vt == VaultType.COMMUNITY else 0,
                platform_users_count=platform_users_count,
                # Safe Vault
                listings_count=safe_count if vt == VaultType.SAFE else (int(agg_row.opp_count) if agg_row else 0),
                avg_interest_rate=avg_interest_rate if vt == VaultType.SAFE else None,
                avg_tenure_months=avg_tenure_months if vt == VaultType.SAFE else None,
                mortgage_coverage_pct=mortgage_coverage_pct if vt == VaultType.SAFE else None,
                # Community
                avg_project_size=avg_project_size if vt == VaultType.COMMUNITY else None,
                collaboration_rate=collaboration_rate if vt == VaultType.COMMUNITY else None,
            )
        )

    return results


# ── Builder-scoped endpoints ────────────────────────────────────────────────


@router.get("/builder/investors")
async def builder_investors(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Return all investors across the current user's opportunities."""
    from app.schemas.opportunity import BuilderInvestorItem, BuilderInvestorsResponse

    # Get all opportunity IDs owned by this user
    opp_q = select(Opportunity.id).where(Opportunity.creator_id == user.id)
    opp_result = await db.execute(opp_q)
    opp_ids = [row[0] for row in opp_result.all()]

    if not opp_ids:
        return BuilderInvestorsResponse(
            investors=[], total_investors=0, total_invested=0
        ).model_dump()

    # Join investments + users + opportunities
    stmt = (
        select(
            OpportunityInvestment.id,
            OpportunityInvestment.user_id,
            OpportunityInvestment.amount,
            OpportunityInvestment.invested_at,
            OpportunityInvestment.status,
            OpportunityInvestment.opportunity_id,
            Opportunity.title,
            Opportunity.slug,
            User.full_name,
            User.email,
            User.avatar_url,
        )
        .join(Opportunity, Opportunity.id == OpportunityInvestment.opportunity_id)
        .join(User, User.id == OpportunityInvestment.user_id)
        .where(
            OpportunityInvestment.opportunity_id.in_(opp_ids),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
        .order_by(OpportunityInvestment.invested_at.desc())
    )
    rows = (await db.execute(stmt)).all()

    investors = []
    unique_investors: set[_uuid.UUID] = set()
    total_invested = 0.0

    for row in rows:
        unique_investors.add(row.user_id)
        total_invested += float(row.amount)
        investors.append(
            BuilderInvestorItem(
                investment_id=row.id,
                investor_id=row.user_id,
                investor_name=row.full_name or "Unknown",
                investor_email=row.email,
                investor_avatar=row.avatar_url,
                opportunity_id=row.opportunity_id,
                opportunity_title=row.title,
                opportunity_slug=row.slug,
                amount=float(row.amount),
                invested_at=row.invested_at,
                status=row.status.value if hasattr(row.status, "value") else str(row.status),
            )
        )

    return BuilderInvestorsResponse(
        investors=investors,
        total_investors=len(unique_investors),
        total_invested=total_invested,
    ).model_dump()


@router.get("/builder/analytics")
async def builder_analytics(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Builder-scoped analytics for the current user's opportunities."""
    from app.schemas.opportunity import (
        BuilderAnalyticsResponse,
        BuilderCityDistribution,
        BuilderMonthlyTrend,
        BuilderOpportunityBreakdown,
    )

    # Fetch all opportunities by this creator
    opp_q = (
        select(Opportunity)
        .where(
            Opportunity.creator_id == user.id,
            Opportunity.status != OpportunityStatus.ARCHIVED,
        )
        .order_by(Opportunity.created_at.desc())
    )
    opps = (await db.execute(opp_q)).scalars().all()

    if not opps:
        return BuilderAnalyticsResponse(
            total_raised=0,
            total_target=0,
            investor_count=0,
            opportunity_count=0,
            opportunities=[],
            monthly_trends=[],
            city_distribution=[],
        ).model_dump()

    opp_ids = [o.id for o in opps]

    # Aggregate investment stats per opportunity
    stats_q = (
        select(
            OpportunityInvestment.opportunity_id,
            func.count(func.distinct(OpportunityInvestment.user_id)).label("inv_count"),
            func.coalesce(func.sum(OpportunityInvestment.amount), 0).label("raised"),
        )
        .where(
            OpportunityInvestment.opportunity_id.in_(opp_ids),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
        .group_by(OpportunityInvestment.opportunity_id)
    )
    stats_result = await db.execute(stats_q)
    stats_map = {
        row.opportunity_id: (int(row.inv_count), float(row.raised)) for row in stats_result.all()
    }

    total_raised = 0.0
    total_target = 0.0
    _all_investor_ids: set[_uuid.UUID] = set()
    opp_breakdowns = []

    for opp in opps:
        inv_count, raised = stats_map.get(opp.id, (0, 0.0))
        target = float(opp.target_amount or 0)
        total_raised += raised
        total_target += target
        funding_pct = (raised / target * 100) if target > 0 else 0

        opp_breakdowns.append(
            BuilderOpportunityBreakdown(
                id=opp.id,
                title=opp.title,
                slug=opp.slug,
                status=opp.status.value if hasattr(opp.status, "value") else str(opp.status),
                vault_type=opp.vault_type.value
                if hasattr(opp.vault_type, "value")
                else str(opp.vault_type),
                city=opp.city,
                raised_amount=raised,
                target_amount=target,
                investor_count=inv_count,
                funding_pct=round(funding_pct, 1),
                created_at=opp.created_at,
            )
        )

    # Unique investor count across all opps
    if opp_ids:
        unique_inv_q = select(func.count(func.distinct(OpportunityInvestment.user_id))).where(
            OpportunityInvestment.opportunity_id.in_(opp_ids),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
        unique_count = (await db.execute(unique_inv_q)).scalar() or 0
    else:
        unique_count = 0

    # Monthly investment trends (last 12 months)
    monthly_q = (
        select(
            func.to_char(OpportunityInvestment.invested_at, "YYYY-MM").label("month"),
            func.coalesce(func.sum(OpportunityInvestment.amount), 0).label("amount"),
            func.count(OpportunityInvestment.id).label("count"),
        )
        .where(
            OpportunityInvestment.opportunity_id.in_(opp_ids),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
            OpportunityInvestment.invested_at.isnot(None),
        )
        .group_by(func.to_char(OpportunityInvestment.invested_at, "YYYY-MM"))
        .order_by(func.to_char(OpportunityInvestment.invested_at, "YYYY-MM"))
    )
    monthly_result = await db.execute(monthly_q)
    monthly_trends = [
        BuilderMonthlyTrend(month=row.month, amount=float(row.amount), count=int(row.count))
        for row in monthly_result.all()
        if row.month is not None
    ]

    # City distribution
    city_map: dict[str, dict] = {}
    for opp in opps:
        city = opp.city or "Unknown"
        inv_count, raised = stats_map.get(opp.id, (0, 0.0))
        if city not in city_map:
            city_map[city] = {"count": 0, "total_raised": 0.0}
        city_map[city]["count"] += 1
        city_map[city]["total_raised"] += raised

    city_distribution = [
        BuilderCityDistribution(city=city, count=data["count"], total_raised=data["total_raised"])
        for city, data in sorted(city_map.items(), key=lambda x: x[1]["total_raised"], reverse=True)
    ]

    # ── New metrics: avg time-to-fund, top opportunity, repeat investor rate ──

    # Average days to fund (for opportunities where raised >= target)
    avg_days_to_fund: float | None = None
    funded_days = []
    for opp in opps:
        target = float(opp.target_amount or 0)
        _inv_count, raised = stats_map.get(opp.id, (0, 0.0))
        if target > 0 and raised >= target:
            # Find the last confirmed investment date for this opportunity
            last_inv_q = (
                select(func.max(OpportunityInvestment.invested_at))
                .where(
                    OpportunityInvestment.opportunity_id == opp.id,
                    OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
                )
            )
            last_inv_date = (await db.execute(last_inv_q)).scalar()
            if last_inv_date and opp.created_at:
                delta = (last_inv_date - opp.created_at).total_seconds() / 86400
                funded_days.append(max(delta, 0))
    if funded_days:
        avg_days_to_fund = round(sum(funded_days) / len(funded_days), 1)

    # Top performing listing (highest funding_pct)
    top_opportunity = None
    if opp_breakdowns:
        top_opportunity = max(opp_breakdowns, key=lambda b: b.funding_pct)

    # Investor repeat rate (% of investors who invested in >1 listing)
    repeat_investor_rate = 0.0
    if opp_ids and unique_count > 1:
        repeat_q = (
            select(OpportunityInvestment.user_id)
            .where(
                OpportunityInvestment.opportunity_id.in_(opp_ids),
                OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
            )
            .group_by(OpportunityInvestment.user_id)
            .having(func.count(func.distinct(OpportunityInvestment.opportunity_id)) > 1)
        )
        repeat_result = await db.execute(repeat_q)
        repeat_count = len(repeat_result.all())
        if unique_count > 0:
            repeat_investor_rate = round(repeat_count / unique_count * 100, 1)

    return BuilderAnalyticsResponse(
        total_raised=total_raised,
        total_target=total_target,
        investor_count=unique_count,
        opportunity_count=len(opps),
        opportunities=opp_breakdowns,
        monthly_trends=monthly_trends,
        city_distribution=city_distribution,
        avg_days_to_fund=avg_days_to_fund,
        top_opportunity=top_opportunity,
        repeat_investor_rate=repeat_investor_rate,
    ).model_dump()


# ── User activities feed ─────────────────────────────────────────────────────


@router.get("/user/activities")
async def user_activities(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
) -> list[dict]:
    """Return user's activity feed (liked, shared, invested, etc.)."""
    result = await db.execute(
        select(UserActivity)
        .where(UserActivity.user_id == user.id)
        .order_by(UserActivity.created_at.desc())
        .limit(limit)
    )
    activities = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "activityType": a.activity_type,
            "resourceType": a.resource_type,
            "resourceId": str(a.resource_id),
            "resourceTitle": a.resource_title,
            "resourceSlug": a.resource_slug,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
        }
        for a in activities
    ]


@router.get("/by-slug/{slug}", response_model=OpportunityRead)
async def get_opportunity_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> OpportunityRead:
    """Fetch a single opportunity by its URL slug."""
    result = await db.execute(select(Opportunity).where(Opportunity.slug == slug))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return OpportunityRead.model_validate(opp)


@router.get("/{opportunity_id}", response_model=OpportunityRead)
async def get_opportunity(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
) -> OpportunityRead:
    result = await db.execute(
        select(Opportunity).where(Opportunity.id == _uuid.UUID(opportunity_id))
    )
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return OpportunityRead.model_validate(opp)


@router.post("", response_model=OpportunityRead)
async def create_opportunity(
    body: OpportunityCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OpportunityRead:
    """
    Create a new opportunity. Automatically generates an approval ticket.
    The opportunity stays in PENDING_APPROVAL until an approver acts.
    """
    # Validate community_subtype for community vault
    if body.vault_type == VaultType.COMMUNITY:
        if not body.community_subtype or body.community_subtype not in (
            "co_investor",
            "co_partner",
        ):
            raise HTTPException(
                status_code=422,
                detail="community_subtype is required for Community Vault (co_investor or co_partner)",
            )

    # Determine approval category based on vault type
    category_map = {
        VaultType.WEALTH: ApprovalCategory.PROPERTY_LISTING,
        VaultType.SAFE: ApprovalCategory.SAFE_LISTING,
        VaultType.COMMUNITY: ApprovalCategory.COMMUNITY_PROJECT,
    }

    slug = _slugify(body.title)

    opportunity = Opportunity(
        creator_id=user.id,
        vault_type=body.vault_type,
        status=OpportunityStatus.PENDING_APPROVAL,
        title=body.title,
        slug=slug,
        tagline=body.tagline,
        description=body.description,
        city=body.city,
        state=body.state,
        address=body.address,
        # Address details
        address_line1=body.address_line1,
        address_line2=body.address_line2,
        landmark=body.landmark,
        locality=body.locality,
        pincode=body.pincode,
        district=body.district,
        country=body.country,
        # Company
        company_id=_uuid.UUID(body.company_id) if body.company_id else None,
        # Financials
        target_amount=body.target_amount,
        min_investment=body.min_investment,
        target_irr=body.target_irr,
        industry=body.industry,
        stage=body.stage,
        founder_name=body.founder_name,
        pitch_deck_url=body.pitch_deck_url,
        community_type=body.community_type,
        collaboration_type=body.collaboration_type,
        community_subtype=body.community_subtype,
        community_details=body.community_details,
        safe_vault_data=body.safe_vault_data,
        funding_open_at=body.funding_open_at,
        closing_date=body.closing_date,
    )
    db.add(opportunity)
    await db.flush()

    # Create corresponding approval request
    approval = ApprovalRequest(
        requester_id=user.id,
        category=category_map.get(body.vault_type, ApprovalCategory.OPPORTUNITY_LISTING),
        title=f"New {body.vault_type.value.title()} Opportunity: {body.title}",
        description=body.description or body.tagline,
        resource_type="opportunity",
        resource_id=str(opportunity.id),
        payload={
            "vault_type": body.vault_type.value,
            "title": body.title,
            "city": body.city,
            "target_amount": body.target_amount,
        },
    )
    db.add(approval)
    await db.flush()

    # Link approval to opportunity
    opportunity.approval_id = approval.id
    await db.flush()
    await db.refresh(opportunity)

    return OpportunityRead.model_validate(opportunity)


@router.post("/{opportunity_id}/assign-role")
async def assign_role_for_opportunity(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """
    When a user creates an opportunity, assign the appropriate role.
    Creates an approval request for the role assignment.
    """
    result = await db.execute(
        select(Opportunity).where(Opportunity.id == _uuid.UUID(opportunity_id))
    )
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Map vault type to suggested role
    role_map = {
        VaultType.WEALTH: UserRole.BUILDER,
        VaultType.SAFE: UserRole.FOUNDER,
        VaultType.COMMUNITY: UserRole.COMMUNITY_LEAD,
    }
    target_role = role_map.get(opp.vault_type)
    if not target_role:
        raise HTTPException(status_code=400, detail="Cannot determine role for this vault type")

    # Create approval for role assignment
    approval = ApprovalRequest(
        requester_id=user.id,
        category=ApprovalCategory.ROLE_ASSIGNMENT,
        title=f"Role Assignment: {target_role.value} for {user.full_name}",
        description=f"User {user.email} requests {target_role.value} role based on opportunity '{opp.title}'.",
        resource_type="user",
        resource_id=str(user.id),
        payload={"target_role": target_role.value, "opportunity_id": str(opp.id)},
    )
    db.add(approval)
    await db.flush()

    return {
        "message": f"Role assignment request for '{target_role.value}' submitted for approval",
        "approval_id": str(approval.id),
    }


# ── Update opportunity (for approver edit) ───────────────────────────────────


@router.patch("/{opportunity_id}", response_model=OpportunityRead)
async def update_opportunity(
    opportunity_id: str,
    body: OpportunityUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OpportunityRead:
    """Update an opportunity. Allowed for creator or approver/admin/super_admin."""
    result = await db.execute(
        select(Opportunity).where(Opportunity.id == _uuid.UUID(opportunity_id))
    )
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Permission: creator can edit drafts/pending; approvers can edit pending
    is_creator = opp.creator_id == user.id
    is_approver = user.role in (UserRole.ADMIN, UserRole.APPROVER, UserRole.SUPER_ADMIN)

    if not is_creator and not is_approver:
        raise HTTPException(status_code=403, detail="Not authorised to edit this opportunity")

    if is_creator and opp.status in (OpportunityStatus.CLOSED, OpportunityStatus.ARCHIVED):
        raise HTTPException(status_code=400, detail="Cannot edit opportunity in current status")

    # Detect backward status transition and handle investment cancellation
    STATUS_ORDER = [
        OpportunityStatus.DRAFT,
        OpportunityStatus.PENDING_APPROVAL,
        OpportunityStatus.APPROVED,
        OpportunityStatus.ACTIVE,
        OpportunityStatus.FUNDING,
        OpportunityStatus.FUNDED,
        OpportunityStatus.CLOSED,
    ]

    update_data = body.model_dump(exclude_unset=True)
    cancel_investments = update_data.pop("cancel_investments", False)
    new_status_str = update_data.get("status")

    if new_status_str and cancel_investments and is_approver:
        try:
            new_status = OpportunityStatus(new_status_str)
        except ValueError:
            new_status = None
        if new_status:
            old_idx = STATUS_ORDER.index(opp.status) if opp.status in STATUS_ORDER else -1
            new_idx = STATUS_ORDER.index(new_status) if new_status in STATUS_ORDER else -1
            if old_idx > new_idx >= 0:
                # Backward transition — cancel confirmed investments
                from sqlalchemy import update as sql_update

                await db.execute(
                    sql_update(OpportunityInvestment)
                    .where(
                        OpportunityInvestment.opportunity_id == opp.id,
                        OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
                    )
                    .values(status=OppInvestmentStatus.CANCELLED)
                )
                # Roll back opportunity aggregate stats after bulk cancellation
                opp.raised_amount = Decimal("0")
                opp.investor_count = 0

    # Apply partial update
    for field_name, value in update_data.items():
        if field_name == "company_id" and value:
            setattr(opp, field_name, _uuid.UUID(value))
        else:
            setattr(opp, field_name, value)

    # If current_valuation was patched, recalculate derived fields
    if "current_valuation" in update_data and update_data["current_valuation"] is not None:
        new_val = Decimal(str(update_data["current_valuation"]))
        total_invested = Decimal(str(opp.raised_amount or 0))
        if total_invested > 0:
            appreciation_amount = new_val - total_invested
            inv_result = await db.execute(
                select(OpportunityInvestment).where(
                    OpportunityInvestment.opportunity_id == opp.id,
                    OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
                )
            )
            for oi in inv_result.scalars().all():
                share = (Decimal(str(oi.amount)) / total_invested) * appreciation_amount
                oi.returns_amount = share.quantize(Decimal("0.01"))
            opp.actual_irr = (
                (new_val - total_invested) / total_invested * 100
            ).quantize(Decimal("0.01"))

    await db.flush()
    await db.refresh(opp)
    return OpportunityRead.model_validate(opp)


# ── Like toggle ──────────────────────────────────────────────────────────────


@router.post("/{opportunity_id}/like")
async def toggle_like(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Toggle like on an opportunity. Returns new liked state and total count."""
    opp_uuid = _uuid.UUID(opportunity_id)

    # Verify opportunity exists
    opp_result = await db.execute(select(Opportunity).where(Opportunity.id == opp_uuid))
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Check existing like
    existing = await db.execute(
        select(OpportunityLike).where(
            OpportunityLike.opportunity_id == opp_uuid,
            OpportunityLike.user_id == user.id,
        )
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        liked = False
        activity_type = "unliked"
    else:
        db.add(OpportunityLike(opportunity_id=opp_uuid, user_id=user.id))
        liked = True
        activity_type = "liked"

    # Record activity
    db.add(
        UserActivity(
            user_id=user.id,
            activity_type=activity_type,
            resource_type="opportunity",
            resource_id=opp_uuid,
            resource_title=opp.title,
            resource_slug=opp.slug,
        )
    )
    await db.flush()

    # Total like count
    count_result = await db.execute(
        select(func.count(OpportunityLike.id)).where(OpportunityLike.opportunity_id == opp_uuid)
    )
    like_count = count_result.scalar() or 0

    return {"liked": liked, "like_count": like_count}


@router.get("/{opportunity_id}/like-status")
async def like_status(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> dict:
    """Check if current user liked this opportunity + total count."""
    opp_uuid = _uuid.UUID(opportunity_id)

    count_result = await db.execute(
        select(func.count(OpportunityLike.id)).where(OpportunityLike.opportunity_id == opp_uuid)
    )
    like_count = count_result.scalar() or 0

    liked = False
    if user:
        existing = await db.execute(
            select(OpportunityLike.id).where(
                OpportunityLike.opportunity_id == opp_uuid,
                OpportunityLike.user_id == user.id,
            )
        )
        liked = existing.scalar_one_or_none() is not None

    return {"liked": liked, "like_count": like_count}


# ── Share tracking ───────────────────────────────────────────────────────────


@router.post("/{opportunity_id}/share")
async def track_share(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Record a share event and return the property referral code for this user+opportunity."""
    opp_uuid = _uuid.UUID(opportunity_id)

    opp_result = await db.execute(select(Opportunity).where(Opportunity.id == opp_uuid))
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Record share activity
    db.add(
        UserActivity(
            user_id=user.id,
            activity_type="shared",
            resource_type="opportunity",
            resource_id=opp_uuid,
            resource_title=opp.title,
            resource_slug=opp.slug,
        )
    )

    # Get or create property referral code
    existing = await db.execute(
        select(PropertyReferralCode).where(
            PropertyReferralCode.user_id == user.id,
            PropertyReferralCode.opportunity_id == opp_uuid,
        )
    )
    prc = existing.scalar_one_or_none()

    if not prc:
        code = f"P{_uuid.uuid4().hex[:7].upper()}"
        prc = PropertyReferralCode(
            user_id=user.id,
            opportunity_id=opp_uuid,
            code=code,
        )
        db.add(prc)
        await db.flush()
        await db.refresh(prc)

    return {
        "message": "Share recorded",
        "property_referral_code": prc.code,
        "referral_link": f"https://wealthspot.in/opportunity/{opp.slug}?pref={prc.code}",
    }


# ── Get or create property referral code ─────────────────────────────────────


@router.get("/{opportunity_id}/referral-code")
async def get_property_referral_code(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Get the static property referral code for this user+opportunity (creates if needed)."""
    opp_uuid = _uuid.UUID(opportunity_id)

    opp_result = await db.execute(select(Opportunity).where(Opportunity.id == opp_uuid))
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    existing = await db.execute(
        select(PropertyReferralCode).where(
            PropertyReferralCode.user_id == user.id,
            PropertyReferralCode.opportunity_id == opp_uuid,
        )
    )
    prc = existing.scalar_one_or_none()

    if not prc:
        code = f"P{_uuid.uuid4().hex[:7].upper()}"
        prc = PropertyReferralCode(
            user_id=user.id,
            opportunity_id=opp_uuid,
            code=code,
        )
        db.add(prc)
        await db.flush()
        await db.refresh(prc)

    return {
        "code": prc.code,
        "referral_link": f"https://wealthspot.in/opportunity/{opp.slug}?pref={prc.code}",
    }


# ── Soft-delete (archive) ────────────────────────────────────────────────────


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_opportunity(
    opportunity_id: str,
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete an opportunity tile (admin/super_admin only). Sets status to ARCHIVED."""
    opp_uuid = _uuid.UUID(opportunity_id)
    result = await db.execute(select(Opportunity).where(Opportunity.id == opp_uuid))
    opp = result.scalar_one_or_none()

    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if opp.status == OpportunityStatus.ARCHIVED:
        raise HTTPException(status_code=400, detail="Opportunity is already archived")

    opp.status = OpportunityStatus.ARCHIVED
    await db.flush()
