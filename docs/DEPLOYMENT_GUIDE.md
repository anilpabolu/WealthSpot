# WealthSpot Production Hosting & Deployment Guide

**Date:** May 4, 2026  
**Scope:** Practical production hosting recommendation for the current WealthSpot monorepo and Dockerized stack.  
**Audience:** Founder/engineering leadership, infrastructure owners, DevOps, platform engineers.

---

## 1. Executive Recommendation

### Recommended production platform

Use **Azure Container Apps + managed Azure services** for the first serious production launch.

This is the best fit for WealthSpot because the project is already containerized, but it does not yet justify the operational cost and complexity of Kubernetes. Azure Container Apps gives you production-grade container hosting, autoscaling, revisions, private networking, secrets integration, logging, and scaling controls without running an AKS cluster.

### Recommended target architecture

| Workload | Recommended service |
| --- | --- |
| React/Vite web app | Azure Static Web Apps or Azure Storage Static Website + Azure Front Door/CDN |
| FastAPI backend | Azure Container Apps |
| Background workers | Azure Container Apps worker apps or Container Apps Jobs |
| PostgreSQL | Azure Database for PostgreSQL Flexible Server |
| Redis / Celery broker / cache | Azure Cache for Redis |
| File/media storage | Azure Blob Storage |
| Container registry | Azure Container Registry |
| Secrets | Azure Key Vault |
| Observability | Application Insights + Log Analytics |
| Edge security | Azure Front Door + WAF |
| Infrastructure as Code | Terraform or Bicep; prefer Terraform if multi-cloud portability matters |

### Practical cost target

For a cost-efficient but production-grade MVP launch in India:

- **Lean production baseline:** approximately **₹12,000–₹25,000/month**.
- **Stronger production baseline with better HA/security:** approximately **₹35,000–₹80,000/month**.
- **Do not start with AKS** unless the team already has Kubernetes operations experience and clear scale requirements.
- **Avoid single-VM Docker Compose for real production** unless this is a short-lived beta with explicit acceptance of downtime risk.

### Final decision

Start with:

1. **Azure Container Apps** for API and workers.
2. **Azure Static Web Apps** for the React frontend.
3. **Azure Database for PostgreSQL Flexible Server** for the database.
4. **Azure Cache for Redis** for Redis.
5. **Azure Blob Storage** instead of MinIO.
6. **Azure Key Vault** for all secrets.
7. **Application Insights + Log Analytics** from day one.
8. **Central India** as the primary Azure region, with South India as the DR/backup region when needed.

---

## 2. Current Project and Docker Review

The current repository is a monorepo with these major components:

| Component | Technology | Current location |
| --- | --- | --- |
| Web app | React 19, Vite, TypeScript, Tailwind | apps/web |
| Mobile app | Expo / React Native | apps/mobile |
| Backend API | FastAPI, SQLAlchemy async, Alembic | services/api |
| Database | PostgreSQL | docker-compose service |
| Cache / broker | Redis | docker-compose service |
| Object storage | MinIO local S3-compatible storage | docker-compose service |
| Async workers | Celery | docker-compose services |
| Shared packages | TypeScript types and API client | packages |
| Tests | JS/Python test runner | tests |

### 2.1 Current Docker Compose services

The current docker-compose.yml defines these services:

| Compose service | Image/build | Current role | Production recommendation |
| --- | --- | --- | --- |
| postgres | postgres:16-alpine | Local/dev database | Replace with Azure Database for PostgreSQL Flexible Server |
| redis | redis:7-alpine | Local/dev cache and Celery broker | Replace with Azure Cache for Redis |
| minio | minio/minio:latest | Local/dev S3-compatible object storage | Replace with Azure Blob Storage |
| minio-init | minio/mc:latest | Creates local bucket and CORS | Remove in production |
| api | services/api Dockerfile, target development | FastAPI backend with hot reload and migrations | Build target production; run in Azure Container Apps |
| celery-worker | services/api Dockerfile, target development | General Celery worker | Deploy only after real tasks are implemented and tested |
| comm-worker | services/api Dockerfile, target development | Communication worker queues | Deploy separately only after communication flows are production-ready |
| web | apps/web Dockerfile, target dev | Vite development server | Use production target or deploy static dist to Static Web Apps |
| test-runner | tests/Dockerfile | Optional CI/test container | CI only; never production |

