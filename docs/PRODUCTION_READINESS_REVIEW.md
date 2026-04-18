# WealthSpot — Complete Production Readiness Review

---

## SECTION 1 — PROJECT STRUCTURE & ARCHITECTURE REVIEW

### 1.1 Architecture Compliance Matrix

| Principle | Status | Notes |
|---|---|---|
| Clean Architecture | 🟡 Partial | Routes→Services→Models exists but services layer is thin; most business logic lives in routers |
| Hexagonal Architecture | 🔴 Violated | No ports/adapters pattern; S3/Razorpay/SMTP directly called from routers and services |
| Domain Driven Design | 🟡 Partial | Good domain models, but no domain events, aggregates, or value objects |
| Dependency Inversion | 🟡 Partial | FastAPI `Depends()` used well, but service classes directly import infrastructure |
| Single Responsibility | 🟡 Violated in routers | `community.py` (452 lines) mixes posts, replies, likes, upvotes, Q&A |
| Proper Layering | 🟠 Missing service layer | Routes talk directly to ORM; no service/use-case layer for complex operations |
| Circular Dependencies | ✅ None detected | Import graph is acyclic |

**Current Architecture:**
```
Routers → (inline business logic) → SQLAlchemy Models → PostgreSQL
    ↳ Services (thin: email, SMS, S3, encryption, points, notification)
```

**Recommended Architecture:**
```
Routers → Services (business logic) → Repositories → Models → DB
    ↳ Infrastructure (S3, payment, email, SMS)
```

### 1.2 Module Boundary Analysis

| Module | Responsibility | Dependencies | Coupling Score |
|---|---|---|---|
| `routers/` | HTTP handling + business logic | models, schemas, services, middleware, core | 🔴 HIGH (5 internal) |
| `models/` | ORM entities | core.database only | ✅ LOW (1) |
| `schemas/` | Pydantic request/response | models (enums) | ✅ LOW (1) |
| `services/` | Infrastructure integration | core.config | ✅ LOW (1) |
| `middleware/` | Auth, rate-limit, audit | models, core | 🟡 MEDIUM (2) |
| `core/` | Config, DB, security | External only | ✅ LOW (0) |

**Violation:** Routers like `investments.py` (lines 55-60) directly execute raw SQLAlchemy queries, compute business metrics, and call infrastructure services — all in one function. This couples HTTP handling with business logic and data access.

### 1.3 Circular Import Detection

No circular imports detected. Import graph is clean:

```
core → models → schemas
core → middleware → models
routers → models, schemas, middleware, services, core
services → core
```

### 1.4 God File Detection

| File | Lines | Classification | Split Strategy |
|---|---|---|---|
| `community.py` (router) | 452 | Controller God File | Split into: posts.py, replies.py, likes.py |
| `properties.py` (router) | 371 | Controller God File | Split into: marketplace.py, builder_listings.py |
| `kyc.py` (router) | 317 | Controller God File | Split into: kyc_submit.py, kyc_documents.py |
| `opportunities.py` (router) | 301 | Near-God File | Acceptable but vault_stats should be extracted |
| `profile.py` (router) | 264 | Code Duplication | 4 nearly identical section-update endpoints |

### 1.5 Missing Modules

| Module | Status | Impact |
|---|---|---|
| `auth/` (directory) | 🟡 Exists as middleware | Good — but refresh token rotation not implemented |
| `audit/` | ✅ Exists | `middleware/audit.py` — fire-and-forget pattern |
| `rate_limit/` | ✅ Exists | Redis-backed with in-memory fallback |
| `feature_flags/` | 🔴 Missing | No feature flag system; `PlatformConfig` table is a partial substitute |
| `permissions/` | 🟡 Basic | Role-based only; no resource-level permissions (ABAC) |
| `events/` (domain events) | 🔴 Missing | No event bus; all cross-cutting concerns are inline |
| `observability/` | 🟡 Partial | Sentry + basic logging; no Prometheus metrics endpoint |
| `repositories/` | 🔴 Missing | No repository layer; all DB access in routers |
| `scheduler/` | 🔴 Missing | Celery app exists but **zero tasks defined** |

### 1.6 Orphan File Detection

