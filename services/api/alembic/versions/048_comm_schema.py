"""Create comm schema with all communication platform tables.

Revision ID: 048_comm_schema
Revises: 047_assessment_is_public
Create Date: 2025-01-01 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

from alembic import op

revision: str = "048_comm_schema"
down_revision: Union[str, None] = "047_assessment_is_public"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    # ── Schema ──────────────────────────────────────────────────────────────
    op.execute("CREATE SCHEMA IF NOT EXISTS comm")

    # ── user_profiles ───────────────────────────────────────────────────────
    op.create_table(
        "user_profiles",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("locale", sa.String(16), nullable=False, server_default="en-IN"),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="Asia/Kolkata"),
        sa.Column("whatsapp_phone", sa.String(20), nullable=True),
        sa.Column("marketing_consent", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("transactional_email", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("transactional_sms", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("transactional_whatsapp", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("promotional_email", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("promotional_sms", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("promotional_whatsapp", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("quiet_hours_start", sa.Time(), nullable=True),
        sa.Column("quiet_hours_end", sa.Time(), nullable=True),
        sa.Column("frequency_cap_promotional_per_week", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        schema="comm",
    )

    # ── user_event_preferences ──────────────────────────────────────────────
    op.create_table(
        "user_event_preferences",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("event_category", sa.String(50), primary_key=True),
        sa.Column("channel", sa.String(20), primary_key=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )

    # ── consent_records ─────────────────────────────────────────────────────
    op.create_table(
        "consent_records",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("purpose", sa.String(60), nullable=False),
        sa.Column("source", sa.String(120), nullable=True),
        sa.Column("ip", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(255), nullable=True),
        sa.Column("consented_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )
    op.create_index("ix_comm_consent_user_id", "consent_records", ["user_id"], schema="comm")

    # ── events ──────────────────────────────────────────────────────────────
    op.create_table(
        "events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("event_name", sa.String(120), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("payload_schema", JSONB(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("category", sa.String(50), nullable=False, server_default="general"),
        sa.Column("is_promotional", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_transactional", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("default_locale", sa.String(16), nullable=False, server_default="en-IN"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("event_name", "version", name="uq_comm_events_name_version"),
        schema="comm",
    )
    op.create_index("ix_comm_events_name", "events", ["event_name"], schema="comm")

    # ── providers ───────────────────────────────────────────────────────────
    op.create_table(
        "providers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("kind", sa.String(30), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("config_encrypted", JSONB(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("failover_to_id", UUID(as_uuid=True), nullable=True),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        schema="comm",
    )

    # ── templates ───────────────────────────────────────────────────────────
    op.create_table(
        "templates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("owner_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        schema="comm",
    )

    # ── template_versions ───────────────────────────────────────────────────
    op.create_table(
        "template_versions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("template_id", UUID(as_uuid=True), sa.ForeignKey("comm.templates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_no", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("locale", sa.String(16), nullable=False, server_default="en-IN"),
        sa.Column("subject", sa.String(255), nullable=True),
        sa.Column("body_mjml", sa.Text(), nullable=True),
        sa.Column("body_html", sa.Text(), nullable=True),
        sa.Column("body_text", sa.Text(), nullable=True),
        sa.Column("variables", JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("approved_by", UUID(as_uuid=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )
    op.create_index("ix_comm_tv_template_id", "template_versions", ["template_id"], schema="comm")

    # ── bindings ────────────────────────────────────────────────────────────
    op.create_table(
        "bindings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("event_name", sa.String(120), nullable=False),
        sa.Column("event_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("template_id", UUID(as_uuid=True), sa.ForeignKey("comm.templates.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("locale", sa.String(16), nullable=True),
        sa.Column("audience_rule", JSONB(), nullable=False, server_default=sa.text("'true'")),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("throttle_rpm", sa.Integer(), nullable=True),
        sa.Column("schedule_cron", sa.String(120), nullable=True),
        sa.Column("quiet_hours_aware", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        schema="comm",
    )
    op.create_index("ix_comm_bindings_event", "bindings", ["event_name", "event_version"], schema="comm")

    # ── outbox ──────────────────────────────────────────────────────────────
    op.create_table(
        "outbox",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("event_name", sa.String(120), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("payload", JSONB(), nullable=False),
        sa.Column("correlation_id", sa.String(128), nullable=True),
        sa.Column("idempotency_key", sa.String(128), nullable=True, unique=True),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("claimed_by", sa.String(128), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )
    op.create_index("ix_comm_outbox_status", "outbox", ["status", "created_at"], schema="comm")

    # ── messages ────────────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("correlation_id", sa.String(128), nullable=True),
        sa.Column("event_outbox_id", UUID(as_uuid=True), nullable=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("provider_id", UUID(as_uuid=True), nullable=True),
        sa.Column("template_version_id", UUID(as_uuid=True), nullable=True),
        sa.Column("locale", sa.String(16), nullable=False, server_default="en-IN"),
        sa.Column("recipient", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(255), nullable=True),
        sa.Column("payload_snapshot", JSONB(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("idempotency_key", sa.String(128), nullable=True, unique=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("clicked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("cost_paise", sa.Integer(), nullable=True),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )
    op.create_index("ix_comm_messages_user_channel", "messages", ["user_id", "channel"], schema="comm")
    op.create_index("ix_comm_messages_status", "messages", ["status", "created_at"], schema="comm")

    # ── message_events ──────────────────────────────────────────────────────
    op.create_table(
        "message_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("message_id", UUID(as_uuid=True), sa.ForeignKey("comm.messages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("payload", JSONB(), nullable=True),
        schema="comm",
    )
    op.create_index("ix_comm_message_events_message_id", "message_events", ["message_id"], schema="comm")

    # ── suppression_list ────────────────────────────────────────────────────
    op.create_table(
        "suppression_list",
        sa.Column("channel", sa.String(20), primary_key=True),
        sa.Column("identifier", sa.String(255), primary_key=True),
        sa.Column("reason", sa.String(60), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("added_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )

    # ── otp_archive ─────────────────────────────────────────────────────────
    op.create_table(
        "otp_archive",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("purpose", sa.String(60), nullable=False),
        sa.Column("phone_hash", sa.String(64), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        schema="comm",
    )

    # ── dlt_principal_entities ──────────────────────────────────────────────
    op.create_table(
        "dlt_principal_entities",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("entity_id", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("telecom_operator", sa.String(60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )

    # ── dlt_templates ───────────────────────────────────────────────────────
    op.create_table(
        "dlt_templates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("principal_entity_id", UUID(as_uuid=True), sa.ForeignKey("comm.dlt_principal_entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("header_id", sa.String(50), nullable=False),
        sa.Column("template_id", sa.String(50), nullable=False),
        sa.Column("content_pattern", sa.Text(), nullable=True),
        sa.Column("dlt_category", sa.String(30), nullable=False, server_default="transactional"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )

    # ── whatsapp_templates ──────────────────────────────────────────────────
    op.create_table(
        "whatsapp_templates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("meta_template_id", sa.String(128), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("language", sa.String(16), nullable=False, server_default="en"),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("components", JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )

    # ── whatsapp_sessions ───────────────────────────────────────────────────
    op.create_table(
        "whatsapp_sessions",
        sa.Column("waba_phone_number_id", sa.String(50), primary_key=True),
        sa.Column("recipient_phone", sa.String(20), primary_key=True),
        sa.Column("last_inbound_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )

    # ── short_links ─────────────────────────────────────────────────────────
    op.create_table(
        "short_links",
        sa.Column("slug", sa.String(20), primary_key=True),
        sa.Column("target_url", sa.Text(), nullable=False),
        sa.Column("message_id", UUID(as_uuid=True), nullable=True),
        sa.Column("click_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )

    # ── audit_logs ──────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("actor_id", UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("target_table", sa.String(120), nullable=False),
        sa.Column("target_id", sa.String(128), nullable=False),
        sa.Column("before", JSONB(), nullable=True),
        sa.Column("after", JSONB(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("request_id", sa.String(128), nullable=True),
        schema="comm",
    )
    op.create_index("ix_comm_audit_actor", "audit_logs", ["actor_id", "occurred_at"], schema="comm")

    # ── outbound_webhooks ───────────────────────────────────────────────────
    op.create_table(
        "outbound_webhooks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("secret", sa.String(128), nullable=True),
        sa.Column("event_filter", JSONB(), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="comm",
    )


def downgrade() -> None:
    op.drop_table("outbound_webhooks", schema="comm")
    op.drop_table("audit_logs", schema="comm")
    op.drop_table("short_links", schema="comm")
    op.drop_table("whatsapp_sessions", schema="comm")
    op.drop_table("whatsapp_templates", schema="comm")
    op.drop_table("dlt_templates", schema="comm")
    op.drop_table("dlt_principal_entities", schema="comm")
    op.drop_table("otp_archive", schema="comm")
    op.drop_table("suppression_list", schema="comm")
    op.drop_table("message_events", schema="comm")
    op.drop_table("messages", schema="comm")
    op.drop_table("outbox", schema="comm")
    op.drop_table("bindings", schema="comm")
    op.drop_table("template_versions", schema="comm")
    op.drop_table("templates", schema="comm")
    op.drop_table("providers", schema="comm")
    op.drop_table("events", schema="comm")
    op.drop_table("consent_records", schema="comm")
    op.drop_table("user_event_preferences", schema="comm")
    op.drop_table("user_profiles", schema="comm")
    op.execute("DROP SCHEMA IF EXISTS comm CASCADE")