### 2.2 Current image details

#### Web image

Current Dockerfile has three stages:

1. **build** — node:20-alpine, installs root workspace dependencies, builds shared packages, builds apps/web.
2. **production** — nginx:alpine, serves apps/web/dist.
3. **dev** — node:20-alpine, runs Vite dev server on port 5173.

This is good structure. The production web target is suitable, but current docker-compose uses the **dev** target. That is correct for local development, not production.

#### API image

Current API Dockerfile has three stages:

1. **builder** — python:3.12-slim, installs uv and builds dependencies into /install.
2. **production** — python:3.12-slim, copies runtime app and Alembic files, runs as appuser, starts uvicorn with 4 workers.
3. **development** — python:3.12-slim, includes build tools, dev dependencies, entrypoint migrations, and reload mode.

The production target is a good starting point. The development target must not be used in production.

#### Celery images

The Celery and communication workers currently reuse the API Dockerfile development target. This is acceptable locally, but production should either:

- use the same API production image with a different command, or
- use a dedicated worker image if worker dependencies diverge.

The practical first step is to reuse the API production image and override the command for Celery.

#### Test runner image

The test runner is not a production runtime. Keep it only in CI.

---

## 3. What Not To Deploy To Production

### Do not deploy the full docker-compose.yml as-is

The current Compose stack is a local development stack. It includes dev targets, hot reload, local credentials, local object storage, and dev service bindings.

Do not run this exact stack in production.

### Do not run production database inside the app VM/container stack

Avoid self-hosted PostgreSQL in Docker for production. The database is the most valuable stateful asset. Use a managed database with backups, restore, patching, metrics, and failover.

### Do not run MinIO for production unless you have a storage operations team

MinIO is useful locally, but production object storage needs:

- lifecycle policies,
- versioning,
- backup/replication,
- private endpoints,
- IAM/RBAC integration,
- audit trails,
- durable storage SLAs.

Use Azure Blob Storage.

### Do not run Vite dev server in production

The current web container running in Docker Compose uses target dev. Production should serve static Vite build output from:

- Azure Static Web Apps, or
- Azure Storage Static Website + Front Door/CDN, or
- nginx production target if containerizing the frontend is mandatory.

### Do not run migrations in every scaled API replica

The current development entrypoint runs Alembic migrations on container startup. In production, this can become dangerous when multiple replicas start at the same time.

Run migrations as a dedicated deployment step or one-off Container Apps Job.

### Do not keep secrets in .env files or Compose environment blocks

Use Azure Key Vault and managed identity.

### Do not deploy unused workers

Deploy Celery workers only when tasks exist and are tested. Unused workers add cost, attack surface, and operational noise.

---

## 4. Hosting Options Compared

### 4.1 Azure Container Apps — Recommended

Best balance of cost, production readiness, autoscaling, and low operational burden.

#### Pros

- Directly supports containers.
- No Kubernetes cluster management.
- Can autoscale API and workers independently.
- Supports revisions, rollbacks, traffic splitting.
- Integrates well with Azure Container Registry, Key Vault, Log Analytics, and Application Insights.
- Good path to future AKS migration if scale demands it.

#### Cons

- Less low-level control than Kubernetes.
- Requires learning Container Apps environment, revisions, ingress, secrets, and scaling rules.

**Recommendation:** Use this.

### 4.2 Azure App Service for Containers

Good for simpler web/API hosting but less elegant for multiple independently scaling container workers.

#### Pros

- Mature PaaS.
- Deployment slots are strong.
- Easy operational model.

#### Cons

- Background workers are less natural.
- Scaling granularity is less flexible.
- Can become more expensive for multiple app services.

**Recommendation:** Acceptable, but Container Apps is better for this stack.

### 4.3 AKS

Powerful but overkill right now.

#### Pros

- Maximum control.
- Best for large multi-service platforms.
- Supports advanced networking and service mesh.

#### Cons

- Requires Kubernetes expertise.
- Higher base cost.
- More operational responsibility.
- More moving parts than this application currently needs.

**Recommendation:** Avoid for first production launch. Reconsider after major scale, multiple teams, or strict platform engineering needs.

