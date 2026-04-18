"""Unit tests for S3 storage service."""

from io import BytesIO
from unittest.mock import patch, MagicMock, AsyncMock

import pytest

import app.services.s3 as s3_mod


@pytest.fixture(autouse=True)
def mock_settings():
    mock = MagicMock()
    mock.aws_access_key_id = "AKIA_TEST"
    mock.aws_secret_access_key = "secret_test"
    mock.aws_region = "ap-south-1"
    mock.aws_s3_bucket = "ws-test-bucket"
    mock.s3_endpoint_url = ""
    mock.s3_public_url = ""
    with patch.object(s3_mod, "settings", mock):
        yield mock


class TestGetPublicUrl:
    def test_default_s3_url(self, mock_settings):
        url = s3_mod.get_public_url("images/photo.jpg")
        assert url == "https://ws-test-bucket.s3.ap-south-1.amazonaws.com/images/photo.jpg"

    def test_custom_public_url(self, mock_settings):
        mock_settings.s3_public_url = "https://cdn.example.com"
        url = s3_mod.get_public_url("images/photo.jpg")
        assert url == "https://cdn.example.com/images/photo.jpg"

    def test_strips_trailing_slash(self, mock_settings):
        mock_settings.s3_public_url = "https://cdn.example.com/"
        url = s3_mod.get_public_url("file.pdf")
        assert url == "https://cdn.example.com/file.pdf"


class TestUploadFile:
    @pytest.mark.asyncio
    async def test_upload_returns_key(self, mock_settings):
        mock_s3 = MagicMock()
        with patch.object(s3_mod, "_get_s3_client", return_value=mock_s3):
            with patch.object(s3_mod.anyio.to_thread, "run_sync", new_callable=AsyncMock):
                result = await s3_mod.upload_file(BytesIO(b"data"), "test/key.txt", "text/plain")
        assert result == "test/key.txt"


class TestUploadOpportunityMedia:
    @pytest.mark.asyncio
    async def test_key_format(self, mock_settings):
        with patch.object(s3_mod, "upload_file", new_callable=AsyncMock) as mock_upload:
            mock_upload.return_value = "opportunities/opp1/image/abc_photo.jpg"
            result = await s3_mod.upload_opportunity_media(
                BytesIO(b"img"), "photo.jpg", "opp1", "image", "image/jpeg"
            )
        assert "opportunities/opp1/image/" in mock_upload.call_args[0][1]
        assert result.startswith("opportunities/")

    @pytest.mark.asyncio
    async def test_replaces_spaces_in_filename(self, mock_settings):
        with patch.object(s3_mod, "upload_file", new_callable=AsyncMock) as mock_upload:
            mock_upload.return_value = "key"
            await s3_mod.upload_opportunity_media(
                BytesIO(b"img"), "my photo.jpg", "opp1", "image"
            )
        key_arg = mock_upload.call_args[0][1]
        assert " " not in key_arg


class TestUploadDocument:
    @pytest.mark.asyncio
    async def test_key_format(self, mock_settings):
        with patch.object(s3_mod, "upload_file", new_callable=AsyncMock) as mock_upload:
            mock_upload.return_value = "kyc/user1/pan/abc_pan.pdf"
            await s3_mod.upload_document(BytesIO(b"pdf"), "pan.pdf", "user1", "pan")
        key_arg = mock_upload.call_args[0][1]
        assert key_arg.startswith("kyc/user1/pan/")


class TestUploadTemplate:
    @pytest.mark.asyncio
    async def test_key_format(self, mock_settings):
        with patch.object(s3_mod, "upload_file", new_callable=AsyncMock) as mock_upload:
            mock_upload.return_value = "templates/user1/abc_sheet.xlsx"
            await s3_mod.upload_template(BytesIO(b"xls"), "sheet.xlsx", "user1")
        key_arg = mock_upload.call_args[0][1]
        assert key_arg.startswith("templates/user1/")


class TestGeneratePresignedUrl:
    def test_calls_s3_client(self, mock_settings):
        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = "https://signed.example.com/obj?sig=abc"
        with patch.object(s3_mod, "_get_s3_client", return_value=mock_s3):
            url = s3_mod.generate_presigned_url("doc/key.pdf", expires_in=600)
        mock_s3.generate_presigned_url.assert_called_once()
        assert url.startswith("https://")

    def test_default_expires_in_3600(self, mock_settings):
        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = "url"
        with patch.object(s3_mod, "_get_s3_client", return_value=mock_s3):
            s3_mod.generate_presigned_url("key")
        call_kwargs = mock_s3.generate_presigned_url.call_args
        assert call_kwargs[1]["ExpiresIn"] == 3600


class TestDeleteFile:
    @pytest.mark.asyncio
    async def test_calls_delete_object(self, mock_settings):
        mock_s3 = MagicMock()
        with patch.object(s3_mod, "_get_s3_client", return_value=mock_s3):
            with patch.object(s3_mod.anyio.to_thread, "run_sync", new_callable=AsyncMock) as mock_run:
                await s3_mod.delete_file("old/key.pdf")
        mock_run.assert_called_once()