| File | Type | Name | Reason / Safe to Delete |
|---|---|---|---|
| `services/api/app/services/__init__.py` | ☠ ORPHAN FILE | `__init__.py` | Empty init, no barrel exports — harmless but unused |
| `services/api/app/celery_app.py` | ☠ ORPHAN MODULE | `celery_app` | Celery configured but **zero @task decorators** defined anywhere in codebase |
| `database/005_media_address_company.sql` | ☠ DUPLICATE MIGRATION | `005_` duplicate | Two `005_` prefixed files — naming collision risk |

---

## SECTION 2 — API DESIGN REVIEW

### 2.1 RESTful Compliance

| Check | Status | Details |
|---|---|---|
| Resource Naming | ✅ Good | `/properties`, `/investments`, `/community/posts` |
| HTTP Methods | ✅ Correct | GET/POST/PATCH/PUT/DELETE used correctly |
| Versioning | ✅ `/api/v1/` | All routes prefixed |
| Pagination | 🟡 Partial | 14/20 routers have it where needed; some missing |
| Filtering | 🟡 Basic | Properties have asset_type/city filters; other endpoints lack it |
| Idempotency | 🔴 Missing | No idempotency keys on POST endpoints |
| HATEOAS | Not applicable | REST level 2 — acceptable for this application |

### 2.2 Critical API Issues

#### 🔴 CRITICAL — N+1 Query: Investment Listing

**File:** `services/api/app/routers/investments.py` (lines 55-60)

**Risk:** O(N) database queries per page load — will degrade linearly with data volume.

**BEFORE:**
```python
for inv in investments:
    prop_result = await db.execute(select(Property.title).where(Property.id == inv.property_id))
    prop_name = prop_result.scalar_one_or_none()
```

**AFTER:**
```python
from sqlalchemy.orm import selectinload

query = (
    select(Investment)
    .options(selectinload(Investment.property))
    .where(Investment.user_id == user.id)
    .order_by(Investment.created_at.desc())
    .offset((page - 1) * page_size)
    .limit(page_size)
)
result = await db.execute(query)
investments = result.scalars().all()
items = [
    InvestmentRead(
        **InvestmentRead.model_validate(inv).model_dump(),
        property_name=inv.property.title if inv.property else None,
    )
    for inv in investments
]
```

**Why better:** Single query with eager loading; O(1) instead of O(N).

---

#### 🔴 CRITICAL — Non-Idempotent Upvote

**File:** `services/api/app/routers/community.py` — upvote endpoint

**Risk:** Repeated calls inflate counts arbitrarily. No dedup.

**AFTER:** Should use the existing like table pattern (UniqueConstraint check) for upvotes too.

---

#### 🟠 HIGH — Hardcoded Returns in Investment Summary

**File:** `services/api/app/routers/investments.py` (lines 86-89)

```python
current_value = total_invested * Decimal("1.08")
monthly_income = total_invested * Decimal("0.006")
xirr=8.2,  # Would be calculated from actual cash flows
```

**Risk:** Misleading financial data shown to investors. Regulatory liability in India (SEBI).

**Fix:** Either compute from actual market data / property valuations, or clearly label as "projected" in both API response and UI.

---

#### 🟠 HIGH — Vault Stats Loop Queries

**File:** `services/api/app/routers/opportunities.py` — `vault_stats()` endpoint

**Risk:** Loops over 3 vault types, each executing ~3 queries = 9+ queries per call.

**Fix:** Single aggregation query with `GROUP BY vault_type`.

---

#### 🟡 MEDIUM — Missing Pagination

| Endpoint | File | Issue |
|---|---|---|
| `GET /community/posts/{id}/replies` | `community.py` | Returns ALL replies unbounded |
| `GET /lender/dashboard` | `lender.py` | Loads ALL loans into memory |
| `GET /approvals/my` | `approvals.py` | Hard-capped at 50, no real pagination |

---

## SECTION 3 — DATABASE DESIGN REVIEW

### 3.1 Schema Summary

