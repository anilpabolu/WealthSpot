"""
EOI router – Expression of Interest, Builder Questions, Communication Mappings.
"""

import math
import uuid as _uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.builder_question import BuilderQuestion, EOIQuestionAnswer
from app.models.comm_mapping import OpportunityCommMapping
from app.models.community import Referral
from app.models.eoi_stage_history import EoiStageHistory
from app.models.expression_of_interest import EOIStatus, ExpressionOfInterest
from app.models.notification import NotificationType
from app.models.opportunity import Opportunity
from app.models.opportunity_investment import OpportunityInvestment, OppInvestmentStatus
from app.models.user import User, UserRole
from app.schemas.eoi import (
    BuilderQuestionCreate,
    BuilderQuestionRead,
    BuilderQuestionUpdate,
    CommMappingCreate,
    CommMappingRead,
    EOICreate,
    EOIRead,
    PaginatedEOIs,
)
from app.services.notification import create_notification

router = APIRouter(prefix="/eoi", tags=["eoi"])


# ═══════════════════════════════════════════════════════════════════════════════
# Expression of Interest CRUD
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=EOIRead)
async def submit_eoi(
    body: EOICreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EOIRead:
    """Submit an expression of interest for an opportunity."""
    # Verify opportunity exists and is active
    opp_result = await db.execute(
        select(Opportunity).where(Opportunity.id == _uuid.UUID(body.opportunity_id))
    )
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.status.value == "closed":
        raise HTTPException(status_code=400, detail="This opportunity is closed")

    # Check for existing EOI (one per user per property)
    existing_result = await db.execute(
        select(ExpressionOfInterest).where(
            ExpressionOfInterest.user_id == user.id,
            ExpressionOfInterest.opportunity_id == opp.id,
        )
    )
    existing_eoi = existing_result.scalar_one_or_none()

    if existing_eoi:
        # Update timestamp only – keep all other details as-is
        existing_eoi.updated_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(existing_eoi)
        return EOIRead.model_validate(existing_eoi)

    # Look up who referred this user (if anyone)
    ref_result = await db.execute(
        select(Referral.referrer_id)
        .where(Referral.referee_id == user.id)
        .order_by(Referral.created_at.desc())
        .limit(1)
    )
    referrer_id = ref_result.scalar_one_or_none()

    # Create EOI
    eoi = ExpressionOfInterest(
        user_id=user.id,
        opportunity_id=opp.id,
        investment_amount=body.investment_amount,
        num_units=body.num_units,
        investment_timeline=body.investment_timeline,
        funding_source=body.funding_source,
        purpose=body.purpose,
        preferred_contact=body.preferred_contact,
        best_time_to_contact=body.best_time_to_contact,
        communication_consent=body.communication_consent,
        additional_notes=body.additional_notes,
        status=EOIStatus.SUBMITTED,
        referrer_id=referrer_id,
    )
    db.add(eoi)
    await db.flush()

    # Record initial stage history
    db.add(EoiStageHistory(
        eoi_id=eoi.id,
        status=EOIStatus.SUBMITTED.value,
        changed_by=user.id,
    ))

    # Save builder question answers
    for ans in body.answers:
        answer = EOIQuestionAnswer(
            eoi_id=eoi.id,
            question_id=_uuid.UUID(ans.question_id),
            answer_text=ans.answer_text,
        )
        db.add(answer)
    await db.flush()

    # Notify comm mapping recipients (builder, handler, admin)
    mapping_result = await db.execute(
        select(OpportunityCommMapping).where(
            OpportunityCommMapping.opportunity_id == opp.id
        )
    )
    mappings = mapping_result.scalars().all()
    investor_name = user.full_name or user.email or "An investor"

    for mapping in mappings:
        await create_notification(
            db,
            user_id=mapping.user_id,
            type=NotificationType.EXPRESSION_OF_INTEREST,
            title=f"New Expression of Interest – {opp.title}",
            body=f"{investor_name} has expressed interest in '{opp.title}'.",
            data={
                "eoi_id": str(eoi.id),
                "opportunity_id": str(opp.id),
                "opportunity_title": opp.title,
                "investor_name": investor_name,
            },
        )

    # Also notify the opportunity creator if not in comm mappings
    comm_user_ids = {m.user_id for m in mappings}
    if opp.creator_id not in comm_user_ids:
        await create_notification(
            db,
            user_id=opp.creator_id,
            type=NotificationType.EXPRESSION_OF_INTEREST,
            title=f"New Expression of Interest – {opp.title}",
            body=f"{investor_name} has expressed interest in '{opp.title}'.",
            data={
                "eoi_id": str(eoi.id),
                "opportunity_id": str(opp.id),
                "opportunity_title": opp.title,
            },
        )

    await db.flush()
    await db.refresh(eoi)
    return EOIRead.model_validate(eoi)


@router.get("", response_model=PaginatedEOIs)
async def list_eois(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    opportunity_id: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedEOIs:
    """List EOIs – admin/builder sees all for their opportunities, investor sees own."""
    query = select(ExpressionOfInterest)
    count_query = select(func.count(ExpressionOfInterest.id))

    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)

    if opportunity_id:
        opp_uuid = _uuid.UUID(opportunity_id)
        query = query.where(ExpressionOfInterest.opportunity_id == opp_uuid)
        count_query = count_query.where(ExpressionOfInterest.opportunity_id == opp_uuid)

    if not is_admin:
        # Non-admin users only see their own EOIs
        query = query.where(ExpressionOfInterest.user_id == user.id)
        count_query = count_query.where(ExpressionOfInterest.user_id == user.id)

    if status:
        query = query.where(ExpressionOfInterest.status == status)
        count_query = count_query.where(ExpressionOfInterest.status == status)

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = max(1, math.ceil(total / page_size))

    query = query.order_by(ExpressionOfInterest.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [EOIRead.model_validate(r) for r in result.scalars().all()]

    return PaginatedEOIs(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{eoi_id}", response_model=EOIRead)
async def get_eoi(
    eoi_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EOIRead:
    """Get a single EOI by ID."""
    result = await db.execute(
        select(ExpressionOfInterest).where(
            ExpressionOfInterest.id == _uuid.UUID(eoi_id)
        )
    )
    eoi = result.scalar_one_or_none()
    if not eoi:
        raise HTTPException(status_code=404, detail="EOI not found")

    # Only the submitter or admin can view
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if eoi.user_id != user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    return EOIRead.model_validate(eoi)


@router.post("/{eoi_id}/connect", response_model=EOIRead)
async def connect_with_builder(
    eoi_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EOIRead:
    """Investor requests to connect with builder after EOI submission."""
    result = await db.execute(
        select(ExpressionOfInterest).where(
            ExpressionOfInterest.id == _uuid.UUID(eoi_id)
        )
    )
    eoi = result.scalar_one_or_none()
    if not eoi:
        raise HTTPException(status_code=404, detail="EOI not found")
    if eoi.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    eoi.status = EOIStatus.BUILDER_CONNECTED
    db.add(EoiStageHistory(
        eoi_id=eoi.id,
        status=EOIStatus.BUILDER_CONNECTED.value,
        changed_by=user.id,
    ))
    await db.flush()

    # Notify builder and comm mapping users
    opp = eoi.opportunity
    investor_name = user.full_name or user.email or "An investor"

    mapping_result = await db.execute(
        select(OpportunityCommMapping).where(
            OpportunityCommMapping.opportunity_id == opp.id
        )
    )
    for mapping in mapping_result.scalars().all():
        await create_notification(
            db,
            user_id=mapping.user_id,
            type=NotificationType.BUILDER_CONNECT,
            title=f"Builder Connect Request – {opp.title}",
            body=f"{investor_name} wants to connect regarding '{opp.title}'.",
            data={
                "eoi_id": str(eoi.id),
                "opportunity_id": str(opp.id),
                "investor_name": investor_name,
            },
        )

    await db.refresh(eoi)
    return EOIRead.model_validate(eoi)


# ═══════════════════════════════════════════════════════════════════════════════
# Admin: EOI Pipeline (Kanban view)
# ═══════════════════════════════════════════════════════════════════════════════

PIPELINE_STATUSES = [
    "submitted",
    "builder_connected",
    "deal_in_progress",
    "payment_done",
    "deal_completed",
]


@router.get("/admin/pipeline", response_model=list[EOIRead])
async def admin_eoi_pipeline(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    status: str | None = Query(None),
    opportunity_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
) -> list[EOIRead]:
    """Admin: list all EOIs for pipeline/kanban view with referrer info."""
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    query = select(ExpressionOfInterest)
    if status:
        query = query.where(ExpressionOfInterest.status == status)
    if opportunity_id:
        query = query.where(
            ExpressionOfInterest.opportunity_id == _uuid.UUID(opportunity_id)
        )

    query = query.order_by(ExpressionOfInterest.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return [EOIRead.model_validate(r) for r in result.scalars().all()]


@router.patch("/admin/{eoi_id}/status", response_model=EOIRead)
async def admin_update_eoi_status(
    eoi_id: str,
    new_status: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EOIRead:
    """Admin: advance an EOI through the pipeline."""
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    if new_status not in PIPELINE_STATUSES and new_status != "closed":
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    result = await db.execute(
        select(ExpressionOfInterest).where(
            ExpressionOfInterest.id == _uuid.UUID(eoi_id)
        )
    )
    eoi = result.scalar_one_or_none()
    if not eoi:
        raise HTTPException(status_code=404, detail="EOI not found")

    old_status = eoi.status
    eoi.status = EOIStatus(new_status)
    db.add(EoiStageHistory(
        eoi_id=eoi.id,
        status=new_status,
        changed_by=user.id,
    ))

    # When deal is completed, create OpportunityInvestment + update opportunity stats
    if new_status == "deal_completed" and old_status != EOIStatus.DEAL_COMPLETED:
        amount = eoi.investment_amount
        if amount and amount > 0:
            # Prevent duplicate investment records
            existing = await db.execute(
                select(OpportunityInvestment).where(
                    OpportunityInvestment.opportunity_id == eoi.opportunity_id,
                    OpportunityInvestment.user_id == eoi.user_id,
                    OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
                )
            )
            if not existing.scalar_one_or_none():
                db.add(OpportunityInvestment(
                    opportunity_id=eoi.opportunity_id,
                    user_id=eoi.user_id,
                    amount=amount,
                    units=eoi.num_units or 1,
                    status=OppInvestmentStatus.CONFIRMED,
                ))
                # Update opportunity raised_amount and investor_count
                opp_result = await db.execute(
                    select(Opportunity).where(Opportunity.id == eoi.opportunity_id)
                )
                opp = opp_result.scalar_one_or_none()
                if opp:
                    opp.raised_amount = (opp.raised_amount or 0) + amount
                    opp.investor_count = (opp.investor_count or 0) + 1

    await db.flush()
    await db.refresh(eoi)
    return EOIRead.model_validate(eoi)

@router.get("/questions/{opportunity_id}", response_model=list[BuilderQuestionRead])
async def list_builder_questions(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[BuilderQuestionRead]:
    """List all builder questions for an opportunity (public)."""
    result = await db.execute(
        select(BuilderQuestion)
        .where(BuilderQuestion.opportunity_id == _uuid.UUID(opportunity_id))
        .order_by(BuilderQuestion.sort_order)
    )
    return [BuilderQuestionRead.model_validate(q) for q in result.scalars().all()]


@router.post("/questions/{opportunity_id}", response_model=BuilderQuestionRead)
async def create_builder_question(
    opportunity_id: str,
    body: BuilderQuestionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BuilderQuestionRead:
    """Add a custom question to an opportunity (builder/admin only)."""
    opp_result = await db.execute(
        select(Opportunity).where(Opportunity.id == _uuid.UUID(opportunity_id))
    )
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if opp.creator_id != user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Only the opportunity creator or admin can add questions")

    question = BuilderQuestion(
        opportunity_id=opp.id,
        creator_id=user.id,
        question_text=body.question_text,
        question_type=body.question_type,
        options=body.options,
        is_required=body.is_required,
        sort_order=body.sort_order,
    )
    db.add(question)
    await db.flush()
    await db.refresh(question)
    return BuilderQuestionRead.model_validate(question)


@router.patch("/questions/{opportunity_id}/{question_id}", response_model=BuilderQuestionRead)
async def update_builder_question(
    opportunity_id: str,
    question_id: str,
    body: BuilderQuestionUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BuilderQuestionRead:
    """Update a builder question."""
    result = await db.execute(
        select(BuilderQuestion).where(
            BuilderQuestion.id == _uuid.UUID(question_id),
            BuilderQuestion.opportunity_id == _uuid.UUID(opportunity_id),
        )
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if question.creator_id != user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(question, field, value)

    await db.flush()
    await db.refresh(question)
    return BuilderQuestionRead.model_validate(question)


@router.delete("/questions/{opportunity_id}/{question_id}")
async def delete_builder_question(
    opportunity_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Delete a builder question."""
    result = await db.execute(
        select(BuilderQuestion).where(
            BuilderQuestion.id == _uuid.UUID(question_id),
            BuilderQuestion.opportunity_id == _uuid.UUID(opportunity_id),
        )
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if question.creator_id != user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.delete(question)
    return {"status": "deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
# Communication Mappings CRUD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/comm-mappings/{opportunity_id}", response_model=list[CommMappingRead])
async def list_comm_mappings(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[CommMappingRead]:
    """List communication mappings for an opportunity (admin only)."""
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(OpportunityCommMapping).where(
            OpportunityCommMapping.opportunity_id == _uuid.UUID(opportunity_id)
        )
    )
    return [CommMappingRead.model_validate(m) for m in result.scalars().all()]


@router.post("/comm-mappings", response_model=CommMappingRead)
async def create_comm_mapping(
    body: CommMappingCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CommMappingRead:
    """Add a communication mapping (admin only)."""
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    mapping = OpportunityCommMapping(
        opportunity_id=_uuid.UUID(body.opportunity_id),
        user_id=_uuid.UUID(body.user_id),
        role=body.role,
    )
    db.add(mapping)
    await db.flush()
    await db.refresh(mapping)
    return CommMappingRead.model_validate(mapping)


@router.delete("/comm-mappings/{mapping_id}")
async def delete_comm_mapping(
    mapping_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Remove a communication mapping (admin only)."""
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(OpportunityCommMapping).where(
            OpportunityCommMapping.id == _uuid.UUID(mapping_id)
        )
    )
    mapping = result.scalar_one_or_none()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    await db.delete(mapping)
    return {"status": "deleted"}
