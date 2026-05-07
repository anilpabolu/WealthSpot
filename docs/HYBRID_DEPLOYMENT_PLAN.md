# WealthSpot Hybrid Deployment Plan

**Date:** May 7, 2026
**Scope:** Architecture decisions, service routing, cost analysis, and scalability design. No infrastructure files or Azure resources are created by this document — implementation comes later.
**Recommended default:** Hybrid Azure + Third-Party bundle.
**Target IaC later:** Bicep + Azure Developer CLI (`azd`).

---

## 1. Executive Summary

WealthSpot is a financial platform handling investor KYC (PAN, Aadhaar, Selfie), real-money investment flows via Razorpay, encryption keys, JWT secrets, property listings, and audit trails. This demands a deployment model where security-critical and legally sensitive components live on Azure-managed infrastructure, while commodity, stateless, and cost-sensitive components run on best-in-class third-party SaaS.

The result is a **hybrid model** that delivers approximately 45–50% monthly cost savings vs a full Azure-only stack while maintaining a stronger compliance and security posture than a pure third-party stack.

### Hybrid Trust Boundary

| Azure owns | Third-party wins |
| --- | --- |
| Stateful API compute (Container Apps) | Stateless frontend CDN (Cloudflare Pages) |
| KYC/legal document storage (Blob Storage) | Public media storage (Cloudflare R2) |
| Encryption keys and secrets (Key Vault) | Authentication (Clerk — already integrated) |
| Container images (ACR) | Database — Phase 1 (Supabase Pro Mumbai) |
| Native APM (Application Insights) | Cache and rate limiting (Upstash Redis) |
| Managed worker runtime (Container Apps) | Transactional email (Resend) |
| — | Edge security and DNS (Cloudflare Proxy) |
| — | Uptime monitoring (Better Stack) |
| — | Mobile builds (Expo EAS) |

---

## 2. Why Hybrid Is the Right Architecture for WealthSpot

### 2.1 What makes pure third-party insufficient

WealthSpot cannot run on a pure Render/Railway/Supabase stack because:

1. **KYC regulatory exposure** — PAN, Aadhaar, and Selfie documents uploaded by investors require private-only storage, signed URL expiry, RBAC audit trail, encryption at rest, and India data residency. Cloudflare R2 is globally distributed and is not a compliant store for regulated identity documents.
2. **Secret surface area** — JWT signing key, Fernet encryption key, Razorpay webhook secret, and Clerk API key must live in a managed secret vault with RBAC, not in provider environment variable dashboards that lack audit trails.
3. **Container identity** — The API must pull from a private container registry using managed identity, not a static credential that can leak.
4. **Razorpay webhook reliability** — Payment capture, failure, and refund webhooks need a stable, always-warm API endpoint with SLA guarantees. Render/Railway free and starter tiers cold-start.
5. **Celery worker orchestration** — KEDA-based queue-depth scaling in Azure Container Apps is the cleanest path to safe, observable Celery workers without over-provisioning.

### 2.2 What makes pure Azure too expensive at startup

Azure-only at startup costs ₹12,000–₹19,800/month because:

1. Azure Static Web Apps + Azure Front Door is overkill when Cloudflare Pages with Proxy mode handles CDN, HTTPS, and DDoS mitigation for free.
2. Azure Cache for Redis Basic starts at ₹2,500/month for a workload that Upstash Redis free tier handles easily.
3. Azure Database for PostgreSQL Flexible Server Burstable B2ms starts at ₹4,500–₹6,500/month versus Supabase Pro at ₹2,100/month with Mumbai region, PgBouncer, and daily backups included.
4. Azure Communication Services email is unnecessary when Resend covers early transactional email volume free.

---

## 3. Codebase-Specific Storage Split

This section describes the most technically important implementation decision: splitting S3-compatible storage across two backends.

### 3.1 Current implementation

The file `services/api/app/services/s3.py` uses a single boto3 client built from `_get_s3_client()`. This function uses `S3_ENDPOINT_URL` as an optional override, which already works with MinIO in local development. All upload functions — `upload_document()`, `upload_avatar()`, `upload_opportunity_media()`, `upload_file()` — use this same client.

