# WealthSpot Unified Communication Platform (WSCP) — Plan & Design

> Source-of-truth design doc. On approval & exit of plan mode, this content will be copied verbatim to `communication.md` at the repo root. No code is written in plan mode.

---

## 1. Context

WealthSpot today has a **partial, hard-coded** communication stack: SMTP for email OTP ([services/api/app/services/email.py](services/api/app/services/email.py)), Twilio for SMS + WhatsApp OTP ([services/api/app/services/sms.py](services/api/app/services/sms.py)), an in-app `Notification` model ([services/api/app/models/notification.py](services/api/app/models/notification.py)), two Celery tasks ([services/api/app/tasks.py](services/api/app/tasks.py)), and a primitive `comm_mappings` admin concept already wired into the frontend ([apps/web/src/pages/CommandControlPage.tsx](apps/web/src/pages/CommandControlPage.tsx)). It is OTP-only, hard-coded, channel-coupled, and not configurable by non-developers.

We are building **WSCP** — an event-driven, configuration-first, provider-agnostic communication platform where:

1. Any module fires a domain event (`comm.publish("eoi.builder_connected", payload)`).
2. Ops/marketing/compliance configure **Event ↔ Channel ↔ Template ↔ Audience** bindings from Command Control with **zero deploys**.
3. Email, SMS (DLT-compliant), WhatsApp Business (HSM-aware), and in-app delivery happen via pluggable providers.
4. Every send is observable, retriable, idempotent, audited, and compliant with **DPDP Act 2023 / TRAI DLT / WhatsApp Business Policy**.
5. Promotional campaigns (SMS + WhatsApp focus) ship with segmentation, opt-out enforcement, throttling, A/B, and maker-checker approval.

User-confirmed decisions (binding):

- **Replace & migrate**: deprecate `services/email.py`, `services/sms.py` and the two legacy Celery tasks `send_email_task` / `send_sms_task`; existing OTP and notify call sites migrate to `comm.publish(...)`. The legacy `Notification` model is **kept** as the persistence layer for the in-app channel inside the new pipeline (not deleted). The `OpportunityCommMapping` model + `useCommMappings`/`useCreateCommMapping`/`useDeleteCommMapping` hooks are **unrelated** (per-opportunity user-role mapping for deal communication routing) and are **not touched**. Single comm system for event-driven sends.
- **Stub WA + DLT now, real later**: full schema and wiring built; Meta Cloud API and MSG91 sit behind stub adapters until live credentials are provisioned (a config flip activates them).
- **Full spec + MVP-first execution**: this doc covers the complete vision; Phase 1 is what we build first and merge.
- **Separate Postgres schema** `comm.*` for all WSCP tables. No new columns on `public.users`. User-level comm metadata (locale, timezone, WhatsApp phone, marketing consent) lives in `comm.user_profiles` keyed by `user_id`.

---

## 2. Discovery Summary (file-cited)

**Backend** — FastAPI 0.135+, SQLAlchemy 2.x async, asyncpg, Alembic async-aware, Celery 5.6 with Redis broker (DB 1) + result backend (DB 0), Pydantic v2 BaseSettings, JWT auth with multi-role JSONB column.

- App entry: [services/api/app/main.py](services/api/app/main.py) — 22 routers under `/api/v1`, lifespan disposes async engine, full exception handlers, Sentry init at startup.
- Celery app: [services/api/app/celery_app.py](services/api/app/celery_app.py) — autodiscovers `app.tasks`; existing beat: `cleanup-expired-otps`, `cleanup-old-audit-logs`, `refresh-analytics-views`, `transition-opportunity-statuses`.
- Existing tasks: [services/api/app/tasks.py](services/api/app/tasks.py) — `send_email_task`, `send_sms_task` (will be deprecated).
- DB: [services/api/app/core/database.py](services/api/app/core/database.py) — `async_sessionmaker`, `get_db()` dependency.
- Alembic: [services/api/alembic/env.py](services/api/alembic/env.py), versions named `NNN_description.py`, latest `047_assessment_is_public.py` (untracked in git status).
- Auth: [services/api/app/middleware/auth.py](services/api/app/middleware/auth.py) — `get_current_user`, `require_role(...)`, `require_super_admin()`.
- Config: [services/api/app/core/config.py](services/api/app/core/config.py) — already has `SMTP_*`, `TWILIO_*`, `ENCRYPTION_KEY` (Fernet), `REDIS_URL`, `CELERY_BROKER_URL`, `OTP_EXPIRY_MINUTES`.
- Logging: [services/api/app/core/logging_config.py](services/api/app/core/logging_config.py) — JSON formatter, `request_id` propagated via [services/api/app/middleware/request_id.py](services/api/app/middleware/request_id.py), Sentry wired.
- Existing User: [services/api/app/models/user.py](services/api/app/models/user.py) — `email`, `phone`, `role`, `roles[]` JSONB, `notification_preferences` JSONB, OTP hash fields. **No `locale`, `timezone`, `whatsapp_phone`, `marketing_consent`.**

**Frontend** — React 19 + Vite, react-router-dom v6 lazy routes, Zustand stores, TanStack React Query, react-hook-form + zod, Radix UI primitives + custom shadcn-style components in [apps/web/src/components/ui/](apps/web/src/components/ui/).

- Admin hub: [apps/web/src/pages/CommandControlPage.tsx](apps/web/src/pages/CommandControlPage.tsx) — monolithic; sections via `?section=` query param; already imports `useCommMappings`, `useCreateCommMapping`, `useDeleteCommMapping`.
- Approvals queue: [apps/web/src/pages/ApprovalsPage.tsx](apps/web/src/pages/ApprovalsPage.tsx) — pattern for queue + filter + status badges.
- API client: [packages/wealthspot-api-client/src/client.ts](packages/wealthspot-api-client/src/client.ts) — token refresh, snake-camel transform, request tracing.
- Hook convention: `useFoo()` query, `useCreateFoo()`/`useUpdateFoo()` mutations, mutation `meta: { successMessage, errorTitle }` auto-toasts via `MutationCache` global handler in [apps/web/src/main.tsx](apps/web/src/main.tsx).
- Auth: Clerk → backend `/auth/check` + `/auth/me` → Zustand `useUserStore` ([apps/web/src/stores/user.store.ts](apps/web/src/stores/user.store.ts)).

