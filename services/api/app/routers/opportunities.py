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
from app.middleware.auth import get_current_user, get_optional_user
from app.models.approval import ApprovalCategory, ApprovalRequest
from app.models.opportunity import Opportunity, OpportunityStatus, VaultType
from app.models.opportunity_investment import OpportunityInvestment, OppInvestmentStatus
from app.models.opportunity_like import OpportunityLike, UserActivity
from app.models.property_referral import PropertyReferralCode
from app.models.user import User, UserRole
from app.schemas.opportunity import (
    OpportunityCreateRequest,
    OpportunityRead,
    OpportunityUpdateRequest,
    PaginatedOpportunities,
    VaultStatsResponse,
)

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
    community_subtype: str | None = Query(None, description="Filter community opportunities: co_investor or co_partner"),
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
    if community_subtype:
        query = query.where(Opportunity.community_subtype == community_subtype)
        count_query = count_query.where(Opportunity.community_subtype == community_subtype)

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
    active_statuses = [
        OpportunityStatus.APPROVED,
        OpportunityStatus.ACTIVE,
        OpportunityStatus.FUNDING,
        OpportunityStatus.FUNDED,
    ]

    # Single aggregation query for counts + investment stats per vault type
    agg_q = (
        select(
            Opportunity.vault_type,
            func.count(func.distinct(Opportunity.id)).label("opp_count"),
            func.coalesce(func.sum(OpportunityInvestment.amount), 0).label("total_invested"),
            func.count(func.distinct(OpportunityInvestment.user_id)).label("investor_count"),
        )
        .outerjoin(
            OpportunityInvestment,
            (OpportunityInvestment.opportunity_id == Opportunity.id)
            & (OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED),
        )
        .where(Opportunity.status.in_(active_statuses))
        .group_by(Opportunity.vault_type)
    )
    agg_result = await db.execute(agg_q)
    agg_rows = {row.vault_type: row for row in agg_result.fetchall()}

    # Average expected IRR per vault type
    irr_q = (
        select(
            Opportunity.vault_type,
            func.avg(Opportunity.expected_irr).label("avg_irr"),
        )
        .where(Opportunity.expected_irr.isnot(None))
        .group_by(Opportunity.vault_type)
    )
    irr_result = await db.execute(irr_q)
    irr_map = {row.vault_type: row.avg_irr for row in irr_result.fetchall()}

    # Compute actual IRR per vault type — single query for ALL vault types
    actual_irr_map: dict[VaultType, float | None] = {}
    inv_q = (
        select(OpportunityInvestment, Opportunity.vault_type)
        .join(Opportunity, Opportunity.id == OpportunityInvestment.opportunity_id)
        .where(
            Opportunity.status.in_(active_statuses),
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
    )
    inv_result = await db.execute(inv_q)
    inv_by_vault: dict[VaultType, list] = {vt: [] for vt in VaultType}
    for inv, vault_type in inv_result.all():
        inv_by_vault[vault_type].append(inv)
    for vt in VaultType:
        agg_row = agg_rows.get(vt)
        total = float(agg_row.total_invested) if agg_row else 0.0
        actual_irr_map[vt] = _compute_irr(inv_by_vault[vt], total) if total > 0 else None

    results = []
    for vt in VaultType:
        agg_row = agg_rows.get(vt)
        results.append(VaultStatsResponse(
            vault_type=vt.value,
            total_invested=float(agg_row.total_invested) if agg_row else 0.0,
            investor_count=int(agg_row.investor_count) if agg_row else 0,
            opportunity_count=int(agg_row.opp_count) if agg_row else 0,
            expected_irr=round(float(irr_map[vt]), 2) if vt in irr_map and irr_map[vt] else None,
            actual_irr=actual_irr_map.get(vt),
        ))

    return results


@router.get("/by-slug/{slug}", response_model=OpportunityRead)
async def get_opportunity_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> OpportunityRead:
    """Fetch a single opportunity by its URL slug."""
    result = await db.execute(
        select(Opportunity).where(Opportunity.slug == slug)
    )
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return OpportunityRead.model_validate(opp)


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
    # Validate community_subtype for community vault
    if body.vault_type == VaultType.COMMUNITY:
        if not body.community_subtype or body.community_subtype not in ("co_investor", "co_partner"):
            raise HTTPException(
                status_code=422,
                detail="community_subtype is required for Community Vault (co_investor or co_partner)",
            )

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
        community_subtype=body.community_subtype,
        community_details=body.community_details,
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


# ── Like toggle ──────────────────────────────────────────────────────────────


@router.post("/{opportunity_id}/like")
async def toggle_like(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Toggle like on an opportunity. Returns new liked state and total count."""
    opp_uuid = _uuid.UUID(opportunity_id)

    # Verify opportunity exists
    opp_result = await db.execute(
        select(Opportunity).where(Opportunity.id == opp_uuid)
    )
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Check existing like
    existing = await db.execute(
        select(OpportunityLike).where(
            OpportunityLike.opportunity_id == opp_uuid,
            OpportunityLike.user_id == user.id,
        )
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        liked = False
        activity_type = "unliked"
    else:
        db.add(OpportunityLike(opportunity_id=opp_uuid, user_id=user.id))
        liked = True
        activity_type = "liked"

    # Record activity
    db.add(UserActivity(
        user_id=user.id,
        activity_type=activity_type,
        resource_type="opportunity",
        resource_id=opp_uuid,
        resource_title=opp.title,
        resource_slug=opp.slug,
    ))
    await db.flush()

    # Total like count
    count_result = await db.execute(
        select(func.count(OpportunityLike.id)).where(
            OpportunityLike.opportunity_id == opp_uuid
        )
    )
    like_count = count_result.scalar() or 0

    return {"liked": liked, "like_count": like_count}


@router.get("/{opportunity_id}/like-status")
async def like_status(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> dict:
    """Check if current user liked this opportunity + total count."""
    opp_uuid = _uuid.UUID(opportunity_id)

    count_result = await db.execute(
        select(func.count(OpportunityLike.id)).where(
            OpportunityLike.opportunity_id == opp_uuid
        )
    )
    like_count = count_result.scalar() or 0

    liked = False
    if user:
        existing = await db.execute(
            select(OpportunityLike.id).where(
                OpportunityLike.opportunity_id == opp_uuid,
                OpportunityLike.user_id == user.id,
            )
        )
        liked = existing.scalar_one_or_none() is not None

    return {"liked": liked, "like_count": like_count}


# ── Share tracking ───────────────────────────────────────────────────────────


@router.post("/{opportunity_id}/share")
async def track_share(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Record a share event and return the property referral code for this user+opportunity."""
    opp_uuid = _uuid.UUID(opportunity_id)

    opp_result = await db.execute(
        select(Opportunity).where(Opportunity.id == opp_uuid)
    )
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Record share activity
    db.add(UserActivity(
        user_id=user.id,
        activity_type="shared",
        resource_type="opportunity",
        resource_id=opp_uuid,
        resource_title=opp.title,
        resource_slug=opp.slug,
    ))

    # Get or create property referral code
    existing = await db.execute(
        select(PropertyReferralCode).where(
            PropertyReferralCode.user_id == user.id,
            PropertyReferralCode.opportunity_id == opp_uuid,
        )
    )
    prc = existing.scalar_one_or_none()

    if not prc:
        code = f"P{_uuid.uuid4().hex[:7].upper()}"
        prc = PropertyReferralCode(
            user_id=user.id,
            opportunity_id=opp_uuid,
            code=code,
        )
        db.add(prc)
        await db.flush()
        await db.refresh(prc)

    return {
        "message": "Share recorded",
        "property_referral_code": prc.code,
        "referral_link": f"https://wealthspot.in/opportunity/{opp.slug}?pref={prc.code}",
    }


# ── Get or create property referral code ─────────────────────────────────────


@router.get("/{opportunity_id}/referral-code")
async def get_property_referral_code(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Get the static property referral code for this user+opportunity (creates if needed)."""
    opp_uuid = _uuid.UUID(opportunity_id)

    opp_result = await db.execute(
        select(Opportunity).where(Opportunity.id == opp_uuid)
    )
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    existing = await db.execute(
        select(PropertyReferralCode).where(
            PropertyReferralCode.user_id == user.id,
            PropertyReferralCode.opportunity_id == opp_uuid,
        )
    )
    prc = existing.scalar_one_or_none()

    if not prc:
        code = f"P{_uuid.uuid4().hex[:7].upper()}"
        prc = PropertyReferralCode(
            user_id=user.id,
            opportunity_id=opp_uuid,
            code=code,
        )
        db.add(prc)
        await db.flush()
        await db.refresh(prc)

    return {
        "code": prc.code,
        "referral_link": f"https://wealthspot.in/opportunity/{opp.slug}?pref={prc.code}",
    }


# ── User activities feed ─────────────────────────────────────────────────────


@router.get("/user/activities")
async def user_activities(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
) -> list[dict]:
    """Return user's activity feed (liked, shared, invested, etc.)."""
    result = await db.execute(
        select(UserActivity)
        .where(UserActivity.user_id == user.id)
        .order_by(UserActivity.created_at.desc())
        .limit(limit)
    )
    activities = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "activityType": a.activity_type,
            "resourceType": a.resource_type,
            "resourceId": str(a.resource_id),
            "resourceTitle": a.resource_title,
            "resourceSlug": a.resource_slug,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
        }
        for a in activities
    ]
