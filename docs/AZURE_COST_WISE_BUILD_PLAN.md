# WealthSpot Azure Cost-Wise Production Build Plan

**Date:** May 5, 2026  
**Scope:** Final implementation plan only. Infrastructure files, deployment files, Azure resources, and production deployment will be created later.  
**Recommended default:** Balanced Azure-lite production plan.  
**Target IaC later:** Bicep + Azure Developer CLI (`azd`).  

---

## 1. Executive Summary

WealthSpot should be prepared for Azure production using a cost-controlled managed-services architecture instead of deploying the current Docker Compose stack directly.

The recommended production shape is:

| Workload | Recommended Azure service |
| --- | --- |
| React/Vite web app | Azure Static Web Apps or Azure Storage Static Website + CDN |
| FastAPI backend | Azure Container Apps |
| Celery/background workers | Azure Container Apps worker apps or jobs |
| PostgreSQL | Azure Database for PostgreSQL Flexible Server |
| Redis/cache/broker | Azure Cache for Redis |
| Media/files | Azure Blob Storage |
| Container images | Azure Container Registry |
| Secrets | Azure Key Vault |
| Monitoring | Application Insights, with low-retention Log Analytics only where required |
| Edge/WAF | Defer initially; add Azure Front Door + WAF before broad public paid launch |

The best starting option is **Balanced Azure-lite**, estimated at **₹15,000–₹25,000/month**. It keeps managed PostgreSQL, managed storage, managed secrets, and monitoring while avoiding expensive high-availability and WAF components until real traffic requires them.

---

## 2. Current Repository Deployment Readiness

### 2.1 Existing runtime components

| Component | Current implementation | Production direction |
| --- | --- | --- |
| Web app | React 19, Vite, TypeScript, Tailwind in `apps/web` | Static hosting preferred |
| API | FastAPI in `services/api` | Azure Container Apps |
| Database | Local PostgreSQL via Docker Compose | Azure PostgreSQL Flexible Server |
| Cache/broker | Local Redis via Docker Compose | Azure Cache for Redis |
| Object storage | MinIO via Docker Compose | Azure Blob Storage |
| Workers | Celery workers using API codebase | Container Apps worker apps/jobs |
| Migrations | Alembic | One-off migration job/deployment step |
| Shared packages | npm workspaces in `packages/` | Build before web deployment |

### 2.2 Existing files to use later

| File | Purpose in future implementation |
| --- | --- |
| `docker-compose.yml` | Source mapping from local services to Azure-managed services |
| `services/api/Dockerfile` | API production image source |
| `apps/web/Dockerfile` | Web production build/container reference |
| `apps/web/nginx.conf` | Security header reference if web is containerized later |
| `services/api/app/core/config.py` | Production environment variable and secret mapping |
| `services/api/app/main.py` | Existing `/live`, `/ready`, and `/health` probes |
| `services/api/alembic.ini` | Alembic migration configuration |
| `services/api/entrypoint.sh` | Development migration-on-start behavior to avoid in scaled production replicas |
| `services/api/app/celery_app.py` | Worker queues, Celery broker/backend, and scheduled tasks |
| `services/api/.env.production.example` | Production secret checklist |

---

## 3. Cost Options

### 3.1 Option A — Aggressive Low-Cost Beta

**Estimated cost:** ₹8,000–₹12,000/month  
**Use case:** Private beta, controlled users, no strict SLA.

| Area | Recommended configuration |
| --- | --- |
| API | Azure Container Apps Consumption, low CPU/memory |
| API replicas | Min 0 or 1, max 1–2 |
| Web | Static Web Apps free/low tier or Storage Static Website |
| PostgreSQL | Flexible Server Burstable B1/B2, no HA |
| Redis | Basic tier or omit if not critical |
| Blob Storage | Standard LRS, hot tier |
| Key Vault | Standard |
| ACR | Basic |
| Monitoring | Application Insights only, low ingestion cap |
| WAF/Front Door | Not included initially |
| Workers | Only if absolutely required |