The KYC router (`services/api/app/routers/kyc.py`) calls `upload_document()` and `generate_presigned_url()` for PAN, Aadhaar, and Selfie uploads. General media uploads (avatars, property photos, opportunity images, app images, videos) use the other upload functions.

### 3.2 Required split

In production, these two categories must route to different backends:

| Upload category | Function called | Target backend | Reason |
| --- | --- | --- | --- |
| KYC documents — PAN, Aadhaar, Selfie | `upload_document()`, `generate_presigned_url()` | Azure Blob Storage — Central India | Private RBAC, SAS token expiry, encrypted at rest, India data residency, audit trail |
| Public media — avatars, property photos, opportunity images, app images, videos | `upload_file()`, `upload_avatar()`, `upload_opportunity_media()` | Cloudflare R2 | Free egress, S3-compatible, public CDN URL, no compliance constraint |

### 3.3 Implementation approach

Add a second S3 client factory `_get_kyc_s3_client()` in `services/api/app/services/s3.py` driven by separate environment variables prefixed with `KYC_`. Add corresponding fields in `services/api/app/core/config.py`. Route `upload_document()` and `generate_presigned_url()` through the KYC client. All other upload functions continue using the existing media client.

New environment variables required:

| Variable | Purpose |
| --- | --- |
| `KYC_S3_ENDPOINT_URL` | Azure Blob Storage S3-compatible endpoint |
| `KYC_AWS_ACCESS_KEY_ID` | Azure Storage access key |
| `KYC_AWS_SECRET_ACCESS_KEY` | Azure Storage secret |
| `KYC_AWS_S3_BUCKET` | KYC documents container name |
| `KYC_S3_PUBLIC_URL` | Leave empty — KYC URLs are always private presigned |

Alternatively, the KYC client can be refactored to use the `azure-storage-blob` SDK with managed identity, which eliminates static credentials entirely for the most sensitive storage path. This is the recommended final state but can follow the boto3 split as an intermediate step.

---

## 4. Full Service Judgment Table