| Table | Indexes | FKs | Constraints | Status |
|---|---|---|---|---|
| users | 4 | 1 (self-ref) | UNIQUE(email, clerk_id, referral_code) | ✅ Good |
| properties | 5 | 2 | UNIQUE(slug) | ✅ Good |
| investments | 4 | 2 | CHECK(units>0, amount>0) | ✅ Good |
| transactions | 3 | 2 | — | 🟡 No CHECK constraints |
| community_posts | 2 | 1 | — | 🟡 Missing full-text index |
| community_replies | 1 | 2 | — | ✅ OK |
| community_post_likes | 2 | 2 | UNIQUE(post_id, user_id) | ✅ Good |
| community_reply_likes | 2 | 2 | UNIQUE(reply_id, user_id) | ✅ Good |
| referrals | 1 | 2 | UNIQUE(referee_id) | ✅ Good |
| audit_logs | 2 | 0 | — | 🟡 No partitioning strategy |
| loans | 2 | 2 | — | 🟡 Missing CHECK(principal>0) |
| approval_requests | 3 | 1 | — | ✅ OK |
| opportunities | 4 | 3 | UNIQUE(slug) | ✅ Good |
| opportunity_media | 2 | 1 | — | ✅ OK |
| opportunity_investments | 2 | 2 | — | ✅ OK |
| companies | 2 | 1 | — | ✅ OK |
| platform_configs | 1 | 0 | — | ✅ JSONB value store |
| bank_details | 1 | 1 | — | ✅ Encrypted fields |
| notifications | 2 | 1 | — | 🟡 Missing index on `read_at IS NULL` |

### 3.2 Missing Indexes

| Table | Column(s) | Query Pattern | Priority |
|---|---|---|---|
| `notifications` | `(user_id, read_at)` WHERE `read_at IS NULL` | Unread count query | 🟠 HIGH |
| `community_posts` | `(title, body)` GIN tsvector | Full-text search | 🟡 MEDIUM |
| `audit_logs` | `created_at` (BRIN) | Time-range queries | 🟡 MEDIUM |
| `investments` | `(user_id, status)` composite | Dashboard summary | 🟡 MEDIUM |
| `properties` | `(status, city)` composite | Marketplace filtering | 🟡 MEDIUM |

**Recommended migration addition:**
```sql
CREATE INDEX CONCURRENTLY idx_notifications_unread 
ON notifications (user_id) WHERE read_at IS NULL;

CREATE INDEX CONCURRENTLY idx_investments_user_status 
ON investments (user_id, status);

CREATE INDEX CONCURRENTLY idx_audit_logs_created_brin 
ON audit_logs USING BRIN (created_at);
```

### 3.3 Data Integrity Issues

#### 🔴 CRITICAL — Race Condition: Investment Confirmation

**File:** `services/api/app/routers/investments.py` (lines 186-193)

```python
prop.raised_amount += investment.amount
prop.sold_units += investment.units
```

**Risk:** Two concurrent confirmations can over-sell units. No `SELECT FOR UPDATE` or optimistic locking.

**AFTER:**
```python
prop_result = await db.execute(
    select(Property)
    .where(Property.id == investment.property_id)
    .with_for_update()  # Row-level lock
)
prop = prop_result.scalar_one_or_none()
if prop:
    if prop.sold_units + investment.units > prop.total_units:
        raise HTTPException(400, "Units no longer available")
    prop.raised_amount += investment.amount
    prop.sold_units += investment.units
```

#### 🟠 HIGH — Duplicate Migration Prefix

Files `005_companies_pincodes_points_groups.sql` and `005_media_address_company.sql` share the same `005_` prefix. This creates ambiguity about execution order and can cause issues with migration tooling.

#### 🟡 MEDIUM — No Soft Delete Index Strategy

Soft-deleted properties (status=`archived`) still participate in every full-table scan. Need partial indexes:

```sql
CREATE INDEX CONCURRENTLY idx_properties_active 
ON properties (city, asset_type) WHERE status NOT IN ('archived', 'rejected');
```

---

## SECTION 4 — PERFORMANCE REVIEW

### 4.1 Issue Summary

| Category | Count | Severity |
|---|---|---|
| N+1 Queries | 3 | 🔴 CRITICAL |
| Unbounded Queries | 3 | 🟠 HIGH |
| Missing Caching | 5 | 🟠 HIGH |
| Blocking I/O in async | 1 | 🟡 MEDIUM |
| Hardcoded computations | 1 | 🟡 MEDIUM |

### 4.2 Blocking I/O in Async Context

**File:** `services/api/app/services/s3.py` (lines 49-55)

```python
async def upload_file(file, key, content_type):
    s3 = _get_s3_client()
    s3.upload_fileobj(file, ...)  # Blocking boto3 call!
```

**Risk:** `boto3.upload_fileobj` is synchronous and blocks the async event loop.

