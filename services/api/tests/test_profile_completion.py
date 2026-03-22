"""
Tests for profile completion endpoints: /api/v1/profile/*
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/profile"


@pytest.mark.asyncio
class TestProfileCompletion:
    async def test_get_completion_empty_profile(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/completion", headers=auth_headers(test_user))
        assert resp.status_code == 200
        data = resp.json()
        assert "profile_completion_pct" in data
        assert "sections" in data
        assert isinstance(data["sections"], dict)
        assert data["email_verified"] is False
        assert data["phone_verified"] is False
        assert data["is_complete"] is False

    async def test_get_full_profile(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/full", headers=auth_headers(test_user))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["email_verified"] is False
        assert data["phone_verified"] is False

    async def test_unauthenticated_returns_401(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/completion")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestProfileSection1:
    async def test_update_personal_risk(self, client: AsyncClient, test_user: User):
        payload = {
            "full_name": "Anil Kumar",
            "date_of_birth": "1990-05-15",
            "gender": "male",
            "occupation": "Software Engineer",
            "annual_income": "25-50L",
            "investment_experience": "intermediate",
            "risk_tolerance": "moderate",
            "investment_horizon": "5-10 years",
            "monthly_investment_capacity": "25K-50K",
        }
        resp = await client.put(
            f"{PREFIX}/section/1", json=payload, headers=auth_headers(test_user)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "Anil Kumar"
        assert data["date_of_birth"] == "1990-05-15"
        assert data["gender"] == "male"
        assert data["risk_tolerance"] == "moderate"
        assert data["investment_horizon"] == "5-10 years"
        assert data["profile_completion_pct"] >= 0

    async def test_partial_update(self, client: AsyncClient, test_user: User):
        resp = await client.put(
            f"{PREFIX}/section/1",
            json={"gender": "female"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        assert resp.json()["gender"] == "female"


@pytest.mark.asyncio
class TestProfileSection2:
    async def test_update_interests(self, client: AsyncClient, test_user: User):
        payload = {
            "interests": ["residential", "commercial", "co-working"],
            "preferred_cities": ["Hyderabad", "Bengaluru"],
            "subscription_topics": ["new_properties", "market_insights"],
        }
        resp = await client.put(
            f"{PREFIX}/section/2", json=payload, headers=auth_headers(test_user)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "residential" in data["interests"]
        assert "Hyderabad" in data["preferred_cities"]
        assert data["profile_completion_pct"] >= 0


@pytest.mark.asyncio
class TestProfileSection3:
    async def test_update_skills(self, client: AsyncClient, test_user: User):
        payload = {
            "skills": ["marketing", "finance", "networking"],
            "weekly_hours_available": "3-5",
            "contribution_interests": ["mentoring", "referrals"],
            "bio": "Passionate about real estate and wealth building.",
        }
        resp = await client.put(
            f"{PREFIX}/section/3", json=payload, headers=auth_headers(test_user)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "marketing" in data["skills"]
        assert data["weekly_hours_available"] == "3-5"
        assert data["bio"] == "Passionate about real estate and wealth building."


@pytest.mark.asyncio
class TestProfileSection4:
    async def test_update_address(self, client: AsyncClient, test_user: User):
        payload = {
            "address_line1": "123 Main Street",
            "address_line2": "Apt 4B",
            "city": "Hyderabad",
            "state": "Telangana",
            "pincode": "500001",
            "country": "India",
        }
        resp = await client.put(
            f"{PREFIX}/section/4", json=payload, headers=auth_headers(test_user)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["address_line1"] == "123 Main Street"
        assert data["city"] == "Hyderabad"
        assert data["pincode"] == "500001"

    async def test_invalid_pincode_rejected(self, client: AsyncClient, test_user: User):
        resp = await client.put(
            f"{PREFIX}/section/4",
            json={"pincode": "ABCDEF"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestOTPVerification:
    async def test_send_email_otp(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{PREFIX}/otp/send",
            json={"channel": "email"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["channel"] == "email"
        assert "dev_otp" in data  # Dev mode returns OTP
        assert len(data["dev_otp"]) == 6

    async def test_send_phone_otp(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{PREFIX}/otp/send",
            json={"channel": "phone"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["channel"] == "phone"
        assert "dev_otp" in data

    async def test_verify_email_otp(self, client: AsyncClient, test_user: User):
        # Send OTP first
        send_resp = await client.post(
            f"{PREFIX}/otp/send",
            json={"channel": "email"},
            headers=auth_headers(test_user),
        )
        otp = send_resp.json()["dev_otp"]

        # Verify
        verify_resp = await client.post(
            f"{PREFIX}/otp/verify",
            json={"channel": "email", "otp": otp},
            headers=auth_headers(test_user),
        )
        assert verify_resp.status_code == 200
        data = verify_resp.json()
        assert data["verified"] is True
        assert data["channel"] == "email"

    async def test_verify_phone_otp(self, client: AsyncClient, test_user: User):
        # Send OTP first
        send_resp = await client.post(
            f"{PREFIX}/otp/send",
            json={"channel": "phone"},
            headers=auth_headers(test_user),
        )
        otp = send_resp.json()["dev_otp"]

        # Verify
        verify_resp = await client.post(
            f"{PREFIX}/otp/verify",
            json={"channel": "phone", "otp": otp},
            headers=auth_headers(test_user),
        )
        assert verify_resp.status_code == 200
        assert verify_resp.json()["verified"] is True

    async def test_verify_wrong_otp_rejected(self, client: AsyncClient, test_user: User):
        # Send OTP
        await client.post(
            f"{PREFIX}/otp/send",
            json={"channel": "email"},
            headers=auth_headers(test_user),
        )

        # Try wrong OTP
        verify_resp = await client.post(
            f"{PREFIX}/otp/verify",
            json={"channel": "email", "otp": "000000"},
            headers=auth_headers(test_user),
        )
        assert verify_resp.status_code == 400
        assert "Invalid OTP" in verify_resp.json()["detail"]

    async def test_send_otp_invalid_channel(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{PREFIX}/otp/send",
            json={"channel": "telegram"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 422

    async def test_verify_without_send_rejected(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{PREFIX}/otp/verify",
            json={"channel": "email", "otp": "123456"},
            headers=auth_headers(test_user),
        )
        # Either 400 (no OTP requested) or the hash won't match
        assert resp.status_code == 400


@pytest.mark.asyncio
class TestProfileFullFlow:
    """End-to-end: fill all sections + verify both OTPs → 100% completion."""

    async def test_full_profile_completion_flow(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)

        # Start: should be incomplete
        resp = await client.get(f"{PREFIX}/completion", headers=headers)
        assert resp.json()["is_complete"] is False

        # Section 1: Personal & Risk
        await client.put(f"{PREFIX}/section/1", headers=headers, json={
            "full_name": "Test Investor",
            "date_of_birth": "1992-03-20",
            "gender": "male",
            "occupation": "Engineer",
            "annual_income": "10-25L",
            "risk_tolerance": "moderate",
            "investment_horizon": "5-10 years",
            "monthly_investment_capacity": "10K-25K",
        })

        # Section 2: Interests
        await client.put(f"{PREFIX}/section/2", headers=headers, json={
            "interests": ["residential", "commercial"],
            "preferred_cities": ["Hyderabad"],
            "subscription_topics": ["new_properties"],
        })

        # Section 3: Skills
        await client.put(f"{PREFIX}/section/3", headers=headers, json={
            "skills": ["finance", "marketing"],
            "weekly_hours_available": "3-5",
            "contribution_interests": ["referrals"],
        })

        # Section 4: Address
        await client.put(f"{PREFIX}/section/4", headers=headers, json={
            "address_line1": "42 MG Road",
            "city": "Hyderabad",
            "state": "Telangana",
            "pincode": "500032",
        })

        # Check — should be 80% (4/5 sections, missing verification)
        resp = await client.get(f"{PREFIX}/completion", headers=headers)
        data = resp.json()
        assert data["profile_completion_pct"] == 80
        assert data["sections"]["verification"] is False

        # Verify email
        send = await client.post(f"{PREFIX}/otp/send", headers=headers, json={"channel": "email"})
        otp = send.json()["dev_otp"]
        await client.post(f"{PREFIX}/otp/verify", headers=headers, json={"channel": "email", "otp": otp})

        # Verify phone
        send = await client.post(f"{PREFIX}/otp/send", headers=headers, json={"channel": "phone"})
        otp = send.json()["dev_otp"]
        await client.post(f"{PREFIX}/otp/verify", headers=headers, json={"channel": "phone", "otp": otp})

        # Final check — should be 100%
        resp = await client.get(f"{PREFIX}/completion", headers=headers)
        data = resp.json()
        assert data["profile_completion_pct"] == 100
        assert data["is_complete"] is True
        assert data["email_verified"] is True
        assert data["phone_verified"] is True
        assert data["referral_code"] is not None

        # Full profile should also reflect everything
        resp = await client.get(f"{PREFIX}/full", headers=headers)
        full = resp.json()
        assert full["city"] == "Hyderabad"
        assert full["risk_tolerance"] == "moderate"
        assert full["email_verified"] is True
        assert full["phone_verified"] is True
        assert full["referral_code"] is not None
