"""
Additional functional + DB tests for uncovered API operations:
- investments lifecycle (initiate + confirm + DB mutation)
- referrals apply/stats/history
- templates download/upload
- pincode lookup (DB + fallback)
"""

from __future__ import annotations

from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.community import Referral
from app.models.investment import Investment, InvestmentStatus, Transaction
from app.models.pincode import IndianPincode
from app.models.property import AssetType, Builder, Property, PropertyStatus
from app.models.user import KycStatus, User
from tests.conftest import TestSessionFactory, auth_headers


@pytest.mark.asyncio
class TestInvestmentsLifecycle:
    async def test_initiate_and_confirm_payment_updates_db(
        self,
        client: AsyncClient,
        test_user: User,
        builder_user: User,
        monkeypatch: pytest.MonkeyPatch,
    ):
        from app.routers import investments as investments_router

        async def _noop_audit(*args, **kwargs):
            return None

        monkeypatch.setattr(investments_router, "log_audit_event", _noop_audit)

        async with TestSessionFactory() as session:
            from sqlalchemy import text

            await session.execute(text("SET search_path TO test_ws"))

            db_test_user = (await session.execute(select(User).where(User.id == test_user.id))).scalar_one()
            db_test_user.kyc_status = KycStatus.APPROVED

            builder = Builder(
                user_id=builder_user.id,
                company_name="Test Builder",
                verified=True,
            )
            session.add(builder)
            await session.flush()

            prop = Property(
                builder_id=builder.id,
                slug="ws-investment-test",
                title="Investment Test Property",
                asset_type=AssetType.RESIDENTIAL,
                status=PropertyStatus.ACTIVE,
                city="Bengaluru",
                state="Karnataka",
                target_amount=Decimal("1000000"),
                raised_amount=Decimal("0"),
                min_investment=Decimal("25000"),
                unit_price=Decimal("25000"),
                total_units=40,
                sold_units=0,
                target_irr=Decimal("12.5"),
                investor_count=0,
            )
            session.add(prop)
            await session.commit()

        create_payload = {
            "property_id": str(prop.id),
            "units": 2,
            "amount": "50000",
        }
        create_resp = await client.post(
            "/api/v1/investments",
            json=create_payload,
            headers=auth_headers(test_user),
        )
        assert create_resp.status_code == 201, create_resp.text
        created = create_resp.json()
        assert created["status"] == InvestmentStatus.PAYMENT_PENDING.value

        confirm_payload = {
            "investment_id": created["id"],
            "razorpay_payment_id": "pay_test_001",
            "razorpay_order_id": "order_test_001",
            "razorpay_signature": "sig_test_001",
        }
        confirm_resp = await client.post(
            "/api/v1/investments/confirm-payment",
            json=confirm_payload,
            headers=auth_headers(test_user),
        )
        assert confirm_resp.status_code == 200, confirm_resp.text
        confirmed = confirm_resp.json()
        assert confirmed["status"] == InvestmentStatus.CONFIRMED.value

        async with TestSessionFactory() as session:
            from sqlalchemy import text

            await session.execute(text("SET search_path TO test_ws"))

            db_prop = (await session.execute(select(Property).where(Property.id == prop.id))).scalar_one()
            assert db_prop.raised_amount == Decimal("50000")
            assert db_prop.sold_units == 2
            assert db_prop.investor_count == 1

            db_inv = (await session.execute(select(Investment).where(Investment.id == created["id"]))).scalar_one()
            assert db_inv.status == InvestmentStatus.CONFIRMED

            db_txns = (await session.execute(select(Transaction).where(Transaction.investment_id == db_inv.id))).scalars().all()
            assert len(db_txns) == 1
            assert db_txns[0].reference_id == "pay_test_001"

    async def test_list_investments_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/v1/investments")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestReferralsFlow:
    async def test_apply_referral_and_get_stats_history(
        self,
        client: AsyncClient,
        test_user: User,
        builder_user: User,
    ):
        apply_resp = await client.post(
            "/api/v1/referrals/apply",
            json={"code": builder_user.referral_code},
            headers=auth_headers(test_user),
        )
        assert apply_resp.status_code == 200, apply_resp.text

        stats_referrer = await client.get(
            "/api/v1/referrals/stats",
            headers=auth_headers(builder_user),
        )
        assert stats_referrer.status_code == 200
        stats_json = stats_referrer.json()
        assert stats_json["total_referrals"] == 1
        assert stats_json["successful_referrals"] == 0

        history_referrer = await client.get(
            "/api/v1/referrals/history",
            headers=auth_headers(builder_user),
        )
        assert history_referrer.status_code == 200
        history_json = history_referrer.json()
        assert len(history_json) == 1
        assert history_json[0]["referee_email"] == test_user.email

        async with TestSessionFactory() as session:
            from sqlalchemy import text

            await session.execute(text("SET search_path TO test_ws"))
            links = (await session.execute(select(Referral).where(Referral.referee_id == test_user.id))).scalars().all()
            assert len(links) == 1
            assert links[0].referrer_id == builder_user.id


