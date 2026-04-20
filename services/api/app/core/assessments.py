"""
WealthSpot Shield — 7-layer trust framework (Python mirror).

This is the authoritative Python-side copy of the assessment catalogue.
The TypeScript source lives at packages/wealthspot-types/src/assessments.ts
and a parity test (tests/api/tests/test_assessment_parity.py) fails CI
whenever the two drift.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class AssessmentStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FLAGGED = "flagged"
    NOT_APPLICABLE = "not_applicable"


INCOMPLETE_STATUSES = {
    AssessmentStatus.NOT_STARTED.value,
    AssessmentStatus.IN_PROGRESS.value,
    AssessmentStatus.FLAGGED.value,
}
CERTIFIED_STATUSES = {
    AssessmentStatus.PASSED.value,
    AssessmentStatus.NOT_APPLICABLE.value,
}


@dataclass(frozen=True)
class AssessmentSubItem:
    code: str
    label: str
    prompt_for_builder: str
    input_type: str  # text | number | select | boolean
    options: tuple[str, ...] | None = None
    requires_document: bool = False
    sensitive_document: bool = False


@dataclass(frozen=True)
class AssessmentCategory:
    code: str
    name: str
    hero_short_def: str
    full_description: str
    icon: str
    accent_color: str
    performed_by: str  # wealthspot | law_firm | sme
    sub_items: tuple[AssessmentSubItem, ...] = field(default_factory=tuple)


ASSESSMENT_CATEGORIES: tuple[AssessmentCategory, ...] = (
    AssessmentCategory(
        code="builder",
        name="Builder Assessment",
        hero_short_def="Grade, tenure, cashflows & team capability of the builder",
        full_description=(
            "We grade every builder on delivery history, balance-sheet health, "
            "and the people behind the project before a single rupee goes on "
            "the platform."
        ),
        icon="ShieldCheck",
        accent_color="text-emerald-500",
        performed_by="wealthspot",
        sub_items=(
            AssessmentSubItem(
                code="category_grade",
                label="Category Grade",
                prompt_for_builder="What grade does your firm hold (A / B / C)?",
                input_type="select",
                options=("A", "B", "C"),
            ),
            AssessmentSubItem(
                code="tenure_sqft",
                label="Tenure & Sqft Delivered",
                prompt_for_builder="Years in business and total sqft delivered to date.",
                input_type="text",
                requires_document=True,
            ),
            AssessmentSubItem(
                code="proprietor_profile",
                label="Proprietor Profile",
                prompt_for_builder="Share the proprietor's profile (LinkedIn / bio / public record).",
                input_type="text",
                requires_document=True,
            ),
            AssessmentSubItem(
                code="cash_flows",
                label="Cash Flows",
                prompt_for_builder="Last 3 FY cashflow statement.",
                input_type="text",
                requires_document=True,
                sensitive_document=True,
            ),
            AssessmentSubItem(
                code="team_capabilities",
                label="Team Capabilities",
                prompt_for_builder="Key people, credentials, specialities.",
                input_type="text",
            ),
        ),
    ),
    AssessmentCategory(
        code="legal",
        name="Legal Assessment",
        hero_short_def="Title, encumbrance & legal-opinion letter from a vetted law firm",
        full_description=(
            "An empanelled law firm independently reviews title deeds, the "
            "Encumbrance Certificate, and flags every location constraint "
            "before listing."
        ),
        icon="Scale",
        accent_color="text-sky-500",
        performed_by="law_firm",
        sub_items=(
            AssessmentSubItem(
                code="title_deeds",
                label="Title Deeds",
                prompt_for_builder="Upload chain of title deeds.",
                input_type="text",
                requires_document=True,
                sensitive_document=True,
            ),
            AssessmentSubItem(
                code="known_legal_issues",
                label="Known Legal Issues",
                prompt_for_builder="Any ongoing disputes or notices?",
                input_type="boolean",
            ),
            AssessmentSubItem(
                code="location_constraints",
                label="Location Constraints",
                prompt_for_builder="Lake buffers, govt encroachments, patta / dotted lands?",
                input_type="text",
                requires_document=True,
                sensitive_document=True,
            ),
            AssessmentSubItem(
                code="ec",
                label="Encumbrance Certificate",
                prompt_for_builder="Latest EC (last 13 years).",
                input_type="text",
                requires_document=True,
                sensitive_document=True,
            ),
            AssessmentSubItem(
                code="legal_opinion",
                label="Legal Opinion Letter",
                prompt_for_builder="Opinion letter from empanelled law firm.",
                input_type="text",
                requires_document=True,
                sensitive_document=True,
            ),
        ),
    ),
    AssessmentCategory(
        code="valuation",
        name="Valuation Assessment",
        hero_short_def="Market price & appreciation outlook by independent SMEs",
        full_description=(
            "Independent Subject-Matter Experts triangulate market value today "
            "against surrounding transactions and map the 3-5 year "
            "appreciation curve."
        ),
        icon="TrendingUp",
        accent_color="text-amber-500",
        performed_by="sme",
        sub_items=(
            AssessmentSubItem(
                code="surrounding_valuation",
                label="Surrounding Valuation",
                prompt_for_builder="Recent transaction prices within a 2 km radius.",
                input_type="text",
                requires_document=True,
            ),
            AssessmentSubItem(
                code="market_value",
                label="Market Value",
                prompt_for_builder="Current fair market value per unit / acre.",
                input_type="number",
            ),
            AssessmentSubItem(
                code="appreciation_scope",
                label="Future Appreciation Scope",
                prompt_for_builder="Projected 3-5 year appreciation narrative.",
                input_type="text",
            ),
        ),
    ),
    AssessmentCategory(
        code="location",
        name="Location Assessment",
        hero_short_def="Buffer-zone, SC/ST, dotted-land & future-development checks",
        full_description=(
            "WealthSpot verifies the parcel against buffer zones, SC/ST "
            "classifications, dotted-land flags and maps upcoming infra "
            "(metro, IT parks) that could move value."
        ),
        icon="MapPin",
        accent_color="text-fuchsia-500",
        performed_by="wealthspot",
        sub_items=(
            AssessmentSubItem(
                code="zone_check",
                label="Buffer / SC-ST / Dotted-Land",
                prompt_for_builder="Any buffer-zone, SC-ST or dotted-land classification?",
                input_type="boolean",
                requires_document=True,
                sensitive_document=True,
            ),
            AssessmentSubItem(
                code="future_development",
                label="Future Development Map",
                prompt_for_builder="Nearby metro, IT park, highway or SEZ plans.",
                input_type="text",
            ),
        ),
    ),
    AssessmentCategory(
        code="property",
        name="Property Assessment",
        hero_short_def="Construction status, parcel size, segment & delivery timelines",
        full_description=(
            "We inspect ground reality — construction phase, acres on offer, "
            "premium / mid / affordable segment, and the timeline the builder "
            "is committing to."
        ),
        icon="Building2",
        accent_color="text-blue-500",
        performed_by="wealthspot",
        sub_items=(
            AssessmentSubItem(
                code="construction_status",
                label="Construction Status",
                prompt_for_builder="Current phase on the ground.",
                input_type="select",
                options=(
                    "planning",
                    "land_acquisition",
                    "approvals_in_progress",
                    "foundation",
                    "structure",
                    "finishing",
                    "possession_ready",
                    "completed",
                ),
            ),
            AssessmentSubItem(
                code="parcel_dimensions",
                label="Land Parcel Dimensions",
                prompt_for_builder="Total acres / sqft of the parcel.",
                input_type="number",
            ),
            AssessmentSubItem(
                code="segment",
                label="Segment",
                prompt_for_builder="Premium / Mid / Affordable.",
                input_type="select",
                options=("premium", "mid", "affordable"),
            ),
            AssessmentSubItem(
                code="timelines",
                label="Timelines",
                prompt_for_builder="Expected possession / exit date.",
                input_type="text",
            ),
        ),
    ),
    AssessmentCategory(
        code="security",
        name="Security Assessment",
        hero_short_def="Sale agreement, post-dated cheque cover & MoUs with the builder",
        full_description=(
            "Binding paperwork that sits under the deal — the sale agreement, "
            "investor-protection cheques, and MoUs that codify exit and "
            "dispute handling."
        ),
        icon="Lock",
        accent_color="text-rose-500",
        performed_by="wealthspot",
        sub_items=(
            AssessmentSubItem(
                code="sale_agreement",
                label="Sale Agreement / Deeds",
                prompt_for_builder="Draft or executed sale agreement / sale deed.",
                input_type="text",
                requires_document=True,
                sensitive_document=True,
            ),
            AssessmentSubItem(
                code="cheque_security",
                label="Cheque Security",
                prompt_for_builder="Post-dated cheques covering principal / interest.",
                input_type="boolean",
                requires_document=True,
                sensitive_document=True,
            ),
            AssessmentSubItem(
                code="mous",
                label="MoUs",
                prompt_for_builder="Executed MoUs with investors / platform.",
                input_type="text",
                requires_document=True,
                sensitive_document=True,
            ),
        ),
    ),
    AssessmentCategory(
        code="exit",
        name="Exit Assessment",
        hero_short_def="Lock-in, flex-move and emergency-exit clauses",
        full_description=(
            "Every deal documents its lock-in window, whether capital can "
            "shift between projects, and the emergency-exit waterfall if life "
            "happens."
        ),
        icon="DoorOpen",
        accent_color="text-violet-500",
        performed_by="wealthspot",
        sub_items=(
            AssessmentSubItem(
                code="lock_in_period",
                label="Lock-in Period",
                prompt_for_builder="Minimum lock-in in months.",
                input_type="number",
            ),
            AssessmentSubItem(
                code="flex_move",
                label="Flex Between Properties",
                prompt_for_builder="Can investors move capital between your projects?",
                input_type="boolean",
            ),
            AssessmentSubItem(
                code="emergency_exit",
                label="Emergency Exit Clause",
                prompt_for_builder="Terms under which investors can exit early.",
                input_type="text",
                requires_document=True,
                sensitive_document=True,
            ),
        ),
    ),
)


CATEGORY_BY_CODE: dict[str, AssessmentCategory] = {c.code: c for c in ASSESSMENT_CATEGORIES}


def find_subitem(category_code: str, subcategory_code: str) -> AssessmentSubItem | None:
    cat = CATEGORY_BY_CODE.get(category_code)
    if cat is None:
        return None
    for si in cat.sub_items:
        if si.code == subcategory_code:
            return si
    return None


def all_subitem_codes() -> list[tuple[str, str]]:
    """Flat list of (category_code, subcategory_code) pairs — used for seeding
    and parity assertions."""
    return [(c.code, s.code) for c in ASSESSMENT_CATEGORIES for s in c.sub_items]


def total_subitem_count() -> int:
    return sum(len(c.sub_items) for c in ASSESSMENT_CATEGORIES)


def subitem_is_sensitive(category_code: str, subcategory_code: str) -> bool:
    si = find_subitem(category_code, subcategory_code)
    return bool(si and si.sensitive_document)