### 4.4 Single VM / VPS with Docker Compose

Cheapest in raw hosting cost, but expensive in risk and operations.

#### Pros

- Very simple to understand.
- Low initial bill.
- Can run current Compose stack with minor edits.

#### Cons

- Single point of failure.
- Manual patching and backups.
- Harder incident recovery.
- Database and storage reliability become your responsibility.
- Weak fit for finance/real-estate investment platform credibility.

**Recommendation:** Only use for internal demo/beta if budget is extremely constrained. Not recommended for real production.

### 4.5 Render, Railway, Fly.io, Heroku-like PaaS

Good developer experience, weaker data residency/control story.

#### Pros

- Fast setup.
- Git-native deploys.
- Low DevOps overhead.

#### Cons

- Region/data residency limitations.
- Less enterprise-grade network/security control.
- Managed database/storage options may be limited.
- Harder to satisfy future compliance needs.

**Recommendation:** Good for prototypes, not preferred for WealthSpot production.

### 4.6 AWS equivalent

AWS is also viable:

- ECS Fargate for API/workers.
- RDS PostgreSQL.
- ElastiCache Redis.
- S3.
- Secrets Manager.
- CloudWatch.
- CloudFront/WAF.

This is a strong alternative, especially if the team already knows AWS. However, since the repo already has Azure-oriented dev tooling and Azure Container Apps gives simpler container PaaS ergonomics, Azure is the recommended path.

---

## 5. Recommended Production Architecture

### 5.1 Primary region

Use **Central India** for the primary deployment.

Reasoning:

- Keeps production data in India.
- Good baseline region for regulated or finance-adjacent workloads.
- Lower latency for Indian users compared with US/EU regions.
- Better long-term compliance posture.

Use **South India** as the DR or secondary region when introducing disaster recovery.

### 5.2 Runtime topology

| Runtime | Minimum production config | Notes |
| --- | --- | --- |
| API Container App | min 1 replica for lean launch, min 2 for stronger production | 0.5–1 vCPU, 1–2 GiB memory to start |
| Worker Container App | min 0 or 1 replica depending on task criticality | Scale by queue depth later |
| Migration Job | one-off Container Apps Job | Runs Alembic once per deployment |
| Web frontend | Static Web Apps | Avoid running frontend as always-on container unless required |

### 5.3 Data services

| Data service | Recommended Azure service | Notes |
| --- | --- | --- |
| PostgreSQL | Azure Database for PostgreSQL Flexible Server | Start Burstable/General Purpose depending on traffic |
| Redis | Azure Cache for Redis | Basic for early MVP; Standard/Premium for production HA/private networking |
| Object storage | Azure Blob Storage | Enable versioning and lifecycle rules |
| Secrets | Azure Key Vault | Use managed identity from Container Apps |

### 5.4 Edge and networking

Start simple but production-safe:

1. Custom domain for frontend.
2. HTTPS only.
3. API ingress limited and protected.
4. CORS restricted to real frontend domains.
5. Database and Redis behind private endpoints when moving to stronger production.
6. Azure Front Door + WAF before public scale or paid users.

### 5.5 Observability

Minimum from day one:

- Application Insights for API requests, failures, dependency latency.
- Log Analytics for container logs.
- Alerts for API down, 5xx rate, latency, DB CPU, DB storage, Redis memory.
- Sentry can remain for application exceptions if already configured.

---

## 6. Cost-Efficient Tiers

These are practical approximations, not vendor quotes. Validate pricing before final purchase.

### 6.1 Lean MVP production

Best for early controlled launch, beta users, and cost control.

| Service | Suggested tier | Approx monthly cost |
| --- | --- | ---: |
| Static Web Apps | Free/Standard as needed | ₹0–₹800 |
| Container Apps API | Consumption, 1–2 small replicas | ₹2,000–₹8,000 |
| PostgreSQL Flexible Server | Burstable B1ms/B2s style tier | ₹3,000–₹8,000 |
| Redis | Basic/low tier | ₹1,000–₹3,000 |
| Blob Storage | Hot LRS, low volume | ₹200–₹1,000 |
| Key Vault | Standard | ₹100–₹500 |
| Logs/App Insights | Low ingestion cap | ₹500–₹3,000 |
| Container Registry | Basic | ₹400–₹800 |
| **Total** |  | **₹12,000–₹25,000/month** |

