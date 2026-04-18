"""Unit tests for matching / personality service."""

from unittest.mock import MagicMock

import pytest

from app.services.matching import (
    determine_archetype,
    determine_compatibility_label,
    _compute_answer_score,
    COMPATIBILITY_LABELS,
)


def _make_pd(**kwargs):
    """Create a mock PersonalityDimension with given dimension scores."""
    pd = MagicMock()
    defaults = dict(
        risk_appetite=50, domain_expertise=50, investment_capacity=50,
        time_commitment=50, network_strength=50, creativity_score=50,
        leadership_score=50, collaboration_score=50,
    )
    defaults.update(kwargs)
    for k, v in defaults.items():
        setattr(pd, k, v)
    return pd


def _make_question(question_type="choice", weight=1.0, options=None):
    """Create a mock VaultProfileQuestion."""
    q = MagicMock()
    q.question_type = question_type
    q.weight = weight
    q.options = options or []
    return q


class TestDetermineArchetype:
    def test_wealth_mogul(self):
        pd = _make_pd(investment_capacity=80, risk_appetite=70)
        result = determine_archetype(pd, "wealth")
        assert result["label"] == "The Mogul"

    def test_wealth_strategist(self):
        pd = _make_pd(domain_expertise=70, risk_appetite=40)
        result = determine_archetype(pd, "wealth")
        assert result["label"] == "The Strategist"

    def test_wealth_fallback(self):
        pd = _make_pd()  # all 50 — no condition matches
        result = determine_archetype(pd, "wealth")
        assert result["label"] == "The Explorer"

    def test_opportunity_visionary(self):
        pd = _make_pd(creativity_score=70, risk_appetite=70)
        result = determine_archetype(pd, "opportunity")
        assert result["label"] == "The Visionary"

    def test_community_catalyst(self):
        pd = _make_pd(leadership_score=70, creativity_score=60)
        result = determine_archetype(pd, "community")
        assert result["label"] == "The Catalyst"

    def test_unknown_vault_returns_wealth_default(self):
        pd = _make_pd()
        result = determine_archetype(pd, "unknown_vault")
        assert result["label"] == "The Explorer"

    def test_archetype_has_required_keys(self):
        pd = _make_pd(investment_capacity=80, risk_appetite=70)
        result = determine_archetype(pd, "wealth")
        assert "label" in result
        assert "emoji" in result
        assert "description" in result


class TestDetermineCompatibilityLabel:
    def test_perfect_synergy(self):
        assert determine_compatibility_label(90) == "Perfect Synergy"

    def test_strong_alignment(self):
        assert determine_compatibility_label(75) == "Strong Alignment"

    def test_complementary(self):
        assert determine_compatibility_label(55) == "Complementary Strengths"

    def test_growth_opportunity(self):
        assert determine_compatibility_label(40) == "Growth Opportunity"

    def test_exploring_together(self):
        assert determine_compatibility_label(20) == "Exploring Together"

    def test_zero_score(self):
        assert determine_compatibility_label(0) == "Exploring Together"

    def test_boundary_85(self):
        assert determine_compatibility_label(85) == "Perfect Synergy"

    def test_boundary_70(self):
        assert determine_compatibility_label(70) == "Strong Alignment"


class TestComputeAnswerScore:
    def test_choice_with_matching_option(self):
        q = _make_question(
            "choice", weight=1.0,
            options=[{"value": "a", "weight": 0.8}, {"value": "b", "weight": 0.3}],
        )
        score = _compute_answer_score(q, "a")
        assert score == pytest.approx(80.0)

    def test_choice_no_match_returns_fallback(self):
        q = _make_question(
            "choice", weight=1.0,
            options=[{"value": "a", "weight": 0.8}],
        )
        score = _compute_answer_score(q, "z")
        assert score == pytest.approx(50.0)

    def test_multi_choice_averages_weights(self):
        q = _make_question(
            "multi_choice", weight=1.0,
            options=[
                {"value": "a", "weight": 0.6},
                {"value": "b", "weight": 0.8},
                {"value": "c", "weight": 0.2},
            ],
        )
        score = _compute_answer_score(q, ["a", "b"])
        expected = ((0.6 + 0.8) / 2) * 1.0 * 100
        assert score == pytest.approx(expected)

    def test_scale_normalizes(self):
        q = _make_question(
            "scale", weight=1.0,
            options={"min": 0, "max": 100},
        )
        score = _compute_answer_score(q, 75)
        assert score == pytest.approx(75.0)

    def test_slider_min_max(self):
        q = _make_question(
            "slider", weight=2.0,
            options={"min": 10, "max": 50},
        )
        score = _compute_answer_score(q, 30)
        # normalised = (30-10)/(50-10) = 0.5, * 2.0 * 100 = 100
        assert score == pytest.approx(100.0)

    def test_text_returns_neutral(self):
        q = _make_question("text", weight=1.0)
        score = _compute_answer_score(q, "anything")
        assert score == pytest.approx(50.0)

    def test_weight_multiplier(self):
        q = _make_question(
            "choice", weight=2.0,
            options=[{"value": "x", "weight": 0.5}],
        )
        score = _compute_answer_score(q, "x")
        assert score == pytest.approx(100.0)  # 0.5 * 2.0 * 100
