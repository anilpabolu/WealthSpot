# WealthSpot — Final Deployment Plan

**Stack:** Azure Container Apps (API) + Cloudflare Pages (Web) + Supabase (DB) + Upstash (Redis)  
**Region:** Central India (Azure) + Mumbai (Supabase/Upstash)  
**Last updated:** May 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Azure Payment Model Guide](#azure-payment-model-guide)
3. [Third-Party Billing Guide](#third-party-billing-guide)
4. [Total Cost Summary](#total-cost-summary)
5. [Deployment Order](#deployment-order)
6. [Infrastructure Files Reference](#infrastructure-files-reference)
7. [Environment Variables Reference](#environment-variables-reference)
8. [CI/CD Pipeline Summary](#cicd-pipeline-summary)
9. [Scaling Guide](#scaling-guide)
10. [Post-Deploy Smoke Test Checklist](#post-deploy-smoke-test-checklist)
11. [Upgrade Triggers (Phase 3)](#upgrade-triggers-phase-3)
12. [Security Checklist](#security-checklist)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  USERS  (browser + React Native mobile)                         │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTPS
          ┌────────▼────────┐         ┌──────────────────────────┐
          │ Cloudflare CDN  │         │  Cloudflare R2           │
          │ Pages (SPA)     │         │  Public media (avatars,  │
          │ app.wealthspot  │         │  opportunity images)     │
          └────────┬────────┘         └──────────────────────────┘
                   │ HTTPS /api/v1/*
          ┌────────▼──────────────────────────────────────────────┐
          │  Azure Container Apps — Central India                 │
          │  wealthspot-api  (FastAPI, uvicorn 4 workers)         │
          │  0.5 vCPU / 1 GiB RAM  |  min 1 / max 3 replicas     │
          │  Probes: /live (30s) / /ready (10s) / /startup (5s)  │
          └───┬──────────┬──────────────────────┬────────────────┘
              │          │                      │
    ┌─────────▼──┐  ┌────▼──────────────┐  ┌───▼──────────────────┐
    │  Supabase  │  │  Upstash Redis    │  │  Azure Blob Storage  │
    │  Pro       │  │  (sessions, cache,│  │  kyc-documents       │
    │  Mumbai    │  │   Celery broker)  │  │  (private, India)    │
    │  PostgreSQL│  │  Mumbai           │  │  Central India       │
    └────────────┘  └───────────────────┘  └──────────────────────┘
              │
    ┌─────────▼──────────────────────────────────────────┐
    │  Azure Key Vault  ·  ACR Basic  ·  App Insights    │
    │  (secrets)            (images)      (telemetry)    │
    └────────────────────────────────────────────────────┘
```

**Trust Boundary — India Data Residency:**
- KYC documents (PAN, Aadhaar, Selfie) → Azure Blob Storage, Central India — never leave India
- Database (user PII, investment records) → Supabase Mumbai (AWS ap-south-1) — India region
- Public media (property photos, avatars) → Cloudflare R2 — global CDN, no PII

---

## Azure Payment Model Guide

### Which Azure Services You're Using

| Service | Billing Model | Monthly Estimate |
|---|---|---|
| Container Apps (Consumption) | Pay-per-vCPU-second + per-request | ₹2,000–₹3,500 |
| ACR Basic | Pay-per-GB storage + per-operation | ₹100–₹200 |
| Key Vault Standard | Pay-per-10K operations | ₹50–₹150 |
| Blob Storage LRS Hot | Pay-per-GB + per-operation | ₹100–₹300 |
| Log Analytics PerGB2018 | Pay-per-GB ingested (30-day retention, 1 GB/day cap) | ₹200–₹400 |
| Application Insights | Pay-per-GB (workspace-based, 1 GB/day cap) | ₹200–₹500 |
| **Azure Total** | | **₹2,650–₹5,050** |

### Reservation Strategy

**Months 1–3: 100% Pay-As-You-Go on ALL Azure services**

Rationale:
- Container Apps Consumption plan is already serverless pricing — no cold starts since min_replicas=1
- You do not know your baseline traffic yet; reservations would be premature
- ACR Basic, Key Vault, Blob Storage have no reservation products — always PAYG
- Log Analytics and App Insights have no reservation products — always PAYG

**Month 4 evaluation: Should you buy Container Apps Dedicated + reservation?**

Evaluate switching to Container Apps Dedicated + 1-year commitment if ALL of the following are true:
- Average replica count ≥ 2.0 over any 2-week period
- Monthly Container Apps bill consistently exceeds ₹3,000
- Traffic is predictable (no large seasonal spikes expected)

Savings if you switch: ~35% on compute (vCPU + memory reservation).

**Month 6+ evaluation: Azure PostgreSQL migration (Phase 3)**

If you migrate from Supabase to Azure Database for PostgreSQL Flexible Server:
- PAYG: ~₹4,200/month (2 vCPU, 4 GiB RAM, 32 GiB storage, Central India)
- 1-year reserved: ~₹3,000/month (saves 28%)
- 3-year reserved: ~₹2,470/month (saves 41%)

> Do not buy reservations before you confirm you will NOT migrate back to Supabase.

### What NEVER needs a reservation

| Service | Why |
|---|---|
| ACR Basic | No reservation product exists at this tier |
| Azure Key Vault | Consumption-only — can't reserve |
| Azure Blob Storage | No compute to reserve; storage is always PAYG |
| Log Analytics | No reservation at PerGB2018 tier |
| Application Insights | Workspace-based billing, no reservation |

### Cost Optimization Tips (immediate)

1. **App Insights daily cap** — already set to 1 GB/day in Bicep. If you see the cap being hit, filter noisy spans in the SDK before blaming the cap.
2. **Log Analytics retention** — already set to 30 days. Azure charges extra for >30 days. Keep it at 30.
3. **Container Apps scale-to-zero** — you have `min_replicas: 1` intentionally (avoids cold starts for a financial app). If cost is a concern during off-peak hours (midnight–6 AM), lower to 0 and accept occasional 5–8s cold starts.
4. **ACR cleanup** — run `az acr run --registry wealthspotcrprod --cmd "acr purge --filter 'wealthspot-api:.*' --ago 30d --keep 10" /dev/null` monthly to purge old images.

---

## Third-Party Billing Guide

### Recommended Plans by Service

| Service | MVP Plan | Monthly (₹) | Notes |
|---|---|---|---|
| **Cloudflare Pages** | Free | ₹0 | 500 builds/month free. Unlimited bandwidth. |
| **Cloudflare R2** | Pay-as-you-go | ₹0–₹130 | First 10 GB/month free. Then ~₹1.3/GB. No egress fees. |
| **Supabase** | Pro (monthly) | ₹2,100 (~$25) | Includes 8 GB DB, 100 GB bandwidth, PITR backups. |
| **Upstash Redis** | Pay-per-command | ₹0–₹400 | Free up to 10K commands/day. Then $0.2/100K commands. |
| **Clerk** | Free (<10K MAU) | ₹0 | Hobby plan $25/mo if >10K MAU. |
| **Resend** | Free (3K/month) | ₹0 | Basic plan $20/mo for 50K emails. |
| **Better Stack** | Free | ₹0 | 10 monitors, 3-minute check interval. |
| **Sentry** | Free | ₹0 | 5K errors/month, 1 GB attachments. |
| **Expo EAS** | Free | ₹0 | 30 builds/month, unlimited updates. |

### Never Commit Annual for These During MVP

**Supabase:** Stay monthly Pro at $25. Annual Pro saves ~16% ($252/year vs. $300) but only commit after:
- You've confirmed the India latency from Supabase Mumbai is acceptable
- You've decided NOT to migrate to Azure PostgreSQL in Phase 3

**Upstash:** Never commit to a plan. Pay-per-command scales linearly with usage. Switch to the $10/month fixed plan only when commands regularly exceed 5 million/month.

**Clerk:** Never commit annual until you exceed 10K MAU. The free tier is extremely generous. At 10K MAU, evaluate if Hobby ($25/mo) vs Pro is right before paying.

---

## Total Cost Summary

### MVP Phase 1 (Months 1–3)

| Category | Monthly (₹) |
|---|---|
| Azure (all services, PAYG) | ₹2,650–₹5,050 |
| Supabase Pro | ₹2,100 |
| Upstash Redis | ₹0–₹400 |
| Cloudflare (R2 + Pages) | ₹0–₹130 |
| Clerk + Resend + Better Stack + Sentry | ₹0 |
| **Total** | **₹4,750–₹7,680** |

### After Optimizations (Month 4+)

With Container Apps Dedicated 1-yr reservation + Supabase annual plan:
- Azure: ₹1,900–₹3,500 (35% compute savings)
- Supabase annual: ₹1,750/month equivalent
- **Total: ₹3,650–₹5,780/month**

---

## Deployment Order

### One-Time Infrastructure Setup

```
Step 1: Prerequisites
  ├── Create Azure account + subscription
  ├── Install Azure CLI (az --version >= 2.60)
  ├── Run: az login && az account set --subscription <id>
  └── Create resource group:
        az group create --name rg-wealthspot-prod --location centralindia

Step 2: Third-party accounts (parallel)
  ├── Supabase: Create project in Mumbai region
  ├── Upstash: Create Redis database in Mumbai
  ├── Cloudflare: Create R2 bucket + Pages project
  ├── Resend: Verify domain, get API key
  ├── Clerk: Already configured — add prod domain to allowed origins
  ├── Better Stack: Create uptime monitor
  └── Sentry: Create project, copy DSN

Step 3: Deploy Azure infrastructure
  └── ./deployment/scripts/01-deploy-azure-infra.sh
        └── Deploys: ACR + Key Vault + Blob Storage + Container Apps Env
                     + App Insights + Managed Identity + Container App
                     (takes 3–6 minutes)

Step 4: Populate secrets
  └── ./deployment/scripts/02-configure-secrets.sh
        ├── Writes 15+ secrets to Key Vault (interactive)
        └── Creates GitHub OIDC service principal + federated credential

Step 5: Add GitHub Actions secrets
  └── See table in docs/manual_prod_steps.md § Step 11

Step 6: First CI/CD deployment
  ├── Push to main → triggers deploy-api.yml AND deploy-web.yml
  └── OR: trigger both workflows manually from GitHub Actions UI

Step 7: Run first migration
  └── GitHub Actions → run-migrations.yml → workflow_dispatch
        └── Type 'migrate' to confirm

Step 8: Configure custom domains
  ├── Container Apps: Azure Portal → wealthspot-api → Custom domains
  │     → Add api.wealthspot.in + managed certificate
  └── Cloudflare Pages: Dashboard → wealthspot-web → Custom domains
        → Add app.wealthspot.in

Step 9: Update Clerk
  ├── Add https://app.wealthspot.in to allowed origins
  └── Set webhook endpoint to https://api.wealthspot.in/api/v1/webhooks/clerk

Step 10: Validate
  └── ./deployment/scripts/04-validate.sh
```

### Ongoing Deployments (automated)

```
API change → push to main → deploy-api.yml runs automatically
Web change → push to main → deploy-web.yml runs automatically
Migration needed → GitHub Actions UI → run-migrations.yml → confirm 'migrate'
```

---

## Infrastructure Files Reference

| File | Purpose |
|---|---|
| [azure.yaml](../azure.yaml) | `azd` configuration (alternative to manual az CLI) |
| [deployment/azure/main.bicep](../deployment/azure/main.bicep) | Top-level Bicep orchestrator |
| [deployment/azure/main.parameters.bicepparam](../deployment/azure/main.parameters.bicepparam) | Infrastructure parameters (fill R2 endpoint before first deploy) |
| [deployment/azure/modules/registry.bicep](../deployment/azure/modules/registry.bicep) | Azure Container Registry Basic |
| [deployment/azure/modules/keyvault.bicep](../deployment/azure/modules/keyvault.bicep) | Key Vault Standard with RBAC + purge protection |
| [deployment/azure/modules/storage-kyc.bicep](../deployment/azure/modules/storage-kyc.bicep) | Private Blob Storage for KYC documents |
| [deployment/azure/modules/container-apps-env.bicep](../deployment/azure/modules/container-apps-env.bicep) | Log Analytics + Container Apps Environment |
| [deployment/azure/modules/api-container-app.bicep](../deployment/azure/modules/api-container-app.bicep) | Container App with health probes + KV secret refs |
| [deployment/azure/modules/monitoring.bicep](../deployment/azure/modules/monitoring.bicep) | Application Insights + alert rules |
| [deployment/azure/modules/rbac.bicep](../deployment/azure/modules/rbac.bicep) | Managed identity + role assignments |
| [deployment/scripts/01-deploy-azure-infra.sh](../deployment/scripts/01-deploy-azure-infra.sh) | Deploy all Azure resources |
| [deployment/scripts/02-configure-secrets.sh](../deployment/scripts/02-configure-secrets.sh) | Populate Key Vault + GitHub OIDC |
| [deployment/scripts/03-run-migrations.sh](../deployment/scripts/03-run-migrations.sh) | Run Alembic migrations locally |
| [deployment/scripts/04-validate.sh](../deployment/scripts/04-validate.sh) | Smoke test all endpoints |
| [.github/workflows/deploy-api.yml](../.github/workflows/deploy-api.yml) | CI/CD: build + push API image + deploy |
| [.github/workflows/deploy-web.yml](../.github/workflows/deploy-web.yml) | CI/CD: build Vite SPA + deploy to Cloudflare Pages |
| [.github/workflows/run-migrations.yml](../.github/workflows/run-migrations.yml) | Manual migration workflow |

---

## Environment Variables Reference

All variables are documented in [deployment/config/prod.env.example](../deployment/config/prod.env.example).

**Secret variables** (stored in Azure Key Vault, injected via Container Apps secret refs):

| KV Secret Name | Env Var | Source |
|---|---|---|
| `database-url` | `DATABASE_URL` | Supabase → Connection String (transaction pooler) |
| `jwt-secret-key` | `JWT_SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `encryption-key` | `ENCRYPTION_KEY` | Generate: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `clerk-webhook-secret` | `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → Signing Secret |
| `clerk-api-key` | `CLERK_API_KEY` | Clerk Dashboard → API Keys |
| `redis-url` | `REDIS_URL` | Upstash → Redis → Details → rediss:// URL |
| `celery-broker-url` | `CELERY_BROKER_URL` | Same Upstash URL + `/1` at the end |
| `aws-access-key-id` | `AWS_ACCESS_KEY_ID` | Cloudflare R2 → Manage API Tokens |
| `aws-secret-access-key` | `AWS_SECRET_ACCESS_KEY` | Cloudflare R2 → Manage API Tokens |
| `kyc-access-key-id` | `KYC_AWS_ACCESS_KEY_ID` | Storage account name (set by script) |
| `kyc-secret-access-key` | `KYC_AWS_SECRET_ACCESS_KEY` | Azure Portal → Storage → Access keys → key1 |
| `razorpay-key-id` | `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `razorpay-key-secret` | `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `sentry-dsn` | `SENTRY_DSN` | Sentry → Project → Settings → DSN |
| `smtp-password` | `SMTP_PASSWORD` | Resend API key (re_...) |
| `twilio-account-sid` | `TWILIO_ACCOUNT_SID` | Twilio Console |
| `twilio-auth-token` | `TWILIO_AUTH_TOKEN` | Twilio Console |

**Non-secret variables** (set directly in Bicep, no Key Vault needed):

| Env Var | Value | Source |
|---|---|---|
| `APP_ENV` | `production` | Hardcoded in Bicep |
| `CORS_ORIGINS` | `https://app.wealthspot.in,https://wealthspot.in` | Bicep param |
| `AWS_REGION` | `auto` | Bicep (R2 uses "auto") |
| `AWS_S3_BUCKET` | `wealthspot-media` | Bicep param |
| `S3_ENDPOINT_URL` | `https://<id>.r2.cloudflarestorage.com` | Bicep param |
| `S3_PUBLIC_URL` | `https://media.wealthspot.in` | Bicep param |
| `KYC_AWS_S3_BUCKET` | `kyc-documents` | Bicep |
| `KYC_S3_ENDPOINT_URL` | `https://wealthspotkycprod.blob.core.windows.net` | Bicep (from storage module output) |
| `SMTP_HOST` | `smtp.resend.com` | Bicep |
| `SMTP_PORT` | `587` | Bicep |
| `SMTP_USERNAME` | `resend` | Bicep |

---

## CI/CD Pipeline Summary

### deploy-api.yml

```
Trigger: push to main (services/api/** or deployment/azure/**)
         OR manual workflow_dispatch

  build job:
    1. Azure OIDC login
    2. az acr build → builds Dockerfile target=production from services/api/
       (cloud build — no local Docker daemon)
    3. Pushes two tags: <sha>-<timestamp> and :latest

  deploy job (needs: build, environment: production):
    1. Azure OIDC login
    2. az containerapp update --image <new-tag>
    3. Wait 30s for revision rollout
    4. Verify ≥1 running revision
    5. Retry /live endpoint 5× (10s apart) — fail workflow on no 200
    6. Annotate Application Insights with deployment marker
```

### deploy-web.yml

```
Trigger: push to main (apps/web/** or packages/**)
         OR manual workflow_dispatch

  build job:
    1. npm ci --legacy-peer-deps (workspace root)
    2. npm run build:packages (wealthspot-types + wealthspot-api-client)
    3. npm run build (Vite, from apps/web/)
       Env vars injected at build time:
         VITE_API_URL, VITE_CLERK_PUBLISHABLE_KEY,
         VITE_SENTRY_DSN, VITE_RAZORPAY_KEY_ID
    4. Upload apps/web/dist as artifact

  deploy job (needs: build, environment: production):
    1. cloudflare/pages-action@v1 → deploys dist/ to Cloudflare Pages
```

### run-migrations.yml

```
Trigger: workflow_dispatch ONLY (requires typing 'migrate' to confirm)
         Optional: dry_run=true prints SQL without applying

  migrate job (environment: production):
    1. Validates confirmation input
    2. Azure OIDC login
    3. Gets current API image from Container App
    4. Creates one-off Container Apps Job with: alembic upgrade head
    5. Starts job execution
    6. Polls status every 10s (5-minute timeout)
    7. Fails workflow if status ≠ Succeeded
    8. Deletes job (cleanup — always runs)
    9. Posts summary to GitHub Step Summary
```

### Existing ci.yml (unchanged)

```
Trigger: push/PR to main

  Runs: backend-lint, backend-test, backend-docker,
        frontend-lint, frontend-build, frontend-test
```

---

## Scaling Guide

### Vertical Scaling (increase resources per replica)

Edit `deployment/azure/modules/api-container-app.bicep`:
```bicep
resources: {
  cpu: json('1.0')    // was 0.5
  memory: '2Gi'       // was 1Gi
}
```
Then push a commit to trigger `deploy-api.yml`, which will re-apply the Bicep module.

### Horizontal Scaling (more replicas)

The HTTP scale rule (100 concurrent requests → add replica) is already configured.
To tune the limits:
```bicep
scale: {
  minReplicas: 2   // never scale to zero
  maxReplicas: 10  // allow up to 10
}
```

### Database Scaling

**Supabase Pro** includes up to 8 GB storage and 4 GiB RAM. To scale:
- Supabase Dashboard → Project Settings → Compute → Upgrade to Micro/Small/Medium

**Phase 3 migration to Azure PostgreSQL Flexible Server:**
- Trigger: DB size > 8 GB OR latency from Container Apps exceeds 100ms p95
- Benefit: co-location in Central India → sub-10ms latency
- Steps: export from Supabase → pg_restore → update DATABASE_URL in Key Vault

### Redis Scaling

**Upstash Free:** 10K commands/day. Scales automatically to pay-per-command.
**Trigger to switch:** Commands > 5M/month or memory > 256 MB → evaluate Upstash Standard ($10/mo fixed).

---

## Post-Deploy Smoke Test Checklist

Run `./deployment/scripts/04-validate.sh` for automated checks, then manually verify:

- [ ] `GET https://api.wealthspot.in/live` → `{"status":"alive"}`
- [ ] `GET https://api.wealthspot.in/ready` → `{"db":"ok","redis":"ok",...}`
- [ ] `GET https://api.wealthspot.in/health` → includes `migration_head` matching latest revision
- [ ] Frontend loads at `https://app.wealthspot.in` — no console errors
- [ ] No CORS errors in browser DevTools when frontend calls API
- [ ] Clerk sign-in page loads; test OTP flow completes
- [ ] Clerk webhook fires: new user → user record created in Supabase
- [ ] `GET https://api.wealthspot.in/api/v1/opportunities` → returns list (requires auth)
- [ ] KYC document upload → file appears in Azure Blob `kyc-documents` container (private, no public URL)
- [ ] Avatar upload → file appears in Cloudflare R2 bucket, served via `media.wealthspot.in`
- [ ] Razorpay test order creation → order ID returned
- [ ] Razorpay test webhook → `POST /api/v1/webhooks/razorpay` → 200
- [ ] Better Stack monitor shows green
- [ ] Application Insights Live Metrics show requests in Azure Portal
- [ ] Sentry receives a test event (trigger from the app)

---

## Upgrade Triggers (Phase 3)

These events signal it is time to re-evaluate the hybrid architecture:

| Trigger | Action |
|---|---|
| DB size > 8 GB | Upgrade Supabase tier OR migrate to Azure PostgreSQL |
| DB p95 latency > 100ms from API | Migrate to Azure PostgreSQL (co-location) |
| Redis commands > 5M/month | Switch Upstash to fixed plan; evaluate Azure Cache for Redis |
| Container App avg replicas ≥ 2 for 2+ weeks | Switch to Dedicated plan + 1-yr reservation |
| Monthly Azure bill consistently > ₹7,000 | Review App Insights cap, purge stale ACR images, evaluate reserved capacity |
| Cloudflare R2 traffic > 1 TB/month | Still cheaper than AWS S3; continue with R2 |
| MAU > 10,000 | Upgrade Clerk from free to Hobby ($25/mo) |
| Email > 3,000/month | Upgrade Resend to Basic ($20/mo, 50K emails) |

---

## Security Checklist

- [x] Production `config.py` validator enforces `JWT_SECRET_KEY ≠ "change-me"`, `ENCRYPTION_KEY` set, `SENTRY_DSN` set, `CORS_ORIGINS` HTTPS-only
- [x] ACR admin login disabled — Container App pulls via managed identity (AcrPull)
- [x] Key Vault RBAC model — no legacy access policies
- [x] Key Vault purge protection enabled (7-day soft delete)
- [x] KYC Blob container has `publicAccess: 'None'` — never publicly accessible
- [x] KYC Storage minimum TLS 1.2 enforced
- [x] GitHub Actions uses OIDC (no long-lived service principal secrets)
- [x] Bicep parameter file contains no secrets — all secrets via Key Vault
- [x] Container App CORS policy explicitly lists allowed origins (no wildcard)
- [x] `RAZORPAY_ALLOW_UNSIGNED_DEV=false` enforced by production validator
- [x] API Swagger/ReDoc endpoints disabled in production (`app_env != "development"`)
- [x] API docs only enabled when `APP_ENV=development`
- [ ] Enable Defender for Containers on ACR (optional, ₹400/month)
- [ ] Enable Azure Blob Storage soft delete (already configured in Bicep — verify in portal)
- [ ] Review Supabase RLS policies before going live with real user data
- [ ] Set up Cloudflare WAF rules for the API subdomain (free plan supports basic rules)
- [ ] Rotate all secrets at 90-day intervals (Azure Key Vault rotation policy)
