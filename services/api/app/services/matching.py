"""
Profile matching service – computes personality dimensions from answers
and calculates match scores between users and opportunities.

Includes personality archetype assignment per vault type.
"""

from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiling import (
    VaultProfileQuestion,
    UserProfileAnswer,
    OpportunityCustomQuestion,
    OpportunityApplicationAnswer,
    ProfileMatchScore,
    PersonalityDimension,
)
from app.models.opportunity import Opportunity


# ── Dimensions that map to personality_dimensions columns ────────────────────
DIMENSION_COLUMNS = [
    "risk_appetite",
    "domain_expertise",
    "investment_capacity",
    "time_commitment",
    "network_strength",
    "creativity_score",
    "leadership_score",
    "collaboration_score",
]


# ── Personality Archetypes per Vault ─────────────────────────────────────────

ARCHETYPE_MAP: dict[str, list[dict[str, Any]]] = {
    "wealth": [
        {
            "label": "The Mogul",
            "emoji": "👑",
            "description": "High conviction, big bets — you think like an empire builder.",
            "condition": lambda pd: float(pd.investment_capacity or 0) > 70 and float(pd.risk_appetite or 0) > 65,
        },
        {
            "label": "The Strategist",
            "emoji": "🎯",
            "description": "Calculated, data-driven, you never make a move without a plan.",
            "condition": lambda pd: float(pd.domain_expertise or 0) > 60 and float(pd.risk_appetite or 0) < 50,
        },
        {
            "label": "The Pioneer",
            "emoji": "🚀",
            "description": "First mover, growth seeker — you spot trends before they trend.",
            "condition": lambda pd: float(pd.risk_appetite or 0) > 60 and float(pd.creativity_score or 0) > 50,
        },
        {
            "label": "The Steward",
            "emoji": "🛡️",
            "description": "Patient, income-focused, community-minded — you play the long game.",
            "condition": lambda pd: float(pd.collaboration_score or 0) > 50 and float(pd.time_commitment or 0) > 40,
        },
    ],
    "opportunity": [
        {
            "label": "The Visionary",
            "emoji": "🔮",
            "description": "You see the future before it arrives — backing world-changing ideas.",
            "condition": lambda pd: float(pd.creativity_score or 0) > 60 and float(pd.risk_appetite or 0) > 65,
        },
        {
            "label": "The Operator",
            "emoji": "⚙️",
            "description": "Hands-on, execution-focused — you don't just invest, you co-build.",
            "condition": lambda pd: float(pd.collaboration_score or 0) > 65 and float(pd.time_commitment or 0) > 55,
        },
        {
            "label": "The Angel",
            "emoji": "👼",
            "description": "Generous with capital and guidance — founders love having you on board.",
            "condition": lambda pd: float(pd.investment_capacity or 0) > 60 and float(pd.network_strength or 0) > 50,
        },
        {
            "label": "The Scout",
            "emoji": "🔭",
            "description": "Connected, analytical — you find diamonds in the rough.",
            "condition": lambda pd: float(pd.domain_expertise or 0) > 60 and float(pd.network_strength or 0) > 55,
        },
    ],
    "community": [
        {
            "label": "The Catalyst",
            "emoji": "⚡",
            "description": "You ignite projects and energize teams — nothing starts without you.",
            "condition": lambda pd: float(pd.leadership_score or 0) > 60 and float(pd.creativity_score or 0) > 55,
        },
        {
            "label": "The Connector",
            "emoji": "🌐",
            "description": "You know everyone and bring the right people together.",
            "condition": lambda pd: float(pd.network_strength or 0) > 65 and float(pd.collaboration_score or 0) > 55,
        },
        {
            "label": "The Builder",
            "emoji": "🔨",
            "description": "Roll up your sleeves — you're the one who actually makes things happen.",
            "condition": lambda pd: float(pd.time_commitment or 0) > 60 and float(pd.collaboration_score or 0) > 60,
        },
        {
            "label": "The Guardian",
            "emoji": "🏛️",
            "description": "Wise, steady, trusted — the backbone of any successful community project.",
            "condition": lambda pd: float(pd.domain_expertise or 0) > 55 and float(pd.investment_capacity or 0) > 50,
        },
    ],
}

# Default fallback archetypes when no condition matches
DEFAULT_ARCHETYPES: dict[str, dict[str, str]] = {
    "wealth": {"label": "The Explorer", "emoji": "🧭", "description": "Curious and open — you're discovering your investment style."},
    "opportunity": {"label": "The Newcomer", "emoji": "🌟", "description": "Fresh perspective and unlimited potential — every expert was once a beginner."},
    "community": {"label": "The Supporter", "emoji": "💫", "description": "Warm, willing, and ready to contribute — the heart of every community."},
}

