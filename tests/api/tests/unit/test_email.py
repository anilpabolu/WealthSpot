"""Unit tests for email service."""

from unittest.mock import patch, MagicMock, AsyncMock

import pytest

import app.services.email as email_mod


@pytest.fixture()
def smtp_settings():
    """Mock settings with SMTP configured."""
    mock = MagicMock()
    mock.smtp_host = "smtp.test.com"
    mock.smtp_port = 587
    mock.smtp_username = "user@test.com"
    mock.smtp_password = "pass123"
    mock.smtp_from_email = "noreply@wealthspot.in"
    mock.smtp_from_name = "WealthSpot"
    return mock


@pytest.fixture()
def no_smtp_settings():
    """Mock settings with SMTP NOT configured."""
    mock = MagicMock()
    mock.smtp_host = ""
    return mock


class TestSendOtpEmail:
    @pytest.mark.asyncio
    async def test_returns_false_when_smtp_not_configured(self, no_smtp_settings):
        with patch.object(email_mod, "get_settings", return_value=no_smtp_settings):
            result = await email_mod.send_otp_email("user@example.com", "123456")
        assert result is False

    @pytest.mark.asyncio
    async def test_returns_true_on_success(self, smtp_settings):
        with patch.object(email_mod, "get_settings", return_value=smtp_settings):
            with patch.object(email_mod, "_send_smtp") as mock_send:
                with patch.object(email_mod.anyio.to_thread, "run_sync", new_callable=AsyncMock) as mock_run:
                    mock_run.return_value = None
                    result = await email_mod.send_otp_email("user@example.com", "654321")
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_on_exception(self, smtp_settings):
        with patch.object(email_mod, "get_settings", return_value=smtp_settings):
            with patch.object(email_mod.anyio.to_thread, "run_sync", side_effect=Exception("SMTP down")):
                result = await email_mod.send_otp_email("user@example.com", "111111")
        assert result is False
