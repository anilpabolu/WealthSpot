"""
Portfolio router – summary, properties, transactions for the investor dashboard.
"""

import logging
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.investment import Investment, InvestmentStatus, Transaction
from app.models.opportunity import Opportunity, OpportunityStatus, VaultType
from app.models.opportunity_investment import OpportunityInvestment, OppInvestmentStatus
from app.models.property import Property
from app.models.user import User
from app.schemas.investment import (
    AssetAllocation,
    CityDistribution,
    PortfolioProperty,
    PortfolioSummary,
    TransactionRead,
)
from app.services.xirr import calculate_xirr

router = APIRouter(prefix="/portfolio", tags=["portfolio"])
logger = logging.getLogger(__name__)


@router.get("/summary", response_model=PortfolioSummary)
async def portfolio_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PortfolioSummary:
    """Full portfolio summary with asset allocation and city distribution."""
    result = await db.execute(
        select(Investment).where(
            Investment.user_id == user.id,
            Investment.status == InvestmentStatus.CONFIRMED,
        )
    )
    investments = list(result.scalars().all())

    if not investments:
        return PortfolioSummary(
            total_invested=Decimal("0"),
            current_value=Decimal("0"),
            xirr=0.0,
            monthly_income=Decimal("0"),
            asset_allocation=[],
            city_distribution=[],
        )

    # Batch-load property info
    property_ids = {inv.property_id for inv in investments}
    prop_result = await db.execute(
        select(Property).where(Property.id.in_(property_ids))
    )
    props = {p.id: p for p in prop_result.scalars().all()}

    total_invested = Decimal("0")
    current_value = Decimal("0")
    by_asset: dict[str, Decimal] = defaultdict(Decimal)
    by_city: dict[str, tuple[int, Decimal]] = defaultdict(lambda: (0, Decimal("0")))

    for inv in investments:
        prop = props.get(inv.property_id)
        total_invested += inv.amount
        unit_val = prop.unit_price if prop else inv.unit_price
        inv_value = inv.units * unit_val
        current_value += inv_value

        if prop:
            asset_key = prop.asset_type.value if prop.asset_type else "Other"
            by_asset[asset_key] += inv.amount
            count, amt = by_city[prop.city]
            by_city[prop.city] = (count + 1, amt + inv.amount)

    monthly_income = total_invested * Decimal("0.006")

    # Compute XIRR
    cashflows: list[tuple[datetime, float]] = []
    for inv in investments:
        inv_date = inv.created_at or datetime.now(timezone.utc)
        cashflows.append((inv_date, -float(inv.amount)))
    if cashflows:
        cashflows.append((datetime.now(timezone.utc), float(current_value)))
    xirr_value = calculate_xirr(cashflows) if len(cashflows) >= 2 else 0.0

    # Asset allocation
    asset_alloc = []
    for asset_type, amount in by_asset.items():
        pct = float(amount / total_invested * 100) if total_invested else 0.0
        asset_alloc.append(AssetAllocation(asset_type=asset_type, percentage=pct, amount=amount))

    # City distribution
    city_dist = []
    for city, (count, amount) in by_city.items():
        city_dist.append(CityDistribution(city=city, count=count, amount=amount))

    return PortfolioSummary(
        total_invested=total_invested,
        current_value=current_value,
        xirr=xirr_value or 0.0,
        monthly_income=monthly_income,
        asset_allocation=asset_alloc,
        city_distribution=city_dist,
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
    prop_result = await db.execute(
        select(Property).where(Property.id.in_(property_ids))
    )
    props = {p.id: p for p in prop_result.scalars().all()}

    # Aggregate per property
    per_prop: dict = defaultdict(lambda: {"units": 0, "invested": Decimal("0")})
    for inv in investments:
        per_prop[inv.property_id]["units"] += inv.units
        per_prop[inv.property_id]["invested"] += inv.amount

    items = []
    for prop_id, agg in per_prop.items():
        prop = props.get(prop_id)
        if not prop:
            continue
        current_val = agg["units"] * prop.unit_price
        invested = agg["invested"]
        irr = float((current_val - invested) / invested * 100) if invested else 0.0

        items.append(PortfolioProperty(
            property_id=prop.id,
            property_name=prop.title,
            city=prop.city,
            asset_type=prop.asset_type.value if prop.asset_type else "Other",
            invested=invested,
            current_value=current_val,
            irr=round(irr, 2),
            units=agg["units"],
            status=prop.status.value,
        ))

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
    now = datetime.now(timezone.utc)

    if prop_investments:
        prop_ids = {i.property_id for i in prop_investments}
        props_r = await db.execute(select(Property).where(Property.id.in_(prop_ids)))
        props = {p.id: p for p in props_r.scalars().all()}
        for inv in prop_investments:
            prop = props.get(inv.property_id)
            unit_val = prop.unit_price if prop else inv.unit_price
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
            "invested": 0.0, "returns": 0.0, "count": set(),
            "days_total": 0.0, "inv_count": 0,
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
        OpportunityStatus.APPROVED, OpportunityStatus.ACTIVE,
        OpportunityStatus.FUNDING, OpportunityStatus.FUNDED,
    ]
    irr_q = (
        select(Opportunity.vault_type, func.avg(Opportunity.expected_irr).label("avg_irr"))
        .where(Opportunity.expected_irr.isnot(None), Opportunity.status.in_(active_statuses))
        .group_by(Opportunity.vault_type)
    )
    irr_result = await db.execute(irr_q)
    irr_map = {row.vault_type.value if isinstance(row.vault_type, VaultType) else row.vault_type: float(row.avg_irr) for row in irr_result.all() if row.avg_irr}

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

    vaults.append(VaultPortfolioItem(
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
    ))
    grand_invested += w_invested
    grand_current += w_current

    # Opportunity + Community vaults
    for vt in ["opportunity", "community"]:
        a = vault_agg[vt]
        invested = a["invested"]
        returns = a["returns"]
        current = invested + returns
        avg_d = a["days_total"] / a["inv_count"] if a["inv_count"] else 0

        vaults.append(VaultPortfolioItem(
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
        ))
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
