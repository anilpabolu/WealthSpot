"""
Investment router – initiate, confirm payment, list.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_kyc_approved
from app.middleware.audit import log_audit_event
from app.models.investment import Investment, InvestmentStatus, Transaction, TransactionType
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

router = APIRouter(prefix="/investments", tags=["investments"])


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

    items: list[InvestmentRead] = []
    for inv in investments:
        prop_result = await db.execute(select(Property.title).where(Property.id == inv.property_id))
        prop_name = prop_result.scalar_one_or_none()
        item = InvestmentRead.model_validate(inv)
        item.property_name = prop_name
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
    # Simplified valuation – in production this would use market data
    current_value = total_invested * Decimal("1.08")
    monthly_income = total_invested * Decimal("0.006")

    property_ids = {inv.property_id for inv in investments}

    return InvestmentSummary(
        total_invested=total_invested,
        current_value=current_value,
        total_returns=current_value - total_invested,
        xirr=8.2,  # Would be calculated from actual cash flows
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
        )
    )
    investment = result.scalar_one_or_none()

    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    if investment.status != InvestmentStatus.PAYMENT_PENDING:
        raise HTTPException(status_code=400, detail="Invalid investment state")

    # TODO: verify Razorpay signature in production
    investment.status = InvestmentStatus.CONFIRMED
    investment.razorpay_payment_id = body.razorpay_payment_id
    investment.razorpay_order_id = body.razorpay_order_id

    # Update property raised amount & sold units
    prop_result = await db.execute(
        select(Property).where(Property.id == investment.property_id)
    )
    prop = prop_result.scalar_one_or_none()
    if prop:
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