**Domain (event vocabulary, NOT generic SIP/fund terms):**
Opportunity (Wealth/Safe/Community vault), EOI (Expression of Interest), OpportunityInvestment, Investment (Razorpay-backed), ApprovalRequest, Company (builder verification — CIN/GSTIN), KYC (PAN/Aadhaar/Selfie), Portfolio. Roles: INVESTOR, BUILDER, LENDER, FOUNDER, COMMUNITY_LEAD, APPROVER, ADMIN, SUPER_ADMIN.

**India fintech context confirmed**: Razorpay, PAN, Aadhaar, CIN/GSTIN, pincode, ₹ currency. **No DLT registration today** — to be added.

---

## 3. Architecture Overview

```
┌──────────────────────────── Host (FastAPI app) ────────────────────────────┐
│                                                                            │
│  routers/* ──┐                                                             │
│              │  comm.publish(event, payload, idempotency_key=…)            │
│              ▼                                                             │
│       ┌──────────────────────┐         ┌──────────────────┐                │
│       │  comm.publish() SDK  │ ──tx──▶ │  comm.outbox     │  (same Tx)     │
│       └──────────────────────┘         └────────┬─────────┘                │
│                                                 │ Celery beat poll (1s)    │
│                                                 ▼                          │
│       ┌────────────────────────  comm-orchestrator (Celery) ────────┐      │
│       │  validate payload (JSON Schema)                             │      │
│       │  resolve recipients (User join + payload extract)           │      │
│       │  load active bindings (DB cache, 10s TTL)                   │      │
│       │  evaluate audience (json-logic-py)                          │      │
│       │  preference / quiet hours / freq cap / suppression checks   │      │
│       │  fan out → per-channel queues                               │      │
│       └─────────┬───────────┬────────────┬────────────┬─────────────┘      │
│                 ▼           ▼            ▼            ▼                    │
│           comm.email   comm.sms    comm.whatsapp  comm.in_app              │
│             queue       queue        queue          queue                  │
│              │           │            │              │                     │
│              ▼           ▼            ▼              ▼                     │
│       comm-worker (one per queue, dedicated concurrency)                   │
│              │           │            │              │                     │
│              ▼           ▼            ▼              ▼                     │
│         render →    DLT check →   HSM gate +     persist to                │
│         provider    render →      24h window →   comm.messages             │
│         adapter     provider      provider       (in_app channel)          │
│              │           │            │              │                     │
│              ▼           ▼            ▼              ▼                     │
│         SES /        Twilio /     Meta Cloud /   Notification              │
│         SendGrid /   MSG91 /      360dialog       feed                     │
│         SMTP        AWS SNS       (stubs first)                            │
│                                                                            │
│  POST /api/v1/comm/webhooks/{provider}  ──▶  DLR ingestion ──▶ state m/c   │
│  POST /api/v1/comm/webhooks/whatsapp    ──▶  inbound → publish event       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Patterns chosen** (each with named alternatives rejected):

- **Outbox pattern** for transactional event publishing. `comm.publish()` writes to `comm.outbox` in the **same DB transaction** as the host's business write; a Celery beat task polls every 1s with `SELECT … FOR UPDATE SKIP LOCKED LIMIT 200` and dispatches. Rejected: pg LISTEN/NOTIFY (loses messages on subscriber crash; no replay), direct Celery enqueue (loses at-least-once if host transaction rolls back after enqueue).
- **Strategy pattern** for provider adapters via abstract base classes (`EmailProvider`, `SmsProvider`, `WhatsAppProvider`).
- **Chain-of-Responsibility send pipeline**: `preference → quiet_hours → frequency_cap → suppression → render → provider_send → DLR_handler`. Each link is a callable returning `(continue, message)` so any check can short-circuit.
- **Circuit breaker per provider** via `pybreaker` (Redis-state) so a degraded SES doesn't block the email queue indefinitely.
- **Bulkhead isolation** — one Celery queue + dedicated worker pool per channel: `-Q comm.email`, `-Q comm.sms`, `-Q comm.whatsapp`, `-Q comm.in_app`, `-Q comm.orchestrator`.
- **Idempotency key** on every send: SHA-256 of `(event_id, channel, recipient_user_id, template_id, template_version)`. Unique constraint on `comm.messages.idempotency_key`.
- **Hot-reload** of bindings via DB short-cache (`cachetools.TTLCache`, 10s) keyed on `(event_name, version)`. Rejected pub/sub for now — adds complexity without measurable benefit at expected scale.

---

## 4. Module Breakdown

All Python modules under [services/api/app/comm/](services/api/app/comm/), mirroring the existing `app/<feature>/` convention. No new top-level package.

### M1 — `comm.core` (event bus + orchestrator)
- `publish(event_name, payload, *, correlation_id=None, idempotency_key=None, tenant_id=None)` — public SDK. Validates payload against the event's JSON Schema, writes to `comm.outbox` in the **caller's existing AsyncSession** (passed as `session=`), returns immediately.
- `comm.tasks.dispatch_outbox_batch` — Celery beat (every 1s), claims rows, schedules one `orchestrate_event` task per outbox row.
- `comm.tasks.orchestrate_event(outbox_id)` — loads bindings, runs pipeline, fans out per-channel sends.
- Recipients resolved in priority order: `payload.user.id` → `payload.recipients[]` → audience-rule SQL query against `users`.

### M2 — `comm.email`
- `EmailProvider` ABC: `send(message: EmailMessage) -> SendResult`.
- Adapters: `SmtpProvider` (real, MVP), `SesProvider` (real, Phase 2 if creds), `SendGridProvider` (stub Phase 2), `MailgunProvider`/`PostmarkProvider` (stubs).
- Rendering: **Jinja2 + MJML** via `mjml-python` package (no shelling, single Python dep). Plain-text auto-generated via `html2text`.
- Inline images (CID), attachments (≤25MB, AV-scan hook stubbed).
- One-click **unsubscribe link** signed with `itsdangerous` (RFC 8058 compliant `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`).
- Bounce + complaint webhook → automatic insert into `comm.suppression_list`.

### M3 — `comm.sms` (with OTP sub-feature)
- `SmsProvider` ABC: `send`, `send_otp`, `verify_otp`, `get_delivery_status`.
- Adapters: `TwilioProvider` (real, MVP — already configured in `Settings.twilio_*`), `Msg91Provider` (real, MVP — needed for India DLT), `KaleyraProvider`/`PlivoProvider`/`SnsProvider` (stubs).
- **OTP sub-module** (`comm/sms/otp.py`):
  - Configurable length (4/6/8), numeric/alphanumeric, TTL (default 5m), max attempts (3), cooldown (60s).
  - **Redis-backed**, key `comm:otp:{purpose}:{phone_hash}`, value = `{hash, attempts, created_at}` with TTL.
  - Verify with `secrets.compare_digest`.
  - Sliding-window rate limit: 5/min per phone, 20/min per IP, 50/hr per device. Redis `INCR` + `EXPIRE`.
  - Fallback chain: SMS → voice → WhatsApp (configurable per purpose).
  - Replaces existing `services/sms.py:send_otp_sms` and the OTP fields on User over a deprecation window.
- **Transactional vs Promotional** — separate sender IDs, separate DLT template IDs, separate Celery queues (`comm.sms.txn`, `comm.sms.promo`), separate rate limits.
- **DLT compliance (India, MANDATORY before any prod SMS send)**:
  - Tables: `comm.dlt_principal_entities`, `comm.dlt_templates` (header_id, entity_id, template_id, content_pattern, status).
  - At send time, content **regex-matched** against the registered template's pattern. No match → reject with `DltTemplateMismatch` exception, never reach provider.
  - Admin section "Compliance → DLT Registry" for ops to enter Entity ID + Header IDs + Template IDs.
- Unicode (UCS-2) auto-detection + segment counting + cost estimation.

### M4 — `comm.whatsapp`
- `WhatsAppProvider` ABC: `send_template`, `send_session_message`, `send_media`, `send_interactive`.
- Default adapter: `MetaCloudProvider`. Phase 1 ships as **`StubWhatsAppProvider`** that logs and writes to `comm.messages` with `provider='stub'` until WABA is live.
- HSM template registry (`comm.whatsapp_templates`): mirror of Meta state (`PENDING|APPROVED|REJECTED|PAUSED|DISABLED`). Beat task `comm.tasks.sync_whatsapp_templates` (every 15min) polls Meta when live.
- **24-hour session window** awareness. Last inbound timestamp tracked per `(waba_phone_number_id, recipient_phone)` in `comm.whatsapp_sessions`. Free-form sends rejected outside the window.
- Media: image/video/document/audio/location/contacts.
- Interactive: reply buttons (≤3), list (≤10), CTA URL.
- **Inbound webhook** (`POST /api/v1/comm/webhooks/whatsapp`) verifies signature, persists message, **publishes `whatsapp.inbound` event** so chatbot/support modules can react.
- **Opt-in capture mandatory** — written to `comm.consent_records` with timestamp/source/IP before any HSM send.

### M5 — `comm.templates`
- Tables: `comm.templates`, `comm.template_versions`, `comm.template_locales`.
- Versioning: every edit creates a new `template_versions` row; one `ACTIVE` per `(template_name, channel, locale)`. Supersession is atomic.
- Locales: `en-IN`, `hi-IN`, `ta-IN`, `te-IN`, `kn-IN`, `mr-IN`, `bn-IN`. Auto-pick from `comm.user_profiles.locale`; fallback to `en-IN`.
- Variable schema: declared per template; validated against the bound event's payload schema **at template-save time** (catches drift before deploy).
- `POST /api/v1/comm/admin/templates/{id}/preview` — render with sample/test data.
- A/B variants: `comm.template_variants` table with weight; winner attribution by open/click/conversion correlation IDs.

### M6 — `comm.events` (registry)
- Table: `comm.events` — `(event_name, version, description, payload_schema_jsonb, category, is_promotional, is_transactional, default_locale, enabled, created_at, updated_at)`.
- Event versioning so payload schema can evolve safely. Old version remains queryable for in-flight outbox rows.
- **Seed events** — using actual WealthSpot domain vocabulary:

| # | event_name | category | txn? |
|---|---|---|---|
| 1 | `auth.otp.requested` | auth | T |
| 2 | `auth.login.succeeded` | auth | T |
| 3 | `auth.password.reset_requested` | auth | T |
| 4 | `user.registered` | onboarding | T |
| 5 | `user.kyc.submitted` | onboarding | T |
| 6 | `user.kyc.approved` | onboarding | T |
| 7 | `user.kyc.rejected` | onboarding | T |
| 8 | `kyc.document.uploaded` | onboarding | T |
| 9 | `kyc.document.verified` | onboarding | T |
| 10 | `opportunity.submitted_for_approval` | listing | T |
| 11 | `opportunity.approved` | listing | T |
| 12 | `opportunity.rejected` | listing | T |
| 13 | `opportunity.closed` | listing | T |
| 14 | `eoi.submitted` | deal | T |
| 15 | `eoi.builder_connected` | deal | T |
| 16 | `eoi.deal_completed` | deal | T |
| 17 | `investment.payment_received` | money | T |
| 18 | `investment.confirmed` | money | T |
| 19 | `investment.refunded` | money | T |
| 20 | `payout.rental_credited` | money | T |
| 21 | `payout.exit_credited` | money | T |
| 22 | `approval.created` | approvals | T |
| 23 | `approval.reviewed` | approvals | T |
| 24 | `builder.verified` | onboarding | T |
| 25 | `role.assigned` | onboarding | T |
| 26 | `portfolio.statement_ready` | portfolio | T |
| 27 | `portfolio.milestone_reached` | portfolio | T |
| 28 | `whatsapp.inbound` | system | T |
| 29 | `promo.opportunity.featured` | marketing | P |
| 30 | `promo.market.insight` | marketing | P |

### M7 — `comm.bindings` (Event ↔ Channel ↔ Template)
- Table: `comm.bindings` — `(id, event_name, event_version, channel ENUM, template_id, locale, audience_rule_jsonb, priority, enabled, throttle_rpm, schedule_cron, quiet_hours_aware, created_at, updated_at, created_by, updated_by)`.
- **Audience rules** in JSONLogic via `json-logic-py`. Example:
  ```json
  {"and": [
    {"==": [{"var": "user.role"}, "INVESTOR"]},
    {">": [{"var": "investment.amount_paise"}, 10000000]}
  ]}
  ```
- Hot-reload via 10s TTL DB cache (cachetools).
- One event → many bindings → fan-out to many channels with independent rules.

### M8 — `comm.preferences`
- Table: `comm.user_profiles` — `(user_id PK FK→users.id, locale, timezone, whatsapp_phone, marketing_consent BOOL, transactional_email BOOL=true, transactional_sms BOOL=true, transactional_whatsapp BOOL=false, promotional_email BOOL, promotional_sms BOOL, promotional_whatsapp BOOL, quiet_hours_start TIME, quiet_hours_end TIME, frequency_cap_promotional_per_week INT, deleted_at)`.
- Table: `comm.user_event_preferences` — granular per-event override, `(user_id, event_category, channel, enabled)`.
- **Transactional events are non-suppressible by default** unless explicit per-event override.
- Quiet hours timezone-aware via `comm.user_profiles.timezone`; fallback `Asia/Kolkata`.
- Frequency caps via Redis sliding window.
- **Public preference center** at `/comm/preferences/me?token=…` (signed JWT). DPDP-compliant data export & erasure tools at the same page.

### M9 — `comm.campaigns`
- Tables: `comm.campaigns`, `comm.campaign_runs`, `comm.audience_segments`, `comm.audience_segment_members`.
- Audience segments: saved queries against users, CSV upload, dynamic SQL via a **safe query builder** (whitelisted tables/columns + parameterized).
- Scheduling: immediate / scheduled (Celery `eta`) / recurring (Celery beat) / drip.
- Throttling: respect provider rate limits + DLT/WA tier limits via Redis token bucket.
- Opt-out enforcement: pre-send check against `comm.suppression_list` + STOP keyword auto-handling.
- Link tracking via own shortener (`comm.short_links` table) → click events back to host.
- A/B at campaign level; cost estimator before launch.
- **Maker-checker approval workflow** — campaigns >N recipients (default 1000, configurable) require a second admin's approval. Reuses the existing [services/api/app/routers/approvals.py](services/api/app/routers/approvals.py) `ApprovalRequest` machinery with a new `ApprovalCategory.CAMPAIGN_LAUNCH`.

### M10 — `comm.admin` (Command Control sections)
Built inside the existing [apps/web/src/pages/CommandControlPage.tsx](apps/web/src/pages/CommandControlPage.tsx) hub. Each section is a separate component file under [apps/web/src/components/comm/](apps/web/src/components/comm/), mounted by the existing `?section=` query param. Reuses Radix primitives, DataTable, Badge, Toast meta pattern, react-hook-form + zod.

| # | Section | Content |
|---|---|---|
| 1 | Comm Dashboard | Sends today/week/month, success/failure rate per channel, top events by volume, total cost, provider health. |
| 2 | Provider Configuration | CRUD for email/SMS/WhatsApp providers. Credentials stored Fernet-encrypted in `comm.providers.config_encrypted` (uses existing `Settings.encryption_key`). "Test connection" + "Send test to me" buttons. Failover order. |
| 3 | Event Registry | List/create/edit events. **JSON-Schema form builder** for payload schema (introduce `@rjsf/core` — only new heavy frontend dep). |
| 4 | Template Library | Three editors: Email (MJML — introduce `mjml-browser` + CodeMirror 6 for syntax), SMS (textarea with segment counter + DLT linker), WhatsApp (HSM builder mirroring Meta structure). Live preview, variable picker, version history, diff. |
| 5 | Bindings | Visual mapper. Pick event → channel → template → audience rule → enable. Fan-out preview. New section. (Legacy `useCommMappings` / opportunity comm-role mapping is a separate feature and stays as is.) |
| 6 | User Preferences Override | Search any user, view/edit their `comm.user_profiles` + `comm.user_event_preferences` (with audit reason). |
| 7 | Campaigns | Wizard: pick channel → segment → template → schedule → throttle → submit for approval → live status → kill switch. |
| 8 | Audience Segments | Query builder UI with row-count preview, CSV upload, save & version. |
| 9 | Suppression Lists | Bounces, complaints, opt-outs, hard-blocked. Manual add/remove with reason. |
| 10 | Logs & Delivery Reports | Searchable, filterable, exportable. Per-message timeline view (queued→sent→delivered→opened→clicked or failed-with-reason). Cursor pagination. |
| 11 | Throttling & Quiet Hours | Global + per-tenant rules. |
| 12 | Compliance Center | DLT registry, WA template approvals, consent records browser, DPDP/GDPR export & erasure tools. |
| 13 | Outbound Webhooks | Other modules subscribe to `message.delivered` / `message.failed` / `message.opened`. |
| 14 | Audit Trail | Append-only log of every config change. PG trigger blocks UPDATE/DELETE on `comm.audit_logs`. |

---

## 5. Data Model — `comm` Postgres schema

All tables live in a dedicated **`comm` schema** (created in the first migration). Every row has UUID PK, `created_at`, `updated_at`, `created_by` UUID, `updated_by` UUID, soft-delete `deleted_at TIMESTAMP NULL`. JSONB used liberally for flexible config. Row-level FKs cross schemas to `public.users.id` only.

```
comm.user_profiles            (user_id PK, locale, timezone, whatsapp_phone,
                               marketing_consent, transactional_*, promotional_*,
                               quiet_hours_start, quiet_hours_end,
                               frequency_cap_promotional_per_week)
