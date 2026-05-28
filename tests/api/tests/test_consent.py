import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

@pytest.mark.asyncio
async def test_record_consent_success(client: AsyncClient, test_user: User):
    payload = {
        "consent_type": "LOGIN",
        "consented": True,
        "target_id": "home-page",
        "location": "IN",
        "device_details": {"browser": "Chrome", "os": "Windows"}
    }
    
    response = await client.post("/api/v1/consent", json=payload, headers=auth_headers(test_user))
    assert response.status_code == 200
    
    data = response.json()
    assert "id" in data
    assert data["consent_type"] == "LOGIN"
    assert data["consented"] is True
    assert data["target_id"] == "home-page"
    assert data["location"] == "IN"
    assert data["device_details"]["browser"] == "Chrome"
    assert "user_id" in data
