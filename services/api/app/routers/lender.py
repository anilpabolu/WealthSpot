"""
Lender router – loan management, repayments, dashboard.
"""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.community import Loan, LoanStatus
from app.models.property import Property
from app.models.user import User, UserRole
from app.schemas.lender import (
    LoanCreate,
    LoanRead,
    LoanRepayment,
    LoanSummary,
    PaginatedLoans,
)

router = APIRouter(prefix="/lender", tags=["lender"])


def require_lender(user: User = Depends(get_current_user)) -> User:
    """Dependency: ensure current user has lender role."""
    if user.role != UserRole.LENDER and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Lender or admin access required",
        )
    return user


# ── Dashboard summary ──────────────────────────────────────────────────────


@router.get("/dashboard", response_model=LoanSummary)
async def lender_dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_lender),
) -> LoanSummary:
    """Lender dashboard statistics."""
    base = select(Loan).where(Loan.lender_id == user.id)

    result = await db.execute(base)
    loans = result.scalars().all()

    active = [l for l in loans if l.status == LoanStatus.ACTIVE]
    total_lent = sum(l.principal for l in loans)
    _total_repaid = sum(l.amount_repaid for l in loans)
    # Simplified interest earned = repaid - principal for repaid loans
    total_interest = sum(
        max(0, l.amount_repaid - l.principal)
        for l in loans
        if l.status == LoanStatus.REPAID
    )

    return LoanSummary(
        active_loans=len(active),
        total_lent=Decimal(total_lent) / 100,  # paise → rupees
        total_interest_earned=Decimal(total_interest) / 100,
        upcoming_payments=len([l for l in active if l.next_payment_date]),
    )


# ── List loans ─────────────────────────────────────────────────────────────


@router.get("/loans", response_model=PaginatedLoans)
async def list_loans(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_lender),
    status_filter: LoanStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
) -> PaginatedLoans:
    """List lender's loans with optional status filter."""
    base = select(Loan).where(Loan.lender_id == user.id)
    if status_filter:
        base = base.where(Loan.status == status_filter)

    total_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(total_q)).scalar() or 0

    query = base.order_by(Loan.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    loans = result.scalars().all()

    items: list[LoanRead] = []
    for loan in loans:
        prop_result = await db.execute(
            select(Property.title, Property.city).where(Property.id == loan.property_id)
        )
        prop = prop_result.one_or_none()
        item = LoanRead.model_validate(loan)
        if prop:
            item.property_title = prop.title
            item.property_city = prop.city
        items.append(item)

    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedLoans(items=items, total=total, page=page, total_pages=total_pages)


# ── Create loan ────────────────────────────────────────────────────────────


@router.post("/loans", response_model=LoanRead, status_code=status.HTTP_201_CREATED)
async def create_loan(
    payload: LoanCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_lender),
) -> LoanRead:
    """Create a new loan against a property."""
    # Verify property exists and is in funding status
    prop_result = await db.execute(select(Property).where(Property.id == payload.property_id))
    prop = prop_result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    loan = Loan(
        lender_id=user.id,
        property_id=payload.property_id,
        principal=payload.principal,
        interest_rate=payload.interest_rate,
        tenure_months=payload.tenure_months,
    )
    db.add(loan)
    await db.commit()
    await db.refresh(loan)

    return LoanRead.model_validate(loan)


# ── Get single loan ───────────────────────────────────────────────────────


@router.get("/loans/{loan_id}", response_model=LoanRead)
async def get_loan(
    loan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_lender),
) -> LoanRead:
    """Get a specific loan detail."""
    result = await db.execute(
        select(Loan).where(Loan.id == loan_id, Loan.lender_id == user.id)
    )
    loan = result.scalar_one_or_none()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    prop_result = await db.execute(
        select(Property.title, Property.city).where(Property.id == loan.property_id)
    )
    prop = prop_result.one_or_none()
    item = LoanRead.model_validate(loan)
    if prop:
        item.property_title = prop.title
        item.property_city = prop.city

    return item


# ── Record repayment ──────────────────────────────────────────────────────


@router.post("/loans/{loan_id}/repay", response_model=LoanRead)
async def record_repayment(
    loan_id: uuid.UUID,
    payload: LoanRepayment,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_lender),
) -> LoanRead:
    """Record a repayment against a loan."""
    result = await db.execute(
        select(Loan).where(Loan.id == loan_id, Loan.lender_id == user.id)
    )
    loan = result.scalar_one_or_none()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.status != LoanStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Loan is not active")

    loan.amount_repaid += payload.amount
    if loan.amount_repaid >= loan.principal:
        loan.status = LoanStatus.REPAID

    await db.commit()
    await db.refresh(loan)

    return LoanRead.model_validate(loan)