comm.user_event_preferences   (user_id, event_category, channel, enabled) PK composite
comm.events                   (id, event_name, version, payload_schema, category,
                               is_promotional, is_transactional, default_locale, enabled)
                              UNIQUE(event_name, version)
comm.providers                (id, channel, kind, name, config_encrypted JSONB,
                               priority, is_active, failover_to_id NULL)
comm.templates                (id, name, channel, status, owner_id)
                              UNIQUE(name, channel) WHERE deleted_at IS NULL
comm.template_versions        (id, template_id, version_no, locale, subject, body_mjml,
                               body_html, body_text, variables JSONB, status, approved_by)
comm.template_variants        (id, template_version_id, weight, label)
comm.bindings                 (id, event_name, event_version, channel, template_id,
                               locale, audience_rule JSONB, priority, enabled,
                               throttle_rpm, schedule_cron, quiet_hours_aware)
comm.outbox                   (id, event_name, version, payload JSONB, correlation_id,
                               idempotency_key UNIQUE, tenant_id, claimed_at,
                               claimed_by, status ENUM(PENDING,CLAIMED,DONE,FAILED),
                               error TEXT, attempts INT)
                              INDEX (status, created_at) WHERE status='PENDING'
comm.messages                 (id, correlation_id, event_outbox_id, user_id, channel,
                               provider_id, template_version_id, locale,
                               payload_snapshot JSONB, status, attempts, idempotency_key
                               UNIQUE, sent_at, delivered_at, opened_at, clicked_at,
                               error TEXT, cost_paise INT)
                              PARTITION BY RANGE (created_at)  -- monthly, ≥10M/yr
                              INDEX(status) WHERE status IN ('PENDING','SENDING')
