# WealthSpot Third-Party MVP Deployment Environment Plan

**Date:** May 5, 2026  
**Scope:** Startup-phase, lower-cost production/MVP deployment alternatives to Azure.  
**Goal:** Keep only the mandatory services required to run WealthSpot safely, while reducing fixed monthly cost.  
**Recommended default:** Lean managed third-party SaaS bundle.  

---

## 1. Executive Recommendation

Azure remains the stronger long-term enterprise platform for WealthSpot, but it is too expensive for the current startup phase if the goal is a controlled MVP with limited traffic.

The best near-term approach is not to replace Azure with another large cloud one-for-one. The better approach is to use a small bundle of managed third-party services with generous free or low-cost tiers.

Recommended startup MVP stack:

| Need | Recommended service | MVP reason |
| --- | --- | --- |
| Web frontend | Cloudflare Pages | Free static hosting, CDN, HTTPS, custom domains |
| API/container hosting | Render or Railway | Simple FastAPI Docker deployment, low starting cost |
| PostgreSQL | Supabase Pro, preferably Mumbai region | Managed Postgres, backups, India data locality option |
| Redis/cache | Upstash Redis | Free/pay-as-you-go Redis-compatible cache for rate limits and lightweight queues |
| Media/KYC files | Cloudflare R2 | S3-compatible object storage, free tier, no egress fees |
| Auth | Clerk Hobby or existing JWT auth | Clerk has generous free tier; built-in JWT keeps cost lowest |
| Monitoring/uptime | Better Stack Free, optional Sentry Free | Uptime checks, basic logs/errors, low operational overhead |
| Transactional email | Resend Free | Enough for early transactional email volume |
| Payments | Razorpay | Enable only when real payment flows are live |

Expected monthly cost:

| Stage | Expected monthly cost | Notes |
| --- | ---: | --- |
| Private demo / founder testing | ₹500-₹2,500 | Uses free tiers heavily; not suitable for serious investor traffic |
| Controlled MVP | ₹1,500-₹7,000 | Recommended startup phase range |
| Safer paid MVP | ₹5,500-₹10,000 | Paid API tier, paid DB, stronger monitoring/email |
| Azure-lite baseline for comparison | ₹15,000-₹25,000 | From the existing Azure cost-wise plan |

This third-party stack gives most of the MVP runtime capability of the Azure-lite plan at a lower fixed cost, but with more multi-vendor operational responsibility.

---

## 2. Mandatory Components Only

These are the minimum services WealthSpot needs to be up and running as a web MVP.

| Component | Mandatory? | Why |
| --- | ---: | --- |
| Static web hosting | Yes | `apps/web` is the user-facing React/Vite frontend |
| FastAPI API container | Yes | `services/api` contains auth, properties, investments, KYC, referrals, notifications, approvals, and admin APIs |
| Managed PostgreSQL | Yes | Primary system of record for users, properties, investments, transactions, KYC, community, approvals, and audit data |
| Redis-compatible cache | Yes | Used for cache, rate limiting, and configured Celery broker/backend URLs |
| Object storage | Yes, if KYC/media upload is live | Replaces local MinIO/S3-style storage for documents and media |
| Auth | Yes | Use Clerk or the existing JWT auth flow |
| Secrets/configuration | Yes | Required for DB, Redis, JWT, encryption, CORS, and optional integrations |
| Basic monitoring | Yes | API uptime and error visibility are mandatory even for MVP |
| One-off migrations | Yes | Alembic must run once per deployment, not inside every scaled API replica |

Do not include these in the first low-cost MVP unless explicitly required:

| Component | MVP decision | Reason |
| --- | --- | --- |
| Celery worker | Defer | Adds cost and operational surface; enable only if async tasks are launch-critical |
| Communication worker | Defer | Email/SMS/WhatsApp orchestration can wait until communication flows are live |
| Kubernetes | Do not use | Too much platform overhead for this stage |
| Full Docker Compose in production | Do not use | Development stack only; not safe for real production state |
| Self-hosted PostgreSQL | Do not use | Backups, patching, restore, and durability risk are too high |
| Self-hosted MinIO | Do not use | Use managed object storage instead |
| Premium Redis | Defer | Not required for early cache/rate-limit usage |
| Front Door/WAF equivalent | Defer for private MVP | Add Cloudflare WAF/security rules before broad public paid launch |
| Heavy APM/log retention | Defer | Use low-retention logs and sampled error tracking first |
| Mobile deployment | Defer | Keep the first environment web-only |

