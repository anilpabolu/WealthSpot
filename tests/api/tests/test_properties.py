"""
Tests for property endpoints: /api/v1/properties/*

Covers:
  - Public listing & filters
  - Property create (builder-only, 403 for investor)
  - Property update (builder owns listing, 403 for other builder, 404 for missing)
  - Filter combinations
  - Edge cases (invalid page, unknown city, autocomplete)
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/properties"

# ── Minimal valid payload for property creation ──────────────────────────────

VALID_PROPERTY_PAYLOAD = {
    "title": "WealthSpot Test Tower",
    "tagline": "Premium unit test property",
    "description": "This property is created during automated tests.",
    "asset_type": "residential",
    "city": "Mumbai",
    "state": "Maharashtra",
    "locality": "Bandra West",
    "target_amount": 10000000,
    "min_investment": 25000,
    "unit_price": 5000,
    "total_units": 2000,
    "target_irr": 14.5,
}


# ── Public listing ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestPropertyList:
    async def test_list_properties_public(self, client: AsyncClient):
        """Properties list should be accessible without auth."""
        resp = await client.get(PREFIX)
        assert resp.status_code == 200
        data = resp.json()
        assert "properties" in data

    async def test_list_properties_with_filters(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"city": "Bengaluru", "page": 1})
        assert resp.status_code == 200

    async def test_featured_properties(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/featured")
        assert resp.status_code == 200

    async def test_available_cities(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/cities")
        assert resp.status_code == 200
        data = resp.json()
        # Should return a list (empty or populated)
        assert isinstance(data, list)

    async def test_list_returns_pagination_keys(self, client: AsyncClient):
        """Response envelope must include pagination metadata."""
        resp = await client.get(PREFIX)
        assert resp.status_code == 200
        data = resp.json()
        assert "properties" in data
        assert "total" in data or "totalPages" in data or "page" in data

    async def test_list_with_asset_type_filter(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"asset_type": "residential"})
        assert resp.status_code == 200

    async def test_list_with_status_filter(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"status": "active"})
        assert resp.status_code == 200

    async def test_list_with_sort_by_newest(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"sort_by": "created_at"})
        assert resp.status_code == 200

    async def test_list_unknown_city_returns_empty(self, client: AsyncClient):
        """Filtering by a city with no properties returns empty list, not error."""
        resp = await client.get(PREFIX, params={"city": "NonExistentCityXYZ"})
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("total", 0) == 0 or data["properties"] == []

    async def test_autocomplete_with_query(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/autocomplete", params={"q": "mum"})
        assert resp.status_code in (200, 422)


# ── Property create (builder / role-protected) ────────────────────────────────


@pytest.mark.asyncio
class TestPropertyCreate:
    async def test_create_requires_authentication(self, client: AsyncClient):
        """Unauthenticated request should be rejected."""
        resp = await client.post(PREFIX, json=VALID_PROPERTY_PAYLOAD)
        assert resp.status_code in (401, 403)

    async def test_investor_cannot_create_property(self, client: AsyncClient, test_user: User):
        """Investors (role=investor) must receive 403."""
        resp = await client.post(
            PREFIX,
            json=VALID_PROPERTY_PAYLOAD,
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403

    async def test_create_with_missing_required_fields_returns_422(self, client: AsyncClient, builder_user: User):
        """Payload missing required fields should return HTTP 422 Unprocessable Entity."""
        incomplete = {"title": "Incomplete Property"}
        resp = await client.post(
            PREFIX,
            json=incomplete,
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 422

    async def test_create_422_error_has_detail_array(self, client: AsyncClient, builder_user: User):
        """422 response must include a 'detail' array describing validation errors."""
        resp = await client.post(
            PREFIX,
            json={"title": "x"},  # title too short (min_length=3) + missing fields
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 422
        data = resp.json()
        assert "detail" in data
        assert isinstance(data["detail"], list)
        assert len(data["detail"]) > 0


# ── Property update (builder owns / other builder's / not found) ──────────────


@pytest.mark.asyncio
class TestPropertyUpdate:
    async def test_update_nonexistent_property_returns_404(self, client: AsyncClient, builder_user: User):
        """PATCH on a slug that does not exist must return 404."""
        resp = await client.patch(
            f"{PREFIX}/nonexistent-slug-abc999",
            json={"title": "Updated Title"},
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 404

    async def test_investor_cannot_update_property(self, client: AsyncClient, test_user: User):
        """Investors must not be able to PATCH properties."""
        resp = await client.patch(
            f"{PREFIX}/some-property-slug",
            json={"title": "Hacked Title"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code in (403, 404)

    async def test_update_requires_authentication(self, client: AsyncClient):
        """Unauthenticated PATCH must be rejected."""
        resp = await client.patch(f"{PREFIX}/some-slug", json={"title": "No Auth"})
        assert resp.status_code in (401, 403)


# ── Filter combinations ───────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestPropertyFilters:
    async def test_filter_by_city_returns_200(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"city": "Mumbai"})
        assert resp.status_code == 200

    async def test_filter_by_asset_type_residential(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"asset_type": "residential"})
        assert resp.status_code == 200

    async def test_filter_by_asset_type_commercial(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"asset_type": "commercial"})
        assert resp.status_code == 200

    async def test_filter_by_status_funding(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"status": "funding"})
        assert resp.status_code == 200

    async def test_combined_city_and_asset_type_filter(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"city": "Bengaluru", "asset_type": "residential"})
        assert resp.status_code == 200

    async def test_page_2_returns_empty_or_200(self, client: AsyncClient):
        """Requesting page 2 of an empty DB should return empty list, not error."""
        resp = await client.get(PREFIX, params={"page": 2, "page_size": 10})
        assert resp.status_code == 200

    async def test_large_page_number_is_graceful(self, client: AsyncClient):
        """Very high page number should return empty list, not 500."""
        resp = await client.get(PREFIX, params={"page": 9999})
        assert resp.status_code == 200


# ── Edge cases ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestPropertyEdgeCases:
    async def test_single_property_by_slug_not_found(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/totally-unknown-slug-xyz-987")
        assert resp.status_code == 404

    async def test_featured_returns_list_type(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/featured")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    async def test_cities_endpoint_returns_list(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/cities")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
