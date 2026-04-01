"""
Approvals router – list, review, filter approval requests.
"""

import math
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.approval import ApprovalCategory, ApprovalPriority, ApprovalRequest, ApprovalStatus
from app.models.company import Company, VerificationStatus
from app.models.opportunity import Opportunity, OpportunityStatus
from app.models.user import KycStatus, User, UserRole
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalRead,
    ApprovalReviewRequest,
    PaginatedApprovals,
)
from app.services.notification import create_notification

router = APIRouter(prefix="/approvals", tags=["approvals"])

# Roles that can review approvals
approver_dep = require_role(UserRole.ADMIN, UserRole.APPROVER, UserRole.SUPER_ADMIN)


@router.get("", response_model=PaginatedApprovals)
async def list_approvals(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(approver_dep),
    category: ApprovalCategory | None = Query(None),
    status: ApprovalStatus | None = Query(None),
    priority: ApprovalPriority | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedApprovals:
    """List approval requests with filters (admin/approver/super_admin only)."""
    query = select(ApprovalRequest)
    count_query = select(func.count(ApprovalRequest.id))

    if category:
        query = query.where(ApprovalRequest.category == category)
        count_query = count_query.where(ApprovalRequest.category == category)
    if status:
        query = query.where(ApprovalRequest.status == status)
        count_query = count_query.where(ApprovalRequest.status == status)
    if priority:
        query = query.where(ApprovalRequest.priority == priority)
        count_query = count_query.where(ApprovalRequest.priority == priority)

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = max(1, math.ceil(total / page_size))

    query = query.order_by(ApprovalRequest.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [ApprovalRead.model_validate(r) for r in result.scalars().all()]

    return PaginatedApprovals(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/my", response_model=PaginatedApprovals)
async def my_approvals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PaginatedApprovals:
    """Get current user's own approval requests with pagination."""
    base = select(ApprovalRequest).where(ApprovalRequest.requester_id == user.id)

    total = (await db.execute(
        select(func.count()).select_from(base.subquery())
    )).scalar() or 0
    total_pages = math.ceil(total / page_size) if total else 0

    result = await db.execute(
        base.order_by(ApprovalRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [ApprovalRead.model_validate(r) for r in result.scalars().all()]

    return PaginatedApprovals(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=ApprovalRead)
async def create_approval(
    body: ApprovalCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ApprovalRead:
    """Create a new approval request."""
    approval = ApprovalRequest(
        requester_id=user.id,
        category=body.category,
        title=body.title,
        description=body.description,
        priority=body.priority,
        resource_type=body.resource_type,
        resource_id=body.resource_id,
        payload=body.payload,
    )
    db.add(approval)
    await db.flush()
    await db.refresh(approval)
    return ApprovalRead.model_validate(approval)


@router.post("/{approval_id}/review", response_model=ApprovalRead)
async def review_approval(
    approval_id: str,
    body: ApprovalReviewRequest,
    db: AsyncSession = Depends(get_db),
    reviewer: User = Depends(approver_dep),
) -> ApprovalRead:
    """Approve or reject an approval request. Syncs linked opportunity status."""
    import uuid as _uuid
    result = await db.execute(
        select(ApprovalRequest).where(ApprovalRequest.id == _uuid.UUID(approval_id))
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.status not in (ApprovalStatus.PENDING, ApprovalStatus.IN_REVIEW):
        raise HTTPException(status_code=400, detail="This request has already been processed")

    now = datetime.now(timezone.utc)
    approval.reviewer_id = reviewer.id
    approval.review_note = body.review_note
    approval.reviewed_at = now

    if body.action == "approve":
        approval.status = ApprovalStatus.APPROVED

        # Sync linked opportunity status to APPROVED
        if approval.resource_type == "opportunity" and approval.resource_id:
            opp_result = await db.execute(
                select(Opportunity).where(Opportunity.id == _uuid.UUID(approval.resource_id))
            )
            opp = opp_result.scalar_one_or_none()
            if opp and opp.status == OpportunityStatus.PENDING_APPROVAL:
                opp.status = OpportunityStatus.APPROVED

        # Sync linked company to verified
        if approval.resource_type == "company" and approval.resource_id:
            comp_result = await db.execute(
                select(Company).where(Company.id == _uuid.UUID(approval.resource_id))
            )
            comp = comp_result.scalar_one_or_none()
            if comp:
                comp.verified = True
                comp.verification_status = VerificationStatus.VERIFIED

        # Sync linked KYC status to APPROVED
        if approval.resource_type == "kyc" and approval.resource_id:
            from app.models.user import User as UserModel
            kyc_user_result = await db.execute(
                select(UserModel).where(UserModel.id == _uuid.UUID(approval.resource_id))
            )
            kyc_user = kyc_user_result.scalar_one_or_none()
            if kyc_user:
                kyc_user.kyc_status = KycStatus.APPROVED

        await create_notification(
            db,
            user_id=approval.requester_id,
            type="approval_approved",
            title="Request Approved",
            body=f'Your request "{approval.title}" has been approved.',
            data={"approval_id": str(approval.id), "category": approval.category},
        )
    else:
        approval.status = ApprovalStatus.REJECTED
        note = body.review_note or "No reason provided."

        # Sync linked opportunity status to REJECTED
        if approval.resource_type == "opportunity" and approval.resource_id:
            opp_result = await db.execute(
                select(Opportunity).where(Opportunity.id == _uuid.UUID(approval.resource_id))
            )
            opp = opp_result.scalar_one_or_none()
            if opp and opp.status == OpportunityStatus.PENDING_APPROVAL:
                opp.status = OpportunityStatus.REJECTED

        # Sync linked company to rejected
        if approval.resource_type == "company" and approval.resource_id:
            comp_result = await db.execute(
                select(Company).where(Company.id == _uuid.UUID(approval.resource_id))
            )
            comp = comp_result.scalar_one_or_none()
            if comp:
                comp.verification_status = VerificationStatus.REJECTED

        # Sync linked KYC status to REJECTED
        if approval.resource_type == "kyc" and approval.resource_id:
            from app.models.user import User as UserModel
            kyc_user_result = await db.execute(
                select(UserModel).where(UserModel.id == _uuid.UUID(approval.resource_id))
            )
            kyc_user = kyc_user_result.scalar_one_or_none()
            if kyc_user:
                kyc_user.kyc_status = KycStatus.REJECTED

        await create_notification(
            db,
            user_id=approval.requester_id,
            type="approval_rejected",
            title="Request Rejected",
            body=f'Your request "{approval.title}" was rejected. Reason: {note}',
            data={"approval_id": str(approval.id), "category": approval.category},
        )

    await db.flush()
    await db.refresh(approval)
    return ApprovalRead.model_validate(approval)


@router.get("/stats")
async def approval_stats(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(approver_dep),
) -> dict[str, Any]:
    """Get approval stats for dashboard."""
    pending = (await db.execute(
        select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == ApprovalStatus.PENDING)
    )).scalar() or 0
    in_review = (await db.execute(
        select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == ApprovalStatus.IN_REVIEW)
    )).scalar() or 0
    approved = (await db.execute(
        select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == ApprovalStatus.APPROVED)
    )).scalar() or 0
    rejected = (await db.execute(
        select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == ApprovalStatus.REJECTED)
    )).scalar() or 0

    return {
        "pending": pending,
        "in_review": in_review,
        "approved": approved,
        "rejected": rejected,
        "total": pending + in_review + approved + rejected,
    }
