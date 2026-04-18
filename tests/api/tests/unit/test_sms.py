"""Unit tests for SMS / WhatsApp service (Twilio)."""

from unittest.mock import patch, MagicMock, AsyncMock

import pytest

import app.services.sms as sms_mod


@pytest.fixture()
def twilio_settings():
    mock = MagicMock()
    mock.twilio_account_sid = "AC_test_sid"
    mock.twilio_auth_token = "test_token"
    mock.twilio_phone_number = "+15551234567"
    mock.twilio_whatsapp_number = "+15559876543"
    return mock


@pytest.fixture()
def no_twilio_settings():
    mock = MagicMock()
    mock.twilio_account_sid = ""
    mock.twilio_auth_token = ""
    return mock


class TestSendOtpSms:
    @pytest.mark.asyncio
    async def test_returns_false_when_not_configured(self, no_twilio_settings):
        with patch.object(sms_mod, "get_settings", return_value=no_twilio_settings):
            result = await sms_mod.send_otp_sms("+919876543210", "123456")
        assert result is False

    @pytest.mark.asyncio
    async def test_returns_true_on_success(self, twilio_settings):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {"sid": "SM_test123"}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch.object(sms_mod, "get_settings", return_value=twilio_settings):
            with patch.object(sms_mod.httpx, "AsyncClient", return_value=mock_client):
                result = await sms_mod.send_otp_sms("+919876543210", "654321")
        assert result is True
        mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_false_on_exception(self, twilio_settings):
        mock_client = AsyncMock()
        mock_client.post.side_effect = Exception("network error")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch.object(sms_mod, "get_settings", return_value=twilio_settings):
            with patch.object(sms_mod.httpx, "AsyncClient", return_value=mock_client):
                result = await sms_mod.send_otp_sms("+919876543210", "111111")
        assert result is False


class TestSendOtpWhatsapp:
    @pytest.mark.asyncio
    async def test_returns_false_when_not_configured(self, no_twilio_settings):
        with patch.object(sms_mod, "get_settings", return_value=no_twilio_settings):
            result = await sms_mod.send_otp_whatsapp("+919876543210", "123456")
        assert result is False

    @pytest.mark.asyncio
    async def test_returns_true_on_success(self, twilio_settings):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {"sid": "WA_test123"}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch.object(sms_mod, "get_settings", return_value=twilio_settings):
            with patch.object(sms_mod.httpx, "AsyncClient", return_value=mock_client):
                result = await sms_mod.send_otp_whatsapp("+919876543210", "654321")
        assert result is True
        # Verify WhatsApp prefix
        call_data = mock_client.post.call_args[1]["data"]
        assert call_data["From"].startswith("whatsapp:")
        assert call_data["To"].startswith("whatsapp:")
