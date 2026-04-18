"""Unit tests for points service."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import app.services.points as pts_mod


@pytest.fixture()
def mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    return db


def _make_config_result(value):
    """Create a mock DB execute result returning a PlatformConfig scalar."""
    cfg = MagicMock()
    cfg.value = value
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = cfg
    return mock_result


class TestGetPointValue:
    @pytest.mark.asyncio
    async def test_returns_int_value(self, mock_db):
        mock_db.execute.return_value = _make_config_result(10)
        result = await pts_mod._get_point_value(mock_db, "signup")
        assert result == 10

    @pytest.mark.asyncio
    async def test_returns_value_from_dict(self, mock_db):
        mock_db.execute.return_value = _make_config_result({"value": 25})
        result = await pts_mod._get_point_value(mock_db, "referral")
        assert result == 25

    @pytest.mark.asyncio
    async def test_returns_zero_when_not_found(self, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        result = await pts_mod._get_point_value(mock_db, "unknown_action")
        assert result == 0

    @pytest.mark.asyncio
    async def test_returns_zero_on_invalid_value(self, mock_db):
        mock_db.execute.return_value = _make_config_result("not-a-number")
        result = await pts_mod._get_point_value(mock_db, "bad")
        assert result == 0


class TestAwardPoints:
    @pytest.mark.asyncio
    async def test_awards_points(self, mock_db):
        mock_db.execute.return_value = _make_config_result(15)
        result = await pts_mod.award_points(
            mock_db, user_id="user-123", action="signup"
        )
        assert result == 15
        mock_db.add.assert_called_once()
        mock_db.flush.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_returns_zero_for_unknown_action(self, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        result = await pts_mod.award_points(
            mock_db, user_id="user-123", action="nonexistent"
        )
        assert result == 0
        mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_includes_reference(self, mock_db):
        mock_db.execute.return_value = _make_config_result(5)
        await pts_mod.award_points(
            mock_db,
            user_id="user-1",
            action="invest",
            reference_type="opportunity",
            reference_id="opp-1",
            description="Investment in Sky Tower",
        )
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.reference_type == "opportunity"
        assert added_obj.reference_id == "opp-1"
        assert added_obj.description == "Investment in Sky Tower"
