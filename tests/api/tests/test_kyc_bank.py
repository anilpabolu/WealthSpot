"""
Tests for KYC and Bank Details endpoints.
"""

import io
import os
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.models.user import KycStatus, User
from tests.conftest import TestSessionFactory, auth_headers

KYC_PREFIX = "/api/v1/kyc"
BANK_PREFIX = "/api/v1/bank"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _fake_upload(*args, **kwargs):
    """Mock S3 upload that returns a fake key."""
    return f"kyc/test/{uuid.uuid4().hex}_test.png"


def _fake_presigned(key: str, **kwargs):
    """Mock presigned URL generator."""
    return f"https://s3.example.com/{key}?signed=true"


# Generate a real Fernet key for tests
os.environ.setdefault("ENCRYPTION_KEY", "dGVzdC1lbmNyeXB0aW9uLWtleS0xMjM0NTY3ODkwYWJj")
# Use proper Fernet key
from cryptography.fernet import Fernet
_test_fernet_key = Fernet.generate_key().decode()
os.environ["ENCRYPTION_KEY"] = _test_fernet_key


# ── KYC Tests ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestKycSubmit:
    async def test_submit_kyc_details(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["kyc_status"] == "IN_PROGRESS"
        assert "documents" in data["message"].lower() or "saved" in data["message"].lower()

    async def test_submit_kyc_invalid_pan(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "INVALID",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 422  # Validation error

    async def test_submit_kyc_invalid_pincode(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "12345",  # Invalid: needs 6 digits
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestKycDocumentUpload:
    @patch("app.routers.kyc.upload_document", new_callable=AsyncMock, side_effect=_fake_upload)
    @patch("app.routers.kyc.generate_presigned_url", side_effect=_fake_presigned)
    async def test_upload_pan_document(self, mock_presign, mock_upload, client: AsyncClient, test_user: User):
        # First submit KYC details
        await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
            headers=auth_headers(test_user),
        )

        # Upload PAN document
        fake_file = io.BytesIO(b"fake image data for PAN card")
        resp = await client.post(
            f"{KYC_PREFIX}/documents/upload?document_type=PAN",
            files={"file": ("pan.png", fake_file, "image/png")},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["document_type"] == "PAN"
        assert data["verification_status"] == "PENDING"
        assert "download_url" in data
        assert data["original_filename"] == "pan.png"

    @patch("app.routers.kyc.upload_document", new_callable=AsyncMock, side_effect=_fake_upload)
    @patch("app.routers.kyc.generate_presigned_url", side_effect=_fake_presigned)
    async def test_upload_invalid_doc_type(self, mock_presign, mock_upload, client: AsyncClient, test_user: User):
        fake_file = io.BytesIO(b"fake data")
        resp = await client.post(
            f"{KYC_PREFIX}/documents/upload?document_type=INVALID",
            files={"file": ("doc.png", fake_file, "image/png")},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 400
        assert "invalid document type" in resp.json()["detail"].lower()

    @patch("app.routers.kyc.upload_document", new_callable=AsyncMock, side_effect=_fake_upload)
    @patch("app.routers.kyc.generate_presigned_url", side_effect=_fake_presigned)
    async def test_upload_wrong_mime_type(self, mock_presign, mock_upload, client: AsyncClient, test_user: User):
        fake_file = io.BytesIO(b"fake data")
        resp = await client.post(
            f"{KYC_PREFIX}/documents/upload?document_type=PAN",
            files={"file": ("doc.exe", fake_file, "application/x-executable")},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
class TestKycDocumentList:
    @patch("app.routers.kyc.upload_document", new_callable=AsyncMock, side_effect=_fake_upload)
    @patch("app.routers.kyc.generate_presigned_url", side_effect=_fake_presigned)
    async def test_list_documents(self, mock_presign, mock_upload, client: AsyncClient, test_user: User):
        # Submit + upload a doc
        await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
            headers=auth_headers(test_user),
        )
        fake_file = io.BytesIO(b"fake PAN data")
        await client.post(
            f"{KYC_PREFIX}/documents/upload?document_type=PAN",
            files={"file": ("pan.png", fake_file, "image/png")},
            headers=auth_headers(test_user),
        )

        # List documents
        resp = await client.get(f"{KYC_PREFIX}/documents", headers=auth_headers(test_user))
        assert resp.status_code == 200
        docs = resp.json()
        assert isinstance(docs, list)
        assert len(docs) >= 1
        assert docs[0]["document_type"] == "PAN"
        assert docs[0]["download_url"] is not None

    async def test_list_documents_empty(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{KYC_PREFIX}/documents", headers=auth_headers(test_user))
        assert resp.status_code == 200
        assert resp.json() == [] or isinstance(resp.json(), list)


@pytest.mark.asyncio
class TestKycStatus:
    async def test_get_kyc_status_not_started(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{KYC_PREFIX}/status", headers=auth_headers(test_user))
        assert resp.status_code == 200
        data = resp.json()
        assert data["kyc_status"] == "NOT_STARTED"

    async def test_status_changes_after_submit(self, client: AsyncClient, test_user: User):
        await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
            headers=auth_headers(test_user),
        )
        resp = await client.get(f"{KYC_PREFIX}/status", headers=auth_headers(test_user))
        assert resp.status_code == 200
        assert resp.json()["kyc_status"] == "IN_PROGRESS"


@pytest.mark.asyncio
class TestKycSubmitForReview:
    @patch("app.routers.kyc.upload_document", new_callable=AsyncMock, side_effect=_fake_upload)
    @patch("app.routers.kyc.generate_presigned_url", side_effect=_fake_presigned)
    async def test_submit_for_review_missing_docs(self, mock_presign, mock_upload, client: AsyncClient, test_user: User):
        """Should fail when not all documents are uploaded."""
        await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
            headers=auth_headers(test_user),
        )
        resp = await client.post(f"{KYC_PREFIX}/submit-for-review", headers=auth_headers(test_user))
        assert resp.status_code == 400
        assert "missing" in resp.json()["detail"].lower()

    @patch("app.routers.kyc.upload_document", new_callable=AsyncMock, side_effect=_fake_upload)
    @patch("app.routers.kyc.generate_presigned_url", side_effect=_fake_presigned)
    async def test_submit_for_review_success(self, mock_presign, mock_upload, client: AsyncClient, test_user: User):
        """Upload all 3 docs then submit for review."""
        await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
            headers=auth_headers(test_user),
        )

        for doc_type in ["PAN", "AADHAAR", "SELFIE"]:
            fake_file = io.BytesIO(b"fake data for " + doc_type.encode())
            await client.post(
                f"{KYC_PREFIX}/documents/upload?document_type={doc_type}",
                files={"file": (f"{doc_type.lower()}.png", fake_file, "image/png")},
                headers=auth_headers(test_user),
            )

        resp = await client.post(f"{KYC_PREFIX}/submit-for-review", headers=auth_headers(test_user))
        assert resp.status_code == 200
        assert resp.json()["kyc_status"] == "UNDER_REVIEW"


@pytest.mark.asyncio
class TestKycDeleteDocument:
    @patch("app.routers.kyc.upload_document", new_callable=AsyncMock, side_effect=_fake_upload)
    @patch("app.routers.kyc.generate_presigned_url", side_effect=_fake_presigned)
    async def test_delete_document(self, mock_presign, mock_upload, client: AsyncClient, test_user: User):
        await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test User",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
            headers=auth_headers(test_user),
        )
        fake_file = io.BytesIO(b"fake PAN")
        upload_resp = await client.post(
            f"{KYC_PREFIX}/documents/upload?document_type=PAN",
            files={"file": ("pan.png", fake_file, "image/png")},
            headers=auth_headers(test_user),
        )
        doc_id = upload_resp.json()["id"]

        resp = await client.delete(f"{KYC_PREFIX}/documents/{doc_id}", headers=auth_headers(test_user))
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

    async def test_delete_nonexistent_document(self, client: AsyncClient, test_user: User):
        fake_id = str(uuid.uuid4())
        resp = await client.delete(f"{KYC_PREFIX}/documents/{fake_id}", headers=auth_headers(test_user))
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestKycUnauthorized:
    async def test_submit_without_auth(self, client: AsyncClient):
        resp = await client.post(
            f"{KYC_PREFIX}/submit",
            json={
                "full_name": "Test",
                "pan_number": "ABCDE1234F",
                "date_of_birth": "1990-01-15",
                "address": "123 Test Street, Bangalore",
                "city": "Bangalore",
                "pincode": "560001",
            },
        )
        assert resp.status_code == 401

    async def test_list_docs_without_auth(self, client: AsyncClient):
        resp = await client.get(f"{KYC_PREFIX}/documents")
        assert resp.status_code == 401


# ── Bank Details Tests ───────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestBankCreate:
    async def test_create_bank_detail(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            BANK_PREFIX,
            json={
                "account_holder_name": "Test User",
                "account_number": "12345678901234",
                "ifsc_code": "HDFC0001234",
                "bank_name": "HDFC Bank",
                "branch_name": "MG Road",
                "account_type": "savings",
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["bank_name"] == "HDFC Bank"
        assert data["account_holder_name"] == "Test User"
        assert "••••" in data["account_number_masked"]
        assert data["ifsc_code"] == "HDFC0001234"
        assert data["account_type"] == "savings"

    async def test_create_bank_invalid_ifsc(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            BANK_PREFIX,
            json={
                "account_holder_name": "Test User",
                "account_number": "12345678901234",
                "ifsc_code": "INVALID",
                "bank_name": "Test Bank",
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 422

    async def test_create_bank_short_account(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            BANK_PREFIX,
            json={
                "account_holder_name": "Test User",
                "account_number": "123",  # Too short
                "ifsc_code": "HDFC0001234",
                "bank_name": "Test Bank",
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestBankList:
    async def test_list_bank_details_empty(self, client: AsyncClient, test_user: User):
        resp = await client.get(BANK_PREFIX, headers=auth_headers(test_user))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_after_create(self, client: AsyncClient, test_user: User):
        await client.post(
            BANK_PREFIX,
            json={
                "account_holder_name": "Test User",
                "account_number": "12345678901234",
                "ifsc_code": "HDFC0001234",
                "bank_name": "HDFC Bank",
            },
            headers=auth_headers(test_user),
        )
        resp = await client.get(BANK_PREFIX, headers=auth_headers(test_user))
        assert resp.status_code == 200
        banks = resp.json()
        assert len(banks) >= 1
        assert banks[0]["bank_name"] == "HDFC Bank"


@pytest.mark.asyncio
class TestBankUpdate:
    async def test_update_bank_detail(self, client: AsyncClient, test_user: User):
        # Create first
        create_resp = await client.post(
            BANK_PREFIX,
            json={
                "account_holder_name": "Test User",
                "account_number": "12345678901234",
                "ifsc_code": "HDFC0001234",
                "bank_name": "HDFC Bank",
            },
            headers=auth_headers(test_user),
        )
        bank_id = create_resp.json()["id"]

        # Update
        resp = await client.put(
            f"{BANK_PREFIX}/{bank_id}",
            json={"bank_name": "ICICI Bank", "branch_name": "Whitefield"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["bank_name"] == "ICICI Bank"
        assert data["branch_name"] == "Whitefield"

    async def test_update_nonexistent_bank(self, client: AsyncClient, test_user: User):
        fake_id = str(uuid.uuid4())
        resp = await client.put(
            f"{BANK_PREFIX}/{fake_id}",
            json={"bank_name": "Test"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestBankDelete:
    async def test_delete_bank_detail(self, client: AsyncClient, test_user: User):
        create_resp = await client.post(
            BANK_PREFIX,
            json={
                "account_holder_name": "Test User",
                "account_number": "12345678901234",
                "ifsc_code": "HDFC0001234",
                "bank_name": "Delete Me Bank",
            },
            headers=auth_headers(test_user),
        )
        bank_id = create_resp.json()["id"]

        resp = await client.delete(f"{BANK_PREFIX}/{bank_id}", headers=auth_headers(test_user))
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

        # Verify it's gone
        get_resp = await client.get(f"{BANK_PREFIX}/{bank_id}", headers=auth_headers(test_user))
        assert get_resp.status_code == 404

    async def test_delete_nonexistent_bank(self, client: AsyncClient, test_user: User):
        fake_id = str(uuid.uuid4())
        resp = await client.delete(f"{BANK_PREFIX}/{fake_id}", headers=auth_headers(test_user))
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestBankUnauthorized:
    async def test_create_without_auth(self, client: AsyncClient):
        resp = await client.post(
            BANK_PREFIX,
            json={
                "account_holder_name": "Test",
                "account_number": "12345678901234",
                "ifsc_code": "HDFC0001234",
                "bank_name": "Test Bank",
            },
        )
        assert resp.status_code == 401

    async def test_list_without_auth(self, client: AsyncClient):
        resp = await client.get(BANK_PREFIX)
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestBankEncryption:
    async def test_encrypted_data_is_masked(self, client: AsyncClient, test_user: User):
        """Verify that the API returns masked account numbers, not raw data."""
        resp = await client.post(
            BANK_PREFIX,
            json={
                "account_holder_name": "Secure User",
                "account_number": "98765432109876",
                "ifsc_code": "SBIN0001234",
                "bank_name": "SBI",
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        data = resp.json()
        # Account number should be masked
        assert data["account_number_masked"] == "••••••••9876"
        # But other fields should be decrypted properly
        assert data["account_holder_name"] == "Secure User"
        assert data["ifsc_code"] == "SBIN0001234"
        assert data["bank_name"] == "SBI"
