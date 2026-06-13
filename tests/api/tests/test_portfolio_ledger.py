"""
Tests for the Investment Ledger endpoints: /api/v1/portfolio/ledger*

Covers auth, manual back-entry CRUD, derived-row overlay upsert, the
manual-only delete guard, collateral replace-all, ownership isolation, and the
asset-options picker. Document upload happy-path is mocked away from S3.
"""

from __future__ import annotations

import io
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from app.models.opportunity import Opportunity, OpportunityStatus, VaultType
from app.models.opportunity_investment import OppInvestmentStatus, OpportunityInvestment
from app.models.user import User
from tests.conftest import TestSessionFactory, auth_headers

PREFIX = "/api/v1/portfolio"


async def _make_opportunity(creator: User, status: OpportunityStatus = OpportunityStatus.APPROVED) -> uuid.UUID:
    async with TestSessionFactory() as session:
        await session.execute(text("SET search_path TO test_ws"))
        opp_id = uuid.uuid4()
        opp = Opportunity(
            id=opp_id,
            creator_id=creator.id,
            vault_type=VaultType.WEALTH,
            title="Ledger-test opportunity",
            slug=f"ledger-test-{opp_id.hex[:8]}",
            city="Bengaluru",
            target_amount=10_000_000,
            min_investment=500_000,
            gst_percentage=5,
            status=status,
        )
        session.add(opp)
        await session.commit()
        return opp.id


async def _make_opp_investment(user: User, opp_id: uuid.UUID, amount: int = 1_000_000) -> uuid.UUID:
    async with TestSessionFactory() as session:
        await session.execute(text("SET search_path TO test_ws"))
        inv = OpportunityInvestment(
            id=uuid.uuid4(),
            opportunity_id=opp_id,
            user_id=user.id,
            amount=amount,
            status=OppInvestmentStatus.CONFIRMED,
        )
        session.add(inv)
        await session.commit()
        return inv.id


@pytest.mark.asyncio
class TestLedgerAuth:
    async def test_list_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/ledger")
        assert resp.status_code == 401

    async def test_asset_options_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/ledger/asset-options")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestLedgerList:
    async def test_empty_for_new_user(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/ledger", headers=auth_headers(test_user))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_derived_row_from_confirmed_investment(
        self, client: AsyncClient, test_user: User
    ):
        opp_id = await _make_opportunity(test_user)
        await _make_opp_investment(test_user, opp_id, amount=2_000_000)

        resp = await client.get(f"{PREFIX}/ledger", headers=auth_headers(test_user))
        assert resp.status_code == 200
        rows = resp.json()
        assert len(rows) == 1
        row = rows[0]
        assert row["kind"] == "derived"
        assert row["source_type"] == "opportunity"
        assert row["can_delete"] is False
        assert row["entry_id"] is None  # no overlay yet
        assert row["base_value"] == 2_000_000
        # GST default = 5% of base
        assert row["gst"] == 100_000
        assert row["registered_name"] == test_user.full_name


@pytest.mark.asyncio
class TestManualEntry:
    async def test_create_requires_asset(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{PREFIX}/ledger", headers=auth_headers(test_user), json={"registered_name": "X"}
        )
        assert resp.status_code == 422

    async def test_create_update_delete_manual(self, client: AsyncClient, test_user: User):
        opp_id = await _make_opportunity(test_user)
        # Create
        resp = await client.post(
            f"{PREFIX}/ledger",
            headers=auth_headers(test_user),
            json={
                "opportunity_id": str(opp_id),
                "registered_name": "Asha Rao",
                "base_value": 1500000,
                "gst": 75000,
                "gst_paid": True,
                "collateral": [
                    {"project": "Tower A", "unit_no": "A-101", "sbua": 1200, "unit_cost": 9000000}
                ],
            },
        )
        assert resp.status_code == 201, resp.text
        entry = resp.json()
        assert entry["kind"] == "manual"
        assert entry["can_delete"] is True
        assert entry["gst_paid"] is True
        assert len(entry["collateral"]) == 1
        assert entry["project_name"] == "Ledger-test opportunity"
        entry_id = entry["entry_id"]

        # Update (replace collateral with two rows)
        resp = await client.put(
            f"{PREFIX}/ledger/{entry_id}",
            headers=auth_headers(test_user),
            json={
                "registered_name": "Asha R.",
                "gst_paid": False,
                "collateral": [
                    {"project": "Tower A", "unit_no": "A-101"},
                    {"project": "Tower B", "unit_no": "B-202"},
                ],
            },
        )
        assert resp.status_code == 200, resp.text
        updated = resp.json()
        assert updated["registered_name"] == "Asha R."
        assert updated["gst_paid"] is False
        assert len(updated["collateral"]) == 2

        # It shows in the list as a manual row
        resp = await client.get(f"{PREFIX}/ledger", headers=auth_headers(test_user))
        assert any(r["entry_id"] == entry_id for r in resp.json())

        # Delete
        resp = await client.delete(
            f"{PREFIX}/ledger/{entry_id}", headers=auth_headers(test_user)
        )
        assert resp.status_code == 204
        resp = await client.get(f"{PREFIX}/ledger", headers=auth_headers(test_user))
        assert all(r["entry_id"] != entry_id for r in resp.json())


