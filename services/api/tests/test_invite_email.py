from unittest.mock import MagicMock, patch

import pytest

from app.services.email import send_admin_invite_email


@pytest.mark.asyncio
async def test_send_admin_invite_email_success():
    """Test that the admin invite email sends successfully."""
    # We mock the _send_smtp blocking function to not actually send a real email
    with (
        patch("app.services.email._send_smtp") as mock_send,
        patch("app.services.email.get_settings") as mock_settings,
    ):
        # Mock settings to pretend SMTP is configured
        mock_env = MagicMock()
        mock_env.smtp_host = "smtp.resend.com"
        mock_env.smtp_from_email = "no-reply@wealthspot.in"
        mock_env.smtp_username = "hello@wealthspot.in"
        mock_env.smtp_from_name = "WealthSpot"
        mock_settings.return_value = mock_env

        result = await send_admin_invite_email(
            to_email="anilkumar.pabolu@gmail.com",
            invite_link="https://wealthspot.in/invite/dummy-token",
            role="super_admin",
        )

        # Verify the email was flagged as sent
        assert result is True
        # Verify that the SMTP send function was actually called exactly once
        mock_send.assert_called_once()

        # Verify the email message contents
        sent_msg = mock_send.call_args[0][0]
        assert sent_msg["To"] == "anilkumar.pabolu@gmail.com"
        assert sent_msg["Reply-To"] == "work.wealthspot@gmail.com"
        assert sent_msg["Subject"] == "You've been invited to join WealthSpot as Super Admin"
        assert "WealthSpot" in sent_msg["From"]

        # Verify the content contains the correct link and role
        html_content = sent_msg.get_payload()[1].get_payload(decode=True).decode()
        assert "https://wealthspot.in/invite/dummy-token" in html_content
        assert "Super Admin" in html_content


@pytest.mark.asyncio
async def test_send_admin_invite_email_no_smtp():
    """Test that the function gracefully fails if SMTP is not configured."""
    with patch("app.services.email.get_settings") as mock_settings:
        mock_env = MagicMock()
        mock_env.smtp_host = None  # Pretend SMTP is missing
        mock_settings.return_value = mock_env

        result = await send_admin_invite_email(
            to_email="anilkumar.pabolu@gmail.com",
            invite_link="https://wealthspot.in/invite/dummy-token",
            role="super_admin",
        )

        # Verify it gracefully returned False without crashing
        assert result is False