| # | Component | Azure Option | Azure Cost/mo | Third-Party Option | 3P Cost/mo | Hybrid Verdict | Hybrid Cost/mo | Saving vs Azure | Reason |
| --- | --- | --- | ---: | --- | ---: | --- | ---: | ---: | --- |
| 1 | **Web frontend** | Azure Static Web Apps | ₹0–₹1,000 | Cloudflare Pages | Free | ✅ Cloudflare Pages | Free | ₹500–₹1,000 | Free tier, global CDN with India PoPs (Mumbai, Chennai, Delhi), instant Git deploys, SPA fallback routing, HTTPS. Cloudflare edge density in India exceeds Azure SWA. |
| 2 | **API container** | **Azure Container Apps** | ₹3,000–₹5,500 | Render Standard / Railway | ₹2,100–₹4,200 | ✅ Azure Container Apps | ₹3,000–₹5,500 | None — Azure wins | Managed identity pulls from ACR without credential exposure. KEDA scales on HTTP concurrency or Redis queue depth. VNet integration for private DB access later. Razorpay webhooks need guaranteed SLA. Financial API is not appropriate for cold-starting platforms. |
| 3 | **PostgreSQL** | Azure PostgreSQL Flexible Server B2ms | ₹4,500–₹6,500 | **Supabase Pro Mumbai** | ₹2,100 | ✅ Supabase Pro → migrate to Azure at scale | ₹2,100 (Phase 1) | ₹2,400–₹4,400 | Supabase Pro includes PgBouncer, daily backups (7-day retention), Mumbai region, up to 1,500 connections. Alembic migrations are vendor-neutral. Migrate to Azure PostgreSQL when private VNet peering or zone-redundant HA is required. |
| 4 | **Redis / cache** | Azure Cache for Redis Basic C1 | ₹2,500–₹3,500 | **Upstash Redis** | ₹0–₹400 | ✅ Upstash Redis | ₹0–₹400 | ₹2,100–₹3,500 | Rate limiting, session cache, and light Celery brokering do not need Azure Redis. Upstash is serverless pay-per-command, TLS, globally accessible. Upgrade only if Celery queue reliability shows gaps. |
| 5 | **KYC document storage** | **Azure Blob Storage Central India** | ₹200–₹500 | Cloudflare R2 | Free–₹200 | ✅ Azure Blob Storage | ₹200–₹500 | None — Azure wins | KYC data (PAN, Aadhaar, Selfie) requires private-only access, SAS token expiry, encryption at rest, RBAC audit trail, and India region. Cloudflare R2 is globally distributed and not appropriate for regulated identity documents. |
| 6 | **Public media storage** | Azure Blob Storage | ₹500–₹1,500 | **Cloudflare R2** | Free (10 GB) then ₹130/10 GB | ✅ Cloudflare R2 | ₹0–₹500 | ₹500–₹1,000 | R2 is S3-compatible. `s3.py` already supports `S3_ENDPOINT_URL` override — zero egress fees, 10 GB free, public CDN URL. Property photos, avatars, and opportunity images have no compliance constraint. |
| 7 | **Secrets management** | **Azure Key Vault Standard** | ₹500–₹800 | Doppler Free / Infisical Free | Free | ✅ Azure Key Vault | ₹500–₹800 | None — Azure wins | JWT secret key, Fernet encryption key, Razorpay webhook secret, Clerk API key, and database URL must not live in provider env var dashboards. Container Apps secret references via managed identity — zero credentials at rest. Non-negotiable for a financial platform. |
| 8 | **Container registry** | **Azure Container Registry Basic** | ₹400–₹600 | GitHub Container Registry | Free | ✅ Azure ACR Basic | ₹400–₹600 | None — Azure wins | Container Apps pulls from ACR using managed identity — no registry credentials in environment variables. GitHub CR requires a static PAT. ACR also enables vulnerability scanning and geo-replication later. |
| 9 | **Observability / APM** | Application Insights + Log Analytics | ₹500–₹1,500 | Sentry Free + Better Stack Free | Free | ✅ App Insights (low cap) + Sentry Free | ₹500–₹1,000 | ₹0–₹500 | App Insights is natively wired into Container Apps for request, dependency, and exception telemetry. Set low daily ingestion cap (1–2 GB/day). Add Sentry Free for error grouping. Better Stack for uptime. |
| 10 | **Edge / WAF / CDN** | Azure Front Door Standard | ₹3,000–₹8,000 | **Cloudflare Proxy mode + Pro WAF** | Free → ₹1,700 | ✅ Cloudflare Proxy (free) → Cloudflare Pro WAF before paid launch | Free initially | ₹3,000–₹8,000 | Already on Cloudflare Pages. Proxy mode on the API domain gives free DDoS mitigation, SSL, CDN, and basic security rules. Cloudflare Pro ($20/mo) adds full WAF — far cheaper than Azure Front Door at startup. |
| 11 | **Authentication** | Azure AD B2C | ₹1,000–₹2,500 | **Clerk (already integrated)** | Free (<10K MAU) | ✅ Clerk — keep as-is | Free | ₹1,000–₹2,500 | Already fully wired: `CLERK_API_KEY`, `CLERK_WEBHOOK_SECRET`, webhook sync in `webhooks.py`, Clerk token → backend JWT bridge. MFA, social login, session management included. Free up to 10,000 MAU. |
| 12 | **Transactional email** | Azure Communication Services | ₹500–₹1,500 | **Resend** | Free (3K/mo) | ✅ Resend | Free–₹1,600 | ₹500–₹1,500 | Config in `config.py` uses provider-agnostic SMTP variables. Resend supports SMTP relay or API. 3,000 free emails/month covers MVP volume. |
| 13 | **Celery workers** | Azure Container Apps Worker | ₹1,500–₹3,000 | Render Background Worker | ₹2,100 | ✅ Defer → Azure Container Apps Worker when tasks are live | ₹0 initially | ₹1,500–₹3,000 | `celery_app.py` beat schedule exists but `app.tasks` definitions are incomplete. Deploy as Container Apps Worker with min 0 replicas and KEDA Redis queue-depth scaling when tasks are fully defined. Same ACR image, command override. |
| 14 | **Mobile builds** | Azure DevOps Pipeline | ₹500–₹1,500 | **Expo EAS** | Free (30 builds/mo) | ✅ Expo EAS | Free | ₹500–₹1,500 | Native fit for Expo SDK 51. Free tier covers all development and preview builds. EAS Submit handles App Store and Play Store submission. |

