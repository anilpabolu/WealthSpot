"""
Comprehensive functional + DB tests for previously-uncovered API routers:
  - admin    : KYC approve/reject, property approval, dashboard stats
  - approvals: full create → review lifecycle (approve + reject), stats
  - control_centre: platform config CRUD + section filtering
  - lender   : dashboard summary, create & list loans
  - referrals: self-referral and duplicate-referral edge cases
"""

from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select, text

from app.models.approval import ApprovalRequest, ApprovalStatus
from app.models.community import Loan, Referral
from app.models.platform_config import PlatformConfig
from app.models.property import AssetType, Builder, Property, PropertyStatus
from app.models.user import KycStatus, User, UserRole
from tests.conftest import TestSessionFactory, auth_headers

BASE = "/api/v1"


# ── Shared DB helper ──────────────────────────────────────────────────────────

async def _db_get(model, pk_value, pk_col: str = "id"):
    """Fetch a single ORM row from the test_ws schema by primary key."""
    async with TestSessionFactory() as session:
        await session.execute(text("SET search_path TO test_ws"))
        result = await session.execute(
            select(model).where(getattr(model, pk_col) == pk_value)
        )
        return result.scalar_one_or_none()


# ── Admin: dashboard stats ────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestAdminStats:
    async def test_stats_returns_all_expected_keys(
        self, client: AsyncClient, admin_user: User
    ):
        resp = await client.get("/api/v1/admin/stats", headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.json()
        for key in ("total_users", "total_properties", "active_properties", "aum", "pending_kyc"):
            assert key in data, f"Missing key: {key}"

    async def test_stats_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/admin/stats")
        assert resp.status_code == 401

    async def test_stats_requires_admin_role(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get("/api/v1/admin/stats", headers=auth_headers(test_user))
        assert resp.status_code == 403


# ── Admin: KYC review ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestAdminKYC:
    async def test_approve_kyc_updates_user_db_status(
        self, client: AsyncClient, admin_user: User, test_user: User
    ):
        # Move the test user into UNDER_REVIEW state
        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            u = (await session.execute(
                select(User).where(User.id == test_user.id)
            )).scalar_one()
            u.kyc_status = KycStatus.UNDER_REVIEW
            await session.commit()

        resp = await client.post(
            f"/api/v1/admin/kyc/{test_user.id}/approve",
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "approved"
        assert body["user_id"] == str(test_user.id)

        row = await _db_get(User, test_user.id)
        assert row is not None
        assert row.kyc_status == KycStatus.APPROVED

    async def test_reject_kyc_updates_user_db_status(
        self, client: AsyncClient, admin_user: User, test_user: User
    ):
        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            u = (await session.execute(
                select(User).where(User.id == test_user.id)
            )).scalar_one()
            u.kyc_status = KycStatus.UNDER_REVIEW
            await session.commit()

        resp = await client.post(
            f"/api/v1/admin/kyc/{test_user.id}/reject",
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"

        row = await _db_get(User, test_user.id)
        assert row is not None
        assert row.kyc_status == KycStatus.REJECTED

    async def test_approve_kyc_returns_404_for_unknown_user(
        self, client: AsyncClient, admin_user: User
    ):
        fake_id = uuid.uuid4()
        resp = await client.post(
            f"/api/v1/admin/kyc/{fake_id}/approve",
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 404


# ── Admin: property approval ──────────────────────────────────────────────────

@pytest.mark.asyncio
class TestAdminPropertyApproval:
    async def _setup_property(self, user_id: uuid.UUID, status: PropertyStatus) -> Property:
        slug = f"admin-prop-{uuid.uuid4().hex[:8]}"
        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            builder = Builder(user_id=user_id, company_name=f"Builder {slug}", verified=True)
            session.add(builder)
            await session.flush()
            prop = Property(
                builder_id=builder.id,
                slug=slug,
                title="Admin Review Property",
                asset_type=AssetType.COMMERCIAL,
                status=status,
                city="Mumbai",
                state="Maharashtra",
                target_amount=Decimal("500000"),
                raised_amount=Decimal("0"),
                min_investment=Decimal("10000"),
                unit_price=Decimal("10000"),
                total_units=50,
                sold_units=0,
                target_irr=Decimal("14"),
                investor_count=0,
            )
            session.add(prop)
            await session.commit()
            return prop

    async def test_approve_under_review_property(
        self, client: AsyncClient, admin_user: User
    ):
        prop = await self._setup_property(admin_user.id, PropertyStatus.UNDER_REVIEW)
        resp = await client.post(
            f"/api/v1/admin/properties/{prop.slug}/approve",
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"

    async def test_approve_already_active_property_returns_400(
        self, client: AsyncClient, admin_user: User
    ):
        prop = await self._setup_property(admin_user.id, PropertyStatus.ACTIVE)
        resp = await client.post(
            f"/api/v1/admin/properties/{prop.slug}/approve",
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 400

    async def test_approve_nonexistent_property_returns_404(
        self, client: AsyncClient, admin_user: User
    ):
        resp = await client.post(
            "/api/v1/admin/properties/slug-that-does-not-exist/approve",
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 404


# ── Approvals: full lifecycle ──────────────────────────────────────────────────

@pytest.mark.asyncio
class TestApprovals:
    async def test_create_and_list_approvals(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        create_resp = await client.post(
            "/api/v1/approvals",
            json={
                "category": "template_upload",
                "title": "Upload investment template",
                "priority": "normal",
            },
            headers=auth_headers(test_user),
        )
        assert create_resp.status_code == 200
        approval_id = create_resp.json()["id"]

        list_resp = await client.get("/api/v1/approvals", headers=auth_headers(admin_user))
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert "items" in data
        ids = [item["id"] for item in data["items"]]
        assert approval_id in ids

    async def test_create_and_approve_lifecycle_updates_db(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        create_resp = await client.post(
            "/api/v1/approvals",
            json={
                "category": "kyc_verification",
                "title": "KYC review request",
                "priority": "high",
            },
            headers=auth_headers(test_user),
        )
        assert create_resp.status_code == 200
        approval_id = create_resp.json()["id"]

        review_resp = await client.post(
            f"/api/v1/approvals/{approval_id}/review",
            json={"action": "approve", "review_note": "All documents verified"},
            headers=auth_headers(admin_user),
        )
        assert review_resp.status_code == 200
        body = review_resp.json()
        assert body["status"] == "approved"
        assert body["reviewer_id"] == str(admin_user.id)

        # Verify DB row
        row = await _db_get(ApprovalRequest, uuid.UUID(approval_id))
        assert row is not None
        assert row.status == ApprovalStatus.APPROVED
        assert row.reviewer_id == admin_user.id

    async def test_create_and_reject_approval(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        create_resp = await client.post(
            "/api/v1/approvals",
            json={"category": "property_listing", "title": "List new plot", "priority": "normal"},
            headers=auth_headers(test_user),
        )
        assert create_resp.status_code == 200
        approval_id = create_resp.json()["id"]

        review_resp = await client.post(
            f"/api/v1/approvals/{approval_id}/review",
            json={"action": "reject", "review_note": "Missing RERA docs"},
            headers=auth_headers(admin_user),
        )
        assert review_resp.status_code == 200
        assert review_resp.json()["status"] == "rejected"

        row = await _db_get(ApprovalRequest, uuid.UUID(approval_id))
        assert row is not None
        assert row.status == ApprovalStatus.REJECTED
        assert row.review_note == "Missing RERA docs"

    async def test_review_same_approval_twice_returns_400(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        create_resp = await client.post(
            "/api/v1/approvals",
            json={"category": "builder_verification", "title": "Verify builder", "priority": "low"},
            headers=auth_headers(test_user),
        )
        approval_id = create_resp.json()["id"]

        # First review — approve
        await client.post(
            f"/api/v1/approvals/{approval_id}/review",
            json={"action": "approve"},
            headers=auth_headers(admin_user),
        )
        # Second review — should fail
        second = await client.post(
            f"/api/v1/approvals/{approval_id}/review",
            json={"action": "reject"},
            headers=auth_headers(admin_user),
        )
        assert second.status_code == 400

    async def test_my_approvals_returns_only_current_users(
        self, client: AsyncClient, test_user: User
    ):
        await client.post(
            "/api/v1/approvals",
            json={"category": "community_project", "title": "My community project", "priority": "normal"},
            headers=auth_headers(test_user),
        )
        resp = await client.get("/api/v1/approvals/my", headers=auth_headers(test_user))
        assert resp.status_code == 200
        data = resp.json()
        # Endpoint may return a paginated dict or a plain list
        items = data["items"] if isinstance(data, dict) and "items" in data else data
        assert isinstance(items, list)
        for item in items:
            assert item["requester_id"] == str(test_user.id)

    async def test_approval_stats_returns_all_keys(
        self, client: AsyncClient, admin_user: User
    ):
        resp = await client.get("/api/v1/approvals/stats", headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.json()
        for key in ("pending", "in_review", "approved", "rejected", "total"):
            assert key in data, f"Missing key: {key}"

    async def test_investor_cannot_list_all_approvals(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get("/api/v1/approvals", headers=auth_headers(test_user))
        assert resp.status_code == 403


# ── Control Centre: platform config CRUD ─────────────────────────────────────

@pytest.mark.asyncio
class TestControlCentre:
    async def test_create_and_list_configs(
        self, client: AsyncClient, admin_user: User
    ):
        section = f"feat_{uuid.uuid4().hex[:6]}"
        create_resp = await client.post(
            "/api/v1/control-centre/configs",
            json={
                "section": section,
                "key": "max_property_images",
                "value": {"limit": 10},
                "description": "Max images allowed per property",
                "is_active": True,
            },
            headers=auth_headers(admin_user),
        )
        assert create_resp.status_code == 200
        config_id = create_resp.json()["id"]
        assert create_resp.json()["section"] == section

        list_resp = await client.get(
            f"/api/v1/control-centre/configs?section={section}",
            headers=auth_headers(admin_user),
        )
        assert list_resp.status_code == 200
        items = list_resp.json()
        assert any(c["id"] == config_id for c in items)

    async def test_update_config_changes_value_in_db(
        self, client: AsyncClient, admin_user: User
    ):
        section = f"upd_{uuid.uuid4().hex[:6]}"
        create_resp = await client.post(
            "/api/v1/control-centre/configs",
            json={"section": section, "key": "feature_flag", "value": {"enabled": False}},
            headers=auth_headers(admin_user),
        )
        assert create_resp.status_code == 200
        config_id = create_resp.json()["id"]

        update_resp = await client.put(
            f"/api/v1/control-centre/configs/{config_id}",
            json={"value": {"enabled": True}, "description": "Updated desc"},
            headers=auth_headers(admin_user),
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["value"] == {"enabled": True}

        row = await _db_get(PlatformConfig, uuid.UUID(config_id))
        assert row is not None
        assert row.value == {"enabled": True}
        assert row.description == "Updated desc"

    async def test_update_nonexistent_config_returns_404(
        self, client: AsyncClient, admin_user: User
    ):
        resp = await client.put(
            f"/api/v1/control-centre/configs/{uuid.uuid4()}",
            json={"value": {"x": 1}},
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 404

    async def test_section_filter_returns_only_matching_configs(
        self, client: AsyncClient, admin_user: User
    ):
        sec_a = f"secA_{uuid.uuid4().hex[:6]}"
        sec_b = f"secB_{uuid.uuid4().hex[:6]}"
        await client.post(
            "/api/v1/control-centre/configs",
            json={"section": sec_a, "key": "k1", "value": {"v": 1}},
            headers=auth_headers(admin_user),
        )
        await client.post(
            "/api/v1/control-centre/configs",
            json={"section": sec_b, "key": "k2", "value": {"v": 2}},
            headers=auth_headers(admin_user),
        )

        resp = await client.get(
            f"/api/v1/control-centre/configs?section={sec_a}",
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200
        sections = {c["section"] for c in resp.json()}
        assert sec_a in sections
        assert sec_b not in sections

    async def test_non_super_admin_forbidden(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get("/api/v1/control-centre/configs", headers=auth_headers(test_user))
        assert resp.status_code == 403


# ── Lender: dashboard & loan lifecycle ───────────────────────────────────────

@pytest.mark.asyncio
class TestLender:
    async def _make_lender(self) -> User:
        unique = uuid.uuid4().hex[:8]
        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            user = User(
                id=uuid.uuid4(),
                email=f"lender-{unique}@wealthspot.in",
                full_name="Test Lender",
                role=UserRole.LENDER,
                is_active=True,
                referral_code=f"LND{unique[:5].upper()}",
            )
            session.add(user)
            await session.commit()
            return user

    async def _make_property(self, owner_id: uuid.UUID) -> Property:
        slug = f"lend-prop-{uuid.uuid4().hex[:8]}"
        async with TestSessionFactory() as session:
            await session.execute(text("SET search_path TO test_ws"))
            builder = Builder(
                user_id=owner_id,
                company_name=f"Lender Co {slug}",
                verified=True,
            )
            session.add(builder)
            await session.flush()
            prop = Property(
                builder_id=builder.id,
                slug=slug,
                title="Lender Property",
                asset_type=AssetType.COMMERCIAL,
                status=PropertyStatus.ACTIVE,
                city="Hyderabad",
                state="Telangana",
                target_amount=Decimal("2000000"),
                raised_amount=Decimal("0"),
                min_investment=Decimal("50000"),
                unit_price=Decimal("50000"),
                total_units=40,
                sold_units=0,
                target_irr=Decimal("13"),
                investor_count=0,
            )
            session.add(prop)
            await session.commit()
            return prop

    async def test_dashboard_returns_empty_state_for_new_lender(
        self, client: AsyncClient
    ):
        lender = await self._make_lender()
        resp = await client.get("/api/v1/lender/dashboard", headers=auth_headers(lender))
        assert resp.status_code == 200
        data = resp.json()
        assert data["active_loans"] == 0
        assert float(data["total_lent"]) == 0.0
        assert data["upcoming_payments"] == 0

    async def test_create_loan_persists_to_db_and_appears_in_list(
        self, client: AsyncClient, admin_user: User
    ):
        lender = await self._make_lender()
        prop = await self._make_property(admin_user.id)

        create_resp = await client.post(
            "/api/v1/lender/loans",
            json={
                "property_id": str(prop.id),
                "principal": 50_000_000,   # ₹5L in paise
                "interest_rate": 12.5,
                "tenure_months": 24,
            },
            headers=auth_headers(lender),
        )
        assert create_resp.status_code == 201
        loan_id = create_resp.json()["id"]

        # Loan exists in DB
        row = await _db_get(Loan, uuid.UUID(loan_id))
        assert row is not None
        assert row.principal == 50_000_000

        # Appears in list endpoint
        list_resp = await client.get("/api/v1/lender/loans", headers=auth_headers(lender))
        assert list_resp.status_code == 200
        ids = [item["id"] for item in list_resp.json()["items"]]
        assert loan_id in ids

    async def test_create_loan_for_nonexistent_property_returns_404(
        self, client: AsyncClient
    ):
        lender = await self._make_lender()
        resp = await client.post(
            "/api/v1/lender/loans",
            json={
                "property_id": str(uuid.uuid4()),
                "principal": 1_000_000,
                "interest_rate": 10.0,
                "tenure_months": 12,
            },
            headers=auth_headers(lender),
        )
        assert resp.status_code == 404

    async def test_investor_cannot_access_lender_dashboard(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get("/api/v1/lender/dashboard", headers=auth_headers(test_user))
        assert resp.status_code == 403


# ── Referral edge cases ───────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestReferralEdgeCases:
    async def test_self_referral_returns_400(
        self, client: AsyncClient, test_user: User
    ):
        """User cannot apply their own referral code."""
        resp = await client.post(
            "/api/v1/referrals/apply",
            json={"code": test_user.referral_code},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 400
        assert "yourself" in resp.json()["detail"].lower()

    async def test_duplicate_referral_returns_400(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        """Applying a second referral code after already applying one returns 400."""
        # First application — must succeed
        first = await client.post(
            "/api/v1/referrals/apply",
            json={"code": admin_user.referral_code},
            headers=auth_headers(test_user),
        )
        assert first.status_code == 200, (
            f"Expected first referral to succeed but got {first.status_code}: {first.text}"
        )

        # Second application with the same code — must fail
        second = await client.post(
            "/api/v1/referrals/apply",
            json={"code": admin_user.referral_code},
            headers=auth_headers(test_user),
        )
        assert second.status_code == 400
        assert "already" in second.json()["detail"].lower()

    async def test_invalid_referral_code_returns_404(
        self, client: AsyncClient, test_user: User
    ):
        """An invalid / non-existent referral code must return 404."""
        resp = await client.post(
            "/api/v1/referrals/apply",
            json={"code": "XXXXNOTREAL"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 404