**AFTER:**
```python
import anyio

async def upload_file(file, key, content_type):
    s3 = _get_s3_client()
    await anyio.to_thread.run_sync(
        lambda: s3.upload_fileobj(file, settings.aws_s3_bucket, key, ExtraArgs={"ContentType": content_type})
    )
    return key
```

### 4.3 Missing Redis Caching

| Endpoint | Cache TTL Suggestion | Rationale |
|---|---|---|
| `GET /properties` (list) | 30s | Most viewed, rarely changes |
| `GET /properties/cities` | 5 min | Slow distinct query, static data |
| `GET /properties/autocomplete` | 60s | Multiple sub-queries |
| `GET /community/config` | 5 min | Static configuration |
| `GET /points/leaderboard` | 60s | Computed leaderboard |

### 4.4 Database Connection Pool

**File:** `services/api/app/core/database.py` (lines 17-21)

```python
engine = create_async_engine(
    settings.database_url,
    pool_size=20,
    max_overflow=10,
)
```

**Assessment:** Pool of 20+10=30 connections is appropriate for a single-instance deployment. For multi-instance, consider reducing per-instance pool and using PgBouncer.

---

## SECTION 5 — SECURITY REVIEW

### 5.1 Critical Findings

#### 🔴 CRITICAL — Webhook Bypass in Production

**File:** `services/api/app/routers/webhooks.py` (lines 31-33)

```python
if not secret:
    logger.warning("CLERK_WEBHOOK_SECRET not configured – skipping verification")
    return True  # Allow in dev when secret is not set
```

The same pattern exists for Razorpay at line 152-154.

**Risk:** If `CLERK_WEBHOOK_SECRET` or `RAZORPAY_KEY_SECRET` are not set in production, **all webhooks are accepted without verification**. An attacker can forge user creation or payment confirmation.

**AFTER:**
```python
if not secret:
    if get_settings().app_env == "production":
        logger.error("Webhook secret not configured in production!")
        return False
    logger.warning("Webhook secret not configured – skipping verification (dev only)")
    return True
```

#### 🔴 CRITICAL — JWT Secret Default Value

**File:** `services/api/app/core/config.py` (line 30)

```python
jwt_secret_key: str = "change-me"
```

**Risk:** If `JWT_SECRET_KEY` is not overridden in environment, attackers can forge valid JWTs.

**AFTER:**
```python
@model_validator(mode="after")
def validate_security(self):
    if self.app_env == "production" and self.jwt_secret_key == "change-me":
        raise ValueError("JWT_SECRET_KEY must be set in production")
    return self
```

#### 🔴 CRITICAL — Race Condition on Investment Confirmation

See Section 3.3 above. No row-level locking on `sold_units` update = potential over-selling.

#### 🔴 CRITICAL — Encryption Key in Docker Compose

**File:** `docker-compose.yml` (line 88)

```yaml
ENCRYPTION_KEY: "awjAdm6ECmN0HZEwATo2a8ymurcteSo3jZI8w9v5MZs="
```

**Risk:** Production encryption key committed to version control. All bank details can be decrypted by anyone with repo access.

**Fix:** Remove from docker-compose, use Docker secrets or external secret manager.

#### 🟠 HIGH — Email Existence Enumeration

**File:** `services/api/app/routers/auth.py` — `/auth/check` endpoint

**Risk:** Allows attackers to enumerate registered emails.

**Fix:** Return constant-time generic response: `{"registered": true}` regardless, or require CAPTCHA.

#### 🟠 HIGH — Token Storage in localStorage

**File:** `apps/web/src/lib/api.ts` (web frontend)

JWT tokens stored in `localStorage` are vulnerable to XSS. Any compromised JS dependency can steal tokens.

**Fix:** Use `httpOnly` + `Secure` + `SameSite=Strict` cookies for token transport.

#### 🟠 HIGH — Open Redirect via API Response

**File:** `apps/web/src/lib/api.ts` (lines ~190-198)

```typescript
if (errorData.error.redirect) {
    window.location.href = errorData.error.redirect  // No URL validation
}
```

**Fix:** Validate redirect URL against allowlist of known origins.

#### 🟠 HIGH — CSV Injection

**File:** `services/api/app/routers/templates.py` — template upload

CSV values parsed without formula injection protection. Values starting with `=`, `+`, `-`, `@` should be sanitized.

