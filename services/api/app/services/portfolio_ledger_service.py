import uuid
from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.investment import Investment, InvestmentStatus
from app.models.investment_ledger import (
    InvestmentLedgerCollateral,
    InvestmentLedgerEntry,
)
from app.models.opportunity import Opportunity, OpportunityStatus
from app.models.opportunity_investment import OppInvestmentStatus, OpportunityInvestment
from app.models.property import Property, PropertyStatus


# Helpers
def _dec(v: float | None) -> Decimal | None:
    if v is None:
        return None
    try:
        return Decimal(str(v))
    except (InvalidOperation, ValueError):
        return None


def _f(v: Decimal | None) -> float | None:
    return float(v) if v is not None else None


def _derive_opp_code(opp: Opportunity) -> str:
    return f"OPP-{str(opp.id)[:8].upper()}"


def _derive_prop_code(prop: Property) -> str:
    return f"PROP-{str(prop.id)[:8].upper()}"


def _coalesce(saved: object | None, default: object | None) -> object | None:
    return saved if saved is not None else default


def apply_ledger_fields(entry: InvestmentLedgerEntry, fields) -> None:
    entry.registered_name = fields.registered_name
    entry.opportunity_code = fields.opportunity_code
    entry.status = fields.status
    entry.configuration = fields.configuration
    entry.base_value = _dec(fields.base_value)
    entry.gst = _dec(fields.gst)
    entry.gst_paid = fields.gst_paid
    entry.total_value = _dec(fields.total_value)
    entry.referred_by = fields.referred_by
    entry.type_of_investment = fields.type_of_investment
    entry.extra_sqft = _dec(fields.extra_sqft)
    entry.sweep_on_oc_loan = _dec(fields.sweep_on_oc_loan)
    entry.latest_updates = fields.latest_updates


def rebuild_ledger_collateral(entry: InvestmentLedgerEntry, rows) -> None:
    entry.collateral.clear()
    for idx, c in enumerate(rows):
        entry.collateral.append(
            InvestmentLedgerCollateral(
                project=c.project,
                unit_no=c.unit_no,
                configuration=c.configuration,
                sbua=_dec(c.sbua),
                unit_cost=_dec(c.unit_cost),
                sort_order=idx,
            )
        )


async def get_owned_ledger_entry(
    entry_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> InvestmentLedgerEntry | None:
    entry_r = await db.execute(
        select(InvestmentLedgerEntry)
        .where(
            InvestmentLedgerEntry.id == entry_id,
            InvestmentLedgerEntry.user_id == user_id,
        )
        .options(
            selectinload(InvestmentLedgerEntry.collateral),
            selectinload(InvestmentLedgerEntry.documents),
        )
    )
    return entry_r.scalars().first()


async def get_asset_options(db: AsyncSession):
    opp_r = await db.execute(
        select(Opportunity)
        .where(Opportunity.status.notin_([OpportunityStatus.DRAFT, OpportunityStatus.REJECTED]))
        .order_by(Opportunity.created_at.desc())
        .limit(500)
    )
    opportunities = opp_r.scalars().all()

    prop_r = await db.execute(
        select(Property)
        .where(Property.status != PropertyStatus.ARCHIVED)
        .order_by(Property.created_at.desc())
        .limit(500)
    )
    properties = prop_r.scalars().all()

    return opportunities, properties


async def get_merged_ledger_rows(user_id: uuid.UUID, db: AsyncSession):
    entries_r = await db.execute(
        select(InvestmentLedgerEntry)
        .where(InvestmentLedgerEntry.user_id == user_id)
        .options(
            selectinload(InvestmentLedgerEntry.collateral),
            selectinload(InvestmentLedgerEntry.documents),
        )
    )
    entries = list(entries_r.scalars().all())
    overlay_by_opp: dict[uuid.UUID, InvestmentLedgerEntry] = {}
    overlay_by_leg: dict[uuid.UUID, InvestmentLedgerEntry] = {}
    manual_entries: list[InvestmentLedgerEntry] = []

    for e in entries:
        if e.opportunity_investment_id is not None:
            overlay_by_opp[e.opportunity_investment_id] = e
        elif e.legacy_investment_id is not None:
            overlay_by_leg[e.legacy_investment_id] = e
        else:
            manual_entries.append(e)

    opp_rows = (
        await db.execute(
            select(OpportunityInvestment, Opportunity)
            .join(Opportunity, Opportunity.id == OpportunityInvestment.opportunity_id)
            .where(
                OpportunityInvestment.user_id == user_id,
                OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
            )
            .order_by(OpportunityInvestment.invested_at.desc())
        )
    ).all()

    leg_rows = (
        await db.execute(
            select(Investment, Property)
            .join(Property, Property.id == Investment.property_id)
            .where(
                Investment.user_id == user_id,
                Investment.status == InvestmentStatus.CONFIRMED,
            )
            .order_by(Investment.created_at.desc())
        )
    ).all()

    manual_opp_ids = {e.opportunity_id for e in manual_entries if e.opportunity_id}
    manual_prop_ids = {e.property_id for e in manual_entries if e.property_id}
    opp_titles: dict[uuid.UUID, str] = {}
    prop_titles: dict[uuid.UUID, str] = {}

    if manual_opp_ids:
        r = await db.execute(
            select(Opportunity.id, Opportunity.title).where(Opportunity.id.in_(manual_opp_ids))
        )
        opp_titles = {row.id: row.title for row in r.all()}
    if manual_prop_ids:
        r = await db.execute(
            select(Property.id, Property.title).where(Property.id.in_(manual_prop_ids))
        )
        prop_titles = {row.id: row.title for row in r.all()}

    return {
        "overlay_by_opp": overlay_by_opp,
        "overlay_by_leg": overlay_by_leg,
        "manual_entries": manual_entries,
        "opp_rows": opp_rows,
        "leg_rows": leg_rows,
        "opp_titles": opp_titles,
        "prop_titles": prop_titles,
    }