# Compatibility labels for match scoring
COMPATIBILITY_LABELS = [
    (85, "Perfect Synergy"),
    (70, "Strong Alignment"),
    (50, "Complementary Strengths"),
    (35, "Growth Opportunity"),
    (0, "Exploring Together"),
]


def determine_archetype(pd: PersonalityDimension, vault_type: str) -> dict[str, str]:
    """Determine the best-fit personality archetype based on dimension scores."""
    archetypes = ARCHETYPE_MAP.get(vault_type, [])
    for arch in archetypes:
        if arch["condition"](pd):
            return {"label": arch["label"], "emoji": arch["emoji"], "description": arch["description"]}
    return DEFAULT_ARCHETYPES.get(vault_type, DEFAULT_ARCHETYPES["wealth"])


def determine_compatibility_label(score: float) -> str:
    """Map an overall match score to a human-readable compatibility label."""
    for threshold, label in COMPATIBILITY_LABELS:
        if score >= threshold:
            return label
    return "Exploring Together"


def _compute_answer_score(question: VaultProfileQuestion, answer_value: Any) -> float:
    """
    Compute a normalised 0-100 score for a single answer.
    Logic depends on question_type:
      - choice: find matching option's weight, multiply by question weight
      - multi_choice: average of selected options' weights × question weight
      - scale/slider: normalize value to 0-1 range × question weight
      - text: default 50 (neutral) × question weight
    """
    q_weight = float(question.weight or 1.0)
    options = question.options or []

    if question.question_type == "choice":
        val = answer_value if isinstance(answer_value, str) else str(answer_value)
        if isinstance(options, list):
            for opt in options:
                if opt.get("value") == val:
                    return float(opt.get("weight", 0.5)) * q_weight * 100
        return 50 * q_weight  # fallback

    elif question.question_type == "multi_choice":
        selected = answer_value if isinstance(answer_value, list) else [answer_value]
        if isinstance(options, list) and selected:
            weights = []
            for opt in options:
                if opt.get("value") in selected:
                    weights.append(float(opt.get("weight", 0.5)))
            if weights:
                return (sum(weights) / len(weights)) * q_weight * 100
        return 50 * q_weight

    elif question.question_type in ("scale", "slider"):
        if isinstance(options, dict):
            min_val = float(options.get("min", 0))
            max_val = float(options.get("max", 100))
            raw = float(answer_value) if answer_value is not None else 50
            normalised = (raw - min_val) / (max_val - min_val) if max_val > min_val else 0.5
            return normalised * q_weight * 100
        return 50 * q_weight

    else:  # text
        return 50 * q_weight


async def compute_personality(
    db: AsyncSession, user_id: UUID, vault_type: str
) -> PersonalityDimension:
    """
    Recompute personality dimensions for a user in a vault from their answers.
    Returns the updated PersonalityDimension record.
    """
    # Fetch all answers with their questions
    stmt = (
        select(UserProfileAnswer, VaultProfileQuestion)
        .join(VaultProfileQuestion, UserProfileAnswer.question_id == VaultProfileQuestion.id)
        .where(
            UserProfileAnswer.user_id == user_id,
            UserProfileAnswer.vault_type == vault_type,
        )
    )
    results = (await db.execute(stmt)).all()

    # Aggregate scores per dimension
    dimension_scores: dict[str, list[float]] = {d: [] for d in DIMENSION_COLUMNS}
    raw_dimensions: dict[str, Any] = {}

    for answer, question in results:
        score = _compute_answer_score(question, answer.answer_value)
        # Update answer_score
        answer.answer_score = Decimal(str(round(score, 2)))

        dim = question.dimension
        if dim and dim in dimension_scores:
            dimension_scores[dim].append(score)

        raw_dimensions[question.category] = raw_dimensions.get(question.category, [])
        raw_dimensions[question.category].append({
            "question": question.question_text[:60],
            "score": round(score, 1),
            "dimension": dim,
        })

    # Average each dimension
    dim_averages = {}
    for dim, scores in dimension_scores.items():
        dim_averages[dim] = round(sum(scores) / len(scores), 2) if scores else 0

    # Upsert PersonalityDimension
    existing = (await db.execute(
        select(PersonalityDimension).where(
            PersonalityDimension.user_id == user_id,
            PersonalityDimension.vault_type == vault_type,
        )
    )).scalar_one_or_none()

    if existing:
        for dim in DIMENSION_COLUMNS:
            setattr(existing, dim, Decimal(str(dim_averages.get(dim, 0))))
        existing.raw_dimensions = raw_dimensions
        pd = existing
    else:
        pd = PersonalityDimension(
            user_id=user_id,
            vault_type=vault_type,
            raw_dimensions=raw_dimensions,
            **{dim: Decimal(str(dim_averages.get(dim, 0))) for dim in DIMENSION_COLUMNS},
        )
        db.add(pd)

    # Assign personality archetype based on dimension pattern
    archetype = determine_archetype(pd, vault_type)
    pd.archetype_label = archetype["label"]
    pd.archetype_description = archetype["description"]

    await db.flush()
    return pd


