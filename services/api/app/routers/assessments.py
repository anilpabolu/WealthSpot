"""
Assessments router — the WealthSpot Shield surface for an opportunity.

Endpoints:
    GET    /opportunities/{id}/assessments                       (public, gated docs)
    PUT    /opportunities/{id}/assessments/bulk                  (creator)
    POST   /opportunities/{id}/assessments/{subcode}/review      (admin/super_admin)
    POST   /opportunities/{id}/risks                             (admin/super_admin)
    DELETE /opportunities/{id}/risks/{risk_id}                   (admin/super_admin)
"""

from __future__ import annotations

import uuid as _uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.assessments import (
    ASSESSMENT_CATEGORIES,
    CERTIFIED_STATUSES,
    AssessmentStatus,
    find_subitem,
    total_subitem_count,
)
from app.core.database import get_db
from app.middleware.auth import get_current_user, get_optional_user, require_role
from app.models.expression_of_interest import EOIStatus, ExpressionOfInterest
from app.models.opportunity import Opportunity
from app.models.opportunity_assessment import (
    OpportunityAssessment,
    OpportunityRiskFlag,
)
from app.models.opportunity_media import OpportunityMedia
from app.models.user import User, UserRole
from app.schemas.assessment import (
    AssessmentBulkUpdateRequest,
    AssessmentCategoryRead,
    AssessmentDocumentRead,
    AssessmentReviewRequest,
    AssessmentSubItemRead,
    AssessmentSummaryRead,
    OpportunityRiskFlagCreate,
    OpportunityRiskFlagRead,
)

router = APIRouter(prefix="/opportunities", tags=["assessments"])

admin_dep = require_role(UserRole.ADMIN, UserRole.APPROVER, UserRole.SUPER_ADMIN)


# ─── Helpers ────────────────────────────────────────────────────────────────


def _eoi_approved_statuses() -> set[str]:
    """EOI statuses that count as "admin-approved" for doc-download gating.

    Any pipeline stage past SUBMITTED means a super-admin moved the EOI
    forward, which is the user's gating rule.
    """
    return {
        EOIStatus.BUILDER_CONNECTED.value,
        EOIStatus.DEAL_IN_PROGRESS.value,
        EOIStatus.PAYMENT_DONE.value,
        EOIStatus.DEAL_COMPLETED.value,
        EOIStatus.TOKEN_PAID.value,
    }


async def _user_has_eoi_approval(
    db: AsyncSession, user_id: _uuid.UUID, opportunity_id: _uuid.UUID
) -> bool:
    result = await db.execute(
        select(ExpressionOfInterest.status).where(
            ExpressionOfInterest.user_id == user_id,
            ExpressionOfInterest.opportunity_id == opportunity_id,
        )
    )
    statuses = [row[0] for row in result.all()]
    approved = _eoi_approved_statuses()
    for s in statuses:
        s_val = s.value if hasattr(s, "value") else str(s)
        if s_val in approved:
            return True
    return False


def _category_status_for(children_statuses: list[str]) -> str:
    """Roll up sub-item statuses into a category status."""
    if not children_statuses:
        return AssessmentStatus.NOT_STARTED.value
    if any(s == AssessmentStatus.FLAGGED.value for s in children_statuses):
        return AssessmentStatus.FLAGGED.value
    if all(s in CERTIFIED_STATUSES for s in children_statuses):
        return AssessmentStatus.PASSED.value
    if all(s == AssessmentStatus.NOT_STARTED.value for s in children_statuses):
        return AssessmentStatus.NOT_STARTED.value
    return AssessmentStatus.IN_PROGRESS.value


def _overall_status(categories: list[AssessmentCategoryRead]) -> tuple[str, bool]:
    """Return (overall_status, is_certified)."""
    statuses = [c.status for c in categories]
    if all(s == AssessmentStatus.NOT_STARTED.value for s in statuses):
        return "not_started", False
    if all(s == AssessmentStatus.PASSED.value for s in statuses):
        return "certified", True
    if any(s == AssessmentStatus.FLAGGED.value for s in statuses):
        return "in_review", False
    return "partial", False