---

## 5. Cost Summary

| Stack | Monthly cost (₹) |
| --- | ---: |
| Azure-only Balanced plan (from `AZURE_COST_WISE_BUILD_PLAN.md`) | ₹12,000–₹19,800 |
| Third-party only MVP (from `THIRD_PARTY_DEPLOYMENT_ENV.md`) | ₹4,600–₹6,700 |
| **Hybrid — recommended** | **₹6,700–₹9,900** |
| Saving vs Azure-only | **₹5,100–₹9,900/month (~45–50%)** |
| Premium vs third-party only | ₹2,100–₹3,200 (buys Azure API runtime + KV + ACR + App Insights) |
| **Estimated annual saving vs Azure-only** | **₹61,200–₹1,18,800** |

### Hybrid cost breakdown

| Component | Provider | Monthly cost (₹) |
| --- | --- | ---: |
| Web frontend | Cloudflare Pages | Free |
| API container | Azure Container Apps (min 1, 0.5 vCPU / 1 GiB) | ₹3,000–₹4,500 |
| PostgreSQL | Supabase Pro Mumbai | ₹2,100 |
| Redis / cache | Upstash Redis (free → pay-as-you-go) | ₹0–₹400 |
| KYC document storage | Azure Blob Storage Central India | ₹200–₹500 |
| Public media storage | Cloudflare R2 | ₹0–₹500 |
| Secrets management | Azure Key Vault Standard | ₹500–₹800 |
| Container registry | Azure ACR Basic | ₹400–₹600 |
| APM / observability | App Insights (low cap) + Sentry Free + Better Stack Free | ₹500–₹1,000 |
| Edge / WAF | Cloudflare Proxy (free initially) | Free |
| Authentication | Clerk | Free |
| Transactional email | Resend | Free |
| Celery workers | Deferred | ₹0 |
| Mobile builds | Expo EAS | Free |
| **Total** | | **₹6,700–₹9,900** |

---

## 6. Scalability Matrix

| Component | Horizontal scale | Vertical scale | Scale trigger | Notes |
| --- | --- | --- | --- | --- |
| **Azure Container Apps (API)** | ✅ 0→30 replicas auto, HTTP concurrency or KEDA | ✅ 0.25→4 vCPU, 0.5→8 GiB — live change, no downtime | HTTP concurrent requests or Redis queue depth | Razorpay webhooks need min 1 replica always-on |
| **Azure Container Apps (Workers)** | ✅ 0→N replicas via KEDA Redis queue depth | ✅ Same as API | Redis queue depth | Deploy with min 0; scale up when task backlog grows |
| **Supabase PostgreSQL** | ✅ Read replicas (Pro), PgBouncer pooling, up to 1,500 connections | ✅ nano → micro → small → medium → large (8 vCPU, 32 GiB RAM) | Dashboard compute upgrade | Migrate to Azure PostgreSQL when private VNet or zone-redundant HA is required |
| **Upstash Redis** | ✅ Multi-region global replication on paid plans | ✅ Free (256 MB) → Fixed $10/mo (1 GB) → Fixed $50/mo (10 GB) | Command volume or memory pressure | Upgrade to Azure Cache for Redis Standard if Celery queue reliability requires it |
| **Cloudflare Pages** | ✅ Infinite — CDN edge auto-distributes | N/A — static assets | None needed | Add Cloudflare Pages Functions if server-side rendering is ever required |
| **Cloudflare R2** | ✅ Infinite — auto-partitioned object storage | N/A | None needed | Add lifecycle policies for old media cleanup |
| **Azure Blob Storage (KYC)** | ✅ Infinite auto-partitioned | ✅ LRS → ZRS → GRS → RA-GRS redundancy tiers; hot → cool → archive | Data volume or compliance requirement | Enable soft delete and versioning from day 1 |
| **Azure Key Vault** | ✅ Built-in HA, multi-region replication available | ✅ Standard → Premium (HSM-backed keys) | Compliance requirement | No action needed at startup |
| **Azure ACR** | ✅ Basic → Standard → Premium (geo-replication) | ✅ Storage quota increases with tier | Image count or geo-replication need | Upgrade to Standard for vulnerability scanning |
| **Clerk** | ✅ Fully managed — Clerk scales for you | ✅ Free → Hobby ($25/mo) → Growth ($0.02/MAU) | MAU count | No infrastructure action needed |
| **Resend** | ✅ SaaS, scales with sending volume | ✅ Free → $20/mo → $90/mo | Monthly email volume | Domain verification and limit increase on paid |

