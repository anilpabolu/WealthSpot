"""Unit tests for Redis cache service."""

import json
from unittest.mock import patch, MagicMock

import pytest

import app.services.cache as cache_mod


@pytest.fixture(autouse=True)
def reset_redis():
    """Reset module-level singleton between tests."""
    cache_mod._redis_client = None
    yield
    cache_mod._redis_client = None


@pytest.fixture()
def mock_redis():
    """Provide a mock Redis client that is already set as the global singleton."""
    client = MagicMock()
    client.ping.return_value = True
    cache_mod._redis_client = client
    return client


class TestCacheGet:
    def test_returns_deserialized_value(self, mock_redis):
        mock_redis.get.return_value = json.dumps({"x": 1})
        result = cache_mod.cache_get("test-key")
        assert result == {"x": 1}
        mock_redis.get.assert_called_once_with("test-key")

    def test_returns_none_on_miss(self, mock_redis):
        mock_redis.get.return_value = None
        assert cache_mod.cache_get("missing") is None

    def test_returns_none_when_redis_unavailable(self):
        # _redis_client is None and _get_redis will fail
        with patch.object(cache_mod, "_get_redis", return_value=None):
            assert cache_mod.cache_get("key") is None

    def test_returns_none_on_exception(self, mock_redis):
        mock_redis.get.side_effect = Exception("connection lost")
        assert cache_mod.cache_get("key") is None


class TestCacheSet:
    def test_sets_value_with_ttl(self, mock_redis):
        cache_mod.cache_set("k", {"a": 1}, ttl_seconds=60)
        mock_redis.setex.assert_called_once_with("k", 60, json.dumps({"a": 1}))

    def test_default_ttl_300(self, mock_redis):
        cache_mod.cache_set("k", "v")
        _, args, _ = mock_redis.setex.mock_calls[0]
        assert args[1] == 300

    def test_noop_when_redis_unavailable(self):
        with patch.object(cache_mod, "_get_redis", return_value=None):
            # Should not raise
            cache_mod.cache_set("k", "v")

    def test_swallows_exceptions(self, mock_redis):
        mock_redis.setex.side_effect = Exception("write fail")
        # Should not raise
        cache_mod.cache_set("k", "v")


class TestMakeCacheKey:
    def test_returns_prefixed_key(self):
        key = cache_mod.make_cache_key("xirr", "user123", "opp456")
        assert key.startswith("ws:xirr:")
        assert len(key.split(":")) == 3

    def test_deterministic(self):
        a = cache_mod.make_cache_key("test", "a", "b")
        b = cache_mod.make_cache_key("test", "a", "b")
        assert a == b

    def test_different_parts_different_key(self):
        a = cache_mod.make_cache_key("test", "x")
        b = cache_mod.make_cache_key("test", "y")
        assert a != b

    def test_digest_length_16(self):
        key = cache_mod.make_cache_key("pfx", "data")
        digest = key.split(":")[-1]
        assert len(digest) == 16


class TestGetRedis:
    def test_returns_none_when_connect_fails(self):
        mock_settings = MagicMock()
        mock_settings.redis_url = "redis://localhost:9999/0"
        with patch.object(cache_mod, "get_settings", return_value=mock_settings):
            with patch.object(cache_mod.redis, "from_url", side_effect=Exception("conn")):
                result = cache_mod._get_redis()
        assert result is None