---

## 3. Repository-Specific Service Mapping

| Current local/runtime item | Third-party MVP mapping | Notes |
| --- | --- | --- |
| `apps/web` | Cloudflare Pages | Build Vite static output and deploy as SPA |
| `apps/web/Dockerfile` | Not required initially | Static hosting is cheaper than an always-on frontend container |
| `services/api` | Render Web Service or Railway Service | Deploy using the production Docker target or native Python build |
| `services/api/Dockerfile` | API container source | Use production target, not development target |
| `postgres` in Docker Compose | Supabase Postgres or Neon Postgres | Managed database only |
| `redis` in Docker Compose | Upstash Redis | Use TLS URL and provider connection string |
| `minio` in Docker Compose | Cloudflare R2 or DigitalOcean Spaces | Prefer R2 for lowest storage/egress cost |
| `minio-init` | Not needed | Configure bucket and CORS in the object storage provider |
| `celery-worker` | Deferred Render/Railway worker or cron/job | Enable only after tasks are required and tested |
| `comm-worker` | Deferred worker | Enable only after communication flows are live |
| Alembic migrations | One-off deploy command/job | Run once before shifting traffic |
| `/live`, `/ready`, `/health` | Provider health checks | Use existing API health endpoints |

---

## 4. Recommended Lean Managed SaaS Architecture

```text
Users
  |
  | HTTPS
  v
Cloudflare Pages - React/Vite frontend
  |
  | HTTPS API calls
  v
Render or Railway - FastAPI container
  |       |        |        |
  |       |        |        +--> Better Stack / Sentry
  |       |        +----------> Cloudflare R2 object storage
  |       +-------------------> Upstash Redis
  +---------------------------> Supabase PostgreSQL

Clerk handles hosted auth if enabled.
Resend handles transactional email if enabled.
Razorpay handles payment flows only when real payments are live.
```

This layout keeps the application stateless at the API layer and keeps critical state in managed services.

---

## 5. Provider Analysis

### 5.1 Cloudflare Pages for frontend

Use Cloudflare Pages for the React/Vite web app.

Benefits:

1. Free static hosting for early stage usage.
2. Global CDN and HTTPS included.
3. Custom domain support.
4. No always-on frontend container cost.
5. Simple deployment from Git.

Limitations:

1. Only handles frontend/static assets.
2. API still needs separate hosting.
3. Build environment must correctly build monorepo packages before `apps/web`.

MVP decision: **Use by default.**

### 5.2 Render for API/container hosting

Render is a strong default for the FastAPI API because it supports Docker, Python services, background workers, static sites, managed Postgres, key-value storage, health checks, and Git-based deployment.

Typical relevant pricing:

| Render item | Starting point |
| --- | ---: |
| Static sites | Free |
| Web service Starter | About $7/month |
| Web service Standard | About $25/month |
| Postgres Basic | From about $6/month |
| Key Value/Redis-compatible | From about $10/month |

Benefits:

1. Very simple developer experience.
2. Docker support fits the existing API Dockerfile.
3. Health checks and logs are built in.
4. Background workers can be added later.
5. Can keep most infrastructure in one dashboard if desired.

Limitations:

1. Region and data residency must be verified before production use.
2. Free/low tiers have resource limits.
3. Managed database and Redis costs can grow if everything is moved into Render.

MVP decision: **Best default API hosting option if simplicity matters.**

### 5.3 Railway for API/container hosting

Railway is also a good fit for quick Docker and monorepo deployment.

Relevant pricing model:

| Railway item | Starting point |
| --- | ---: |
| Hobby plan | $5/month, includes $5 usage credit |
| Pro plan | $20/month, includes $20 usage credit |
| RAM usage | Usage-based |
| CPU usage | Usage-based |
| Egress | Usage-based |
| Volume storage | Usage-based |

Benefits:

1. Fast setup for monorepos and Docker services.
2. Good developer workflow.
3. Supports Postgres, Redis, variables, logs, metrics, cron, and private networking concepts.
4. Very low starting cost if usage stays small.

Limitations:

1. Usage-based billing must be watched carefully.
2. Requires spend controls and resource limits.
3. Production predictability can be weaker than fixed-price services if traffic spikes.

MVP decision: **Good alternative to Render when fast iteration matters most.**

### 5.4 Supabase for PostgreSQL

Supabase is the recommended database option when India data locality matters.

Relevant pricing and features:

| Supabase item | Starting point |
| --- | ---: |
| Free plan | $0, limited database/storage/egress, project may pause after inactivity |
| Pro plan | From $25/month |
| Included Pro database disk | 8 GB |
| Included Pro egress | 250 GB |
| Included Pro file storage | 100 GB |
| Backups | Daily backups with 7-day retention on Pro |
| Region | Supports South Asia/Mumbai region |

Benefits:

1. Managed Postgres with a strong developer experience.
2. Mumbai region support is valuable for India-focused users.
3. Backups on paid plan.
4. Connection pooling and dashboard tooling.
5. Could later consolidate auth/storage if desired, though this plan keeps services decoupled.

Limitations:

1. Free plan is not a serious production database option.
2. Pro starts at $25/month, which may be the largest fixed cost in the lean stack.
3. Supabase Auth/Storage should not be adopted unless the codebase intentionally migrates to those APIs.

MVP decision: **Use Supabase Pro for controlled MVP if database reliability and India data locality matter.**

### 5.5 Neon for PostgreSQL

Neon is a strong serverless Postgres alternative for demos, previews, and intermittent workloads.

Relevant pricing and features:

| Neon item | Starting point |
| --- | ---: |
| Free plan | $0, 0.5 GB storage per project, 100 CU-hours/month per project |
| Launch plan | Usage-based, typical intermittent load around $15/month |
| Scale-to-zero | Available for idle compute |
| Connection pooling | Built in |
| Available Asia region | Singapore |

Benefits:

1. Can be cheaper than Supabase for intermittent usage.
2. Serverless scale-to-zero can reduce cost.
3. Excellent branching and preview database workflows.
4. Good fit for staging, demos, and development.

Limitations:

1. No Mumbai region in the researched region list; Singapore is the closest Asia option.
2. Serverless pause/resume behavior can add cold-start considerations.
3. Free plan is not ideal for sensitive production data.

MVP decision: **Use for ultra-low-cost beta or staging; prefer Supabase for India-focused controlled MVP.**

### 5.6 Upstash Redis

Upstash is a good startup-phase Redis-compatible cache.

Relevant pricing:

| Upstash Redis item | Starting point |
| --- | ---: |
| Free plan | 256 MB data, 500K monthly commands |
| Pay as you go | About $0.20 per 100K commands |
| Fixed plan | From about $10/month |

Benefits:

1. Excellent free tier for early cache and rate limiting.
2. Serverless/pay-as-you-go pricing avoids fixed Redis cost.
3. TLS support.
4. Works well for lightweight state and rate limiting.

Limitations:

1. Not the first choice for durable Celery queues.
2. Command-based billing can grow if used heavily.
3. Some Redis patterns may need validation before production worker usage.

MVP decision: **Use for cache/rate limiting. Do not rely on it for critical durable job queues without testing.**

### 5.7 Cloudflare R2 for object storage

Cloudflare R2 is the recommended replacement for MinIO/Azure Blob in the low-cost MVP.

Relevant pricing:

| R2 item | Starting point |
| --- | ---: |
| Free storage | 10 GB-month/month |
| Free Class A operations | 1 million/month |
| Free Class B operations | 10 million/month |
| Egress | No egress fees |
| Standard storage after free tier | About $0.015/GB-month |

Benefits:

1. S3-compatible API fits the existing S3/MinIO direction better than a full storage refactor.
2. No egress fees are very useful for startup media costs.
3. Good free tier.
4. Works well with private buckets and signed URL patterns.

Limitations:

1. CORS and signed URL behavior must be tested with the existing upload flow.
2. Object storage is globally distributed rather than an India-only data residency story.
3. Access policy discipline is still required for KYC/media documents.