async def _load_summary(
    db: AsyncSession,
    opportunity_id: _uuid.UUID,
    viewer: User | None,
) -> AssessmentSummaryRead:
    # Fetch existing rows
    rows = (
        (
            await db.execute(
                select(OpportunityAssessment).where(
                    OpportunityAssessment.opportunity_id == opportunity_id
                )
            )
        )
        .scalars()
        .all()
    )
    by_sub: dict[str, OpportunityAssessment] = {r.subcategory_code: r for r in rows}

    # Evidence media (media_type='document' + assessment codes populated)
    media_rows = (
        (
            await db.execute(
                select(OpportunityMedia).where(
                    OpportunityMedia.opportunity_id == opportunity_id,
                    OpportunityMedia.assessment_subcategory_code.is_not(None),
                )
            )
        )
        .scalars()
        .all()
    )
    media_by_sub: dict[str, list[OpportunityMedia]] = {}
    for m in media_rows:
        media_by_sub.setdefault(m.assessment_subcategory_code, []).append(m)

    # Determine viewer access
    is_privileged = False
    viewer_has_eoi = False
    if viewer is not None:
        if viewer.role in (UserRole.ADMIN, UserRole.APPROVER, UserRole.SUPER_ADMIN):
            is_privileged = True
        else:
            # Creator of the opportunity also gets full access
            opp_creator = (
                await db.execute(
                    select(Opportunity.creator_id).where(Opportunity.id == opportunity_id)
                )
            ).scalar_one_or_none()
            if opp_creator == viewer.id:
                is_privileged = True
            else:
                viewer_has_eoi = await _user_has_eoi_approval(db, viewer.id, opportunity_id)

    categories: list[AssessmentCategoryRead] = []
    total_passed = 0
    total_slots = 0

    for cat in ASSESSMENT_CATEGORIES:
        sub_reads: list[AssessmentSubItemRead] = []
        child_statuses: list[str] = []
        for sub in cat.sub_items:
            total_slots += 1
            row = by_sub.get(sub.code)
            status_val = row.status if row else AssessmentStatus.NOT_STARTED.value
            child_statuses.append(status_val)
            if status_val == AssessmentStatus.PASSED.value:
                total_passed += 1

            docs: list[AssessmentDocumentRead] = []
            for m in media_by_sub.get(sub.code, []):
                # Gating rule: sensitive docs + non-privileged viewer without
                # EOI approval → locked (no URL exposed).
                locked = sub.sensitive_document and not is_privileged and not viewer_has_eoi
                docs.append(
                    AssessmentDocumentRead(
                        id=str(m.id),
                        filename=m.filename,
                        content_type=m.content_type,
                        size_bytes=m.size_bytes,
                        url=None if locked else m.url,
                        locked=locked,
                    )
                )

            sub_reads.append(
                AssessmentSubItemRead(
                    code=sub.code,
                    label=sub.label,
                    status=status_val,
                    has_evidence=bool(docs),
                    risk_severity=row.risk_severity if row else None,
                    reviewer_note=row.reviewer_note if row else None,
                    documents=docs,
                    builder_answer=row.builder_answer if row else None,
                    reviewed_at=row.reviewed_at if row else None,
                )
            )

        passed_in_cat = sum(1 for s in child_statuses if s == AssessmentStatus.PASSED.value)
        categories.append(
            AssessmentCategoryRead(
                code=cat.code,
                status=_category_status_for(child_statuses),
                passed_count=passed_in_cat,
                total_count=len(cat.sub_items),
                sub_items=sub_reads,
            )
        )

    overall_status, certified = _overall_status(categories)

    # Risk flags
    risk_rows = (
        (
            await db.execute(
                select(OpportunityRiskFlag)
                .where(OpportunityRiskFlag.opportunity_id == opportunity_id)
                .order_by(OpportunityRiskFlag.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    return AssessmentSummaryRead(
        opportunity_id=opportunity_id,
        overall=overall_status,
        passed_count=total_passed,
        total_count=total_slots,
        certified=certified,
        categories=categories,
        risks=[OpportunityRiskFlagRead.model_validate(r) for r in risk_rows],
    )


# ─── Endpoints ──────────────────────────────────────────────────────────────


@router.get("/{opportunity_id}/assessments", response_model=AssessmentSummaryRead)
async def get_opportunity_assessments(
    opportunity_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> AssessmentSummaryRead:
    opp_id = _uuid.UUID(opportunity_id)
    opp = await db.get(Opportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return await _load_summary(db, opp_id, viewer)


@router.put(
    "/{opportunity_id}/assessments/bulk",
    response_model=AssessmentSummaryRead,
)
async def bulk_save_assessments(
    opportunity_id: str,
    body: AssessmentBulkUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AssessmentSummaryRead:
    opp_id = _uuid.UUID(opportunity_id)
    opp = await db.get(Opportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.APPROVER)
    if opp.creator_id != user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not your opportunity")

    for item in body.items:
        sub = find_subitem(item.category_code, item.subcategory_code)
        if sub is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unknown assessment sub-item {item.category_code}/{item.subcategory_code}"
                ),
            )
        # Upsert
        existing = (
            await db.execute(
                select(OpportunityAssessment).where(
                    OpportunityAssessment.opportunity_id == opp_id,
                    OpportunityAssessment.subcategory_code == item.subcategory_code,
                )
            )
        ).scalar_one_or_none()
        if existing:
            existing.builder_answer = item.builder_answer
            # Once passed/flagged by admin we do not drop back to in_progress
            if existing.status == AssessmentStatus.NOT_STARTED.value:
                existing.status = AssessmentStatus.IN_PROGRESS.value
        else:
            db.add(
                OpportunityAssessment(
                    opportunity_id=opp_id,
                    category_code=item.category_code,
                    subcategory_code=item.subcategory_code,
                    status=AssessmentStatus.IN_PROGRESS.value,
                    builder_answer=item.builder_answer,
                )
            )

    await db.commit()
    return await _load_summary(db, opp_id, user)


@router.post(
    "/{opportunity_id}/assessments/{subcategory_code}/review",
    response_model=AssessmentSummaryRead,
)
async def review_assessment(
    opportunity_id: str,
    subcategory_code: str,
    body: AssessmentReviewRequest,
    db: AsyncSession = Depends(get_db),
    reviewer: User = Depends(admin_dep),
) -> AssessmentSummaryRead:
    opp_id = _uuid.UUID(opportunity_id)
    sub = None
    for cat in ASSESSMENT_CATEGORIES:
        for s in cat.sub_items:
            if s.code == subcategory_code:
                sub = s
                category_code = cat.code
                break
        if sub:
            break
    if sub is None:
        raise HTTPException(status_code=400, detail="Unknown sub-item")

    existing = (
        await db.execute(
            select(OpportunityAssessment).where(
                OpportunityAssessment.opportunity_id == opp_id,
                OpportunityAssessment.subcategory_code == subcategory_code,
            )
        )
    ).scalar_one_or_none()

    action_to_status = {
        "pass": AssessmentStatus.PASSED.value,
        "flag": AssessmentStatus.FLAGGED.value,
        "na": AssessmentStatus.NOT_APPLICABLE.value,
    }
    new_status = action_to_status[body.action]

    now = datetime.now(UTC)
    if existing:
        existing.status = new_status
        existing.reviewer_note = body.reviewer_note
        existing.risk_severity = body.risk_severity if body.action == "flag" else None
        existing.reviewed_by = reviewer.id
        existing.reviewed_at = now
    else:
        db.add(
            OpportunityAssessment(
                opportunity_id=opp_id,
                category_code=category_code,
                subcategory_code=subcategory_code,
                status=new_status,
                reviewer_note=body.reviewer_note,
                risk_severity=body.risk_severity if body.action == "flag" else None,
                reviewed_by=reviewer.id,
                reviewed_at=now,
            )
        )

    await db.commit()
    return await _load_summary(db, opp_id, reviewer)


@router.post("/{opportunity_id}/risks", response_model=OpportunityRiskFlagRead, status_code=201)
async def create_risk_flag(
    opportunity_id: str,
    body: OpportunityRiskFlagCreate,
    db: AsyncSession = Depends(get_db),
    reviewer: User = Depends(admin_dep),
) -> OpportunityRiskFlagRead:
    opp_id = _uuid.UUID(opportunity_id)
    opp = await db.get(Opportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    flag = OpportunityRiskFlag(
        opportunity_id=opp_id,
        label=body.label,
        severity=body.severity,
        note=body.note,
        created_by=reviewer.id,
    )
    db.add(flag)
    await db.commit()
    await db.refresh(flag)
    return OpportunityRiskFlagRead.model_validate(flag)


@router.delete("/{opportunity_id}/risks/{risk_id}")
async def delete_risk_flag(
    opportunity_id: str,
    risk_id: str,
    db: AsyncSession = Depends(get_db),
    reviewer: User = Depends(admin_dep),
) -> dict:
    opp_id = _uuid.UUID(opportunity_id)
    risk_uuid = _uuid.UUID(risk_id)
    row = (
        await db.execute(
            select(OpportunityRiskFlag).where(
                OpportunityRiskFlag.id == risk_uuid,
                OpportunityRiskFlag.opportunity_id == opp_id,
            )
        )
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Risk flag not found")
    await db.delete(row)
    await db.commit()
    return {"deleted": True, "id": risk_id}


# ─── Helpers used by other routers ──────────────────────────────────────────


async def compute_completion(db: AsyncSession, opportunity_id: _uuid.UUID) -> tuple[int, int, bool]:
    """Return (passed_count, total_count, is_certified) for an opportunity."""
    rows = (
        await db.execute(
            select(OpportunityAssessment.status).where(
                OpportunityAssessment.opportunity_id == opportunity_id
            )
        )
    ).all()
    statuses = [r[0] for r in rows]
    total = total_subitem_count()
    passed = sum(1 for s in statuses if s == AssessmentStatus.PASSED.value)
    # Certified if every expected slot has a passed/NA row
    certified_count = sum(1 for s in statuses if s in CERTIFIED_STATUSES)
    is_certified = certified_count == total
    return passed, total, is_certified


async def any_incomplete(db: AsyncSession, opportunity_id: _uuid.UUID) -> bool:
    """True if any required sub-item is still not_started / in_progress / flagged."""
    rows = (
        await db.execute(
            select(
                OpportunityAssessment.subcategory_code,
                OpportunityAssessment.status,
            ).where(OpportunityAssessment.opportunity_id == opportunity_id)
        )
    ).all()
    status_by_sub = {sub: st for sub, st in rows}
    for cat in ASSESSMENT_CATEGORIES:
        for sub in cat.sub_items:
            st = status_by_sub.get(sub.code, AssessmentStatus.NOT_STARTED.value)
            if st not in CERTIFIED_STATUSES:
                return True
    return False