---

## 7. Logical Architecture

```text
Users (India)
  |
  | HTTPS
  v
Cloudflare Pages — React/Vite static frontend
(Cloudflare CDN: Mumbai, Chennai, Delhi PoPs)
  |
  | HTTPS API calls
  | (Cloudflare Proxy mode on api.domain.com — DDoS mitigation, SSL, free WAF rules)
  v
Azure Container Apps — FastAPI API (min 1 replica, max 3 initially)
  |         |         |         |         |
  |         |         |         |         +---> Azure Application Insights
  |         |         |         +-----------> Azure Key Vault (JWT key, Fernet key, Razorpay, Clerk secrets)
  |         |         +-------------------> Azure Blob Storage — KYC documents (private, Central India)
  |         +-----------------------------> Cloudflare R2 — Public media (avatars, property photos)
  +----------------------------------------> Supabase PostgreSQL — Mumbai (primary DB, Phase 1)

Azure Container Apps — Celery Workers (DEFERRED, min 0 replicas)
  |         |         |
  |         |         +-------------------> Supabase PostgreSQL
  +----------------------------------------> Upstash Redis (broker + result backend)

Upstash Redis — Cache, rate limiting, Celery broker
Clerk — Authentication (JWT bridge to API)
Resend — Transactional email (SMTP relay)
Better Stack — Uptime monitoring
Sentry Free — Application error tracking

Azure Container Registry — Private container images (API + worker images)
Azure Key Vault — All production secrets (referenced by Container Apps managed identity)
```

---

## 8. Service Mapping from Local Docker Compose

| Current `docker-compose.yml` service | Production mapping | Notes |
| --- | --- | --- |
| `postgres` | Supabase PostgreSQL Pro (Mumbai) → Azure PostgreSQL Flexible Server at scale | No database container in production |
| `redis` | Upstash Redis | TLS URL via Key Vault secret reference |
| `minio` | Dual split: Azure Blob (KYC) + Cloudflare R2 (public media) | Requires dual client in `s3.py` |
| `minio-init` | Not needed | Containers created through IaC |
| `api` | Azure Container Apps API app | Production Docker target, managed identity |
| `celery-worker` | Azure Container Apps Worker (deferred) | Same image, command override, KEDA |
| `comm-worker` | Separate Container Apps Worker (deferred) | Deploy only when comm flows are live |
| `web` | Cloudflare Pages | Static Vite build output |
| `test-runner` | CI only | Never in production runtime |

---

## 9. Required Environment Variables (Production)

### 9.1 Azure Key Vault secrets (never in env vars at rest)

| Secret name | Purpose |
| --- | --- |
| `DATABASE-URL` | Supabase/Azure PostgreSQL connection string |
| `REDIS-URL` | Upstash Redis TLS URL |
| `CELERY-BROKER-URL` | Upstash Redis URL for Celery broker |
| `JWT-SECRET-KEY` | JWT signing secret |
| `ENCRYPTION-KEY` | Fernet encryption key |
| `CLERK-WEBHOOK-SECRET` | Clerk webhook validation |
| `CLERK-API-KEY` | Clerk server API access |
| `RAZORPAY-KEY-ID` | Razorpay key ID |
| `RAZORPAY-KEY-SECRET` | Razorpay key secret |
| `SMTP-HOST` | Resend SMTP host |
| `SMTP-USERNAME` | Resend SMTP username |
| `SMTP-PASSWORD` | Resend SMTP password / API key |
| `SENTRY-DSN` | Sentry error reporting DSN |
| `KYC-AWS-ACCESS-KEY-ID` | Azure Storage / KYC bucket access key |
| `KYC-AWS-SECRET-ACCESS-KEY` | Azure Storage / KYC bucket secret |
| `MEDIA-AWS-ACCESS-KEY-ID` | Cloudflare R2 access key |
| `MEDIA-AWS-SECRET-ACCESS-KEY` | Cloudflare R2 secret key |

