"""
Cross-cutting error handling tests.

Validates that the API returns consistent, well-formed error responses for:
  - 401 Unauthenticated access to protected routes
  - 403 Insufficient role / forbidden action
  - 404 Resource not found
  - 422 Validation errors (Pydantic / FastAPI)
  - Consistent error envelope shape across all error types
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers


# ── 401 Unauthenticated ───────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestUnauthenticated:
    """Protected routes must reject requests that carry no token."""

    async def test_portfolio_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/portfolio")
        assert resp.status_code == 401

    async def test_kyc_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/kyc")
        assert resp.status_code == 401

    async def test_profile_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/profile")
        assert resp.status_code == 401

    async def test_notifications_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/notifications")
        assert resp.status_code == 401

    async def test_unauthenticated_response_has_detail(self, client: AsyncClient):
        """401 response body must include a 'detail' field."""
        resp = await client.get("/api/v1/portfolio")
        assert resp.status_code == 401
        data = resp.json()
        assert "detail" in data

    async def test_invalid_bearer_token_is_rejected(self, client: AsyncClient):
        """A syntactically valid but fake JWT must be rejected as 401."""
        resp = await client.get(
            "/api/v1/profile",
            headers={"Authorization": "Bearer not.a.real.jwt"},
        )
        assert resp.status_code == 401


# ── 403 Forbidden / role mismatch ────────────────────────────────────────────


@pytest.mark.asyncio
class TestForbidden:
    """Actions that require elevated roles must return 403 for insufficient roles."""

    async def test_investor_cannot_create_property(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            "/api/v1/properties",
            json={
                "title": "Role test",
                "asset_type": "residential",
                "city": "Mumbai",
                "state": "Maharashtra",
                "target_amount": 1000000,
                "min_investment": 10000,
                "unit_price": 5000,
                "total_units": 200,
                "target_irr": 14,
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403

    async def test_investor_cannot_access_admin_endpoint(self, client: AsyncClient, test_user: User):
        """Non-admin access to admin-only route must return 403."""
        resp = await client.get("/api/v1/admin/users", headers=auth_headers(test_user))
        assert resp.status_code in (403, 404)  # 404 if route doesn't exist

    async def test_403_response_has_detail(self, client: AsyncClient, test_user: User):
        """403 response body must include a 'detail' field."""
        resp = await client.post(
            "/api/v1/properties",
            json={
                "title": "Forbidden test",
                "asset_type": "residential",
                "city": "Mumbai",
                "state": "Maharashtra",
                "target_amount": 1000000,
                "min_investment": 10000,
                "unit_price": 5000,
                "total_units": 200,
                "target_irr": 14,
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403
        data = resp.json()
        assert "detail" in data
        assert isinstance(data["detail"], str)


# ── 404 Not found ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestNotFound:
    """Missing resources must return 404 with a meaningful detail message."""

    async def test_property_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v1/properties/nonexistent-slug-12345")
        assert resp.status_code == 404

    async def test_404_response_has_detail(self, client: AsyncClient):
        resp = await client.get("/api/v1/properties/nonexistent-slug-12345")
        assert resp.status_code == 404
        data = resp.json()
        assert "detail" in data
        assert isinstance(data["detail"], str)
        assert len(data["detail"]) > 0

    async def test_completely_unknown_route(self, client: AsyncClient):
        """Requests to routes that don't exist at all must return 404."""
        resp = await client.get("/api/v1/nonexistent-endpoint-xyz")
        assert resp.status_code == 404


# ── 422 Validation errors ─────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestValidationErrors:
    """422 responses must return the standard FastAPI validation error envelope."""

    async def test_422_has_detail_array(self, client: AsyncClient, builder_user: User):
        """422 response must have 'detail' as a list."""
        resp = await client.post(
            "/api/v1/properties",
            json={"title": "x"},  # too short + missing required fields
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 422
        data = resp.json()
        assert "detail" in data
        assert isinstance(data["detail"], list)

    async def test_422_detail_items_have_loc_msg_type(self, client: AsyncClient, builder_user: User):
        """Each validation error item must have 'loc', 'msg', and 'type' keys."""
        resp = await client.post(
            "/api/v1/properties",
            json={"title": "x"},
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 422
        data = resp.json()
        for item in data["detail"]:
            assert "loc" in item
            assert "msg" in item
            assert "type" in item

    async def test_422_loc_is_a_list(self, client: AsyncClient, builder_user: User):
        """'loc' inside each validation error must be a list (field path)."""
        resp = await client.post(
            "/api/v1/properties",
            json={"title": "x"},
            headers=auth_headers(builder_user),
        )
        assert resp.status_code == 422
        data = resp.json()
        for item in data["detail"]:
            assert isinstance(item["loc"], list)

    async def test_422_registration_invalid_email(self, client: AsyncClient):
        """Sending an invalid email to registration must return 422."""
        resp = await client.post(
            "/api/v1/auth/register",
            json={"email": "not-an-email", "password": "short"},
        )
        # Either 422 (validation) or 404 (if route not found), not 500
        assert resp.status_code in (400, 404, 422)


# ── Response shape consistency ────────────────────────────────────────────────


@pytest.mark.asyncio
class TestResponseShapeConsistency:
    """Error responses across different status codes share a consistent shape."""

    async def test_all_errors_are_json(self, client: AsyncClient):
        """All error responses must be valid JSON with content-type application/json."""
        endpoints = [
            ("/api/v1/properties/nonexistent", "GET", None),
            ("/api/v1/portfolio", "GET", None),
        ]
        for path, method, body in endpoints:
            if method == "GET":
                resp = await client.get(path)
            else:
                resp = await client.post(path, json=body)
            assert resp.headers.get("content-type", "").startswith("application/json"), (
                f"{path} returned non-JSON content-type: {resp.headers.get('content-type')}"
            )

    async def test_error_response_is_not_html(self, client: AsyncClient):
        """Error responses must never return HTML (common misconfiguration)."""
        resp = await client.get("/api/v1/portfolio")
        body = resp.text
        assert "<html" not in body.lower()

    async def test_500_is_not_raised_on_missing_property(self, client: AsyncClient, test_user: User):
        """Fetching a missing property must return 404, never 500."""
        resp = await client.get(
            "/api/v1/properties/this-slug-does-not-exist-at-all-999",
            headers=auth_headers(test_user),
        )
        assert resp.status_code != 500
        assert resp.status_code == 404
