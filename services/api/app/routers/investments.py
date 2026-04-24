"""
Investment router – initiate, confirm payment, list.
"""

import logging
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.middleware.audit import log_audit_event
from app.middleware.auth import get_current_user, require_kyc_approved
from app.models.investment import Investment, InvestmentStatus, Transaction, TransactionType
from app.models.property import Property, PropertyStatus
from app.models.user import User
from app.routers.referrals import process_referral_reward_on_investment
from app.schemas.investment import (
    ConfirmPayment,
    InvestmentCreate,
    InvestmentRead,
    InvestmentSummary,
    PaginatedInvestments,
    TransactionRead,
)
from app.services.cache import cache_get, cache_set, make_cache_key
from app.services.payment import verify_payment_signature
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
    total_q = select(func.count()).select_from(Investment).where(Investment.user_id == user.id)
    total = (await db.execute(total_q)).scalar() or 0

    from sqlalchemy.orm import selectinload
    query = (
        base.options(selectinload(Investment.property))
        .order_by(Investment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    investments = result.scalars().all()

    items: list[InvestmentRead] = []
    for inv in investments:
        item = InvestmentRead.model_validate(inv)
        item.property_name = inv.property.title if inv.property else None
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
    from sqlalchemy.orm import selectinload
    confirmed = select(Investment).options(selectinload(Investment.property)).where(
        Investment.user_id == user.id,
        Investment.status == InvestmentStatus.CONFIRMED,
    )
    result = await db.execute(confirmed)
    investments = list(result.scalars().all())

    total_invested = sum((inv.amount for inv in investments), Decimal("0"))

    current_value = Decimal("0")
    property_ids = set()
    for inv in investments:
        current_unit_price = inv.property.unit_price if inv.property else inv.unit_price
        current_value += inv.units * current_unit_price
        if inv.property_id:
            property_ids.add(inv.property_id)

    monthly_income = total_invested * Decimal("0.006")

    # Compute real XIRR from cashflows (with Redis cache)
    xirr_cache_key = make_cache_key("xirr", str(user.id), "inv_summary")
    xirr_value = cache_get(xirr_cache_key)
    if xirr_value is None:
        cashflows: list[tuple[datetime, float]] = []
        for inv in investments:
            inv_date = inv.created_at or datetime.now(UTC)
            cashflows.append((inv_date, -float(inv.amount)))
        if cashflows:
            cashflows.append((datetime.now(UTC), float(current_value)))
        xirr_value = calculate_xirr(cashflows) if len(cashflows) >= 2 else None
        if xirr_value is not None:
            cache_set(xirr_cache_key, xirr_value, ttl_seconds=300)

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
    prop_result = await db.execute(select(Property).where(Property.id == body.property_id))
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
        select(Investment)
        .where(
            Investment.id == body.investment_id,
            Investment.user_id == user.id,
        )
        .with_for_update()
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
        if not verify_payment_signature(
            body.razorpay_order_id,
            body.razorpay_payment_id,
            body.razorpay_signature,
        ):
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
            select(Property)
            .where(Property.id == investment.property_id)
            .with_for_update(of=Property)
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
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Investment)
        .options(selectinload(Investment.property))
        .where(
            Investment.id == investment_id,
            Investment.user_id == user.id,
        )
    )
    investment = result.scalar_one_or_none()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    item = InvestmentRead.model_validate(investment)
    item.property_name = investment.property.title if investment.property else None
    return item
