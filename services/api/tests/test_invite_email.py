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


from datetime import UTC, datetime

from fastapi import HTTPException

from app.models.admin_invite import AdminInvite
from app.routers.control_centre import accept_invite


@pytest.mark.asyncio
async def test_accept_invite_success():
    """Test that an authenticated user can accept an invite and get the role."""
    mock_db = MagicMock()
    # Mock the database result for the token lookup
    mock_result = MagicMock()
    mock_invite = AdminInvite(
        email="anilkumar.pabolu@gmail.com",
        role="super_admin",
        status="pending",
        token="valid-token-123",
        expires_at=datetime(2099, 1, 1, tzinfo=UTC),
    )
    mock_result.scalar_one_or_none.return_value = mock_invite
    mock_db.execute.return_value = mock_result

    # Mock the authenticated user that comes from the JWT via Depend(get_current_user)
    mock_user = MagicMock()
    mock_user.email = "anilkumar.pabolu@gmail.com"
    mock_user.roles = []

    # Call the endpoint function
    response = await accept_invite("valid-token-123", user=mock_user, db=mock_db)

    # Verify the user was granted the role
    assert mock_user.primary_role == "super_admin"
    assert "super_admin" in mock_user.roles
    assert mock_invite.status == "accepted"
    assert response == {"status": "accepted", "role": "super_admin"}


@pytest.mark.asyncio
async def test_accept_invite_wrong_user():
    """Test that authentication rejects users who try to accept an invite sent to a different email."""
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_invite = AdminInvite(
        email="anilkumar.pabolu@gmail.com",
        role="admin",
        status="pending",
        token="valid-token-123",
        expires_at=datetime(2099, 1, 1, tzinfo=UTC),
    )
    mock_result.scalar_one_or_none.return_value = mock_invite
    mock_db.execute.return_value = mock_result

    # Mock a different authenticated user
    mock_user = MagicMock()
    mock_user.email = "hacker@evil.com"

    # Expect 403 Forbidden because they are authenticated as the wrong user
    with pytest.raises(HTTPException) as exc_info:
        await accept_invite("valid-token-123", user=mock_user, db=mock_db)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Invite was sent to a different email"