MVP decision: **Use by default if KYC/media uploads are enabled.**

### 5.8 DigitalOcean as predictable alternative

DigitalOcean can be used as a more predictable, simpler cloud alternative when fewer vendors are preferred.

Relevant pricing:

| DigitalOcean item | Starting point |
| --- | ---: |
| Basic Droplet | $4-$6/month |
| App Platform container | From about $5/month |
| Managed PostgreSQL | From about $15/month |
| Managed Valkey/Redis-compatible cache | From about $15/month |
| Spaces object storage | $5/month for 250 GiB and 1 TiB outbound transfer |

Benefits:

1. Predictable pricing.
2. Simple VM and App Platform options.
3. Managed databases and object storage are available.
4. Good option if you want one vendor and simpler billing.
5. Droplets include generous outbound transfer.

Limitations:

1. Droplet/Coolify style deployment increases operational responsibility.
2. Managed DB plus managed cache plus object storage can approach Azure-lite costs if all paid services are enabled.
3. Region availability must be confirmed before choosing a data residency posture.

MVP decision: **Use if predictable billing and fewer vendors matter more than maximum cost reduction.**

### 5.9 Fly.io and Koyeb

Fly.io and Koyeb are capable container platforms, but they are not the default recommendation for WealthSpot’s first low-cost MVP.

Fly.io strengths:

1. Very flexible container deployment.
2. Low-cost small machines.
3. Good global edge/container story.
4. Can add Upstash Redis and object storage integrations.

Fly.io concerns:

1. Postgres and storage choices need careful operations decisions.
2. Data transfer pricing can matter for India/Asia traffic.
3. More infra-shaped than Render/Railway for a small team.

Koyeb strengths:

1. Strong serverless container model.
2. Scale-to-zero and per-second billing.
3. Serverless Postgres option.

Koyeb concerns:

1. Base Pro plan and Postgres pricing are less attractive for the leanest MVP.
2. Available Postgres regions are not India-specific in the researched material.
3. Better fit for AI/high-performance workloads than this specific MVP.

MVP decision: **Keep as alternatives, not default.**

---

## 6. Recommended Deployment Options

### Option A — Lean Managed SaaS Bundle

**Recommended default for WealthSpot MVP.**

| Component | Provider |
| --- | --- |
| Web | Cloudflare Pages |
| API | Render Starter/Standard or Railway Hobby/Pro |
| PostgreSQL | Supabase Pro, Mumbai where possible |
| Redis | Upstash Redis free/pay-as-you-go |
| Object storage | Cloudflare R2 |
| Auth | Clerk Hobby or built-in JWT |
| Monitoring | Better Stack Free + optional Sentry Free |
| Email | Resend Free |

Estimated monthly cost:

| Mode | Estimate |
| --- | ---: |
| Free-heavy private beta | ₹500-₹2,500 |
| Recommended controlled MVP | ₹1,500-₹7,000 |
| With paid API and email upgrades | ₹5,500-₹10,000 |

Best for:

1. Startup burn-rate control.
2. Fast MVP launch.
3. Low operational overhead.
4. Easy rollback to Azure later because the app remains Docker/env-var/Postgres/S3 oriented.

Risks:

1. Multi-vendor billing and dashboards.
2. Weaker centralized IAM/secrets than Azure.
3. Requires careful CORS, secrets, and provider budget caps.

### Option B — Ultra-Low-Cost Private Beta

Use this only for founder demos, internal testing, or a very small private beta.

| Component | Provider |
| --- | --- |
| Web | Cloudflare Pages free |
| API | Railway Hobby or Render Starter/free where acceptable |
| PostgreSQL | Neon Free or Supabase Free |
| Redis | Upstash Free |
| Object storage | Cloudflare R2 free tier |
| Auth | Built-in JWT or Clerk Hobby |
| Monitoring | Better Stack Free |
| Email | Resend Free |

Estimated monthly cost: **₹500-₹2,500**.

Benefits:

1. Lowest possible monthly cost.
2. Fastest way to get a web MVP online.
3. Good for validation before investor-facing traffic.

Risks:

1. Free database tiers are not ideal for sensitive production data.
2. Cold starts, pausing, limits, and support gaps are likely.
3. Not suitable for paid investor traffic or production KYC workflows.

