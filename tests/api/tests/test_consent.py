import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

@pytest.mark.asyncio
async def test_record_consent_success(client: AsyncClient, test_user: User):
    payload = {
        "context": "ONBOARDING",
        "consent_version": "v1.0",
        "regulatory_accepted": True,
        "privacy_accepted": True,
        "communication_accepted": False,
        "target_id": "home-page",
        "location": "IN",
        "device_details": {"browser": "Chrome", "os": "Windows"}
    }
    
    response = await client.post("/api/v1/consent", json=payload, headers=auth_headers(test_user))
    print(response.json())
    assert response.status_code == 200
    
    data = response.json()
    assert "id" in data
    assert data["context"] == "ONBOARDING"
    assert data["consent_version"] == "v1.0"
    assert data["regulatory_accepted"] is True
    assert data["privacy_accepted"] is True
    assert data["communication_accepted"] is False
    assert data["target_id"] == "home-page"
    assert data["location"] == "IN"
    assert data["device_details"]["browser"] == "Chrome"
    assert "user_id" in data
    assert "created_at" in data
