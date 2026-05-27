import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_record_consent_success(client: AsyncClient, token_headers: dict):
    payload = {
        "consent_type": "LOGIN",
        "consented": True,
        "target_id": "home-page",
        "location": "IN",
        "device_details": {"browser": "Chrome", "os": "Windows"}
    }
    
    response = await client.post("/api/v1/consent", json=payload, headers=token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "id" in data
    assert data["consent_type"] == "LOGIN"
    assert data["consented"] is True
    assert data["target_id"] == "home-page"
    assert data["location"] == "IN"
    assert data["device_details"]["browser"] == "Chrome"
    assert "user_id" in data
