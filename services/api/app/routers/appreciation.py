"""
Appreciation router – apply valuation appreciation and view history.
"""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.appreciation_event import AppreciationEvent
from app.models.opportunity import Opportunity
from app.models.opportunity_investment import OpportunityInvestment, OppInvestmentStatus
from app.models.user import User, UserRole
from app.schemas.appreciation import AppreciationCreateRequest, AppreciationEventRead

router = APIRouter(prefix="/opportunities", tags=["appreciation"])


def _event_to_read(event: AppreciationEvent) -> AppreciationEventRead:
    """Convert model to read schema with creator_name populated."""
    return AppreciationEventRead(
        id=event.id,
        opportunity_id=event.opportunity_id,
        created_by=event.created_by,
        creator_name=event.creator.full_name if event.creator else None,
        mode=event.mode,
        input_value=float(event.input_value),
        old_valuation=float(event.old_valuation),
        new_valuation=float(event.new_valuation),
        note=event.note,
        created_at=event.created_at,
    )


@router.post("/{opportunity_id}/appreciate", response_model=AppreciationEventRead)
async def appreciate_opportunity(
    opportunity_id: uuid.UUID,
    body: AppreciationCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(
        UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPROVER, UserRole.BUILDER,
    )),
):
    """Apply a valuation appreciation to an opportunity.

    Admin/approver can appreciate any deal.
    Builders can only appreciate their own deals.
    """
    opp = await db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Builder can only appreciate own deals
    if (
        not user.has_role(UserRole.SUPER_ADMIN.value)
        and not user.has_role(UserRole.ADMIN.value)
        and not user.has_role(UserRole.APPROVER.value)
        and opp.creator_id != user.id
    ):
        raise HTTPException(status_code=403, detail="You can only appreciate your own deals")

    # Calculate new valuation
    old_val = opp.current_valuation or opp.raised_amount or Decimal("0")
    old_val = Decimal(str(old_val))

    if body.mode == "percentage":
        new_val = old_val * (1 + Decimal(str(body.value)) / 100)
    else:  # absolute
        new_val = old_val + Decimal(str(body.value))

    new_val = new_val.quantize(Decimal("0.01"))

    # Log appreciation event
    event = AppreciationEvent(
        opportunity_id=opp.id,
        created_by=user.id,
        mode=body.mode,
        input_value=Decimal(str(body.value)),
        old_valuation=old_val,
        new_valuation=new_val,
        note=body.note,
    )
    db.add(event)

    # Update opportunity valuation
    opp.current_valuation = new_val

    # Recalculate all investor returns proportionally
    total_invested = Decimal(str(opp.raised_amount or 0))
    if total_invested > 0:
        appreciation_amount = new_val - total_invested
        result = await db.execute(
            select(OpportunityInvestment).where(
                OpportunityInvestment.opportunity_id == opp.id,
                OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
            )
        )
        for inv in result.scalars().all():
            share = (Decimal(str(inv.amount)) / total_invested) * appreciation_amount
            inv.returns_amount = share.quantize(Decimal("0.01"))

    # Update actual_irr on opportunity
    if total_invested > 0:
        opp.actual_irr = Decimal(
            str(float((new_val - total_invested) / total_invested * 100))
        ).quantize(Decimal("0.01"))

    await db.flush()
    await db.refresh(event)
    # Eager-load creator for response
    await db.refresh(event, ["creator"])

    return _event_to_read(event)


@router.get("/{opportunity_id}/appreciation-history", response_model=list[AppreciationEventRead])
async def appreciation_history(
    opportunity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List all appreciation events for an opportunity (newest first)."""
    result = await db.execute(
        select(AppreciationEvent)
        .where(AppreciationEvent.opportunity_id == opportunity_id)
        .order_by(AppreciationEvent.created_at.desc())
    )
    return [_event_to_read(e) for e in result.scalars().all()]