comm.message_events           (id, message_id, event_type ENUM, occurred_at, payload JSONB)
comm.consent_records          (id, user_id, channel, source, ip, user_agent,
                               consented_at, revoked_at)
comm.suppression_list         (channel, identifier, reason, added_by, added_at)
                              PK (channel, identifier)
comm.otp_archive              (id, purpose, phone_hash, status, requested_at,
                               verified_at)  -- cold archive; live OTPs in Redis
comm.campaigns                (id, name, channel, template_id, segment_id, schedule,
                               throttle_rpm, status, cost_estimate_paise, start_at,
                               end_at, approval_state, approved_by)
comm.campaign_runs            (id, campaign_id, started_at, completed_at,
                               total_recipients, succeeded, failed)
comm.audience_segments        (id, name, query_dsl JSONB, csv_object_key, version)
comm.audience_segment_members (segment_id, user_id, snapshot_at) PK composite
comm.whatsapp_templates       (id, meta_template_id, name, language, category, status,
                               components JSONB, last_synced_at)
comm.whatsapp_sessions        (waba_phone_number_id, recipient_phone, last_inbound_at)
                              PK composite
comm.dlt_principal_entities   (id, entity_id, name, telecom_operator)
comm.dlt_templates            (id, principal_entity_id, header_id, template_id,
                               content_pattern, dlt_category, status)
