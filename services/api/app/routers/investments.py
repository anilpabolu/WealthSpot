"""
Investment router – initiate, confirm payment, list.
"""

import hashlib
import hmac
import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.middleware.auth import get_current_user, require_kyc_approved
from app.middleware.audit import log_audit_event
from app.models.investment import Investment, InvestmentStatus, Transaction, TransactionType
from app.routers.referrals import process_referral_reward_on_investment
from app.models.property import Property, PropertyStatus
from app.models.user import User
from app.schemas.investment import (
    ConfirmPayment,
    InvestmentCreate,
    InvestmentRead,
    InvestmentSummary,
    PaginatedInvestments,
    TransactionRead,
)
from app.services.xirr import calculate_xirr

router = APIRouter(prefix="/investments", tags=["investments"])
settings = get_settings()
logger = logging.getLogger(__name__)


@router.get("", response_model=PaginatedInvestments)
async def list_investments(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
) -> PaginatedInvestments:
    """List user's investments."""
    base = select(Investment).where(Investment.user_id == user.id)
    total_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(total_q)).scalar() or 0

    query = base.order_by(Investment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    investments = result.scalars().all()

    # Batch-load property names to avoid N+1
    property_ids = {inv.property_id for inv in investments}
    prop_map: dict = {}
    if property_ids:
        prop_result = await db.execute(
            select(Property.id, Property.title).where(Property.id.in_(property_ids))
        )
        prop_map = {row.id: row.title for row in prop_result.fetchall()}

    items: list[InvestmentRead] = []
    for inv in investments:
        item = InvestmentRead.model_validate(inv)
        item.property_name = prop_map.get(inv.property_id)
        items.append(item)

    return PaginatedInvestments(
        investments=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/summary", response_model=InvestmentSummary)
async def investment_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> InvestmentSummary:
    """Aggregated investment summary for dashboard."""
    confirmed = select(Investment).where(
        Investment.user_id == user.id,
        Investment.status == InvestmentStatus.CONFIRMED,
    )
    result = await db.execute(confirmed)
    investments = list(result.scalars().all())

    total_invested = sum((inv.amount for inv in investments), Decimal("0"))
    # Compute current value from property-level valuations or NAV
    # For now use each property's current unit_price vs purchase price
    property_ids = {inv.property_id for inv in investments}
    prop_map: dict = {}
    if property_ids:
        prop_result = await db.execute(
            select(Property.id, Property.unit_price).where(Property.id.in_(property_ids))
        )
        prop_map = {row.id: row.unit_price for row in prop_result.fetchall()}

    current_value = Decimal("0")
    for inv in investments:
        current_unit_price = prop_map.get(inv.property_id, inv.unit_price)
        current_value += inv.units * current_unit_price

    monthly_income = total_invested * Decimal("0.006")

    # Compute real XIRR from cashflows
    cashflows: list[tuple[datetime, float]] = []
    for inv in investments:
        # Investment outflow (negative)
        inv_date = inv.created_at or datetime.now(timezone.utc)
        cashflows.append((inv_date, -float(inv.amount)))
    # Current portfolio value as inflow (positive)
    if cashflows:
        cashflows.append((datetime.now(timezone.utc), float(current_value)))

    xirr_value = calculate_xirr(cashflows) if len(cashflows) >= 2 else None

    return InvestmentSummary(
        total_invested=total_invested,
        current_value=current_value,
        total_returns=current_value - total_invested,
        xirr=xirr_value or 0.0,
        properties_count=len(property_ids),
        monthly_income=monthly_income,
    )


@router.post("", response_model=InvestmentRead, status_code=status.HTTP_201_CREATED)
async def initiate_investment(
    body: InvestmentCreate,
    request: Request,
    user: User = Depends(require_kyc_approved),
    db: AsyncSession = Depends(get_db),
) -> InvestmentRead:
    """Initiate an investment (KYC approved required)."""
    # Validate property
    prop_result = await db.execute(
        select(Property).where(Property.id == body.property_id)
    )
    prop = prop_result.scalar_one_or_none()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.status not in (PropertyStatus.ACTIVE, PropertyStatus.FUNDING):
        raise HTTPException(status_code=400, detail="Property not accepting investments")
    if body.amount < prop.min_investment:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum investment is ₹{prop.min_investment}",
        )
    if body.units > (prop.total_units - prop.sold_units):
        raise HTTPException(status_code=400, detail="Not enough units available")

    investment = Investment(
        user_id=user.id,
        property_id=prop.id,
        units=body.units,
        amount=body.amount,
        unit_price=prop.unit_price,
        status=InvestmentStatus.PAYMENT_PENDING,
    )
    db.add(investment)
    await db.flush()

    await log_audit_event(
        actor_id=user.id,
        action="investment.initiated",
        resource_type="investment",
        resource_id=str(investment.id),
        details={"property_id": str(prop.id), "amount": str(body.amount)},
        request=request,
    )

    return InvestmentRead.model_validate(investment)


@router.post("/confirm-payment", response_model=InvestmentRead)
async def confirm_payment(
    body: ConfirmPayment,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InvestmentRead:
    """Confirm payment after Razorpay callback."""
    result = await db.execute(
        select(Investment).where(
            Investment.id == body.investment_id,
            Investment.user_id == user.id,
        ).with_for_update()
    )
    investment = result.scalar_one_or_none()

    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    if investment.status != InvestmentStatus.PAYMENT_PENDING:
        raise HTTPException(status_code=400, detail="Invalid investment state")

    # Verify Razorpay signature – mandatory when secret is configured
    if settings.razorpay_key_secret:
        if not body.razorpay_signature:
            raise HTTPException(status_code=400, detail="Payment signature is required")
        sign_payload = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
        expected = hmac.new(
            settings.razorpay_key_secret.encode("utf-8"),
            sign_payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, body.razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Atomic: update investment + property in a savepoint
    async with db.begin_nested():
        investment.status = InvestmentStatus.CONFIRMED
        investment.razorpay_payment_id = body.razorpay_payment_id
        investment.razorpay_order_id = body.razorpay_order_id

        # Update property raised amount & sold units (with row-level lock to prevent overselling)
        # Use of=Property to lock only the properties table row; avoids PostgreSQL restriction
        # on FOR UPDATE applied to the nullable side of an outer join.
        prop_result = await db.execute(
            select(Property).where(Property.id == investment.property_id).with_for_update(of=Property)
        )
        prop = prop_result.scalar_one_or_none()
        if prop:
            if prop.sold_units + investment.units > prop.total_units:
                raise HTTPException(status_code=400, detail="Units no longer available")
            prop.raised_amount += investment.amount
            prop.sold_units += investment.units
            prop.investor_count += 1
            if prop.raised_amount >= prop.target_amount:
                prop.status = PropertyStatus.FUNDED

        # Create transaction record
        txn = Transaction(
            investment_id=investment.id,
            user_id=user.id,
            type=TransactionType.INVESTMENT,
            amount=investment.amount,
            description=f"Investment in {prop.title if prop else 'property'}",
            reference_id=body.razorpay_payment_id,
        )
        db.add(txn)

    await db.flush()

    await log_audit_event(
        actor_id=user.id,
        action="investment.confirmed",
        resource_type="investment",
        resource_id=str(investment.id),
        details={"razorpay_payment_id": body.razorpay_payment_id},
        request=request,
    )

    # Trigger referral reward on first investment
    await process_referral_reward_on_investment(db, user.id, investment.id)

    return InvestmentRead.model_validate(investment)


@router.get("/transactions", response_model=list[TransactionRead])
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
) -> list[TransactionRead]:
    """Recent transactions for the logged-in user."""
    query = (
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return [TransactionRead.model_validate(t) for t in result.scalars().all()]


@router.get("/{investment_id}", response_model=InvestmentRead)
async def get_investment(
    investment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> InvestmentRead:
    """Get a single investment by ID."""
    result = await db.execute(
        select(Investment).where(
            Investment.id == investment_id,
            Investment.user_id == user.id,
        )
    )
    investment = result.scalar_one_or_none()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    prop_result = await db.execute(
        select(Property.title).where(Property.id == investment.property_id)
    )
    prop_row = prop_result.one_or_none()
    item = InvestmentRead.model_validate(investment)
    if prop_row:
        item.property_name = prop_row.title
    return item