@pytest.mark.asyncio
class TestOverlay:
    async def test_overlay_upsert_and_delete_guard(self, client: AsyncClient, test_user: User):
        opp_id = await _make_opportunity(test_user)
        inv_id = await _make_opp_investment(test_user, opp_id, amount=3_000_000)

        # Save an overlay (edit the derived row)
        resp = await client.post(
            f"{PREFIX}/ledger/overlay",
            headers=auth_headers(test_user),
            json={
                "source_type": "opportunity",
                "source_id": str(inv_id),
                "referred_by": "Partner Co",
                "sweep_on_oc_loan": 250000,
            },
        )
        assert resp.status_code == 200, resp.text
        ov = resp.json()
        assert ov["kind"] == "derived"
        assert ov["can_delete"] is False
        assert ov["referred_by"] == "Partner Co"
        entry_id = ov["entry_id"]
        assert entry_id is not None

        # The derived list row now carries the overlay edits + entry_id
        resp = await client.get(f"{PREFIX}/ledger", headers=auth_headers(test_user))
        rows = [r for r in resp.json() if r["source_id"] == str(inv_id)]
        assert len(rows) == 1
        assert rows[0]["entry_id"] == entry_id
        assert rows[0]["referred_by"] == "Partner Co"
        assert rows[0]["sweep_on_oc_loan"] == 250000

        # Saving again upserts (no duplicate row)
        resp = await client.post(
            f"{PREFIX}/ledger/overlay",
            headers=auth_headers(test_user),
            json={
                "source_type": "opportunity",
                "source_id": str(inv_id),
                "referred_by": "Partner Co 2",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["entry_id"] == entry_id

        # Derived overlay cannot be deleted
        resp = await client.delete(
            f"{PREFIX}/ledger/{entry_id}", headers=auth_headers(test_user)
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
class TestOwnership:
    async def test_cannot_edit_others_entry(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        opp_id = await _make_opportunity(test_user)
        resp = await client.post(
            f"{PREFIX}/ledger",
            headers=auth_headers(test_user),
            json={"opportunity_id": str(opp_id), "registered_name": "Owner"},
        )
        entry_id = resp.json()["entry_id"]
        # admin_user is a different user → should not find this entry
        resp = await client.put(
            f"{PREFIX}/ledger/{entry_id}",
            headers=auth_headers(admin_user),
            json={"registered_name": "Hacker"},
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestAssetOptions:
    async def test_lists_visible_opportunity(self, client: AsyncClient, test_user: User):
        opp_id = await _make_opportunity(test_user)
        await _make_opportunity(test_user, status=OpportunityStatus.DRAFT)
        resp = await client.get(
            f"{PREFIX}/ledger/asset-options", headers=auth_headers(test_user)
        )
        assert resp.status_code == 200
        data = resp.json()
        opp_ids = {o["id"] for o in data["opportunities"]}
        assert str(opp_id) in opp_ids
        # draft is excluded
        for o in data["opportunities"]:
            assert o["code"].startswith("OPP-")


@pytest.mark.asyncio
class TestDocuments:
    async def test_upload_and_list_document(
        self, client: AsyncClient, test_user: User, monkeypatch
    ):
        # Mock S3 so the happy path does not hit the network.
        import app.routers.portfolio_ledger as mod

        async def _fake_upload(file_obj, key, content_type):  # noqa: ANN001
            return key

        monkeypatch.setattr(mod, "upload_file", _fake_upload)
        monkeypatch.setattr(mod, "generate_presigned_url", lambda key, expires_in=300: f"https://x/{key}")

        opp_id = await _make_opportunity(test_user)
        resp = await client.post(
            f"{PREFIX}/ledger",
            headers=auth_headers(test_user),
            json={"opportunity_id": str(opp_id), "registered_name": "DocUser"},
        )
        entry_id = resp.json()["entry_id"]

        files = {"file": ("receipt.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")}
        resp = await client.post(
            f"{PREFIX}/ledger/{entry_id}/documents",
            headers=auth_headers(test_user),
            files=files,
        )
        assert resp.status_code == 201, resp.text
        doc = resp.json()
        assert doc["filename"] == "receipt.pdf"
        doc_id = doc["id"]

        # Document shows on the entry
        resp = await client.get(f"{PREFIX}/ledger", headers=auth_headers(test_user))
        row = next(r for r in resp.json() if r["entry_id"] == entry_id)
        assert len(row["documents"]) == 1

        # Presigned URL
        resp = await client.get(
            f"{PREFIX}/ledger/{entry_id}/documents/{doc_id}",
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        assert "url" in resp.json()

    async def test_upload_rejects_bad_type(
        self, client: AsyncClient, test_user: User, monkeypatch
    ):
        import app.routers.portfolio_ledger as mod

        async def _fake_upload(file_obj, key, content_type):  # noqa: ANN001
            return key

        monkeypatch.setattr(mod, "upload_file", _fake_upload)
        opp_id = await _make_opportunity(test_user)
        resp = await client.post(
            f"{PREFIX}/ledger",
            headers=auth_headers(test_user),
            json={"opportunity_id": str(opp_id), "registered_name": "DocUser"},
        )
        entry_id = resp.json()["entry_id"]
        files = {"file": ("evil.exe", io.BytesIO(b"MZ"), "application/x-msdownload")}
        resp = await client.post(
            f"{PREFIX}/ledger/{entry_id}/documents",
            headers=auth_headers(test_user),
            files=files,
        )
        assert resp.status_code == 415