**Benefits:** Lowest monthly bill while still avoiding self-hosted production database/storage.  
**Risks:** DB throttling, Redis availability limitations, possible API cold starts, no WAF.

---

### 3.2 Option B — Balanced Azure-Lite

**Estimated cost:** ₹15,000–₹25,000/month  
**Use case:** Recommended initial production launch.

| Area | Recommended configuration |
| --- | --- |
| API | Azure Container Apps |
| API replicas | Min 1, max 3 |
| API size | Start around 0.5 vCPU / 1 GiB; increase after load test if required |
| Web | Static Web Apps or Storage Static Website + CDN |
| PostgreSQL | Burstable upper tier or entry General Purpose based on load test |
| Redis | Basic if cache-only; Standard if Celery queue reliability matters |
| Blob Storage | Standard LRS, soft delete enabled |
| Key Vault | Standard |
| ACR | Basic |
| Monitoring | Application Insights alerts; low-retention Log Analytics only if needed |
| WAF/Front Door | Deferred initially unless broad paid launch starts immediately |
| Workers | Only required Celery/communication workers |

**Benefits:** Best cost/reliability balance. Keeps managed critical state, supports autoscaling, and allows smooth upgrade.  
**Risks:** Lower HA than full production; WAF deferred; Redis and DB tier must be monitored closely.

---

### 3.3 Option C — Strong Public Production

**Estimated cost:** ₹35,000–₹80,000/month  
**Use case:** Broad public launch, paid investor traffic, stricter uptime/security posture.

| Area | Recommended configuration |
| --- | --- |
| API | Azure Container Apps with 2+ always-warm replicas |
| Web | Static Web Apps + Azure Front Door |
| PostgreSQL | General Purpose tier, stronger backup/HA settings |
| Redis | Standard or Premium |
| Blob Storage | Soft delete, versioning, lifecycle policies, optional geo-redundancy |
| Key Vault | Standard with purge protection retained |
| Monitoring | Application Insights + Log Analytics dashboards and alerts |
| WAF/Front Door | Enabled |
| Workers | Required worker apps with monitoring and scale rules |

**Benefits:** Stronger public-production reliability and security.  
**Risks:** Much higher monthly cost.

---

## 4. Final Recommended Build Plan

Start with **Option B — Balanced Azure-lite**.

This option is preferred because WealthSpot handles investor, property, KYC, payment, notification, media, and admin workflows. A single VM or full Docker Compose deployment would reduce cost but would weaken reliability, backups, security, and recovery.

Balanced Azure-lite keeps the non-negotiable production services managed:

1. Managed PostgreSQL.
2. Managed Blob Storage.
3. Managed Key Vault.
4. Managed monitoring.
5. Managed container hosting.

At the same time, it defers expensive components:

1. Front Door + WAF.
2. Zone-redundant database HA.
3. Premium Redis.
4. High log ingestion.
5. Always-on multiple worker replicas.

---

## 5. Target Architecture for Balanced Azure-Lite

### 5.1 Logical architecture

```text
Users
  |
  | HTTPS
  v
Static Frontend Hosting
  |
  | HTTPS API calls
  v
Azure Container Apps - API
  |       |        |        |
  |       |        |        +--> Application Insights
  |       |        +----------> Azure Blob Storage
  |       +-------------------> Azure Cache for Redis
  +---------------------------> Azure PostgreSQL Flexible Server

Azure Container Apps - Workers
  |       |        |
  |       |        +----------> Azure Cache for Redis
  |       +-------------------> Azure PostgreSQL Flexible Server
  +---------------------------> Azure Blob Storage / external providers

Azure Key Vault stores all secrets.
Azure Container Registry stores production container images.
```

### 5.2 Service mapping from local Docker Compose