comm.audit_logs               (id, actor_id, action, target_table, target_id,
                               before JSONB, after JSONB, occurred_at, request_id)
                              -- TRIGGER block_update_delete BEFORE UPDATE OR DELETE
comm.outbound_webhooks        (id, name, url, secret, event_filter JSONB, enabled)
comm.short_links              (slug PK, target_url, message_id, click_count)
```

**Indices**:
- Partial: `comm.messages(status)` WHERE `status IN ('PENDING','SENDING')`.
- Partial: `comm.outbox(claimed_at)` WHERE `status='PENDING'`.
- Composite: `comm.bindings(event_name, event_version, enabled)`.
- Composite: `comm.user_event_preferences(user_id, event_category)`.

**Partitioning**: `comm.messages` partitioned by month (`PARTITION BY RANGE (created_at)`) — only if expected >10M rows/yr. Beat task creates next-month partition on day 25 of current month.

**Append-only audit**: PostgreSQL trigger on `comm.audit_logs`:
```sql
CREATE OR REPLACE FUNCTION comm.block_audit_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'comm.audit_logs is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER comm_audit_block BEFORE UPDATE OR DELETE ON comm.audit_logs
  FOR EACH ROW EXECUTE FUNCTION comm.block_audit_mutation();
```

**Migrations**: Alembic, naming `048_comm_schema.py`, `049_comm_seed_events.py`, etc., matching existing `NNN_description.py` convention. First migration creates schema + all DDL; second seeds the 30 events + sample templates.

---

## 6. SDK Contract

```python
# services/api/app/comm/__init__.py
from app.comm.api import publish, email, sms, whatsapp

# In any router / service:
from app.comm import publish

await publish(
    "investment.confirmed",
    payload={
        "user": {"id": str(user.id), "email": user.email, "phone": user.phone},
        "investment": {
            "id": str(inv.id),
            "amount_paise": inv.amount_paise,
            "opportunity_id": str(inv.opportunity_id),
        },
    },
    session=session,                               # caller's AsyncSession (MUST)
    correlation_id=request.state.request_id,       # auto-injected via middleware
    idempotency_key=f"investment-confirmed-{inv.id}",
)