#### 🟡 MEDIUM — Missing CORS Tightening

**File:** `services/api/app/main.py` (lines 60-66)

```python
allow_methods=["*"],
allow_headers=["*"],
```

Should restrict to actual methods/headers used in production.

#### 🟡 MEDIUM — No CSP Headers

Nginx config at `apps/web/nginx.conf` has basic security headers but **no Content-Security-Policy**. This enables XSS if any input is unsanitized.

#### 🟡 MEDIUM — Docs Exposed in Non-Production

**File:** `services/api/app/main.py` (lines 47-49)

```python
docs_url="/api/docs" if settings.app_env != "production" else None,
```

Good — but staging environments (non-production, non-development) also expose Swagger docs. Should be `development` only.

### 5.2 Security Checklist

| Check | Status |
|---|---|
| SQL Injection | ✅ Protected — SQLAlchemy ORM parameterized queries |
| JWT Security | 🔴 Default secret risk |
| Authentication | ✅ Bearer JWT with proper validation |
| Authorization | ✅ Role-based with `require_role()` |
| Input Validation | 🟡 Partial — Pydantic schemas on most, missing on some |
| Rate Limiting | ✅ Redis-backed with fallback |
| CORS | 🟡 Too permissive methods/headers |
| Secret Leakage | 🔴 Encryption key in docker-compose |
| Sensitive Logging | 🟡 OTP logged in dev mode |
| Webhook Security | 🔴 Bypass when secrets unconfigured |
| Password Hashing | ✅ passlib[bcrypt] available |
| Bank Details | ✅ Fernet encrypted at rest |

---

## SECTION 6 — BACKGROUND JOBS & EVENT SYSTEM

### 6.1 Current State

| Component | Status | Assessment |
|---|---|---|
| Celery App | ☠ CONFIGURED BUT EMPTY | `celery_app.py` — 25 lines, zero tasks |
| Celery Worker | 🔴 Docker service exists | Will start but do nothing — wasted container |
| APScheduler | 🔴 Not present | No periodic job scheduler |
| Redis Streams | 🔴 Not present | No event streaming |
| Domain Events | 🔴 Not present | All side effects inline |

### 6.2 Missing Background Tasks

| Task | Priority | Currently Handled |
|---|---|---|
| Send email notifications | 🔴 HIGH | Inline in request handler (blocks response) |
| Process KYC document verification | 🔴 HIGH | Not automated |
| Compute investment returns/XIRR | 🟠 HIGH | Hardcoded `Decimal("1.08")` |
| Clean expired OTPs | 🟡 MEDIUM | Never cleaned |
| Generate referral rewards | 🟡 MEDIUM | Inline |
| Audit log archival/compression | 🟡 MEDIUM | Grows unbounded |
| S3 orphan cleanup | 🔵 LOW | Never cleaned |
| Daily portfolio snapshot | 🔵 LOW | Not implemented |

### 6.3 Recommendation

Implement at least these Celery tasks:

```python
# app/tasks/notifications.py
@celery.task(bind=True, max_retries=3)
def send_notification_email(self, user_id: str, template: str, context: dict):
    ...

# app/tasks/kyc.py
@celery.task(bind=True, max_retries=2)
def process_kyc_document(self, document_id: str):
    ...

# app/tasks/cleanup.py
@celery.task
def cleanup_expired_otps():
    ...
```

---

## SECTION 7 — OBSERVABILITY

### 7.1 Current State

| Component | Status | Details |
|---|---|---|
| Sentry | 🟡 Optional | Configured in `main.py` (lines 25-30) but `SENTRY_DSN` defaults to empty |
| Prometheus | 🔴 Missing | No `/metrics` endpoint, no instrumentation |
| Structured Logging | 🟡 Basic | Uses `logging.getLogger()` — no JSON formatting |
| Trace Correlation | 🔴 Missing | No request-id propagation |
| Health Endpoint | ✅ Present | `GET /health` returns `{"status": "ok"}` |

### 7.2 Missing Observability

- **No Prometheus metrics:** Request duration, error rates, active connections
- **No request ID** propagated through logs for trace correlation
- **Health check is shallow:** Doesn't verify database or Redis connectivity
- **No structured JSON logging** for log aggregation (ELK/Loki)