| Current Compose service | Production mapping | Notes |
| --- | --- | --- |
| `postgres` | Azure PostgreSQL Flexible Server | No database container in production |
| `redis` | Azure Cache for Redis | Use TLS/password configuration as required |
| `minio` | Azure Blob Storage | Replace local object storage |
| `minio-init` | Not needed | Blob container configured through IaC later |
| `api` | Azure Container Apps API app | Use production Docker target |
| `celery-worker` | Container Apps worker app/job | Deploy only if needed |
| `comm-worker` | Separate worker app/job | Deploy only if communication flows are live |
| `web` | Static hosting | Avoid Vite dev server in production |
| `test-runner` | CI only | Never production runtime |

---

## 6. Required Files to Create Later

No implementation files are created by this plan. During the later implementation phase, create the following:

| Future file/folder | Purpose |
| --- | --- |
| `.azure/deployment-plan.md` | Azure deployment source of truth used by validation/deploy workflow |
| `azure.yaml` | Azure Developer CLI orchestration file |
| `infra/main.bicep` | Main Bicep entrypoint |
| `infra/main.parameters.json` or environment parameters | Environment-specific Bicep parameters |
| `infra/modules/registry.bicep` | Azure Container Registry |
| `infra/modules/keyvault.bicep` | Key Vault and access/RBAC |
| `infra/modules/storage.bicep` | Storage Account and Blob container |
| `infra/modules/monitoring.bicep` | Application Insights and Log Analytics if needed |
| `infra/modules/postgres.bicep` | PostgreSQL Flexible Server |
| `infra/modules/redis.bicep` | Azure Cache for Redis |
| `infra/modules/container-apps-environment.bicep` | Container Apps environment |
| `infra/modules/api-container-app.bicep` | API Container App |
| `infra/modules/worker-container-app.bicep` | Celery/communication workers |
| `infra/modules/rbac.bicep` | Managed identity and role assignments |
| `.github/workflows/deploy-azure.yml` | Optional CI/CD workflow later |
| `docs/AZURE_DEPLOYMENT_RUNBOOK.md` | Optional operations runbook later |

---

## 7. Detailed Build and Deployment Steps for Later Implementation

### Phase 0 — Confirm inputs

Before creating infrastructure files or Azure resources, confirm:

1. Azure subscription ID and tenant.
2. Region: default recommendation is Central India.
3. Resource group name.
4. App/environment name.
5. Domain names for frontend and API.
6. Whether staging is required before production.
7. Monthly budget ceiling.
8. Whether Celery workers are required at launch.
9. Whether communication worker is required at launch.
10. Whether Front Door/WAF is required immediately.

### Phase 1 — Prepare Azure deployment plan artifact

Create `.azure/deployment-plan.md` with:

1. Selected cost tier.
2. Target region.
3. Resource names.
4. Required services.
5. Secret inventory.
6. Deployment order.
7. Validation steps.
8. Rollback process.
9. Cost guardrails.
10. Upgrade triggers.

### Phase 2 — Generate IaC structure

Create Bicep modules under `infra/`.

Design principles:

1. Use managed identity where possible.
2. Never hardcode credentials.
3. Keep Key Vault purge protection enabled.
4. Do not enable anonymous pull on ACR.
5. Use least-privilege RBAC.
6. Keep logs and retention cost-controlled.
7. Use parameters for SKUs and replica settings.

### Phase 3 — Configure foundation resources

Provision later:

1. Resource group.
2. Azure Container Registry Basic.
3. Key Vault Standard.
4. Storage Account Standard LRS.
5. Blob container for media.
6. Application Insights.
7. Log Analytics workspace only if required by Container Apps.
8. Managed identities.
9. RBAC role assignments.

### Phase 4 — Configure data services

Provision later:

1. PostgreSQL Flexible Server.
2. Database name and app user.
3. Backup retention.
4. Firewall/private access settings.
5. Azure Cache for Redis.
6. Redis access settings.