### 9.2 Non-secret environment variables (safe in Container Apps config)

| Variable | Production value |
| --- | --- |
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `DATABASE_ECHO` | `false` |
| `CORS_ORIGINS` | Exact Cloudflare Pages HTTPS domain only |
| `AWS_S3_BUCKET` | Cloudflare R2 media bucket name |
| `AWS_REGION` | `auto` (R2 compatibility value) |
| `S3_ENDPOINT_URL` | Cloudflare R2 S3 endpoint URL |
| `S3_PUBLIC_URL` | R2 public CDN URL base |
| `KYC_S3_ENDPOINT_URL` | Azure Blob Storage S3-compatible endpoint |
| `KYC_AWS_S3_BUCKET` | Azure Blob KYC container name |
| `KYC_S3_PUBLIC_URL` | Empty — KYC URLs are always private presigned |

---

## 10. Migration Path — Phase 1 to Phase 3

### Phase 1 — Hybrid MVP launch

Services active:

- Cloudflare Pages (web)
- Azure Container Apps API (min 1, max 3 replicas)
- Supabase Pro PostgreSQL — Mumbai
- Upstash Redis
- Azure Blob Storage — KYC documents only
- Cloudflare R2 — public media
- Azure Key Vault Standard
- Azure ACR Basic
- Application Insights (low ingestion cap)
- Clerk
- Resend
- Better Stack + Sentry Free
- Cloudflare Proxy on API domain

Deferred:

- Celery workers
- Communication worker
- Cloudflare WAF rules
- Azure Front Door

### Phase 2 — Paid user growth

Additions:

- Enable Cloudflare Pro WAF rules on the API domain
- Deploy Celery worker Container App (min 0, KEDA Redis queue-depth scaling)
- Deploy communication worker if email/SMS flows are live
- Upgrade Supabase compute tier if DB CPU stays above 60%
- Upgrade Upstash to fixed plan if command volume grows

### Phase 3 — Enterprise / compliance growth

Additions:

- Migrate PostgreSQL from Supabase to Azure PostgreSQL Flexible Server (private endpoint, zone-redundant HA, VNet peering with Container Apps)
- Upgrade Redis to Azure Cache for Redis Standard
- Upgrade ACR to Standard (vulnerability scanning, content trust)
- Evaluate Azure Front Door if multi-region or formal WAF/enterprise compliance is required
- Migrate KYC storage client from boto3 to `azure-storage-blob` SDK with managed identity

---

## 11. Upgrade Triggers

| Trigger | Recommended action |
| --- | --- |
| DB CPU above 70% during peak | Upgrade Supabase compute tier |
| DB connections near limit | Tune PgBouncer pool settings or upgrade compute |
| Redis memory above 80% | Upgrade to Upstash Fixed plan or Azure Cache for Redis |
| Redis evictions detected | Upgrade immediately or reduce cache pressure |
| API p95 latency consistently high | Increase vCPU/memory on Container Apps or increase max replicas |
| API cold starts affect Razorpay webhooks | Confirm min replicas is 1; never 0 for API |
| Worker task backlog grows | Add worker replicas or tighten KEDA scale rule |
| Paid public launch begins | Enable Cloudflare Pro WAF; review min API replicas |
| KYC document volume grows | Enable Azure Blob soft delete, versioning, and lifecycle policies |
| Compliance audit required | Migrate DB to Azure PostgreSQL; migrate Redis to Azure Cache for Redis |
| Multi-region expansion | Add Azure Front Door; evaluate geo-replication on ACR and PostgreSQL |

---

## 12. Security Posture Checklist

Apply before any production access:

- [ ] Azure Key Vault purge protection enabled
- [ ] Container Apps using managed identity for ACR pull and Key Vault secret reference — no static credentials
- [ ] Azure Blob KYC container — public access disabled, SAS token expiry 15–30 minutes maximum
- [ ] Cloudflare R2 bucket — approved CORS origins only (exact frontend domain)
- [ ] `CORS_ORIGINS` set to exact HTTPS frontend domain only — no wildcard
- [ ] API documentation endpoints (`/docs`, `/redoc`) disabled or restricted in production
- [ ] Razorpay webhook signature verification always enforced (`razorpay_allow_unsigned_dev = false`)
- [ ] Clerk webhook HMAC-SHA256 verification always active
- [ ] JWT secrets rotated before production launch
- [ ] Fernet encryption key backed up to Key Vault before any user data is written
- [ ] Alembic migrations run once before traffic shift — not on every replica start
- [ ] Spend caps and budget alerts enabled on every provider dashboard
- [ ] Upstash command volume alerts configured
- [ ] Application Insights daily ingestion cap set
- [ ] Azure Blob soft delete enabled on KYC container
- [ ] No `.env` files with production secrets committed to source control