**Recommended health check:**
```python
@app.get("/health")
async def health():
    db_ok = await check_db_connection()
    redis_ok = await check_redis_connection()
    return {
        "status": "ok" if (db_ok and redis_ok) else "degraded",
        "db": "ok" if db_ok else "error",
        "redis": "ok" if redis_ok else "error",
    }
```

---

## SECTION 8 — FRONTEND ARCHITECTURE REVIEW

### 8.1 Web App Assessment

| Check | Status | Details |
|---|---|---|
| Code Splitting | ✅ Excellent | All 28 routes use `React.lazy` |
| Error Boundaries | ✅ Present | `ErrorBoundary.tsx` with recovery options |
| State Management | ✅ Good | 4 Zustand stores with appropriate scoping |
| React Query | ✅ Well-implemented | 17 hooks, proper `staleTime`, cache invalidation |
| TypeScript | 🟡 Good | 2 `as any` usages found |
| Bundle Optimization | ✅ Good | Manual chunks for vendor/charts/clerk |
| Form Validation | 🟡 Partial | Zod validators exist but not all forms use them |
| Accessibility | 🔴 Not reviewed | No evidence of ARIA labels or a11y testing |

### 8.2 Key Issues

1. **Token in localStorage** (see Section 5) — XSS vulnerability vector
2. **Unvalidated API redirects** — open redirect risk
3. **Missing CSP** — no Content-Security-Policy header
4. **Recharts not lazy-loaded** — 38KB gzipped loaded for all users, only needed on portfolio pages
5. **No Sentry integration in frontend** — `ErrorBoundary` logs to console only

### 8.3 Mobile App Status

The mobile app is a **minimal MVP** with ~10% feature parity to web:
- 5 tab screens + 2 modals
- 1 custom hook, 1 store
- Missing: portfolio, community, KYC, admin, approvals, settings
- **Not production-ready** — essentially a proof of concept

---

## SECTION 9 — TEST COVERAGE REVIEW

### 9.1 Backend Test Coverage

| Test File | Lines | Covers | Missing |
|---|---|---|---|
| test_auth.py | 99 | Register, login, refresh | Brute-force, token expiry edge cases |
| test_properties.py | 25 | ⚠️ Stub only | Complete CRUD, filtering, pagination |
| test_investments_referrals_templates_pincodes.py | 237 | Investments, referrals | Payment confirmation, race conditions |
| test_community.py | 63 | Basic posts | Replies, likes, upvotes, Q&A |
| test_companies.py | 72 | CRUD | Edge cases |
| test_kyc_bank.py | 445 | KYC + Bank | Good coverage |
| test_admin_approvals_control_centre_lender.py | 517 | Admin flows | Good coverage |
| test_notifications_points.py | 44 | ⚠️ Minimal | Missing preferences, bulk operations |
| test_opportunities.py | 78 | Basic CRUD | Vault stats, assignment, PATCH |
| test_profile_completion.py | 277 | Profile sections | OTP verification |

### 9.2 Coverage Gaps

| Category | Coverage | Priority |
|---|---|---|
| Auth (brute force, token rotation) | 🟡 40% | 🔴 HIGH |
| Properties CRUD | 🔴 ~5% | 🔴 HIGH |
| Investment confirm-payment race condition | 🔴 0% | 🔴 CRITICAL |
| Webhook signature verification | 🔴 0% | 🔴 CRITICAL |
| Community full flow | 🟡 30% | 🟡 MEDIUM |
| Notifications full | 🔴 15% | 🟡 MEDIUM |
| Frontend unit tests | ❓ Unknown | 🟡 MEDIUM |
| Integration/E2E tests | 🔴 0% | 🔴 HIGH |
| Load/performance tests | 🔴 0% | 🟠 HIGH |

### 9.3 Test Infrastructure Assessment

- **Test database isolation:** ✅ Excellent — uses separate `test_ws` schema, full teardown
- **Fixtures:** ✅ Good — `test_user`, `admin_user`, `auth_headers`
- **Async support:** ✅ `pytest-asyncio` configured
- **Coverage reporting:** ✅ `pytest-cov` available
- **Mocking:** 🟡 Partial — no service-level mocking strategy

---

## SECTION 10 — DEVOPS & DEPLOYMENT REVIEW

### 10.1 Docker Assessment

