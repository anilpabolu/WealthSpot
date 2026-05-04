"""Seed communication platform with stub provider, core events, and default templates.

Revision ID: 049_comm_seed
Revises: 048_comm_schema
Create Date: 2025-01-01 00:00:00.000000
"""

from __future__ import annotations

import uuid
from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "049_comm_seed"
down_revision: Union[str, None] = "048_comm_schema"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


_STUB_PROVIDER_EMAIL_ID = "11111111-1111-1111-1111-111111111101"
_STUB_PROVIDER_SMS_ID = "11111111-1111-1111-1111-111111111102"
_STUB_PROVIDER_WA_ID = "11111111-1111-1111-1111-111111111103"

_EVENTS = [
    # Transactional
    ("user.welcome", 1, "Sent after successful registration", "onboarding", False, True),
    ("user.password_reset", 1, "Password reset link", "account", False, True),
    ("user.email_verify", 1, "Email verification link", "account", False, True),
    ("user.kyc_submitted", 1, "KYC documents received", "kyc", False, True),
    ("user.kyc_approved", 1, "KYC verification approved", "kyc", False, True),
    ("user.kyc_rejected", 1, "KYC verification rejected", "kyc", False, True),
    ("investment.eoi_submitted", 1, "EOI submission confirmed", "investment", False, True),
    ("investment.eoi_approved", 1, "EOI approved by admin", "investment", False, True),
    ("investment.payment_received", 1, "Payment receipt", "investment", False, True),
    ("investment.payment_failed", 1, "Payment failure notification", "investment", False, True),
    ("investment.allotment_confirmed", 1, "Investment allotment confirmed", "investment", False, True),
    ("investment.distribution", 1, "Distribution / payout notification", "investment", False, True),
    ("otp.login", 1, "OTP for login", "auth", False, True),
    ("otp.transaction", 1, "OTP for transaction authorization", "auth", False, True),
    # Promotional
    ("promo.new_opportunity", 1, "New investment opportunity launched", "marketing", True, False),
    ("promo.opportunity_closing", 1, "Investment opportunity closing soon", "marketing", True, False),
    ("promo.referral_reward", 1, "Referral reward earned", "referral", True, False),
    ("promo.points_earned", 1, "Loyalty points earned", "loyalty", True, False),
    ("promo.monthly_digest", 1, "Monthly portfolio digest", "marketing", True, False),
    ("promo.webinar_invite", 1, "Webinar invitation", "marketing", True, False),
]

_TEMPLATES: list[dict] = [
    {
        "id": "22222222-2222-2222-2222-222222222201",
        "name": "Welcome Email",
        "channel": "email",
        "subject": "Welcome to WealthSpot, {{ first_name }}!",
        "body_text": "Hi {{ first_name }},\n\nWelcome to WealthSpot! Start exploring investment opportunities at https://wealthspot.in.\n\nRegards,\nThe WealthSpot Team",
        "body_html": None,
    },
    {
        "id": "22222222-2222-2222-2222-222222222202",
        "name": "OTP SMS",
        "channel": "sms",
        "subject": None,
        "body_text": "{{ otp_code }} is your WealthSpot OTP. Valid for {{ ttl_minutes }} minutes. Do not share with anyone.",
        "body_html": None,
    },
    {
        "id": "22222222-2222-2222-2222-222222222203",
        "name": "KYC Approved Email",
        "channel": "email",
        "subject": "Your KYC is Verified - WealthSpot",
        "body_text": "Hi {{ first_name }},\n\nYour KYC verification is complete. You can now invest on WealthSpot.\n\nRegards,\nThe WealthSpot Team",
        "body_html": None,
    },
    {
        "id": "22222222-2222-2222-2222-222222222204",
        "name": "Investment Confirmed Email",
        "channel": "email",
        "subject": "Investment Confirmed - {{ opportunity_name }}",
        "body_text": "Hi {{ first_name }},\n\nYour investment of ₹{{ amount }} in {{ opportunity_name }} has been confirmed.\n\nRegards,\nThe WealthSpot Team",
        "body_html": None,
    },
    {
        "id": "22222222-2222-2222-2222-222222222205",
        "name": "New Opportunity SMS",
        "channel": "sms",
        "subject": None,
        "body_text": "New opportunity on WealthSpot: {{ opportunity_name }} | {{ irr }}% IRR | Invest now: https://wealthspot.in",
        "body_html": None,
    },
]