---

## 13. Files to Create During Implementation

No infrastructure files are created by this plan. During the later implementation phase, create the following:

| Future file | Purpose |
| --- | --- |
| `.azure/deployment-plan.md` | Azure deployment source of truth |
| `azure.yaml` | Azure Developer CLI orchestration |
| `infra/main.bicep` | Main Bicep entrypoint |
| `infra/main.parameters.json` | Environment-specific parameters |
| `infra/modules/registry.bicep` | Azure Container Registry |
| `infra/modules/keyvault.bicep` | Key Vault, managed identity, RBAC |
| `infra/modules/storage-kyc.bicep` | Azure Blob Storage for KYC documents |
| `infra/modules/container-apps-env.bicep` | Container Apps environment |
| `infra/modules/api-container-app.bicep` | API Container App |
| `infra/modules/worker-container-app.bicep` | Celery and communication workers |
| `infra/modules/monitoring.bicep` | Application Insights, Log Analytics |
| `infra/modules/rbac.bicep` | Role assignments for managed identity |
| `.github/workflows/deploy-azure.yml` | Optional CI/CD workflow |
| `docs/AZURE_DEPLOYMENT_RUNBOOK.md` | Operations runbook |

Third-party accounts to create separately (not IaC):

| Account | For |
| --- | --- |
| Cloudflare account + Pages project | Frontend hosting and DNS proxy |
| Supabase project — Mumbai region | PostgreSQL Phase 1 |
| Upstash Redis database | Cache and Celery broker |
| Cloudflare R2 bucket | Public media storage |
| Resend account + domain | Transactional email |
| Better Stack team | Uptime monitoring |
| Sentry project | Error tracking |
| Expo EAS project | Mobile builds |

---

## 14. Comparison Reference

| Document | Scope |
| --- | --- |
| `docs/AZURE_COST_WISE_BUILD_PLAN.md` | Full Azure-only balanced plan. ₹15,000–₹25,000/month. Reference for Azure service sizing and IaC structure. |
| `docs/THIRD_PARTY_DEPLOYMENT_ENV.md` | Third-party only MVP plan. ₹4,600–₹6,700/month. Reference for third-party provider options and rationale. |
| `docs/HYBRID_DEPLOYMENT_PLAN.md` (this document) | Hybrid model. ₹6,700–₹9,900/month. Recommended default. Azure for security-critical components. Third-party for cost-sensitive commodity components. |

---

## 15. Final Decision

The hybrid model is the recommended production path for WealthSpot because:

1. Azure Container Apps for the API gives managed identity, KEDA scaling, revision management, and SLA-backed compute for a platform that processes real financial transactions.
2. Azure Blob Storage for KYC documents gives India-region private storage with RBAC, SAS token expiry, and audit trail — non-negotiable for regulated identity data.
3. Azure Key Vault gives managed secret lifecycle for JWT keys, Fernet keys, Razorpay secrets, and Clerk credentials — no static credentials in environment variables.
4. Azure ACR gives credential-free container image pulls via managed identity.
5. Cloudflare Pages and R2 eliminate frontend hosting and media egress costs entirely.
6. Supabase Pro in Mumbai gives managed PostgreSQL with India data locality at less than half the Azure PostgreSQL cost for Phase 1.
7. Clerk is already integrated and free — replacing it with Azure AD B2C would cost more and require significant rework.
8. Upstash Redis free/pay-as-you-go saves ₹2,100–₹3,500/month vs Azure Cache for Redis at startup.

This approach saves approximately ₹5,100–₹9,900/month (**₹61,200–₹1,18,800/year**) compared to a full Azure-only deployment while maintaining the compliance, security, and reliability posture that a financial platform requires.