| Check | Status | Details |
|---|---|---|
| Multi-stage build (API) | 🔴 Missing | Single FROM, no builder/runtime separation |
| Multi-stage build (Web) | ✅ Good | Build → nginx production stage |
| Non-root user | 🔴 Missing (API) | Runs as root |
| Non-root user | ✅ Good (Web) | nginx runs as non-root by default |
| `.dockerignore` | 🔴 Not found | Entire source tree copied including `.git`, tests |
| Image pinning | 🟡 Partial | `python:3.12-slim` not SHA-pinned |
| `--reload` in production | 🔴 YES | Dockerfile: `CMD ["uvicorn", ... "--reload"]` |
| Health checks | 🟡 Infra only | Postgres/Redis have checks; API container does not |
| Secrets management | 🔴 BAD | Encryption key hardcoded in compose |

#### 🔴 CRITICAL — `--reload` in Docker CMD

**File:** `services/api/Dockerfile` (line 19)

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**Risk:** `--reload` watches filesystem for changes — massive overhead in production, security risk (arbitrary code execution if volume mounted).

**AFTER:**
```dockerfile
# Development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production (separate stage or override)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### 🔴 CRITICAL — No Non-Root User

```dockerfile
# Add before CMD:
RUN adduser --system --no-create-home appuser
USER appuser
```

### 10.2 CI/CD Pipeline

🔴 **No CI/CD configuration found** — no `.github/workflows/`, no `Jenkinsfile`, no `.gitlab-ci.yml`.

**Missing:**
- Lint + type-check stage
- Test stage
- Docker build + push
- Database migration validation
- Security scanning (Trivy, Snyk)
- Deployment automation

### 10.3 Environment Configuration

| Concern | Status |
|---|---|
| `.env` example file | ✅ Exists |
| Secret rotation strategy | 🔴 Missing |
| Config validation on startup | 🔴 Missing for critical settings |
| Separate staging configs | 🔴 Missing |

---

## SECTION 11 — AI SYSTEM REVIEW

### 11.1 Current AI Components

🔴 **No AI components found in the codebase.**

The project description mentions "AI-powered" but there are:
- No ML model files
- No prompt templates
- No OpenAI/LLM API integrations
- No model versioning
- No AI hallucination safety measures
- No token usage tracking

**Recommendation:** The "AI-powered" label appears aspirational rather than current. If AI features are planned, implement:
1. `/services/ai/` service module
2. Prompt management system
3. Rate limiting for AI endpoints
4. Output validation/guardrails
5. Token usage tracking and budget alerts

---

## SECTION 12 — FEATURE GAP ANALYSIS

| Feature | Status | Priority |
|---|---|---|
| Portfolio Tracking | ✅ Present | — |
| Investment Dashboard | ✅ Present | — |
| KYC Verification | ✅ Present | — |
| Community Forum | ✅ Present | — |
| Referral System | ✅ Present | — |
| Approval Workflow | ✅ Present | — |
| Notifications | ✅ Present | — |
| **Price Alerts** | 🔴 Missing | 🟠 HIGH |
| **Risk Scoring** | 🔴 Missing | 🔴 CRITICAL for finance |
| **AI Investment Insights** | 🔴 Missing | 🟡 MEDIUM |
| **Portfolio Rebalancing** | 🔴 Missing | 🟡 MEDIUM |
| **Backtesting** | 🔴 Missing | 🔵 LOW |
| **Tax Optimization / 80C** | 🔴 Missing | 🟠 HIGH for Indian market |
| **Goal-Based Planning** | 🔴 Missing | 🟡 MEDIUM |
| **2FA / MFA** | 🔴 Missing | 🔴 CRITICAL for finance |
| **Audit Trail Export** | 🔴 Missing | 🟠 HIGH for compliance |
| **SEBI Compliance Reports** | 🔴 Missing | 🔴 CRITICAL (regulatory) |
| **Account Statements (PDF)** | 🔴 Missing | 🟠 HIGH |
| **Transaction Receipts** | 🔴 Missing | 🟠 HIGH |
| **Real-time Property Valuation** | 🔴 Missing | Investment data is hardcoded 1.08x |
| **Actual XIRR Calculation** | 🔴 Missing | Returns `8.2` constant |
| **Mobile App Feature Parity** | 🔴 10% | 🟠 HIGH |

---

## SECTION 13 — IMPLEMENTATION SUGGESTIONS (Top 5)

### 1. Add Service Layer (Architecture Fix)

Create `services/api/app/domain/` with business logic extracted from routers:

```
app/
  domain/
    investment_service.py   # Business rules for investing
    property_service.py     # Listing management
    notification_service.py # Dispatch logic
    kyc_service.py          # KYC workflow