### Option C — Predictable DigitalOcean Stack

Use this if fewer providers and predictable billing matter more than squeezing every rupee.

| Component | Provider |
| --- | --- |
| Web | Cloudflare Pages or DigitalOcean App Platform static |
| API | DigitalOcean App Platform or a small Droplet with Coolify |
| PostgreSQL | DigitalOcean Managed PostgreSQL |
| Redis | DigitalOcean Managed Valkey or Upstash |
| Object storage | DigitalOcean Spaces or Cloudflare R2 |
| Monitoring | DigitalOcean monitoring + Better Stack |

Estimated monthly cost: **₹3,500-₹7,000** for lean mode, higher if all managed services are enabled.

Benefits:

1. Predictable flat pricing.
2. Fewer provider relationships.
3. Good Docker fit.
4. Easy upgrade path from Droplet to App Platform or managed services.

Risks:

1. Droplet-based deployments require patching, backups, firewall discipline, and incident handling.
2. Managed DB/cache/storage can become less cheap than the mixed SaaS bundle.
3. Less integrated than Azure for enterprise security and compliance.

---

## 7. Azure vs Third-Party MVP Comparison

| Azure-lite component | Third-party MVP equivalent | MVP feature similarity | Azure advantage | Third-party advantage |
| --- | --- | --- | --- | --- |
| Azure Static Web Apps | Cloudflare Pages | High | Azure ecosystem integration | Lower cost, excellent CDN |
| Azure Container Apps | Render/Railway/DigitalOcean App Platform | Medium-high | Managed identity, revisions, Azure networking | Simpler setup, lower starting cost |
| Azure PostgreSQL Flexible Server | Supabase/Neon/DO Managed Postgres | High | Azure private networking, enterprise controls | Lower startup cost, better dev UX |
| Azure Cache for Redis | Upstash/Render Key Value/DO Valkey | Medium | Stronger production Redis posture | Free/pay-as-you-go entry point |
| Azure Blob Storage | Cloudflare R2/DO Spaces | High | Azure governance, lifecycle, private endpoints | R2 no-egress model, S3 compatibility |
| Azure Key Vault | Platform env vars, later Doppler/Infisical | Medium | Strong centralized secrets and RBAC | No extra service required at MVP stage |
| Application Insights | Better Stack/Sentry/provider logs | Medium | Deep Azure-native observability | Easier free/low-cost monitoring |
| Azure Container Registry | Provider build pipeline/Git deploy | Medium | Dedicated private registry | Often unnecessary at MVP stage |
| Azure Front Door + WAF | Cloudflare DNS/security/WAF later | Medium-high | Enterprise edge integration | Can start free/low and upgrade later |
| Azure budget/management | Provider spend caps and alerts | Medium | Centralized cloud billing controls | Lower absolute monthly cost |

Azure is still better when WealthSpot needs:

1. Strong centralized IAM and RBAC.
2. Private networking across all services.
3. Enterprise-grade Key Vault workflows.
4. Compliance and audit posture in one cloud.
5. One vendor support model.
6. More formal production governance.

The third-party stack is better when WealthSpot needs:

1. Lowest fixed monthly burn.
2. Faster MVP launch.
3. Generous free tiers.
4. Easy developer onboarding.
5. Lower-cost static hosting, Redis, and object storage.

---

## 8. Pros and Cons of the Recommended Third-Party Stack

### Pros

1. Much lower monthly cost than Azure-lite.
2. Better startup fit because services can start free or cheap.
3. Fast setup without Bicep/Terraform or Azure resource complexity.
4. Keeps managed Postgres instead of unsafe self-hosted database.
5. Keeps managed object storage instead of production MinIO.
6. Uses existing Docker/API/env-var architecture with minimal app rewrite.
7. Cloudflare R2 avoids media egress surprises.
8. Clerk, Supabase, Resend, Better Stack, and Upstash are startup-friendly tools.
9. Easy to replace individual services later.

### Cons