USD equivalent: approximately **$145–$300/month**.

### 6.2 Stronger production baseline

Best when handling real investors, sensitive documents, payment flows, and public traffic.

| Service | Suggested tier | Approx monthly cost |
| --- | --- | ---: |
| Static Web Apps / Front Door | Standard + WAF when needed | ₹2,000–₹10,000 |
| Container Apps API | 2+ always-warm replicas | ₹8,000–₹20,000 |
| PostgreSQL Flexible Server | General Purpose, better storage, backups | ₹10,000–₹25,000 |
| Redis | Standard/Premium | ₹5,000–₹15,000 |
| Blob Storage | Hot + versioning + lifecycle | ₹500–₹3,000 |
| Key Vault | Standard | ₹200–₹1,000 |
| Observability | App Insights + Log Analytics | ₹3,000–₹10,000 |
| Container Registry | Basic/Standard | ₹800–₹2,000 |
| **Total** |  | **₹35,000–₹80,000/month** |

USD equivalent: approximately **$420–$960/month**.

### 6.3 Ultra-low-cost beta option

If cost must be kept extremely low:

- One small VM running API/web only.
- Managed PostgreSQL still recommended.
- Managed Redis optional.
- Blob Storage for files.

Approximate cost: **₹6,000–₹15,000/month**.

This should be treated as beta/non-critical hosting only. It is not the recommended architecture for investor-facing production.

---

## 7. Current Service to Production Mapping

| Current Docker service | Production replacement | Action |
| --- | --- | --- |
| postgres | Azure Database for PostgreSQL Flexible Server | Migrate schema/data using Alembic and pg_dump/restore |
| redis | Azure Cache for Redis | Use TLS URL and password/managed access |
| minio | Azure Blob Storage | Replace endpoint config; keep boto3 only if using S3-compatible path, otherwise migrate to Azure SDK later |
| minio-init | Not needed | Remove from production |
| api | Azure Container Apps | Build production target and deploy from ACR |
| celery-worker | Azure Container Apps worker or job | Deploy after tasks are confirmed |
| comm-worker | Separate worker Container App | Deploy after email/SMS/WhatsApp flows are hardened |
| web | Azure Static Web Apps | Build Vite static assets and deploy dist |
| test-runner | GitHub Actions / CI | Keep out of production |

---

## 8. Production Docker Changes Required

### 8.1 Web

Current production stage is acceptable. Required actions:

1. Build using production target only.
2. Confirm Vite environment variables point to production API.
3. Harden nginx.conf if using containerized web:
   - HSTS.
   - X-Content-Type-Options.
   - X-Frame-Options or frame-ancestors CSP.
   - CSP compatible with Clerk, Sentry, API, and media domains.
   - gzip/brotli compression if supported.
4. Prefer Static Web Apps over nginx container for cost and simplicity.

### 8.2 API

Required actions:

1. Use services/api Dockerfile production target.
2. Do not use reload mode.
3. Do not run Alembic migrations in every API replica.
4. Add or verify a /health endpoint suitable for readiness checks.
5. Add structured JSON logging.
6. Confirm non-root user is used.
7. Pin production dependencies with lockfile strategy.
8. Add graceful shutdown handling for active requests.

### 8.3 Workers

Required actions:

1. Use the API production image with a worker command, or create a dedicated worker image.
2. Start with one worker type only when real tasks are in use.
3. Add task timeouts and retry policies.
4. Configure queue names explicitly.
5. Add queue-depth based scaling later.

### 8.4 Database migrations

Required actions:

1. Create a deployment job to run Alembic once.
2. Run migrations before shifting traffic to the new API revision.
3. Keep rollback scripts or backward-compatible migrations.
4. Never run destructive migrations without a backup.

---

## 9. Environment and Secrets

### 9.1 Required production secrets

Move all of these to Azure Key Vault:

| Secret | Purpose |
| --- | --- |
| DATABASE_URL | PostgreSQL connection |
| REDIS_URL | Redis/cache/broker connection |
| CELERY_BROKER_URL | Celery broker connection |
| JWT_SECRET_KEY | API token signing |
| ENCRYPTION_KEY | Sensitive field encryption |
| CLERK_API_KEY | Clerk server integration |
| CLERK_WEBHOOK_SECRET | Clerk webhook validation |
| RAZORPAY_KEY_ID | Razorpay public/server key id |
| RAZORPAY_KEY_SECRET | Razorpay secret |
| SMTP credentials | Email sending |
| Twilio credentials | SMS/WhatsApp |
| SENTRY_DSN | Error monitoring |
| OPENAI_API_KEY | AI features if used |

### 9.2 Required production environment values

| Variable | Recommendation |
| --- | --- |
| APP_ENV | production |
| DEBUG | false |
| CORS_ORIGINS | only exact HTTPS frontend origins |
| DATABASE_ECHO | false |
| S3_PUBLIC_URL | production storage/CDN URL |
| AWS_S3_BUCKET | keep if preserving boto3 abstraction |
| S3_ENDPOINT_URL | blank for AWS S3; Azure-specific if using compatibility layer |

### 9.3 CORS policy

Do not use localhost or wildcard origins in production.

Use explicit values such as:

- <https://wealthspot.in>
- <https://www.wealthspot.in>
- <https://app.wealthspot.in>
- staging domain only in staging

---

## 10. CI/CD Recommendation

### 10.1 Pipeline stages

Use GitHub Actions or Azure DevOps.

Recommended pipeline:

1. Checkout.
2. Install Node and Python.
3. Lint web/mobile/API.
4. Run tests.
5. Build shared packages.
6. Build API production image.
7. Build worker image or reuse API image.
8. Build web static assets.
9. Scan images for vulnerabilities.
10. Push images to Azure Container Registry.
11. Run database migration job.
12. Deploy API Container App revision.
13. Deploy worker revision if enabled.
14. Deploy web static assets.
15. Run smoke tests.
16. Shift traffic.
17. Monitor and rollback if health checks fail.

### 10.2 Deployment strategy

Use revision-based deployment:

- Deploy new API revision.
- Run health checks.
- Shift 10% traffic for canary.
- Monitor 5xx and latency.
- Shift to 100%.
- Keep previous revision for rollback.

### 10.3 Branching

Minimum practical model:

| Branch | Purpose |
| --- | --- |
| main | production releases |
| staging | pre-production environment |
| feature/* | pull requests and review |

---

## 11. Security and Compliance Checklist

### 11.1 Must fix before real production

1. Remove dev secrets from deployment configuration.
2. Enforce strong JWT secret in production.
3. Enforce ENCRYPTION_KEY in production.
4. Enforce SENTRY_DSN or equivalent observability in production.
5. Use HTTPS only.
6. Lock CORS to exact origins.
7. Protect database and Redis with private networking.
8. Use Blob Storage instead of public MinIO.
9. Validate all webhooks in production.
10. Add API rate limiting using Redis.
11. Turn off API docs in production.
12. Add backup and restore validation.
13. Add alerts for failed payments, auth spikes, and API failures.

### 11.2 Strongly recommended for investor-facing launch

1. Azure Front Door WAF.
2. Storage versioning for documents/media.
3. Immutable audit log storage for compliance-critical events.
4. App Insights distributed tracing.
5. Per-request correlation ID across frontend/API/logs.
6. Database read/write user with least privilege.
7. Admin access protected by MFA.
8. Security headers in frontend hosting.
9. Image upload scanning if users upload documents at scale.
10. Formal incident response runbook.

### 11.3 Data residency

For an India-focused product, keep primary production data in Indian Azure regions.

Recommended:

- Primary: Central India.
- Secondary/DR: South India.
- Avoid US/EU regions for production user data unless there is a deliberate legal/compliance decision.

---

## 12. Observability and Alerts

### 12.1 Minimum dashboards

Create dashboards for:

| Area | Metrics |
| --- | --- |
| API | requests/min, 5xx rate, p95 latency, active replicas |
| Database | CPU, memory, storage, connections, slow queries |
| Redis | memory, operations/sec, evictions, connection count |
| Storage | requests, failures, egress, capacity |
| Workers | queue length, task success/failure, retries |
| Frontend | CDN errors, JS errors, web vitals if instrumented |

### 12.2 Alerts

Minimum alerts:

| Alert | Threshold |
| --- | --- |
| API down | health check fails for 3–5 minutes |
| API error rate | 5xx > 1% for 5 minutes |
| API latency | p95 > 1.5 seconds for 10 minutes |
| DB CPU | > 80% for 15 minutes |
| DB connections | > 80% pool usage |
| DB storage | > 80% used |
| Redis memory | > 80% used |
| Worker backlog | queue depth above agreed threshold |
| Payment failures | spike above baseline |
| Auth failures | spike above baseline |

### 12.3 Logging

Use structured logs with:

- request_id,
- user_id when authenticated,
- route,
- method,
- status,
- latency_ms,
- error code,
- deployment revision,
- trace id.

Never log:

- JWTs,
- passwords,
- Razorpay secrets,
- encryption keys,
- bank details,
- KYC document contents,
- raw OTPs.

---

## 13. Backup and Disaster Recovery

### 13.1 PostgreSQL

Minimum:

- Automated backups enabled.
- 7–14 day retention for MVP.
- 30–35 day retention for stronger production.
- Point-in-time restore.
- Monthly restore test.

Stronger production:

- Zone redundant HA.
- Geo-redundant backups.
- Read replica if reporting traffic grows.

### 13.2 Redis

For Redis used as cache only:

- No backup required.
- Rebuild cache from DB.

For Redis used as Celery broker:

- Accept that queued jobs may be lost unless using durable broker patterns.
- For critical jobs, persist job state in PostgreSQL outbox table and let workers process from durable state.

### 13.3 Blob Storage

Enable:

- versioning,
- soft delete,
- lifecycle policies,
- private access by default,
- signed URLs for restricted access,
- geo-redundancy when budget allows.

### 13.4 RTO/RPO targets

Suggested initial targets:

| Component | RTO | RPO |
| --- | ---: | ---: |
| Web frontend | 15 minutes | 0, from git/build artifacts |
| API | 15–30 minutes | 0, stateless |
| PostgreSQL | 1–4 hours initially | 5–15 minutes with PITR |
| Blob Storage | 1–4 hours initially | near-zero with versioning/replication |
| Redis cache | 15 minutes | acceptable cache loss |
| Celery queue | depends on task durability | use DB outbox for critical tasks |

---

## 14. Production Rollout Plan

### Phase 0 — Decide and prepare

1. Confirm Azure subscription.
2. Confirm region: Central India primary.
3. Confirm domains: wealthspot.in, app.wealthspot.in, api.wealthspot.in.
4. Confirm budget ceiling.
5. Confirm whether web should be Static Web Apps or containerized nginx.

### Phase 1 — Infrastructure foundation

1. Create resource group.
2. Create Azure Container Registry.
3. Create Key Vault.
4. Create PostgreSQL Flexible Server.
5. Create Azure Cache for Redis.
6. Create Storage Account and Blob container.
7. Create Log Analytics workspace.
8. Create Application Insights.
9. Create Container Apps environment.
10. Configure managed identities and RBAC.

### Phase 2 — Production image build

1. Build API production image.
2. Build worker image or use API production image with worker command.
3. Build web static assets.
4. Push API/worker images to ACR.
5. Scan images for vulnerabilities.

### Phase 3 — Deploy staging

1. Deploy API to staging Container App.
2. Run Alembic migration job against staging DB.
3. Deploy web staging app.
4. Configure Clerk staging URLs.
5. Run smoke tests.
6. Run auth, KYC, media upload, and payment webhook tests.

### Phase 4 — Deploy production

1. Take database backup/snapshot.
2. Run migrations as one-off job.
3. Deploy API revision.
4. Deploy web.
5. Verify health checks.
6. Run smoke tests.
7. Shift traffic.
8. Monitor for at least 2 hours.

### Phase 5 — Stabilize

1. Review slow endpoints.
2. Tune DB indexes.
3. Tune API replica count.
4. Tune Redis usage.
5. Add worker scaling if queues are active.
6. Run restore drill.

---

## 15. Codebase-Specific Production Risks

These were observed from the current project structure and readiness notes.

### 15.1 Database query performance

The production readiness review already identifies N+1 query risks and missing indexes. Fix high-impact query issues before major public traffic.

Priority:

1. Investment listing N+1 query.
2. Vault stats multiple aggregation queries.
3. Missing unread notifications index.
4. Missing composite indexes for investment dashboards.
5. Audit log time-range strategy.

### 15.2 Financial correctness

Any hardcoded financial return values must be clearly labeled as projected or removed. This is especially important for investor trust and regulatory posture.

### 15.3 Idempotency

Payment, investment, webhook, and approval endpoints should use idempotency keys to avoid duplicate actions.

### 15.4 Worker maturity

Celery exists in the stack, but production should only run workers for real tasks with:

- retries,
- dead-letter handling,
- idempotency,
- task status persistence,
- alerts.

### 15.5 Upload/media migration

The application currently supports S3-style storage through boto3 and MinIO variables. For Azure Blob Storage, you have two practical choices:

1. Keep the S3-style abstraction temporarily by using compatible storage patterns where possible.
2. Refactor storage service to Azure Blob SDK.

Recommendation: use Blob Storage directly in production once stable, but do not block launch if S3 abstraction can be configured safely.

---

## 16. Recommended First Production Shape

### Start with these deployed components

| Component | Deploy now? | Notes |
| --- | --- | --- |
| Web frontend | Yes | Static Web Apps preferred |
| API | Yes | Container Apps, production image |
| PostgreSQL | Yes | Managed Flexible Server |
| Redis | Yes | Managed Redis, can start low tier |
| Blob Storage | Yes | Replace MinIO |
| Key Vault | Yes | Mandatory |
| App Insights | Yes | Mandatory |
| Celery worker | Maybe | Only if real tasks are needed at launch |
| Comm worker | Maybe later | Defer if not production-tested |
| Test runner | No | CI only |
| MinIO | No | Dev only |
| Postgres container | No | Dev only |
| Redis container | No | Dev only |

### Minimal public launch topology

1. Static web app on app.wealthspot.in.
2. API container on api.wealthspot.in.
3. PostgreSQL Flexible Server private to backend.
4. Redis private to backend.
5. Blob Storage for media.
6. Key Vault for secrets.
7. Application Insights for monitoring.

---

## 17. Practical Implementation Checklist

### Before infrastructure

- [ ] Confirm Azure subscription and billing owner.
- [ ] Confirm domain DNS owner.
- [ ] Confirm production region.
- [ ] Confirm budget cap.
- [ ] Confirm initial expected users and traffic.
- [ ] Confirm RTO/RPO expectations.

### Before production deploy

- [ ] API production image builds successfully.
- [ ] Web production build succeeds.
- [ ] All secrets moved to Key Vault.
- [ ] CORS locked down.
- [ ] Alembic migration job created.
- [ ] PostgreSQL backups enabled.
- [ ] Redis configured securely.
- [ ] Blob Storage container configured.
- [ ] Health endpoint verified.
- [ ] Logs visible in Log Analytics.
- [ ] Alerts configured.
- [ ] Smoke tests documented.

### Before public users

- [ ] WAF enabled or scheduled for immediate enablement.
- [ ] Clerk production URLs configured.
- [ ] Razorpay production webhook verified.
- [ ] Upload security verified.
- [ ] Admin access MFA enforced.
- [ ] Backup restore tested.
- [ ] Rollback path tested.

---

## 18. Final Recommendation

The best practical decision is:

**Deploy WealthSpot to Azure Container Apps with managed PostgreSQL, Redis, Blob Storage, Key Vault, and Application Insights. Use Azure Static Web Apps for the frontend.**

This gives the best combination of:

- low operational burden,
- production-grade security,
- good cost control,
- autoscaling,
- managed backups,
- India data residency,
- clear migration path to AKS later,
- compatibility with the current Dockerized architecture.

Do not ship the current docker-compose stack as production. Treat it as local development only.

Start lean, but do not compromise on:

1. Managed database.
2. Managed secrets.
3. Managed object storage.
4. Backups.
5. Observability.
6. HTTPS and CORS security.
7. Deployment rollback.

For a platform handling investors, properties, KYC, documents, referrals, payments, and sensitive user data, this is the minimum responsible production posture.
