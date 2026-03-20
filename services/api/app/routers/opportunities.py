"""
Opportunities router – create, list, manage multi-vault opportunities.
"""

import math
import re
import uuid as _uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.approval import ApprovalCategory, ApprovalRequest, ApprovalStatus
from app.models.opportunity import Opportunity, OpportunityStatus, VaultType
from app.models.user import User, UserRole
from app.schemas.opportunity import (
    OpportunityCreateRequest,
    OpportunityRead,
    PaginatedOpportunities,
)
from app.services.notification import create_notification

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
    vault_type: VaultType | None = Query(None),
    status: OpportunityStatus | None = Query(None),
    city: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedOpportunities:
    """List opportunities (public / marketplace-facing)."""
    query = select(Opportunity)
    count_query = select(func.count(Opportunity.id))

    if vault_type:
        query = query.where(Opportunity.vault_type == vault_type)
        count_query = count_query.where(Opportunity.vault_type == vault_type)
    if status:
        query = query.where(Opportunity.status == status)
        count_query = count_query.where(Opportunity.status == status)
    if city:
        query = query.where(Opportunity.city == city)
        count_query = count_query.where(Opportunity.city == city)

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = max(1, math.ceil(total / page_size))

    query = query.order_by(Opportunity.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [OpportunityRead.model_validate(r) for r in result.scalars().all()]

    return PaginatedOpportunities(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


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
    # Determine approval category based on vault type
    category_map = {
        VaultType.WEALTH: ApprovalCategory.PROPERTY_LISTING,
        VaultType.OPPORTUNITY: ApprovalCategory.OPPORTUNITY_LISTING,
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
        VaultType.OPPORTUNITY: UserRole.FOUNDER,
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