1. Multi-vendor environment increases operational coordination.
2. Secrets are spread across provider dashboards unless a secret manager is added.
3. IAM/RBAC is weaker than Azure managed identity plus Key Vault.
4. Data residency can become mixed across providers.
5. Free tiers have limits, pauses, cold starts, or support constraints.
6. Incident debugging spans multiple dashboards.
7. Compliance story is less unified.
8. Durable background jobs need extra design before serious production use.
9. Scaling later may require moving some components back to Azure, AWS, or a more consolidated cloud.

---

## 9. Required Environment and Secrets

Minimum production values:

| Variable | Required? | Source/provider |
| --- | ---: | --- |
| `APP_ENV` | Yes | Set to `production` |
| `DEBUG` | Yes | Set to `false` |
| `DATABASE_URL` | Yes | Supabase/Neon/DO Postgres connection string |
| `REDIS_URL` | Yes | Upstash/Redis URL |
| `CELERY_BROKER_URL` | Yes if Celery config remains active | Use Redis DB/URL; do not start worker unless needed |
| `JWT_SECRET_KEY` | Yes | Strong generated secret |
| `ENCRYPTION_KEY` | Yes | Fernet key for sensitive fields |
| `CORS_ORIGINS` | Yes | Exact Cloudflare Pages/custom domains only |
| `S3_ENDPOINT_URL` | If R2/Spaces is used | R2/Spaces S3 endpoint |
| `AWS_ACCESS_KEY_ID` | If R2/Spaces is used | R2/Spaces access key |
| `AWS_SECRET_ACCESS_KEY` | If R2/Spaces is used | R2/Spaces secret key |
| `AWS_S3_BUCKET` | If R2/Spaces is used | Media/KYC bucket name |
| `S3_PUBLIC_URL` | If public media is used | CDN or signed URL base strategy |
| `CLERK_API_KEY` | If Clerk is enabled | Clerk dashboard |
| `CLERK_WEBHOOK_SECRET` | If Clerk webhooks are enabled | Clerk dashboard |
| `RAZORPAY_KEY_ID` | If payments are enabled | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | If payments are enabled | Razorpay dashboard |
| `SENTRY_DSN` | Optional | Sentry/Better Stack equivalent |
| `SMTP_HOST` / credentials | Optional | Use Resend SMTP/API when email is enabled |

Do not store production secrets in committed `.env` files.

---

## 10. Cost Guardrails

Apply these before any public access:

1. Enable spend caps or budget alerts in every provider dashboard.
2. Keep API on the smallest paid tier that passes smoke tests.
3. Keep API replicas low; avoid always-on extra workers.
4. Do not deploy Celery or communication workers until they are required.
5. Use low log retention and sampling.
6. Keep Upstash command usage visible; upgrade only after command volume is known.
7. Keep R2 buckets private by default.
8. Use signed URLs or tightly controlled public media paths.
9. Restrict CORS to exact frontend domains.
10. Disable API docs in production if the backend supports that mode.
11. Run Alembic migrations once per deploy, not in every replica.
12. Set health checks for `/live`, `/ready`, and `/health`.
13. Keep daily/weekly DB backup policy documented.
14. Delete unused preview environments, databases, branches, storage buckets, and old deployments.

---

## 11. Rollout Plan

### Phase 0 — Confirm decisions

Confirm:

1. Monthly budget ceiling.
2. Frontend domain.
3. API domain.
4. Whether India-only data residency is mandatory.
5. Whether KYC/media upload is live on day one.
6. Whether payments are live on day one.
7. Whether Clerk is required or built-in JWT is enough for private beta.
8. Whether workers are needed at launch.

### Phase 1 — Create provider accounts

Create or prepare:

1. Cloudflare account and DNS zone.
2. Render or Railway account.
3. Supabase project in Mumbai where possible.
4. Upstash Redis database.
5. Cloudflare R2 bucket.
6. Clerk app if using Clerk.
7. Better Stack monitor.
8. Resend domain if email is enabled.

### Phase 2 — Configure data services

1. Create Postgres database.
2. Configure SSL connection string.
3. Configure database connection pooling if provider supports it.
4. Create Redis database and capture TLS URL.
5. Create R2 bucket and access keys.
6. Configure bucket CORS only for approved frontend/API domains.

### Phase 3 — Run migrations once

1. Build or connect the API deployment environment.
2. Set `DATABASE_URL` for the managed Postgres database.
3. Run Alembic migrations once.
4. Save migration logs.
5. Verify schema is current.

