"""Unit tests for payment service (Razorpay)."""

import hashlib
import hmac
from decimal import Decimal
from unittest.mock import patch, MagicMock

import pytest

import app.services.payment as pay_mod


@pytest.fixture(autouse=True)
def mock_settings():
    """Patch module-level settings with test credentials."""
    mock = MagicMock()
    mock.razorpay_key_id = "rzp_test_key"
    mock.razorpay_key_secret = "rzp_test_secret"
    with patch.object(pay_mod, "settings", mock):
        yield mock


class TestCreateOrder:
    def test_creates_order_with_paise(self, mock_settings):
        mock_client = MagicMock()
        mock_client.order.create.return_value = {"id": "order_123", "amount": 100000}
        with patch.object(pay_mod, "_get_client", return_value=mock_client):
            result = pay_mod.create_order(Decimal("1000.00"), "rcpt-001")

        mock_client.order.create.assert_called_once()
        call_data = mock_client.order.create.call_args[1]["data"]
        assert call_data["amount"] == 100000  # 1000 INR = 100000 paise
        assert call_data["currency"] == "INR"
        assert call_data["receipt"] == "rcpt-001"
        assert call_data["payment_capture"] == 1
        assert result["id"] == "order_123"

    def test_includes_notes_when_provided(self, mock_settings):
        mock_client = MagicMock()
        mock_client.order.create.return_value = {}
        with patch.object(pay_mod, "_get_client", return_value=mock_client):
            pay_mod.create_order(Decimal("500"), "rcpt-002", notes={"key": "val"})

        call_data = mock_client.order.create.call_args[1]["data"]
        assert call_data["notes"] == {"key": "val"}

    def test_omits_notes_when_none(self, mock_settings):
        mock_client = MagicMock()
        mock_client.order.create.return_value = {}
        with patch.object(pay_mod, "_get_client", return_value=mock_client):
            pay_mod.create_order(Decimal("100"), "rcpt-003")

        call_data = mock_client.order.create.call_args[1]["data"]
        assert "notes" not in call_data


class TestVerifyPaymentSignature:
    def test_valid_signature(self, mock_settings):
        order_id = "order_abc"
        payment_id = "pay_xyz"
        message = f"{order_id}|{payment_id}"
        sig = hmac.new(
            mock_settings.razorpay_key_secret.encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()
        assert pay_mod.verify_payment_signature(order_id, payment_id, sig) is True

    def test_invalid_signature(self, mock_settings):
        assert pay_mod.verify_payment_signature("order_1", "pay_1", "bad_sig") is False

    def test_tampered_order_id(self, mock_settings):
        order_id = "order_real"
        payment_id = "pay_real"
        message = f"{order_id}|{payment_id}"
        sig = hmac.new(
            mock_settings.razorpay_key_secret.encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()
        # Different order_id should fail
        assert pay_mod.verify_payment_signature("order_fake", payment_id, sig) is False