Recommended initial database posture:

| Setting | Balanced recommendation |
| --- | --- |
| Tier | Burstable upper tier or entry General Purpose after load testing |
| Backup retention | 7–14 days |
| HA | Defer initially unless public paid launch requires it |
| Region | Central India |

### Phase 5 — Configure API Container App

Use `services/api/Dockerfile` production target.

Configure later:

1. Container image from ACR.
2. Ingress on port 8000.
3. Health probe: `/live`.
4. Readiness probe: `/ready`.
5. Deep health endpoint: `/health`.
6. CPU/memory settings.
7. Min/max replicas.
8. Environment variables.
9. Key Vault secret references.
10. Managed identity.

Recommended Balanced replica settings:

| Setting | Value |
| --- | --- |
| Min replicas | 1 |
| Max replicas | 3 |
| CPU | 0.5–1 vCPU |
| Memory | 1–2 GiB |

### Phase 6 — Configure secrets

Use Key Vault for all production secrets.

Required secret inventory:

| Secret | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis cache/backend URL |
| `CELERY_BROKER_URL` | Celery broker URL |
| `JWT_SECRET_KEY` | JWT signing secret |
| `ENCRYPTION_KEY` | Fernet encryption key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook validation |
| `CLERK_API_KEY` | Clerk server API access |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `SENTRY_DSN` | Error reporting |
| `SMTP_HOST` | Email host |
| `SMTP_USERNAME` | Email username |
| `SMTP_PASSWORD` | Email password |
| `TWILIO_ACCOUNT_SID` | Twilio account |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `OPENAI_API_KEY` | AI feature key if used |

Required non-secret environment values:

| Variable | Production value |
| --- | --- |
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `DATABASE_ECHO` | `false` |
| `CORS_ORIGINS` | Exact HTTPS frontend domains only |
| `AWS_S3_BUCKET` | Production blob/media container mapping if S3 abstraction remains |
| `S3_PUBLIC_URL` | Production media URL |
| `AWS_REGION` | Compatibility value if boto3 abstraction remains |

### Phase 7 — Configure media storage

Replace MinIO with Azure Blob Storage.

Recommended initial Blob settings:

1. Standard LRS.
2. Hot access tier.
3. Soft delete enabled.
4. Public access disabled by default where possible.
5. Approved CORS origins only.
6. Signed URLs or controlled public URL strategy for media.
7. Lifecycle policy later if storage grows.

If the current boto3/S3 abstraction is retained temporarily, configure compatibility values carefully and plan a later Azure Blob SDK refactor.

### Phase 8 — Configure database migrations safely

Do not run Alembic migrations in every scaled API replica.

Later implementation must:

1. Remove migration-on-start behavior from production API startup.
2. Create a one-off migration job or deployment hook.
3. Run `alembic upgrade head` once before shifting traffic.
4. Take backup/snapshot before production migration.
5. Log migration output.
6. Fail deployment if migration fails.

### Phase 9 — Configure workers

Use the API production image with command overrides.

Potential worker commands:

| Worker | Command |
| --- | --- |
| General worker | `celery -A app.celery_app worker --loglevel=info` |
| Communication worker | `celery -A app.celery_app worker -Q comm.email,comm.sms,comm.whatsapp,comm.in_app,comm.orchestrator -c 8 --loglevel=info` |

Cost-control rule:

1. Do not deploy workers unless tasks are required at launch.
2. Use min replicas 0 for non-critical workers where possible.
3. Add queue-depth scaling later when metrics are reliable.

### Phase 10 — Configure frontend hosting

Recommended lower-cost option:

1. Build Vite app from `apps/web`.
2. Deploy static output to Static Web Apps or Storage static website.
3. Configure production API base URL.
4. Configure custom domain and TLS.
5. Restrict API CORS to frontend domain.

Avoid production Vite dev server.

### Phase 11 — Validate before deployment

Before any later deployment:

