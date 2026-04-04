"""
Profiling & Matching router.
Handles vault-specific profile questions, answers, personality computation,
opportunity custom questions, and profile matching.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.profiling import (
    VaultProfileQuestion,
    UserProfileAnswer,
    OpportunityCustomQuestion,
    OpportunityApplicationAnswer,
    ProfileMatchScore,
    PersonalityDimension,
)
from app.models.opportunity import Opportunity
from app.schemas.profiling import (
    VaultProfileQuestionRead,
    UserProfileAnswerBulk,
    UserProfileAnswerRead,
    OpportunityCustomQuestionCreate,
    OpportunityCustomQuestionRead,
    OpportunityApplicationBulk,
    OpportunityApplicationAnswerRead,
    PersonalityDimensionRead,
    MatchScoreRead,
    MatchedUserRead,
    OpportunityMatchesResponse,
    ProfilingProgressRead,
)
from app.services.matching import (
    compute_personality,
    compute_match_score,
    get_top_matches_for_opportunity,
    _compute_answer_score,
)

router = APIRouter(prefix="/profiling", tags=["profiling"])


# ── Vault Profile Questions ──────────────────────────────────────────────────

@router.get("/questions/{vault_type}", response_model=list[VaultProfileQuestionRead])
async def get_vault_questions(
    vault_type: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get all active profiling questions for a vault type."""
    if vault_type not in ("wealth", "opportunity", "community"):
        raise HTTPException(status_code=400, detail="Invalid vault type")

    stmt = (
        select(VaultProfileQuestion)
        .where(
            VaultProfileQuestion.vault_type == vault_type,
            VaultProfileQuestion.is_active.is_(True),
        )
        .order_by(VaultProfileQuestion.sort_order)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# ── Submit Vault Profile Answers ─────────────────────────────────────────────

@router.post("/answers", response_model=list[UserProfileAnswerRead])
async def submit_vault_answers(
    payload: UserProfileAnswerBulk,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Submit answers to vault profiling questions. Upserts."""
    if payload.vault_type not in ("wealth", "opportunity", "community"):
        raise HTTPException(status_code=400, detail="Invalid vault type")

    # Validate question IDs
    q_ids = [a.question_id for a in payload.answers]
    questions_result = await db.execute(
        select(VaultProfileQuestion).where(VaultProfileQuestion.id.in_(q_ids))
    )
    questions_map = {q.id: q for q in questions_result.scalars().all()}

    saved = []
    for ans in payload.answers:
        question = questions_map.get(ans.question_id)
        if not question:
            continue

        score = _compute_answer_score(question, ans.answer_value)

        # Upsert
        existing = (await db.execute(
            select(UserProfileAnswer).where(
                UserProfileAnswer.user_id == user.id,
                UserProfileAnswer.question_id == ans.question_id,
            )
        )).scalar_one_or_none()

        if existing:
            existing.answer_value = ans.answer_value
            existing.answer_score = round(score, 2)
            saved.append(existing)
        else:
            new_ans = UserProfileAnswer(
                user_id=user.id,
                question_id=ans.question_id,
                vault_type=payload.vault_type,
                answer_value=ans.answer_value,
                answer_score=round(score, 2),
            )
            db.add(new_ans)
            saved.append(new_ans)

    await db.flush()

    # Recompute personality dimensions
    await compute_personality(db, user.id, payload.vault_type)
    await db.commit()

    return saved


# ── Get My Answers for a Vault ───────────────────────────────────────────────

@router.get("/answers/{vault_type}", response_model=list[UserProfileAnswerRead])
async def get_my_answers(
    vault_type: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get current user's answers for a vault."""
    stmt = (
        select(UserProfileAnswer)
        .where(
            UserProfileAnswer.user_id == user.id,
            UserProfileAnswer.vault_type == vault_type,
        )
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# ── Profiling Progress ───────────────────────────────────────────────────────

@router.get("/progress/{vault_type}", response_model=ProfilingProgressRead)
async def get_profiling_progress(
    vault_type: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get profiling completion progress for a vault."""
    total = (await db.execute(
        select(func.count(VaultProfileQuestion.id)).where(
            VaultProfileQuestion.vault_type == vault_type,
            VaultProfileQuestion.is_active.is_(True),
        )
    )).scalar() or 0

    answered = (await db.execute(
        select(func.count(UserProfileAnswer.id)).where(
            UserProfileAnswer.user_id == user.id,
            UserProfileAnswer.vault_type == vault_type,
        )
    )).scalar() or 0

    pct = round((answered / total) * 100, 1) if total > 0 else 0

    personality = (await db.execute(
        select(PersonalityDimension).where(
            PersonalityDimension.user_id == user.id,
            PersonalityDimension.vault_type == vault_type,
        )
    )).scalar_one_or_none()

    return ProfilingProgressRead(
        vault_type=vault_type,
        total_questions=total,
        answered_questions=answered,
        completion_pct=pct,
        is_complete=answered >= total and total > 0,
        personality=personality,
    )


# ── Personality Dimensions ───────────────────────────────────────────────────

@router.get("/personality/{vault_type}", response_model=PersonalityDimensionRead | None)
async def get_my_personality(
    vault_type: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get current user's personality dimensions for a vault."""
    pd = (await db.execute(
        select(PersonalityDimension).where(
            PersonalityDimension.user_id == user.id,
            PersonalityDimension.vault_type == vault_type,
        )
    )).scalar_one_or_none()
    return pd


# ── Opportunity Custom Questions ─────────────────────────────────────────────

@router.post(
    "/opportunities/{opportunity_id}/questions",
    response_model=list[OpportunityCustomQuestionRead],
    status_code=status.HTTP_201_CREATED,
)
async def create_opportunity_questions(
    opportunity_id: UUID,
    questions: list[OpportunityCustomQuestionCreate],
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Creator adds custom questions to their opportunity."""
    opp = (await db.execute(
        select(Opportunity).where(Opportunity.id == opportunity_id)
    )).scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can add questions")

    created = []
    for i, q in enumerate(questions):
        ocq = OpportunityCustomQuestion(
            opportunity_id=opportunity_id,
            creator_id=user.id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=q.options,
            weight=q.weight,
            dimension=q.dimension,
            sort_order=q.sort_order or i,
            is_required=q.is_required,
        )
        db.add(ocq)
        created.append(ocq)

    await db.flush()
    await db.commit()
    return created


@router.get(
    "/opportunities/{opportunity_id}/questions",
    response_model=list[OpportunityCustomQuestionRead],
)
async def get_opportunity_questions(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get custom questions for an opportunity."""
    stmt = (
        select(OpportunityCustomQuestion)
        .where(OpportunityCustomQuestion.opportunity_id == opportunity_id)
        .order_by(OpportunityCustomQuestion.sort_order)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# ── Apply to Opportunity (submit answers) ────────────────────────────────────

@router.post("/applications", response_model=list[OpportunityApplicationAnswerRead])
async def submit_application_answers(
    payload: OpportunityApplicationBulk,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Submit answers when applying to an opportunity."""
    opp = (await db.execute(
        select(Opportunity).where(Opportunity.id == payload.opportunity_id)
    )).scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    saved = []
    for ans in payload.answers:
        # Fetch question for scoring
        question = (await db.execute(
            select(OpportunityCustomQuestion).where(
                OpportunityCustomQuestion.id == ans.question_id
            )
        )).scalar_one_or_none()

        score = None
        if question and question.options:
            # Re-use scoring logic with a duck-typed question
            class _Q:
                def __init__(self, q):
                    self.weight = q.weight
                    self.question_type = q.question_type
                    self.options = q.options
            score = _compute_answer_score(_Q(question), ans.answer_value)

        existing = (await db.execute(
            select(OpportunityApplicationAnswer).where(
                OpportunityApplicationAnswer.user_id == user.id,
                OpportunityApplicationAnswer.question_id == ans.question_id,
            )
        )).scalar_one_or_none()

        if existing:
            existing.answer_value = ans.answer_value
            existing.answer_score = round(score, 2) if score else None
            saved.append(existing)
        else:
            new_ans = OpportunityApplicationAnswer(
                user_id=user.id,
                opportunity_id=payload.opportunity_id,
                question_id=ans.question_id,
                answer_value=ans.answer_value,
                answer_score=round(score, 2) if score else None,
            )
            db.add(new_ans)
            saved.append(new_ans)

    await db.flush()

    # Recompute match score
    vault_type = opp.vault_type.value if hasattr(opp.vault_type, 'value') else str(opp.vault_type)
    await compute_match_score(db, user.id, opp.id)
    await db.commit()

    return saved


# ── Match Scores ─────────────────────────────────────────────────────────────

@router.get("/match/{opportunity_id}", response_model=MatchScoreRead | None)
async def get_my_match_score(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get current user's match score for an opportunity."""
    ms = (await db.execute(
        select(ProfileMatchScore).where(
            ProfileMatchScore.user_id == user.id,
            ProfileMatchScore.opportunity_id == opportunity_id,
        )
    )).scalar_one_or_none()

    if not ms:
        # Compute on-the-fly
        ms = await compute_match_score(db, user.id, opportunity_id)
        await db.commit()

    return ms


@router.post("/match/{opportunity_id}/compute", response_model=MatchScoreRead)
async def recompute_match_score(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Force recompute match score."""
    ms = await compute_match_score(db, user.id, opportunity_id)
    await db.commit()
    return ms


@router.get(
    "/opportunities/{opportunity_id}/matches",
    response_model=OpportunityMatchesResponse,
)
async def get_opportunity_matches(
    opportunity_id: UUID,
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get top matching users for an opportunity (creator only)."""
    opp = (await db.execute(
        select(Opportunity).where(Opportunity.id == opportunity_id)
    )).scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can view matches")

    matches = await get_top_matches_for_opportunity(db, opportunity_id, limit)

    return OpportunityMatchesResponse(
        opportunity_id=opportunity_id,
        total_matches=len(matches),
        matches=[MatchedUserRead(**m) for m in matches],
    )