# Direct send escape hatches (for one-offs only):
await email.send(to=user.email, template_name="welcome", variables={...}, session=session)
await sms.send_otp(phone=phone, purpose="login", session=session)
await whatsapp.send_template(phone=phone, template_name="kyc_approved", components=[...])
```

Calling convention rule: **`publish()` always accepts the caller's `AsyncSession` so the outbox INSERT happens in the same transaction as the host's business write**. This is the contract that delivers the at-least-once guarantee.

---

## 7. REST API

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/comm/events` | JWT | External event publish |
| POST | `/api/v1/comm/otp/request` | None (rate-limited) | Phone OTP request |
| POST | `/api/v1/comm/otp/verify` | None (rate-limited) | OTP verify, returns short-lived JWT |
| GET | `/api/v1/comm/preferences/me?token=…` | Signed token | Public preference center |
| PATCH | `/api/v1/comm/preferences/me?token=…` | Signed token | Update prefs / unsubscribe |
| GET | `/api/v1/comm/preferences/export?token=…` | Signed token | DPDP data export |
| POST | `/api/v1/comm/preferences/erase?token=…` | Signed token | DPDP erasure |
| GET/POST/PATCH/DELETE | `/api/v1/comm/admin/events` | role: comm.admin | Event registry CRUD |
| GET/POST/PATCH/DELETE | `/api/v1/comm/admin/templates` | role: comm.template.editor | Template CRUD |
| POST | `/api/v1/comm/admin/templates/{id}/preview` | role: comm.template.editor | Render preview |
| POST | `/api/v1/comm/admin/templates/{id}/test-send` | role: comm.template.editor | Send test to current user |
| GET/POST/PATCH/DELETE | `/api/v1/comm/admin/bindings` | role: comm.admin | Binding CRUD |
| GET/POST/PATCH/DELETE | `/api/v1/comm/admin/providers` | role: comm.admin | Provider CRUD |
| POST | `/api/v1/comm/admin/providers/{id}/test` | role: comm.admin | Connectivity check |
| GET/POST/PATCH/DELETE | `/api/v1/comm/admin/campaigns` | role: comm.campaign.manager | Campaign CRUD |
| POST | `/api/v1/comm/admin/campaigns/{id}/submit` | role: comm.campaign.manager | Submit for approval |
| POST | `/api/v1/comm/admin/campaigns/{id}/approve` | role: comm.compliance.officer | Approve |
| POST | `/api/v1/comm/admin/campaigns/{id}/kill` | role: comm.admin | Emergency stop |
| GET/POST/PATCH/DELETE | `/api/v1/comm/admin/segments` | role: comm.campaign.manager | Audience segments |
| GET/POST/DELETE | `/api/v1/comm/admin/suppression` | role: comm.admin | Suppression list |
| GET | `/api/v1/comm/admin/messages` | role: comm.viewer | Searchable message log |
| GET | `/api/v1/comm/admin/dashboard` | role: comm.viewer | KPIs |
| POST | `/api/v1/comm/webhooks/email/{provider}` | HMAC signature | Bounce/complaint/open/click DLR |
| POST | `/api/v1/comm/webhooks/sms/{provider}` | HMAC signature | DLR / inbound STOP |
| POST | `/api/v1/comm/webhooks/whatsapp` | Meta signature | Inbound + DLR |

**Roles** (added to existing `roles[]` JSONB on `users`): `comm.admin`, `comm.campaign.manager`, `comm.template.editor`, `comm.compliance.officer`, `comm.viewer`. Mapped onto existing `SUPER_ADMIN` / `ADMIN` via the existing role enforcement system in [services/api/app/middleware/auth.py](services/api/app/middleware/auth.py).

OpenAPI 3.1 spec auto-generated by FastAPI. New SDK package documented with MkDocs.

---

## 8. Compliance Checklist (build-time, gating)

- [ ] India **DLT registration** (Header / Entity / Template) blocks unregistered SMS sends — implemented as pre-send gate in `comm.sms.pipeline.dlt_check`.
- [ ] WhatsApp **opt-in** captured in `comm.consent_records` BEFORE any HSM send.
- [ ] WhatsApp **24-hour rule** enforced in `comm.whatsapp.pipeline.session_window_check`.
- [ ] **Unsubscribe link** present in every promotional email — Jinja2 template macro, RFC 8058 one-click.
- [ ] **DPDP Act 2023**: consent purpose recorded; data principal export + erasure live at `/comm/preferences/me`.
- [ ] **Quiet hours** enforced per recipient timezone via `comm.user_profiles.timezone`.
- [ ] **Frequency caps** enforced via Redis sliding window, respected by orchestrator before fan-out.
- [ ] **STOP/UNSUB keyword** auto-handled — inbound SMS/WA webhook adds sender to `comm.suppression_list` immediately.
- [ ] **Suppression list** checked before every send (chain link `suppression_check`).
- [ ] **PII redaction in logs** — phone shows first 2 + last 2 digits; email shows first 2 chars before `@`.
- [ ] **Audit immutability** — `comm.audit_logs` PG trigger blocks UPDATE/DELETE.

---

## 9. Phasing & Execution Plan

### Phase 1 — MVP (Weeks 1–3)

**Backend**
- [ ] Alembic migration `048_comm_schema.py` — create `comm` schema + all tables/triggers/indices.
- [ ] Alembic migration `049_comm_seed.py` — seed 30 events + 5 sample templates + admin role rows.
- [ ] [services/api/app/comm/](services/api/app/comm/) module skeleton (`core/`, `email/`, `sms/`, `whatsapp/`, `templates/`, `bindings/`, `preferences/`, `providers/`, `pipeline/`, `tasks.py`).
- [ ] `comm.publish()` SDK + outbox writer.
- [ ] Beat task: `comm.dispatch_outbox_batch` (every 1s) — claim & enqueue.
- [ ] Orchestrator task: `comm.orchestrate_event(outbox_id)` — full pipeline.
- [ ] Email module: SMTP provider (live, reuse existing `Settings.smtp_*`), Jinja2+MJML rendering, plain-text fallback, unsubscribe link.
- [ ] SMS module: Twilio provider (live, reuse existing `Settings.twilio_*`) + Msg91 stub. OTP submodule (Redis-backed, replaces `services/sms.py:send_otp_sms`).
- [ ] WhatsApp module: stub provider only. Schema and pipeline complete; Meta adapter scaffold.
- [ ] In-app channel: writes to existing `Notification` model for backward compat.
- [ ] `comm.tasks.send_email`, `comm.tasks.send_sms`, `comm.tasks.send_whatsapp`, `comm.tasks.send_in_app` on dedicated queues.
- [ ] Update [services/api/app/celery_app.py](services/api/app/celery_app.py) with new beat entries + `task_routes`.
- [ ] Update [docker-compose.yml](docker-compose.yml): add `comm-worker` service running `celery -A app.celery_app worker -Q comm.email,comm.sms,comm.whatsapp,comm.in_app,comm.orchestrator -c 8 -l info`. Reuse existing `api` image. Add healthcheck.
- [ ] REST router [services/api/app/routers/comm.py](services/api/app/routers/comm.py) — public endpoints + admin CRUD (events / templates / bindings / providers / suppression).
- [ ] Replace existing `auth` OTP call sites: route via `comm.publish("auth.otp.requested", …)`.
- [ ] Migrate one existing in-app notify call site (`notify_investment_confirmed`) to `comm.publish("investment.confirmed", …)` as the canonical example.