```

### 2. Add Prometheus Metrics

```python
# app/middleware/metrics.py
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'Request latency', ['method', 'endpoint'])
```

### 3. Fix Docker for Production

```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .

FROM python:3.12-slim AS production
WORKDIR /app
COPY --from=base /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=base /usr/local/bin /usr/local/bin
COPY app/ app/
RUN adduser --system --no-create-home appuser
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 4. Add XIRR Calculation

```python
# app/services/xirr.py
from scipy.optimize import brentq
from datetime import datetime
from decimal import Decimal

def calculate_xirr(cashflows: list[tuple[datetime, Decimal]]) -> float:
    """Calculate Extended IRR from dated cashflows."""
    if not cashflows or len(cashflows) < 2:
        return 0.0
    dates = [cf[0] for cf in cashflows]
    amounts = [float(cf[1]) for cf in cashflows]
    min_date = min(dates)
    years = [(d - min_date).days / 365.25 for d in dates]
    
    def npv(rate):
        return sum(a / (1 + rate) ** y for a, y in zip(amounts, years))
    
    try:
        return brentq(npv, -0.99, 10.0)
    except ValueError:
        return 0.0
```

### 5. Add CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install ruff mypy
      - run: ruff check services/api/
      - run: mypy services/api/app/
  
  test:
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16-alpine, env: {...}, ports: ['5433:5432'] }
      redis: { image: redis:7-alpine, ports: ['6379:6379'] }
    steps:
      - uses: actions/checkout@v4
      - run: pip install ".[dev]"
      - run: pytest --cov=app --cov-report=xml
  
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t wealthspot-api services/api/
```

---

## SECTION 14 — FINAL PRODUCTION READINESS SCORE

| Category | Score | Grade | Key Blockers |
|---|---|---|---|
| **Architecture** | 62/100 | C+ | Missing service layer, thin abstraction, god files |
| **Security** | 48/100 | D+ | Webhook bypass, JWT default, encryption key in compose, no MFA |
| **Performance** | 58/100 | C | N+1 queries, blocking S3, no caching, hardcoded returns |
| **Scalability** | 45/100 | D+ | No background tasks, no event system, single-instance only |
| **Code Quality** | 72/100 | B- | Good models, decent TypeScript, but logic in routers |
| **Testing** | 35/100 | D | Major gaps: properties, webhooks, payment race conditions |
| **DevOps** | 28/100 | F | No CI/CD, --reload in prod, no non-root, no secrets mgmt |
| **Observability** | 30/100 | F | No metrics, no structured logging, no tracing |
| **Data Integrity** | 65/100 | C+ | Good indexes, but race conditions on investments |
| **Feature Completeness** | 68/100 | C+ | Core CRUD solid; missing finance-specific requirements |
| **Frontend** | 78/100 | B | Excellent code splitting, good React Query usage |
| **Maintainability** | 65/100 | C+ | Clear naming, but high coupling in routers |

---

### ⚡ OVERALL PRODUCTION READINESS SCORE: **52/100 (NOT READY)**

---

### Priority Fix Order

| Priority | Item | Effort |
|---|---|---|
| P0 | Fix webhook bypass (env check) | 1 hour |
| P0 | Remove `--reload` from Docker CMD | 10 min |
| P0 | Remove encryption key from docker-compose | 10 min |
| P0 | Add `SELECT FOR UPDATE` to investment confirmation | 30 min |
| P0 | Validate JWT_SECRET_KEY in production | 30 min |
| P1 | Add non-root Docker user | 15 min |
| P1 | Fix N+1 queries (investments, lender) | 2 hours |
| P1 | Add CI/CD pipeline | 4 hours |
| P1 | Move tokens to httpOnly cookies | 8 hours |
| P2 | Add Prometheus metrics | 4 hours |
| P2 | Implement Celery background tasks | 8 hours |
| P2 | Add missing database indexes | 2 hours |
| P2 | Add structured JSON logging | 2 hours |
| P3 | Extract service layer from routers | 16 hours |
| P3 | Add comprehensive test coverage | 24 hours |
| P3 | Implement real XIRR calculation | 8 hours |
