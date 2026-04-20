"""
Portfolio router – summary, properties, transactions for the investor dashboard.
"""

import logging
import uuid
from collections import defaultdict
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.investment import Investment, InvestmentStatus, Transaction
from app.models.opportunity import Opportunity, OpportunityStatus, VaultType
from app.models.opportunity_investment import OppInvestmentStatus, OpportunityInvestment
from app.models.property import Property
from app.models.user import User
from app.schemas.investment import (
    AssetAllocation,
    CityDistribution,
    MonthlyReturn,
    PortfolioProperty,
    PortfolioSummary,
    TransactionRead,
)
from app.services.cache import cache_get, cache_set, make_cache_key
from app.services.xirr import calculate_xirr

router = APIRouter(prefix="/portfolio", tags=["portfolio"])
logger = logging.getLogger(__name__)


@router.get("/summary", response_model=PortfolioSummary)
async def portfolio_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PortfolioSummary:
    """Full portfolio summary with asset allocation and city distribution."""
    # Query property-based investments (legacy)
    result = await db.execute(
        select(Investment).where(
            Investment.user_id == user.id,
            Investment.status == InvestmentStatus.CONFIRMED,
        )
    )
    investments = list(result.scalars().all())

    # Query opportunity-based investments
    opp_result = await db.execute(
        select(OpportunityInvestment).where(
            OpportunityInvestment.user_id == user.id,
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
    )
    opp_investments = list(opp_result.scalars().all())

    if not investments and not opp_investments:
        return PortfolioSummary(
            total_invested=Decimal("0"),
            current_value=Decimal("0"),
            total_returns=Decimal("0"),
            unrealized_gains=Decimal("0"),
            avg_irr=0.0,
            xirr=0.0,
            properties_count=0,
            cities_count=0,
            monthly_income=Decimal("0"),
            asset_allocation=[],
            city_distribution=[],
            monthly_returns=[],
        )

    total_invested = Decimal("0")
    current_value = Decimal("0")
    by_asset: dict[str, Decimal] = defaultdict(Decimal)
    by_city: dict[str, tuple[int, Decimal]] = defaultdict(lambda: (0, Decimal("0")))
    property_ids_set: set = set()
    cities_set: set[str] = set()
    irr_values: list[float] = []

    # Aggregate property-based investments
    if investments:
        property_ids = {inv.property_id for inv in investments}
        prop_result = await db.execute(select(Property).where(Property.id.in_(property_ids)))
        props = {p.id: p for p in prop_result.scalars().all()}

        for inv in investments:
            prop = props.get(inv.property_id)
            total_invested += inv.amount
            unit_val = (prop.current_unit_price or prop.unit_price) if prop else inv.unit_price
            inv_value = inv.units * unit_val
            current_value += inv_value

            if prop:
                property_ids_set.add(prop.id)
                if prop.city:
                    cities_set.add(prop.city)
                asset_key = prop.asset_type.value if prop.asset_type else "Other"
                by_asset[asset_key] += inv.amount
                count, amt = by_city[prop.city]
                by_city[prop.city] = (count + 1, amt + inv.amount)

    # Aggregate opportunity-based investments
    for oi in opp_investments:
        total_invested += oi.amount
        current_value += oi.amount + (oi.returns_amount or Decimal("0"))

    monthly_income = total_invested * Decimal("0.006")

    # Compute XIRR (with Redis cache)
    xirr_cache_key = make_cache_key("xirr", str(user.id), "portfolio")
    xirr_value = cache_get(xirr_cache_key)
    if xirr_value is None:
        cashflows: list[tuple[datetime, float]] = []
        for inv in investments:
            inv_date = inv.created_at or datetime.now(UTC)
            cashflows.append((inv_date, -float(inv.amount)))
        for oi in opp_investments:
            inv_date = oi.invested_at or oi.created_at or datetime.now(UTC)
            cashflows.append((inv_date, -float(oi.amount)))
        if cashflows:
            cashflows.append((datetime.now(UTC), float(current_value)))
        xirr_value = calculate_xirr(cashflows) if len(cashflows) >= 2 else 0.0
        if xirr_value is not None:
            cache_set(xirr_cache_key, xirr_value, ttl_seconds=60)

    # Asset allocation
    asset_alloc = []
    for asset_type, amount in by_asset.items():
        pct = float(amount / total_invested * 100) if total_invested else 0.0
        asset_alloc.append(AssetAllocation(asset_type=asset_type, percentage=pct, amount=amount))

    # City distribution
    city_dist = []
    for city, (count, amount) in by_city.items():
        city_dist.append(CityDistribution(city=city, count=count, amount=amount))

    # Compute derived fields
    total_returns = current_value - total_invested
    unrealized_gains = total_returns  # all gains are unrealized until payout
    properties_count = len(property_ids_set)
    cities_count = len(cities_set)

    return PortfolioSummary(
        total_invested=total_invested,
        current_value=current_value,
        total_returns=total_returns,
        unrealized_gains=unrealized_gains,
        avg_irr=round(xirr_value or 0.0, 2),
        xirr=xirr_value or 0.0,
        properties_count=properties_count,
        cities_count=cities_count,
        monthly_income=monthly_income,
        asset_allocation=asset_alloc,
        city_distribution=city_dist,
        monthly_returns=[],
    )


@router.get("/properties", response_model=list[PortfolioProperty])
async def portfolio_properties(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[PortfolioProperty]:
    """List all properties the user has invested in."""
    result = await db.execute(
        select(Investment).where(
            Investment.user_id == user.id,
            Investment.status == InvestmentStatus.CONFIRMED,
        )
    )
    investments = list(result.scalars().all())

    if not investments:
        return []

    property_ids = {inv.property_id for inv in investments}
    prop_result = await db.execute(select(Property).where(Property.id.in_(property_ids)))
    props = {p.id: p for p in prop_result.scalars().all()}

    # Aggregate per property
    per_prop: dict = defaultdict(lambda: {"units": 0, "invested": Decimal("0"), "inv_count": 0})
    for inv in investments:
        per_prop[inv.property_id]["units"] += inv.units
        per_prop[inv.property_id]["invested"] += inv.amount
        per_prop[inv.property_id]["inv_count"] += 1

    items = []
    for prop_id, agg in per_prop.items():
        prop = props.get(prop_id)
        if not prop:
            continue
        orig_price = prop.unit_price or Decimal("0")
        cur_price = prop.current_unit_price or orig_price
        current_val = agg["units"] * cur_price
        invested = agg["invested"]
        irr = float((current_val - invested) / invested * 100) if invested else 0.0
        appreciation_amt = cur_price - orig_price
        appreciation_pct = float(appreciation_amt / orig_price * 100) if orig_price else 0.0

        items.append(
            PortfolioProperty(
                property_id=prop.id,
                property_name=prop.title,
                city=prop.city,
                asset_type=prop.asset_type.value if prop.asset_type else "Other",
                invested=invested,
                current_value=current_val,
                irr=round(irr, 2),
                units=agg["units"],
                investment_count=agg["inv_count"],
                original_unit_price=orig_price,
                current_unit_price=cur_price,
                appreciation_amount=appreciation_amt,
                appreciation_pct=round(appreciation_pct, 2),
                status=prop.status.value,
            )
        )

    return items


@router.get("/transactions", response_model=list[TransactionRead])
async def portfolio_transactions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
) -> list[TransactionRead]:
    """Recent transactions for the portfolio view."""
    query = (
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return [TransactionRead.model_validate(t) for t in result.scalars().all()]


# ── Property detail endpoint ────────────────────────────────────────────────


class PropertyInvestmentItem(BaseModel):
    investment_id: uuid.UUID
    units: int
    amount: float
    unit_price: float
    invested_at: datetime


class PropertyAppreciationItem(BaseModel):
    id: uuid.UUID
    mode: str
    input_value: float
    old_valuation: float
    new_valuation: float
    note: str | None = None
    created_at: datetime


class PropertyInvestmentDetail(BaseModel):
    property_id: uuid.UUID
    property_name: str
    city: str
    asset_type: str
    original_unit_price: float
    current_unit_price: float
    appreciation_pct: float
    total_invested: float
    current_value: float
    total_units: int
    investment_count: int
    investments: list[PropertyInvestmentItem]
    appreciation_history: list[PropertyAppreciationItem]


@router.get("/properties/{property_id}", response_model=PropertyInvestmentDetail)
async def portfolio_property_detail(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PropertyInvestmentDetail:
    """Full detail of a user's investments in a specific property."""
    from app.models.appreciation_event import AppreciationEvent

    prop = await db.get(Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    result = await db.execute(
        select(Investment).where(
            Investment.user_id == user.id,
            Investment.property_id == property_id,
            Investment.status == InvestmentStatus.CONFIRMED,
        ).order_by(Investment.created_at.desc())
    )
    investments = list(result.scalars().all())

    if not investments:
        raise HTTPException(status_code=404, detail="No investments found for this property")

    orig_price = float(prop.unit_price or 0)
    cur_price = float(prop.current_unit_price or prop.unit_price or 0)
    appreciation_pct = ((cur_price - orig_price) / orig_price * 100) if orig_price else 0.0

    total_units = sum(i.units for i in investments)
    total_invested = float(sum(i.amount for i in investments))
    current_value = total_units * cur_price

    inv_items = [
        PropertyInvestmentItem(
            investment_id=inv.id,
            units=inv.units,
            amount=float(inv.amount),
            unit_price=float(inv.unit_price),
            invested_at=inv.created_at or datetime.now(UTC),
        )
        for inv in investments
    ]

    # Appreciation history
    appr_result = await db.execute(
        select(AppreciationEvent)
        .where(AppreciationEvent.property_id == property_id)
        .order_by(AppreciationEvent.created_at.desc())
    )
    appr_items = [
        PropertyAppreciationItem(
            id=e.id,
            mode=e.mode,
            input_value=float(e.input_value),
            old_valuation=float(e.old_valuation),
            new_valuation=float(e.new_valuation),
            note=e.note,
            created_at=e.created_at,
        )
        for e in appr_result.scalars().all()
    ]

    return PropertyInvestmentDetail(
        property_id=prop.id,
        property_name=prop.title,
        city=prop.city,
        asset_type=prop.asset_type.value if prop.asset_type else "Other",
        original_unit_price=orig_price,
        current_unit_price=cur_price,
        appreciation_pct=round(appreciation_pct, 2),
        total_invested=total_invested,
        current_value=current_value,
        total_units=total_units,
        investment_count=len(investments),
        investments=inv_items,
        appreciation_history=appr_items,
    )


# ── Vault-wise portfolio breakdown ──────────────────────────────────────────


class VaultPortfolioItem(BaseModel):
    vault_type: str
    total_invested: float
    current_value: float
    returns: float
    return_pct: float
    opportunity_count: int
    investor_count: int
    expected_irr: float | None = None
    actual_irr: float | None = None
    avg_duration_days: float


class VaultPortfolioResponse(BaseModel):
    vaults: list[VaultPortfolioItem]
    grand_total_invested: float
    grand_current_value: float
    grand_returns: float
    grand_return_pct: float


@router.get("/vault-wise", response_model=VaultPortfolioResponse)
async def vault_wise_portfolio(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> VaultPortfolioResponse:
    """Vault-wise portfolio breakdown: per-vault invested, returns, IRR, count."""

    # 1. Property-based investments (wealth vault — real estate)
    prop_inv_result = await db.execute(
        select(Investment).where(
            Investment.user_id == user.id,
            Investment.status == InvestmentStatus.CONFIRMED,
        )
    )
    prop_investments = list(prop_inv_result.scalars().all())

    wealth_invested = float(sum(i.amount for i in prop_investments))
    wealth_current = 0.0
    wealth_days_total = 0.0
    now = datetime.now(UTC)

    if prop_investments:
        prop_ids = {i.property_id for i in prop_investments}
        props_r = await db.execute(select(Property).where(Property.id.in_(prop_ids)))
        props = {p.id: p for p in props_r.scalars().all()}
        for inv in prop_investments:
            prop = props.get(inv.property_id)
            unit_val = (prop.current_unit_price or prop.unit_price) if prop else inv.unit_price
            wealth_current += float(inv.units * unit_val)
            days = (now - (inv.created_at or now)).days
            wealth_days_total += days

    # 2. Opportunity-based investments (all vaults)
    opp_inv_result = await db.execute(
        select(OpportunityInvestment, Opportunity.vault_type)
        .join(Opportunity, Opportunity.id == OpportunityInvestment.opportunity_id)
        .where(
            OpportunityInvestment.user_id == user.id,
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
    )
    opp_rows = opp_inv_result.all()

    vault_agg: dict[str, dict] = {}
    for vt in VaultType:
        vault_agg[vt.value] = {
            "invested": 0.0,
            "returns": 0.0,
            "count": set(),
            "days_total": 0.0,
            "inv_count": 0,
        }

    for inv, vault_type in opp_rows:
        vt_val = vault_type.value if isinstance(vault_type, VaultType) else vault_type
        agg = vault_agg.get(vt_val)
        if not agg:
            continue
        agg["invested"] += float(inv.amount)
        agg["returns"] += float(inv.returns_amount or 0)
        agg["count"].add(inv.opportunity_id)
        days = (now - (inv.invested_at or now)).days
        agg["days_total"] += days
        agg["inv_count"] += 1

    # 3. Global vault stats (for expected/actual IRR and investor counts)
    active_statuses = [
        OpportunityStatus.APPROVED,
        OpportunityStatus.ACTIVE,
        OpportunityStatus.FUNDING,
        OpportunityStatus.FUNDED,
    ]
    irr_q = (
        select(Opportunity.vault_type, func.avg(Opportunity.expected_irr).label("avg_irr"))
        .where(Opportunity.expected_irr.isnot(None), Opportunity.status.in_(active_statuses))
        .group_by(Opportunity.vault_type)
    )
    irr_result = await db.execute(irr_q)
    irr_map = {
        row.vault_type.value if isinstance(row.vault_type, VaultType) else row.vault_type: float(
            row.avg_irr
        )
        for row in irr_result.all()
        if row.avg_irr
    }

    # Build vault items
    vaults = []
    grand_invested = 0.0
    grand_current = 0.0

    # Wealth vault combines property + opportunity investments
    w = vault_agg["wealth"]
    w_invested = wealth_invested + w["invested"]
    w_returns = (wealth_current - wealth_invested) + w["returns"]
    w_current = wealth_invested + w_returns if wealth_invested else w["invested"] + w["returns"]
    w_count = len(w["count"]) + (1 if prop_investments else 0)
    all_inv_count = len(prop_investments) + w["inv_count"]
    w_avg_days = (wealth_days_total + w["days_total"]) / all_inv_count if all_inv_count else 0

    vaults.append(
        VaultPortfolioItem(
            vault_type="wealth",
            total_invested=w_invested,
            current_value=w_current,
            returns=w_returns,
            return_pct=round(w_returns / w_invested * 100, 2) if w_invested else 0,
            opportunity_count=w_count,
            investor_count=all_inv_count,
            expected_irr=round(irr_map.get("wealth", 0), 2) if "wealth" in irr_map else None,
            actual_irr=None,
            avg_duration_days=round(w_avg_days, 0),
        )
    )
    grand_invested += w_invested
    grand_current += w_current

    # Opportunity + Community vaults
    for vt in ["opportunity", "community"]:
        a = vault_agg[vt]
        invested = a["invested"]
        returns = a["returns"]
        current = invested + returns
        avg_d = a["days_total"] / a["inv_count"] if a["inv_count"] else 0

        vaults.append(
            VaultPortfolioItem(
                vault_type=vt,
                total_invested=invested,
                current_value=current,
                returns=returns,
                return_pct=round(returns / invested * 100, 2) if invested else 0,
                opportunity_count=len(a["count"]),
                investor_count=a["inv_count"],
                expected_irr=round(irr_map.get(vt, 0), 2) if vt in irr_map else None,
                actual_irr=None,
                avg_duration_days=round(avg_d, 0),
            )
        )
        grand_invested += invested
        grand_current += current

    grand_returns = grand_current - grand_invested

    return VaultPortfolioResponse(
        vaults=vaults,
        grand_total_invested=grand_invested,
        grand_current_value=grand_current,
        grand_returns=grand_returns,
        grand_return_pct=round(grand_returns / grand_invested * 100, 2) if grand_invested else 0,
    )