**Frontend** ([apps/web/src/components/comm/](apps/web/src/components/comm/))
- [ ] Comm Dashboard panel (KPIs).
- [ ] Bindings UI — replaces existing `useCommMappings` hooks (preserves the existing UX surface in [CommandControlPage.tsx](apps/web/src/pages/CommandControlPage.tsx)).
- [ ] Event Registry panel.
- [ ] Template Library — Email (Jinja2 textarea + preview), SMS (textarea + segment counter), WhatsApp (form). MJML editor deferred to Phase 2.
- [ ] Provider Configuration panel.
- [ ] Suppression list panel.
- [ ] Logs & Delivery panel.
- [ ] New hooks under [apps/web/src/hooks/comm/](apps/web/src/hooks/comm/) following existing `useCommMappings` shape.
- [ ] New comm sections added to [CommandControlPage.tsx](apps/web/src/pages/CommandControlPage.tsx) under `?section=comm-{events|templates|bindings|...}`. Existing `useCommMappings` section is left untouched (separate feature).

**Tests**
- [ ] `tests/api/tests/comm/` — pytest: outbox, pipeline, OTP rate limit, idempotency, suppression, DLT gate, render.
- [ ] `tests/web/comm/` — vitest: each new component, hook contract.
- [ ] Coverage gate ≥ 80% on `app/comm/`.

### Phase 2 — Channels Complete (Weeks 4–6)
SES + SendGrid email adapters, MSG91 SMS adapter (DLT live), Meta Cloud WhatsApp adapter, HSM template registry sync beat, 24h-window enforcement, inbound webhook → `whatsapp.inbound` event, full suppression list, public preference center page in Next.js-style React route.

### Phase 3 — Command Control Complete (Weeks 7–9)
Remaining 8 admin sections, MJML editor (`mjml-browser` + CodeMirror 6), JSON-Schema form builder (`@rjsf/core`), audience-rule builder UI, full RBAC roles, audit log viewer, compliance center.

### Phase 4 — Campaigns & Scale (Weeks 10–12)
Campaign engine, audience segments, scheduling, A/B, link tracking, cost estimator, maker-checker workflow (reusing `ApprovalRequest` with `CAMPAIGN_LAUNCH` category), Locust load tests at 1k sends/sec/channel, observability hardening, internal SDK release, runbooks (provider outage, DLT rejection, WA template rejection, queue backlog, secret rotation, OTP abuse).

---

## 10. Critical Files to Modify (Phase 1)

**New (back end)**
- `services/api/app/comm/__init__.py`
- `services/api/app/comm/api.py` — public `publish()` SDK
- `services/api/app/comm/core/orchestrator.py`
- `services/api/app/comm/core/outbox.py`
- `services/api/app/comm/pipeline/preference.py`
- `services/api/app/comm/pipeline/quiet_hours.py`
- `services/api/app/comm/pipeline/frequency_cap.py`
- `services/api/app/comm/pipeline/suppression.py`
- `services/api/app/comm/pipeline/render.py`
- `services/api/app/comm/email/{provider_base,smtp,ses_stub,sendgrid_stub}.py`
- `services/api/app/comm/sms/{provider_base,twilio,msg91_stub,otp,dlt}.py`
- `services/api/app/comm/whatsapp/{provider_base,stub,meta_cloud_stub,hsm_registry,sessions}.py`
- `services/api/app/comm/templates/{rendering,versioning}.py`
- `services/api/app/comm/bindings/{loader,audience}.py`
- `services/api/app/comm/preferences/service.py`
- `services/api/app/comm/providers/secrets.py` (Fernet wrapper, reuses `Settings.encryption_key`)
- `services/api/app/comm/tasks.py` (Celery)
- `services/api/app/comm/models.py` (or split per table — match existing convention)
- `services/api/app/comm/schemas.py` (Pydantic DTOs)
- `services/api/app/routers/comm.py`
- `services/api/alembic/versions/048_comm_schema.py`
- `services/api/alembic/versions/049_comm_seed.py`

**Modified (back end)**
- [services/api/app/main.py](services/api/app/main.py) — register `comm` router.
- [services/api/app/celery_app.py](services/api/app/celery_app.py) — beat entries + `task_routes` for comm queues; autodiscover includes `app.comm.tasks`.
- [services/api/app/core/config.py](services/api/app/core/config.py) — add `MJML_RENDER_TIMEOUT_SECONDS`, `COMM_OUTBOX_BATCH_SIZE` (default 200), `COMM_OUTBOX_POLL_SECONDS` (default 1).
- [services/api/app/routers/auth.py](services/api/app/routers/auth.py) — replace `services/email.py` + `services/sms.py` calls with `comm.publish("auth.otp.requested", …)`.
- [services/api/app/services/notification.py](services/api/app/services/notification.py) — `notify_investment_confirmed`, `notify_kyc_status_change`, `notify_payout` migrated to `comm.publish(...)`. Keep file as a thin shim that publishes events for backward compat in Phase 1; delete in Phase 2.

