"""Regression: editing an opportunity (PATCH) persists/upserts shield answers.

Covers the edit-workflow addition where `update_opportunity` upserts
`OpportunityAssessment` rows from `shield_answers` (previously the field was
discarded on update). Mirrors the create flow's answer shape
(``{subcode: {"value": ..., "isPublic": ...}}``).
"""
import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/opportunities"


@pytest.mark.asyncio
class TestUpdateShieldAnswers:
    async def test_patch_upserts_shield_answers(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)

        # Create with one shield answer
        create = await client.post(
            PREFIX,
            json={
                "vault_type": "wealth",
                "title": "Shield Edit Regression",
                "shield_answers": {"category_grade": {"value": "A", "isPublic": True}},
            },
            headers=headers,
        )
        assert create.status_code in (200, 201), create.text
        opp_id = create.json()["id"]

        # The created opportunity exposes the answer
        g1 = await client.get(f"{PREFIX}/{opp_id}")
        sa1 = {a["subcategory_code"]: a for a in g1.json()["shield_assessments"]}
        assert sa1["category_grade"]["builder_answer"]["value"] == "A"

        # PATCH updates the existing answer and adds a new one
        patch = await client.patch(
            f"{PREFIX}/{opp_id}",
            json={
                "shield_answers": {
                    "category_grade": {"value": "A+", "isPublic": True},
                    "tenure_sqft": {"value": "1200 sqft", "isPublic": True},
                }
            },
            headers=headers,
        )
        assert patch.status_code == 200, patch.text
        sa_patch = {a["subcategory_code"]: a for a in patch.json()["shield_assessments"]}
        assert sa_patch["category_grade"]["builder_answer"]["value"] == "A+"
        assert sa_patch["tenure_sqft"]["builder_answer"]["value"] == "1200 sqft"

        # Persisted on re-fetch, with no duplicate row for the updated subcode
        g2 = await client.get(f"{PREFIX}/{opp_id}")
        codes = [a["subcategory_code"] for a in g2.json()["shield_assessments"]]
        assert codes.count("category_grade") == 1
        assert "tenure_sqft" in codes
