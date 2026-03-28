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
from app.models.opportunity_investment import OpportunityInvestment, OppInvestmentStatus
from app.models.user import User, UserRole
from app.schemas.opportunity import (
    OpportunityCreateRequest,
    OpportunityRead,
    OpportunityUpdateRequest,
    PaginatedOpportunities,
    VaultStatsResponse,
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


# ── Vault-level aggregated stats ────────────────────────────────────────────

def _compute_irr(investments: list, total_invested: float) -> float | None:
    """Compute a simplified actual IRR from investment returns."""
    if not investments or total_invested <= 0:
        return None
    total_returns = float(sum(inv.returns_amount or 0 for inv in investments))
    if total_returns <= 0:
        return None
    now = datetime.now(timezone.utc)
    avg_days = sum(
        (now - inv.invested_at).days for inv in investments if inv.invested_at
    ) / len(investments)
    years = max(avg_days / 365.25, 0.25)
    return_ratio = total_returns / total_invested
    irr = ((1 + return_ratio) ** (1 / years) - 1) * 100
    return round(irr, 2)


@router.get("/vault-stats", response_model=list[VaultStatsResponse])
async def vault_stats(
    db: AsyncSession = Depends(get_db),
) -> list[VaultStatsResponse]:
    """Return aggregated stats per vault (total invested, investor count, IRR)."""
    results = []
    for vt in VaultType:
        opp_q = select(Opportunity.id).where(
            Opportunity.vault_type == vt,
            Opportunity.status.in_([
                OpportunityStatus.APPROVED,
                OpportunityStatus.ACTIVE,
                OpportunityStatus.FUNDING,
                OpportunityStatus.FUNDED,
            ]),
        )
        opp_ids_result = await db.execute(opp_q)
        opp_ids = [r[0] for r in opp_ids_result.fetchall()]

        opp_count = len(opp_ids)
        total_invested = 0.0
        investor_count = 0
        actual_irr = None

        if opp_ids:
            agg = await db.execute(
                select(
                    func.coalesce(func.sum(OpportunityInvestment.amount), 0),
                    func.count(func.distinct(OpportunityInvestment.user_id)),
                ).where(
                    OpportunityInvestment.opportunity_id.in_(opp_ids),
                    OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
                )
            )
            row = agg.first()
            if row:
                total_invested = float(row[0])
                investor_count = int(row[1])

            inv_result = await db.execute(
                select(OpportunityInvestment).where(
                    OpportunityInvestment.opportunity_id.in_(opp_ids),
                    OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
                )
            )
            all_investments = list(inv_result.scalars().all())
            actual_irr = _compute_irr(all_investments, total_invested)

        exp_irr_result = await db.execute(
            select(func.avg(Opportunity.expected_irr)).where(
                Opportunity.vault_type == vt,
                Opportunity.expected_irr.isnot(None),
            )
        )
        avg_expected = exp_irr_result.scalar()

        results.append(VaultStatsResponse(
            vault_type=vt.value,
            total_invested=total_invested,
            investor_count=investor_count,
            opportunity_count=opp_count,
            expected_irr=round(float(avg_expected), 2) if avg_expected else None,
            actual_irr=actual_irr,
        ))

    return results


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

    if is_creator and opp.status not in (OpportunityStatus.DRAFT, OpportunityStatus.PENDING_APPROVAL):
        raise HTTPException(status_code=400, detail="Cannot edit opportunity in current status")

    # Apply partial update
    update_data = body.model_dump(exclude_unset=True)
    for field_name, value in update_data.items():
        if field_name == "company_id" and value:
            setattr(opp, field_name, _uuid.UUID(value))
        else:
            setattr(opp, field_name, value)

    await db.flush()
    await db.refresh(opp)
    return OpportunityRead.model_validate(opp)