1. Validate Bicep.
2. Run `azd provision --preview` if using azd.
3. Build API production image.
4. Build web production output.
5. Validate Key Vault references.
6. Validate managed identity RBAC.
7. Validate DB connectivity.
8. Validate Redis connectivity.
9. Validate Blob upload/download.
10. Validate API `/live`, `/ready`, and `/health`.

### Phase 12 — Later deployment order

When deployment is approved later, deploy in this order:

1. Provision foundation Azure resources.
2. Provision data services.
3. Push API image to ACR.
4. Run database migrations once.
5. Deploy API revision.
6. Verify API health.
7. Deploy workers if enabled.
8. Deploy frontend.
9. Configure custom domains and TLS.
10. Run smoke tests.
11. Enable alerts.
12. Monitor for 2–4 hours.

---

## 8. Post-Deployment Smoke Test Plan

Run these tests after the future deployment:

1. API `/live` returns alive.
2. API `/ready` returns ready.
3. API `/health` reports DB and Redis OK.
4. Frontend loads over HTTPS.
5. Frontend can call API without CORS errors.
6. Clerk sign-in works.
7. KYC/profile flow works.
8. Property listing loads.
9. Investment listing loads.
10. Investment/approval flow works.
11. Media upload/download works through Blob Storage.
12. Razorpay webhook validation works.
13. Notification flow works.
14. Communication outbox works if workers are enabled.
15. Admin flows work.
16. Application Insights receives request, dependency, and error telemetry.

---

## 9. Cost Controls and Alerts

Configure these during later implementation:

| Control | Recommended setting |
| --- | --- |
| Azure budget alert | 50%, 80%, 100% of monthly target |
| API max replicas | 3 initially for Balanced plan |
| Worker replicas | 0–1 initially unless critical |
| App Insights | Low ingestion cap |
| Log retention | Low retention initially |
| PostgreSQL | Start low; upgrade after metrics |
| Redis | Start low; upgrade after memory/eviction metrics |
| Front Door/WAF | Defer until public paid launch |

---

## 10. Upgrade Triggers

| Trigger | Recommended action |
| --- | --- |
| DB CPU/IO above 70–80% during peak | Upgrade PostgreSQL tier |
| DB connections near limit | Tune pool or upgrade DB |
| Redis memory above 80% | Upgrade Redis tier |
| Redis evictions appear | Upgrade Redis or reduce cache pressure |
| API p95 latency consistently high | Increase CPU/memory or replicas |
| API cold starts affect users | Increase min replicas |
| Worker backlog grows | Add worker replicas or queue-based scaling |
| Paid public launch starts | Add Front Door + WAF |
| Sensitive document volume grows | Add Blob versioning/stronger lifecycle policies |
| Investor traffic grows | Add stronger database HA/backup posture |

---

## 11. Explicit Non-Goals for First Implementation

Do not include these in the first cost-controlled implementation unless specifically approved:

1. AKS.
2. Full Docker Compose production hosting.
3. Self-hosted PostgreSQL in Docker.
4. Self-hosted MinIO for production documents.
5. Premium Redis.
6. Front Door + WAF for private beta.
7. Multi-region active-active architecture.
8. Always-on unused Celery workers.
9. Running Alembic in every API replica.
10. Public wildcard CORS.

---

## 12. Final Decision

The final recommended build path is:

1. Use **Balanced Azure-lite** as the default production plan.
2. Keep managed PostgreSQL, Blob Storage, Key Vault, Container Apps, ACR, and Application Insights.
3. Deploy only required workers.
4. Use static frontend hosting to reduce runtime cost.
5. Defer WAF, premium Redis, and stronger database HA until public paid traffic requires them.
6. Use Bicep + azd later for repeatable deployment.
7. Validate all builds, IaC, secrets, health checks, and smoke tests before deployment.

This plan gives WealthSpot a responsible production posture while keeping the initial Azure bill under control.