def upgrade() -> None:
    conn = op.get_bind()

    # ── Stub providers ───────────────────────────────────────────────────────
    providers = [
        {
            "id": _STUB_PROVIDER_EMAIL_ID,
            "channel": "email",
            "kind": "stub",
            "name": "Stub Email Provider",
            "config_encrypted": "{}",
            "priority": 999,
            "is_active": True,
        },
        {
            "id": _STUB_PROVIDER_SMS_ID,
            "channel": "sms",
            "kind": "stub",
            "name": "Stub SMS Provider",
            "config_encrypted": "{}",
            "priority": 999,
            "is_active": True,
        },
        {
            "id": _STUB_PROVIDER_WA_ID,
            "channel": "whatsapp",
            "kind": "stub",
            "name": "Stub WhatsApp Provider",
            "config_encrypted": "{}",
            "priority": 999,
            "is_active": True,
        },
    ]
    conn.execute(
        sa.text(
            "INSERT INTO comm.providers (id, channel, kind, name, config_encrypted, priority, is_active) "
            "VALUES (:id, :channel, :kind, :name, CAST(:config_encrypted AS jsonb), :priority, :is_active) "
            "ON CONFLICT DO NOTHING"
        ),
        providers,
    )

    # ── Events ───────────────────────────────────────────────────────────────
    event_rows = [
        {
            "id": str(uuid.uuid4()),
            "event_name": name,
            "version": ver,
            "description": desc,
            "category": cat,
            "is_promotional": is_promo,
            "is_transactional": is_tx,
            "payload_schema": "{}",
        }
        for name, ver, desc, cat, is_promo, is_tx in _EVENTS
    ]
    conn.execute(
        sa.text(
            "INSERT INTO comm.events (id, event_name, version, description, category, "
            "is_promotional, is_transactional, payload_schema) "
            "VALUES (:id, :event_name, :version, :description, :category, "
            ":is_promotional, :is_transactional, CAST(:payload_schema AS jsonb)) "
            "ON CONFLICT (event_name, version) DO NOTHING"
        ),
        event_rows,
    )

    # ── Templates ─────────────────────────────────────────────────────────────
    for tmpl in _TEMPLATES:
        tmpl_id = tmpl["id"]
        conn.execute(
            sa.text(
                "INSERT INTO comm.templates (id, name, channel, status) "
                "VALUES (:id, :name, :channel, 'active') "
                "ON CONFLICT DO NOTHING"
            ),
            {"id": tmpl_id, "name": tmpl["name"], "channel": tmpl["channel"]},
        )
        conn.execute(
            sa.text(
                "INSERT INTO comm.template_versions "
                "(id, template_id, version_no, locale, subject, body_text, body_html, status) "
                "VALUES (gen_random_uuid(), :template_id, 1, 'en-IN', :subject, :body_text, :body_html, 'active') "
                "ON CONFLICT DO NOTHING"
            ),
            {
                "template_id": tmpl_id,
                "subject": tmpl.get("subject"),
                "body_text": tmpl.get("body_text"),
                "body_html": tmpl.get("body_html"),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    for tmpl in _TEMPLATES:
        conn.execute(
            sa.text("DELETE FROM comm.templates WHERE id = :id"),
            {"id": tmpl["id"]},
        )
    conn.execute(
        sa.text("DELETE FROM comm.providers WHERE id IN (:e, :s, :w)"),
        {
            "e": _STUB_PROVIDER_EMAIL_ID,
            "s": _STUB_PROVIDER_SMS_ID,
            "w": _STUB_PROVIDER_WA_ID,
        },
    )