async def compute_match_score(
    db: AsyncSession, user_id: UUID, opportunity_id: UUID
) -> ProfileMatchScore:
    """
    Compute and cache the match score between a user and an opportunity.

    Scoring algorithm:
    1. Get user's personality dimensions for the opportunity's vault type
    2. Get the opportunity's requirements (derived from creator's questions)
    3. Compare dimensional overlap → weighted cosine-like similarity
    4. Bonus for domain match, risk alignment, capacity fit
    """
    # 1. Get opportunity
    opp = (await db.execute(
        select(Opportunity).where(Opportunity.id == opportunity_id)
    )).scalar_one_or_none()
    if not opp:
        raise ValueError(f"Opportunity {opportunity_id} not found")

    vault_type = opp.vault_type.value if hasattr(opp.vault_type, 'value') else str(opp.vault_type)

    # 2. Get user's personality
    pd = (await db.execute(
        select(PersonalityDimension).where(
            PersonalityDimension.user_id == user_id,
            PersonalityDimension.vault_type == vault_type,
        )
    )).scalar_one_or_none()

    if not pd:
        # No profile yet → default 30% score
        dim_scores = {d: 30.0 for d in DIMENSION_COLUMNS}
        overall = 30.0
    else:
        # 3. Score each dimension based on vault-specific weights
        weights = _vault_dimension_weights(vault_type)
        dim_scores = {}
        total_weight = 0
        weighted_sum = 0

        for dim in DIMENSION_COLUMNS:
            raw = float(getattr(pd, dim, 0) or 0)
            w = weights.get(dim, 1.0)
            dim_scores[dim] = round(raw, 1)
            weighted_sum += raw * w
            total_weight += w

        overall = round(weighted_sum / total_weight, 1) if total_weight > 0 else 0

        # 4. Apply opportunity-specific bonuses
        overall = _apply_opportunity_bonuses(overall, opp, pd)

    overall = min(max(overall, 0), 100)  # clamp

    # Generate human-readable breakdown
    breakdown = _generate_breakdown(dim_scores, overall, vault_type)

    # Upsert
    existing = (await db.execute(
        select(ProfileMatchScore).where(
            ProfileMatchScore.user_id == user_id,
            ProfileMatchScore.opportunity_id == opportunity_id,
        )
    )).scalar_one_or_none()

    compatibility = determine_compatibility_label(overall)

    if existing:
        existing.overall_score = Decimal(str(overall))
        existing.dimension_scores = dim_scores
        existing.breakdown = breakdown
        existing.archetype_compatibility = compatibility
        ms = existing
    else:
        ms = ProfileMatchScore(
            user_id=user_id,
            opportunity_id=opportunity_id,
            overall_score=Decimal(str(overall)),
            dimension_scores=dim_scores,
            breakdown=breakdown,
            archetype_compatibility=compatibility,
        )
        db.add(ms)

    await db.flush()
    return ms


def _vault_dimension_weights(vault_type: str) -> dict[str, float]:
    """Importance of each dimension varies by vault type."""
    if vault_type == "wealth":
        return {
            "risk_appetite": 1.5,
            "domain_expertise": 1.2,
            "investment_capacity": 2.0,
            "time_commitment": 0.3,
            "network_strength": 0.5,
            "creativity_score": 0.2,
            "leadership_score": 0.3,
            "collaboration_score": 0.5,
        }
    elif vault_type == "community":
        return {
            "risk_appetite": 0.8,
            "domain_expertise": 1.0,
            "investment_capacity": 1.0,
            "time_commitment": 1.8,
            "network_strength": 1.5,
            "creativity_score": 1.3,
            "leadership_score": 1.5,
            "collaboration_score": 2.0,
        }
    else:  # opportunity
        return {
            "risk_appetite": 1.8,
            "domain_expertise": 1.5,
            "investment_capacity": 1.5,
            "time_commitment": 0.8,
            "network_strength": 1.0,
            "creativity_score": 0.5,
            "leadership_score": 0.8,
            "collaboration_score": 1.2,
        }


