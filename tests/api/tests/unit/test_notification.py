"""Unit tests for notification service."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

import app.services.notification as notif_mod


@pytest.fixture()
def mock_db():
    """Provide a mock AsyncSession."""
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    return db


class TestCreateNotification:
    @pytest.mark.asyncio
    async def test_creates_notification(self, mock_db):
        user_id = uuid4()
        result = await notif_mod.create_notification(
            mock_db,
            user_id=user_id,
            type="test_type",
            title="Test Title",
            body="Test body",
        )
        mock_db.add.assert_called_once()
        mock_db.flush.assert_awaited_once()
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.user_id == user_id
        assert added_obj.title == "Test Title"
        assert added_obj.channel == "in_app"

    @pytest.mark.asyncio
    async def test_custom_channel(self, mock_db):
        result = await notif_mod.create_notification(
            mock_db,
            user_id=uuid4(),
            type="info",
            title="T",
            body="B",
            channel="push",
        )
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.channel == "push"

    @pytest.mark.asyncio
    async def test_includes_data(self, mock_db):
        data = {"key": "value"}
        await notif_mod.create_notification(
            mock_db,
            user_id=uuid4(),
            type="info",
            title="T",
            body="B",
            data=data,
        )
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.data == data


class TestNotifyInvestmentConfirmed:
    @pytest.mark.asyncio
    async def test_creates_investment_notification(self, mock_db):
        user_id = uuid4()
        await notif_mod.notify_investment_confirmed(
            mock_db, user_id, "Green Valley", 50000.0, 5
        )
        added_obj = mock_db.add.call_args[0][0]
        assert "Green Valley" in added_obj.body
        assert "50,000" in added_obj.body
        assert added_obj.data["units"] == 5


class TestNotifyKycStatusChange:
    @pytest.mark.asyncio
    async def test_approved(self, mock_db):
        await notif_mod.notify_kyc_status_change(mock_db, uuid4(), "APPROVED")
        added_obj = mock_db.add.call_args[0][0]
        assert "approved" in added_obj.body.lower()

    @pytest.mark.asyncio
    async def test_rejected_with_reason(self, mock_db):
        await notif_mod.notify_kyc_status_change(
            mock_db, uuid4(), "REJECTED", reason="Blurry ID"
        )
        added_obj = mock_db.add.call_args[0][0]
        assert "Blurry ID" in added_obj.body

    @pytest.mark.asyncio
    async def test_unknown_status_uses_fallback_type(self, mock_db):
        await notif_mod.notify_kyc_status_change(mock_db, uuid4(), "PENDING")
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.type == "kyc_update"


class TestNotifyPayout:
    @pytest.mark.asyncio
    async def test_rental_payout(self, mock_db):
        await notif_mod.notify_payout(mock_db, uuid4(), "Sky Tower", 25000.0, "rental")
        added_obj = mock_db.add.call_args[0][0]
        assert "Sky Tower" in added_obj.body
        assert "rental" in added_obj.body.lower()
        assert added_obj.data["type"] == "rental"

    @pytest.mark.asyncio
    async def test_exit_payout(self, mock_db):
        await notif_mod.notify_payout(mock_db, uuid4(), "Sea View", 100000.0, "exit")
        added_obj = mock_db.add.call_args[0][0]
        assert "exit" in added_obj.body.lower()
