"""
Tests for the Shield evidence-doc endpoints.

Upload tests focus on auth/ownership/validation since the happy path hits S3.
Download tests cover the EOI gating matrix — which does *not* require S3 — by
pre-seeding an OpportunityMedia row directly in the DB.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from app.models.expression_of_interest import EOIStatus, ExpressionOfInterest
from app.models.opportunity import Opportunity, OpportunityStatus, VaultType
from app.models.opportunity_media import OpportunityMedia
from app.models.user import User
from tests.conftest import TestSessionFactory, auth_headers

UPLOADS = "/api/v1/uploads"


async def _make_opportunity(creator: User) -> uuid.UUID:
    async with TestSessionFactory() as session:
        await session.execute(text("SET search_path TO test_ws"))
        opp_id = uuid.uuid4()
        opp = Opportunity(
            id=opp_id,
            creator_id=creator.id,
            vault_type=VaultType.WEALTH,
            title="Upload-test opportunity",
            slug=f"upload-test-{opp_id.hex[:8]}",
            city="Mumbai",
            target_amount=10_000_000,
            min_investment=500_000,
            target_irr=15.0,
            status=OpportunityStatus.APPROVED,
        )
        session.add(opp)
        await session.commit()
        return opp.id


async def _make_evidence_media(
    opportunity_id: uuid.UUID,
    category: str,
    subcategory: str,
) -> uuid.UUID:
    """Seed an OpportunityMedia row without touching S3."""
    async with TestSessionFactory() as session:
        await session.execute(text("SET search_path TO test_ws"))
        media = OpportunityMedia(
            id=uuid.uuid4(),
            opportunity_id=opportunity_id,
            media_type="document",
            s3_key=f"test/{uuid.uuid4()}.pdf",
            url="https://example.invalid/doc.pdf",
            filename="evidence.pdf",
            size_bytes=1024,
            content_type="application/pdf",
            assessment_category_code=category,
            assessment_subcategory_code=subcategory,
        )
        session.add(media)
        await session.commit()
        return media.id


async def _create_eoi(
    user_id: uuid.UUID, opp_id: uuid.UUID, status: EOIStatus
) -> None:
    async with TestSessionFactory() as session:
        await session.execute(text("SET search_path TO test_ws"))
        session.add(
            ExpressionOfInterest(
                id=uuid.uuid4(),
                user_id=user_id,
                opportunity_id=opp_id,
                status=status,
            )
        )
        await session.commit()


@pytest.mark.asyncio
class TestAssessmentDocumentUploadAuth:
    async def test_upload_requires_auth(self, client: AsyncClient):
        fake = uuid.uuid4()
        resp = await client.post(
            f"{UPLOADS}/opportunity/{fake}/assessment-document"
            f"?category=builder&subcategory=cash_flows",
            files={"files": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
        )
        assert resp.status_code == 401

    async def test_non_creator_cannot_upload(
        self, client: AsyncClient, builder_user: User, test_user: User
    ):
        opp_id = await _make_opportunity(builder_user)
        resp = await client.post(
            f"{UPLOADS}/opportunity/{opp_id}/assessment-document"
            f"?category=builder&subcategory=cash_flows",
            files={"files": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403

    async def test_unknown_subcategory_returns_400(
        self, client: AsyncClient, builder_user: User
    ):
        opp_id = await _make_opportunity(builder_user)
        resp = await client.post(
            f"{UPLOADS}/opportunity/{opp_id}/assessment-document"
            f"?category=builder&subcategory=does_not_exist",
            files={"files": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
class TestAssessmentDocumentDownloadGating:
    async def test_download_requires_auth(self, client: AsyncClient):
        fake = uuid.uuid4()
        resp = await client.get(
            f"{UPLOADS}/opportunity/{fake}/assessment-document/{uuid.uuid4()}"
        )
        assert resp.status_code == 401

    async def test_creator_can_always_download_sensitive(
        self, client: AsyncClient, builder_user: User
    ):
        opp_id = await _make_opportunity(builder_user)
        media_id = await _make_evidence_media(opp_id, "builder", "cash_flows")
        resp = await client.get(
            f"{UPLOADS}/opportunity/{opp_id}/assessment-document/{media_id}",
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == str(media_id)

    async def test_admin_can_always_download(
        self, client: AsyncClient, builder_user: User, admin_user: User
    ):
        opp_id = await _make_opportunity(builder_user)
        media_id = await _make_evidence_media(opp_id, "legal", "title_deeds")
        resp = await client.get(
            f"{UPLOADS}/opportunity/{opp_id}/assessment-document/{media_id}",
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200

    async def test_investor_without_eoi_blocked_from_sensitive(
        self, client: AsyncClient, builder_user: User, test_user: User
    ):
        opp_id = await _make_opportunity(builder_user)
        # cash_flows is marked sensitive_document=True
        media_id = await _make_evidence_media(opp_id, "builder", "cash_flows")
        resp = await client.get(
            f"{UPLOADS}/opportunity/{opp_id}/assessment-document/{media_id}",
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403
        assert "EOI_REQUIRED" in resp.text

    async def test_investor_with_submitted_eoi_still_blocked(
        self, client: AsyncClient, builder_user: User, test_user: User
    ):
        """SUBMITTED EOI is NOT yet super-admin-approved."""
        opp_id = await _make_opportunity(builder_user)
        media_id = await _make_evidence_media(opp_id, "builder", "cash_flows")
        await _create_eoi(test_user.id, opp_id, EOIStatus.SUBMITTED)

        resp = await client.get(
            f"{UPLOADS}/opportunity/{opp_id}/assessment-document/{media_id}",
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403

    async def test_investor_with_approved_eoi_unlocks_sensitive(
        self, client: AsyncClient, builder_user: User, test_user: User
    ):
        opp_id = await _make_opportunity(builder_user)
        media_id = await _make_evidence_media(opp_id, "builder", "cash_flows")
        await _create_eoi(test_user.id, opp_id, EOIStatus.BUILDER_CONNECTED)

        resp = await client.get(
            f"{UPLOADS}/opportunity/{opp_id}/assessment-document/{media_id}",
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        assert resp.json()["filename"] == "evidence.pdf"

    async def test_non_sensitive_doc_is_open_to_any_user(
        self, client: AsyncClient, builder_user: User, test_user: User
    ):
        """Sub-items without sensitive_document=True don't need EOI."""
        opp_id = await _make_opportunity(builder_user)
        # team_capabilities is not sensitive in the catalogue
        media_id = await _make_evidence_media(
            opp_id, "builder", "team_capabilities"
        )
        resp = await client.get(
            f"{UPLOADS}/opportunity/{opp_id}/assessment-document/{media_id}",
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200

    async def test_mismatched_opportunity_returns_404(
        self, client: AsyncClient, builder_user: User
    ):
        opp_a = await _make_opportunity(builder_user)
        opp_b = await _make_opportunity(builder_user)
        media_id = await _make_evidence_media(opp_a, "builder", "cash_flows")
        resp = await client.get(
            f"{UPLOADS}/opportunity/{opp_b}/assessment-document/{media_id}",
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 404