def _apply_opportunity_bonuses(
    score: float, opp: Opportunity, pd: PersonalityDimension
) -> float:
    """Apply small bonuses/penalties based on opportunity-profile alignment."""
    bonus = 0.0
    vault = opp.vault_type.value if hasattr(opp.vault_type, 'value') else str(opp.vault_type)

    # Investment capacity vs target amount alignment
    if opp.min_investment and float(pd.investment_capacity or 0) > 70:
        bonus += 5  # High capacity + opportunity needing funds

    # Community: collaboration + time alignment
    if vault == "community":
        if float(pd.time_commitment or 0) > 60 and float(pd.collaboration_score or 0) > 60:
            bonus += 8
        if float(pd.network_strength or 0) > 70:
            bonus += 4

    # Risk appetite alignment for high-risk opportunities
    if vault == "opportunity" and float(pd.risk_appetite or 0) > 75:
        bonus += 5

    return min(score + bonus, 100)


def _generate_breakdown(
    dim_scores: dict[str, float], overall: float, vault_type: str
) -> dict[str, Any]:
    """Generate human-readable match breakdown."""
    strengths = []
    areas_to_grow = []

    labels = {
        "risk_appetite": "Risk Appetite",
        "domain_expertise": "Domain Knowledge",
        "investment_capacity": "Investment Capacity",
        "time_commitment": "Time Availability",
        "network_strength": "Network Reach",
        "creativity_score": "Creative Thinking",
        "leadership_score": "Leadership",
        "collaboration_score": "Team Collaboration",
    }

    for dim, score in dim_scores.items():
        label = labels.get(dim, dim)
        if score >= 70:
            strengths.append(f"Strong {label}")
        elif score < 40:
            areas_to_grow.append(label)

    # Match tier
    if overall >= 85:
        tier = "Excellent Match"
        emoji = "🌟"
        note = "You're a perfect fit for this opportunity!"
    elif overall >= 70:
        tier = "Great Match"
        emoji = "💪"
        note = "You align very well with this opportunity."
    elif overall >= 50:
        tier = "Good Match"
        emoji = "👍"
        note = "There's solid alignment here with room to grow."
    elif overall >= 35:
        tier = "Partial Match"
        emoji = "🤔"
        note = "Some aspects align, but there are gaps."
    else:
        tier = "Exploring"
        emoji = "🌱"
        note = "This might be outside your comfort zone — but that's where growth happens!"

    return {
        "tier": tier,
        "emoji": emoji,
        "note": note,
        "strengths": strengths[:3],
        "areas_to_grow": areas_to_grow[:3],
        "compatibility_label": determine_compatibility_label(overall),
    }


async def get_top_matches_for_opportunity(
    db: AsyncSession, opportunity_id: UUID, limit: int = 20
) -> list[dict[str, Any]]:
    """
    Get top matching users for an opportunity (for the creator to see).
    """
    from app.models.user import User

    stmt = (
        select(ProfileMatchScore, User)
        .join(User, ProfileMatchScore.user_id == User.id)
        .where(ProfileMatchScore.opportunity_id == opportunity_id)
        .order_by(ProfileMatchScore.overall_score.desc())
        .limit(limit)
    )
    results = (await db.execute(stmt)).all()

    # Fetch personality dimensions for archetype labels
    user_ids = [ms.user_id for ms, _ in results]
    pd_stmt = select(PersonalityDimension).where(PersonalityDimension.user_id.in_(user_ids))
    pd_results = (await db.execute(pd_stmt)).scalars().all()
    pd_map = {pd.user_id: pd for pd in pd_results}

    matches = []
    for ms, user in results:
        dim_scores = ms.dimension_scores or {}
        top_strengths = []
        for dim, score in sorted(dim_scores.items(), key=lambda x: x[1], reverse=True)[:3]:
            if score >= 50:
                top_strengths.append(dim.replace("_", " ").title())

        user_pd = pd_map.get(user.id)
        matches.append({
            "user_id": str(user.id),
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "overall_score": float(ms.overall_score),
            "dimension_scores": dim_scores,
            "top_strengths": top_strengths,
            "compatibility_note": (ms.breakdown or {}).get("note"),
            "archetype_label": user_pd.archetype_label if user_pd else None,
            "archetype_compatibility": ms.archetype_compatibility,
        })

    return matches