@pytest.mark.asyncio
class TestPincodes:
    async def test_lookup_pincode_from_db(self, client: AsyncClient):
        async with TestSessionFactory() as session:
            from sqlalchemy import text

            await session.execute(text("SET search_path TO test_ws"))
            row = IndianPincode(
                pincode="560001",
                office_name="MG Road",
                locality="Bangalore North",
                district="Bengaluru",
                state="Karnataka",
                region="South India",
                division="Bangalore East",
                circle="Karnataka",
                delivery="Delivery",
            )
            session.add(row)
            await session.commit()

        resp = await client.get("/api/v1/pincodes/560001")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["office_name"] == "MG Road"

    async def test_lookup_pincode_fallback_api(self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        from app.routers import pincodes as pincodes_router

        class _MockResponse:
            def json(self):
                return [
                    {
                        "Status": "Success",
                        "PostOffice": [
                            {
                                "Name": "Connaught Place",
                                "Block": "New Delhi",
                                "District": "Central Delhi",
                                "State": "Delhi",
                                "Region": "Delhi",
                            }
                        ],
                    }
                ]

        class _MockClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb):
                return None

            async def get(self, _url):
                return _MockResponse()

        monkeypatch.setattr(pincodes_router.httpx, "AsyncClient", _MockClient)

        resp = await client.get("/api/v1/pincodes/110001")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["office_name"] == "Connaught Place"


@pytest.mark.asyncio
class TestTemplates:
    async def test_download_template_authenticated(self, client: AsyncClient, test_user: User):
        resp = await client.get(
            "/api/v1/templates/opportunity",
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        assert "text/csv" in resp.headers.get("content-type", "")
        assert "title,tagline,description,vault_type" in resp.text

    async def test_upload_template_rejects_non_csv(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            "/api/v1/templates/opportunity/upload",
            headers=auth_headers(test_user),
            files={"file": ("bad.txt", b"hello", "text/plain")},
        )
        assert resp.status_code == 400
        assert "Only CSV files" in resp.text

    async def test_upload_template_parses_csv(self, client: AsyncClient, test_user: User, monkeypatch: pytest.MonkeyPatch):
        from app.routers import templates as templates_router

        async def _fake_upload_template(**kwargs):
            return "templates/test/opportunity.csv"

        def _fake_get_public_url(key: str):
            return f"https://cdn.test/{key}"

        monkeypatch.setattr(templates_router, "s3_upload_template", _fake_upload_template)
        monkeypatch.setattr(templates_router, "get_public_url", _fake_get_public_url)

        csv_content = (
            "title,tagline,description,vault_type,city,state,address_line1,pincode,target_amount,min_investment,target_irr\n"
            "Alpha Residency,Tagline,Desc,wealth,Bengaluru,Karnataka,Address,560001,1000000,50000,14.5\n"
        )

        resp = await client.post(
            "/api/v1/templates/opportunity/upload",
            headers=auth_headers(test_user),
            files={"file": ("opportunity.csv", csv_content.encode("utf-8"), "text/csv")},
        )

        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["parsed_count"] == 1
        assert data["error_count"] == 0
        assert data["preview"][0]["title"] == "Alpha Residency"
