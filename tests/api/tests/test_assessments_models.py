"""
Model-level tests for WealthSpot Shield — the unique constraint on
(opportunity_id, subcategory_code), default status, and the risk-flag row
shape.
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from app.models.opportunity import Opportunity, OpportunityStatus, VaultType
from app.models.opportunity_assessment import (
    OpportunityAssessment,
    OpportunityRiskFlag,
)
from app.models.user import User
from tests.conftest import TestSessionFactory


async def _make_opportunity(creator: User) -> uuid.UUID:
    async with TestSessionFactory() as session:
        await session.execute(text("SET search_path TO test_ws"))
        opp_id = uuid.uuid4()
        opp = Opportunity(
            id=opp_id,
            creator_id=creator.id,
            vault_type=VaultType.WEALTH,
            title="Model-test opportunity",
            slug=f"model-test-{opp_id.hex[:8]}",
            city="Chennai",
            target_amount=10_000_000,
            min_investment=500_000,
            target_irr=14.0,
            status=OpportunityStatus.DRAFT,
        )
        session.add(opp)
        await session.commit()
        return opp.id


@pytest.mark.asyncio
class TestOpportunityAssessmentModel:
    async def test_unique_opportunity_subcategory(self, builder_user: User):
        opp_id = await _make_opportunity(builder_user)

        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            session.add(
                OpportunityAssessment(
                    opportunity_id=opp_id,
                    category_code="builder",
                    subcategory_code="category_grade",
                    status="in_progress",
                )
            )
            await session.commit()

        with pytest.raises(IntegrityError):
            async with TestSessionFactory() as session:
                await session.execute(text("SET search_path TO test_ws"))
                session.add(
                    OpportunityAssessment(
                        opportunity_id=opp_id,
                        category_code="builder",
                        subcategory_code="category_grade",
                        status="passed",
                    )
                )
                await session.commit()

    async def test_default_status_is_not_started(self, builder_user: User):
        opp_id = await _make_opportunity(builder_user)
        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            row = OpportunityAssessment(
                opportunity_id=opp_id,
                category_code="legal",
                subcategory_code="title_deeds",
            )
            session.add(row)
            await session.commit()
            row_id = row.id

        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            result = await session.execute(
                select(OpportunityAssessment).where(OpportunityAssessment.id == row_id)
            )
            fresh = result.scalar_one()
            assert fresh.status == "not_started"
            assert fresh.builder_answer is None
            assert fresh.reviewer_note is None
            assert fresh.risk_severity is None

    async def test_different_opportunities_can_share_subcategory(
        self, builder_user: User
    ):
        opp_a = await _make_opportunity(builder_user)
        opp_b = await _make_opportunity(builder_user)
        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            session.add(
                OpportunityAssessment(
                    opportunity_id=opp_a,
                    category_code="exit",
                    subcategory_code="lockin_period",
                    status="passed",
                )
            )
            session.add(
                OpportunityAssessment(
                    opportunity_id=opp_b,
                    category_code="exit",
                    subcategory_code="lockin_period",
                    status="not_started",
                )
            )
            await session.commit()


@pytest.mark.asyncio
class TestOpportunityRiskFlagModel:
    async def test_risk_flag_persists(self, builder_user: User, admin_user: User):
        opp_id = await _make_opportunity(builder_user)
        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            flag = OpportunityRiskFlag(
                opportunity_id=opp_id,
                label="Registrar delay",
                severity="medium",
                note="Sub-registrar office backlog.",
                created_by=admin_user.id,
            )
            session.add(flag)
            await session.commit()

        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            result = await session.execute(
                select(OpportunityRiskFlag).where(
                    OpportunityRiskFlag.opportunity_id == opp_id
                )
            )
            fresh = result.scalar_one()
            assert fresh.severity == "medium"
            assert fresh.created_by == admin_user.id