**Deleted (back end, end of Phase 1)**
- [services/api/app/services/email.py](services/api/app/services/email.py)
- [services/api/app/services/sms.py](services/api/app/services/sms.py)
- `send_email_task`, `send_sms_task` in [services/api/app/tasks.py](services/api/app/tasks.py).

**New (front end)**
- `apps/web/src/components/comm/CommDashboard.tsx`
- `apps/web/src/components/comm/EventRegistry.tsx`
- `apps/web/src/components/comm/TemplateLibrary.tsx`
- `apps/web/src/components/comm/BindingsManager.tsx`
- `apps/web/src/components/comm/ProvidersConfig.tsx`
- `apps/web/src/components/comm/SuppressionList.tsx`
- `apps/web/src/components/comm/MessagesLog.tsx`
- `apps/web/src/hooks/comm/useCommEvents.ts`
- `apps/web/src/hooks/comm/useCommTemplates.ts`
- `apps/web/src/hooks/comm/useCommBindings.ts`
- `apps/web/src/hooks/comm/useCommProviders.ts`
- `apps/web/src/hooks/comm/useCommSuppression.ts`
- `apps/web/src/hooks/comm/useCommMessages.ts`

**Modified (front end)**
- [apps/web/src/pages/CommandControlPage.tsx](apps/web/src/pages/CommandControlPage.tsx) — add new sections under `?section=comm-{events|templates|bindings|providers|suppression|logs|dashboard}`. Existing `useCommMappings` section unchanged (different feature).

**Dependencies (new)**
- Backend: `mjml-python`, `html2text`, `json-logic-py`, `pybreaker`, `cachetools`, `itsdangerous` (already transitively), `jsonschema`.
- Frontend (Phase 1 minimal): none. Phase 2/3 adds `mjml-browser`, `@codemirror/view`, `@rjsf/core`.

---

## 11. Non-Functional Requirements

- **Throughput**: 10k events/sec ingest, 1k sends/sec/channel sustained (Phase 4 hardening).
- **Latency**: transactional event → first send attempt within 2s p95.
- **Availability**: 99.95%; provider failover within 30s via circuit breaker.
- **Idempotency**: `(event_id, channel, recipient_id, template_id, template_version)` SHA-256 → unique on `comm.messages.idempotency_key`.
- **Security**: Fernet-encrypted provider creds in `comm.providers.config_encrypted`; webhook HMAC signature verification mandatory; rate-limit all admin endpoints (reuse existing `RateLimitMiddleware`); CSRF unnecessary (token auth only).
- **Observability**: structured JSON logs (existing JSONFormatter), request_id propagated into Celery via task headers; Prometheus metrics via existing `MetricsMiddleware` extended; Sentry integration retained. OTel deferred to Phase 4.
- **Multi-tenancy**: `tenant_id` column on every `comm.*` row, default `NULL` for current single-tenant deployment. Indices include it.
- **Testability**: pytest, ≥80% on business logic; fake providers for unit tests; sandbox tests behind env flag for live providers.
- **Localization**: every user-visible string in templates is locale-keyed (`comm.template_versions.locale`).

---

## 12. Verification Plan

After Phase 1 land:

1. **Unit**: `cd services/api && pytest tests/api/tests/comm/ -v` → all pass, coverage ≥80%.
2. **Lint**: `cd services/api && ruff check app/comm/` → zero errors.
3. **Migration**: `cd services/api && alembic upgrade head` (against local Postgres at port 5433) → success; `alembic downgrade -1 && alembic upgrade head` → success.
4. **Web build**: `npm run build:web` → success (tsc + vite).
5. **Web tests**: `npm test --workspace=tests/web` → green.
6. **Integration end-to-end** (with `docker compose up -d`):
   - **OTP**: `curl -X POST localhost:8000/api/v1/comm/otp/request -d '{"phone":"+91…","purpose":"login"}'` → 200, OTP delivered (Twilio sandbox or stub log).
   - **Verify**: `curl -X POST localhost:8000/api/v1/comm/otp/verify -d '{"phone":"…","otp":"……","purpose":"login"}'` → JWT returned.
   - **Event publish**: trigger investment confirm flow → outbox row appears → Celery worker logs orchestration → `comm.messages` row appears with `status=SENT` → email arrives at MailHog (added to compose for dev).
   - **Admin UI**: open Command Control → Bindings → toggle a binding off → re-trigger event → no send. Toggle on → send resumes within 10s (cache TTL).
   - **Idempotency**: replay the same `idempotency_key` → second `comm.publish` is a no-op; only one row in `comm.messages`.
   - **DLT gate**: configure SMS template not registered → send attempt → rejected with `DltTemplateMismatch`, never reaches Twilio, error visible in admin Logs panel.
   - **Suppression**: add an email to suppression list → publish event → no email sent; `comm.messages` row written with `status=SUPPRESSED`.
   - **Quiet hours**: set user quiet hours 22:00–08:00 IST; publish at 02:00 IST → message scheduled with `eta=08:00 IST`; verify by checking Celery scheduled task.
7. **Security**: `bandit -r services/api/app/comm/` zero High/Critical; `safety check` clean.
8. **Compose**: `docker compose ps` → `comm-worker` healthy; `docker compose logs comm-worker` → consuming `comm.*` queues.
9. **Demo**: short Loom recording of the OTP + event + admin-binding-toggle flow.

---

## 13. Open Items (deferred)

- WABA + DLT credential procurement: out-of-band; once obtained, flip provider config in Command Control → Providers; no code change required.
- Push notifications (FCM/APNs) — currently NotificationChannel.PUSH is unused; add as Phase 5 channel module.
- OpenTelemetry tracing across Celery — Phase 4.
- KMS-backed encryption (currently Fernet via `Settings.encryption_key`) — Phase 4 if compliance escalates.
- Mobile app (`apps/mobile/`) consumption of comm SDK — events fired from mobile go via `POST /api/v1/comm/events`; no mobile SDK changes required Phase 1.
