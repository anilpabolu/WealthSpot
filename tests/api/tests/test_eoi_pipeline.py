"""
Tests for EOI endpoints: /api/v1/eoi/*
Covers submission, listing, detail, connect-with-builder, admin pipeline,
builder questions CRUD, communication mappings.
"""

import uuid

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/eoi"
OPP_PREFIX = "/api/v1/opportunities"


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _create_opportunity(client: AsyncClient, headers: dict) -> dict:
    """Create a minimal opportunity so we can submit EOIs against it."""
    resp = await client.post(
        OPP_PREFIX,
        json={
            "vault_type": "wealth",
            "title": f"EOI Test Property {uuid.uuid4().hex[:6]}",
            "description": "Test property for EOI tests",
            "city": "Mumbai",
            "state": "Maharashtra",
            "target_amount": 10_000_000,
            "min_investment": 100_000,
            "target_irr": 15.0,
        },
        headers=headers,
    )
    assert resp.status_code in (200, 201), resp.text
    return resp.json()


async def _submit_eoi(
    client: AsyncClient, headers: dict, opportunity_id: str, **overrides
) -> dict:
    payload = {
        "opportunity_id": opportunity_id,
        "investment_amount": 500_000,
        "num_units": 2,
        "investment_timeline": "1-3 months",
        "funding_source": "own_funds",
        "purpose": "investment",
        "preferred_contact": "phone",
        "communication_consent": True,
        "answers": [],
    }
    payload.update(overrides)
    resp = await client.post(PREFIX, json=payload, headers=headers)
    assert resp.status_code in (200, 201), resp.text
    return resp.json()


# ── EOI Creation ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestEOISubmission:
    async def test_submit_eoi_success(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(client, user_h, opp["id"])
        assert eoi["status"] == "submitted"
        assert eoi["opportunity_id"] == opp["id"]

    async def test_submit_eoi_unauthenticated(self, client: AsyncClient):
        resp = await client.post(PREFIX, json={"opportunity_id": str(uuid.uuid4())})
        assert resp.status_code == 401

    async def test_submit_eoi_nonexistent_opportunity(
        self, client: AsyncClient, test_user: User
    ):
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "opportunity_id": str(uuid.uuid4()),
                "investment_amount": 100_000,
                "answers": [],
            },
            headers=headers,
        )
        assert resp.status_code == 404

    async def test_duplicate_eoi_returns_existing(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        """Submitting EOI twice for the same user+property returns existing record, not a duplicate."""
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        eoi1 = await _submit_eoi(client, user_h, opp["id"])
        eoi2 = await _submit_eoi(client, user_h, opp["id"])

        # Same EOI returned – no duplicate
        assert eoi1["id"] == eoi2["id"]
        # updated_at should be refreshed
        assert eoi2["updated_at"] >= eoi1["updated_at"]


# ── EOI Listing & Detail ────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestEOIListing:
    async def test_list_own_eois(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        await _submit_eoi(client, user_h, opp["id"])

        resp = await client.get(PREFIX, headers=user_h)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] >= 1

    async def test_get_eoi_by_id(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(client, user_h, opp["id"])

        resp = await client.get(f"{PREFIX}/{eoi['id']}", headers=user_h)
        assert resp.status_code == 200
        assert resp.json()["id"] == eoi["id"]

    async def test_get_eoi_forbidden_for_other_user(
        self, client: AsyncClient, test_user: User, builder_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(client, user_h, opp["id"])

        builder_h = auth_headers(builder_user)
        resp = await client.get(f"{PREFIX}/{eoi['id']}", headers=builder_h)
        assert resp.status_code == 403


# ── Connect with Builder ─────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestConnectWithBuilder:
    async def test_connect_success(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(client, user_h, opp["id"])

        resp = await client.post(
            f"{PREFIX}/{eoi['id']}/connect", headers=user_h
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "builder_connected"

    async def test_connect_forbidden_for_other_user(
        self, client: AsyncClient, test_user: User, builder_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(client, user_h, opp["id"])

        builder_h = auth_headers(builder_user)
        resp = await client.post(
            f"{PREFIX}/{eoi['id']}/connect", headers=builder_h
        )
        assert resp.status_code == 403


# ── Admin Pipeline ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestAdminPipeline:
    async def test_pipeline_requires_admin(
        self, client: AsyncClient, test_user: User
    ):
        headers = auth_headers(test_user)
        resp = await client.get(f"{PREFIX}/admin/pipeline", headers=headers)
        assert resp.status_code == 403

    async def test_pipeline_list(
        self, client: AsyncClient, admin_user: User, test_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        await _submit_eoi(client, user_h, opp["id"])

        resp = await client.get(f"{PREFIX}/admin/pipeline", headers=admin_h)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_pipeline_filter_by_status(
        self, client: AsyncClient, admin_user: User, test_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        await _submit_eoi(client, user_h, opp["id"])

        resp = await client.get(
            f"{PREFIX}/admin/pipeline",
            params={"status": "submitted"},
            headers=admin_h,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert all(e["status"] == "submitted" for e in data)

    async def test_update_eoi_status(
        self, client: AsyncClient, admin_user: User, test_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(client, user_h, opp["id"])

        resp = await client.patch(
            f"{PREFIX}/admin/{eoi['id']}/status",
            json={"new_status": "deal_in_progress"},
            headers=admin_h,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "deal_in_progress"

    async def test_update_status_invalid(
        self, client: AsyncClient, admin_user: User, test_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(client, user_h, opp["id"])

        resp = await client.patch(
            f"{PREFIX}/admin/{eoi['id']}/status",
            json={"new_status": "invalid_status"},
            headers=admin_h,
        )
        assert resp.status_code == 400

    async def test_update_status_non_admin_forbidden(
        self, client: AsyncClient, admin_user: User, test_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(client, user_h, opp["id"])

        resp = await client.patch(
            f"{PREFIX}/admin/{eoi['id']}/status",
            json={"new_status": "deal_in_progress"},
            headers=user_h,
        )
        assert resp.status_code == 403


# ── Builder Questions ────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestBuilderQuestions:
    async def test_list_questions_empty(
        self, client: AsyncClient, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        resp = await client.get(f"{PREFIX}/questions/{opp['id']}")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_create_question(
        self, client: AsyncClient, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        resp = await client.post(
            f"{PREFIX}/questions/{opp['id']}",
            json={
                "question_text": "What is your preferred floor plan?",
                "question_type": "text",
                "is_required": True,
                "sort_order": 1,
            },
            headers=admin_h,
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["question_text"] == "What is your preferred floor plan?"

    async def test_submit_eoi_with_answers(
        self, client: AsyncClient, admin_user: User, test_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        # Create a question
        q_resp = await client.post(
            f"{PREFIX}/questions/{opp['id']}",
            json={
                "question_text": "Budget range?",
                "question_type": "text",
                "is_required": False,
                "sort_order": 0,
            },
            headers=admin_h,
        )
        question = q_resp.json()

        # Submit EOI with answer
        user_h = auth_headers(test_user)
        eoi = await _submit_eoi(
            client,
            user_h,
            opp["id"],
            answers=[
                {"question_id": str(question["id"]), "answer_text": "50-75 lakhs"}
            ],
        )
        assert eoi["status"] == "submitted"