Do not run migrations in every API container start.

### Phase 4 — Deploy API

1. Deploy `services/api` using the production Docker target or equivalent production command.
2. Set all mandatory environment variables.
3. Configure health checks.
4. Confirm `/live`, `/ready`, and `/health`.
5. Confirm DB, Redis, and object storage connectivity.

### Phase 5 — Deploy frontend

1. Build shared packages.
2. Build `apps/web` with the production API base URL.
3. Deploy to Cloudflare Pages.
4. Configure SPA fallback routing.
5. Configure custom domain and HTTPS.
6. Confirm CORS from the frontend domain to API domain.

### Phase 6 — Smoke test

Run:

1. Frontend loads over HTTPS.
2. API `/live` returns OK.
3. API `/ready` returns OK.
4. API `/health` confirms DB and Redis.
5. Sign-in/auth flow works.
6. Property listing loads.
7. Investment listing loads.
8. Profile/KYC flow works if enabled.
9. Media upload/download works if enabled.
10. Razorpay webhook test works if payments are enabled.
11. Better Stack receives uptime alerts.
12. Error tracking receives test event if enabled.

### Phase 7 — Stabilize

1. Review API logs for 24-48 hours.
2. Check DB CPU, connections, and slow queries.
3. Check Redis command volume.
4. Check R2 operation volume.
5. Review provider billing dashboards.
6. Upgrade only the service that hits a real limit.

---

## 12. When to Upgrade Beyond This Stack

Move toward Azure, AWS, or a stronger managed-cloud setup when any of these become true:

| Trigger | Recommended action |
| --- | --- |
| Paid public launch starts | Add Cloudflare WAF/security rules or equivalent |
| KYC document volume grows | Add stronger storage lifecycle, versioning, and audit controls |
| DB CPU/connections stay high | Upgrade Supabase compute or move to stronger managed Postgres |
| Redis command volume grows quickly | Move from free/pay-as-you-go to fixed Redis plan |
| Worker backlog becomes business-critical | Add proper worker service and durable outbox pattern |
| Compliance requirements increase | Re-evaluate Azure/AWS with centralized IAM, secrets, logs, and private networking |
| Multi-vendor operations becomes painful | Consolidate onto DigitalOcean, Azure, or AWS |
| Investor/payment traffic grows | Add WAF, stronger monitoring, backup restore drills, and formal runbook |

---

## 13. Keep Migration Paths Open

To avoid lock-in, keep these choices:

1. Keep `DATABASE_URL` as a standard PostgreSQL connection string.
2. Keep Alembic migrations as the source of truth.
3. Keep API deployable through `services/api/Dockerfile` production target.
4. Keep object storage S3-compatible where possible.
5. Keep `/live`, `/ready`, and `/health` provider-neutral.
6. Keep all provider-specific values in environment variables.
7. Avoid adopting Supabase-only APIs unless there is a deliberate product decision.
8. Avoid adopting platform-specific worker queues until background processing requirements are clear.

This keeps the app portable back to Azure Container Apps, DigitalOcean App Platform, AWS ECS/Fargate, or another container platform later.

---

## 14. Final Decision

For WealthSpot’s current startup phase, use the following default third-party environment:

1. **Cloudflare Pages** for the React/Vite web frontend.
2. **Render** for the FastAPI API container, with Railway as a close alternative.
3. **Supabase Pro in Mumbai** for managed PostgreSQL if budget allows; Neon only for ultra-low-cost beta/staging.
4. **Upstash Redis** for cache and rate limiting.
5. **Cloudflare R2** for media/KYC object storage.
6. **Clerk Hobby** if hosted auth is desired; otherwise use the existing JWT auth for private beta.
7. **Better Stack Free** for uptime/log/error basics, optionally Sentry Free for application errors.
8. **Resend Free** for early transactional email.
9. **Razorpay** only when real payments are enabled.

Do not deploy workers, Kubernetes, WAF, premium Redis, or heavy observability in the first low-cost MVP unless a launch requirement proves they are mandatory.

This approach should reduce the initial monthly platform cost significantly while preserving the core managed-service posture needed for a responsible MVP.
