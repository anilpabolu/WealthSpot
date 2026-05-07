# WealthSpot — Deployment Quick-Start

This directory contains all infrastructure-as-code, configuration templates, and runscripts
needed to deploy WealthSpot to the hybrid Azure + Cloudflare + Supabase stack.

## Architecture Overview

| Layer | Service | Region |
|---|---|---|
| Web frontend | Cloudflare Pages | Global CDN |
| API backend | Azure Container Apps | Central India |
| Container registry | Azure Container Registry (Basic) | Central India |
| Secret store | Azure Key Vault Standard | Central India |
| KYC documents | Azure Blob Storage (private) | Central India |
| Public media | Cloudflare R2 | Global |
| Database | Supabase Pro | Mumbai (ap-south-1) |
| Redis | Upstash Redis | Mumbai |
| Auth | Clerk | Global |
| Email | Resend | Global |
| Monitoring | Application Insights + Sentry | Central India / Global |
| Uptime | Better Stack | Global |

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) ≥ 2.60
- An active Azure subscription with Contributor access
- Bash shell (Linux, macOS, WSL on Windows, or Azure Cloud Shell)
- Accounts created for all third-party services (see `docs/manual_prod_steps.md`)

## First-Time Deployment (5 steps)

```bash
# 1. Login and set subscription
az login
az account set --subscription <your-subscription-id>

# 2. Create resource group
az group create --name rg-wealthspot-prod --location centralindia

# 3. Deploy Azure infrastructure (ACR, Key Vault, Blob, Container Apps, Monitoring)
./deployment/scripts/01-deploy-azure-infra.sh

# 4. Populate Key Vault secrets (interactive — prompts for each secret)
./deployment/scripts/02-configure-secrets.sh

# 5. Push to main branch — GitHub Actions will build, push, and deploy the API
#    Then manually trigger the migration workflow in GitHub Actions UI
```

After step 5, follow **steps 16–19** in `docs/manual_prod_steps.md` to configure custom
domains and Clerk webhooks.

## Directory Structure

```
deployment/
├── README.md                   ← You are here
├── config/
│   ├── dev.env.example         ← Template for local Docker Compose .env
│   └── prod.env.example        ← Complete production environment reference
├── azure/
│   ├── main.bicep              ← Top-level Bicep orchestrator
│   ├── main.parameters.bicepparam
│   └── modules/
│       ├── registry.bicep
│       ├── keyvault.bicep
│       ├── storage-kyc.bicep
│       ├── container-apps-env.bicep
│       ├── api-container-app.bicep
│       ├── monitoring.bicep
│       └── rbac.bicep
└── scripts/
    ├── 01-deploy-azure-infra.sh    ← Deploy all Azure resources
    ├── 02-configure-secrets.sh     ← Populate Key Vault + set up GitHub OIDC
    ├── 03-run-migrations.sh        ← Run Alembic migrations via Container Apps Job
    └── 04-validate.sh              ← Smoke-test all endpoints and services
```

## Re-deploying

The GitHub Actions workflows in `.github/workflows/` handle ongoing deployments automatically:

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy-api.yml` | Push to `main` (API/infra changes) | Build image → push to ACR → update Container App |
| `deploy-web.yml` | Push to `main` (web/packages changes) | Build Vite SPA → deploy to Cloudflare Pages |
| `run-migrations.yml` | Manual only | Run `alembic upgrade head` as a Container Apps Job |

## Cost Summary (MVP)

| Service | Monthly (₹) |
|---|---|
| Azure (Container Apps + ACR + KV + Blob + App Insights) | ₹3,700–₹5,500 |
| Supabase Pro | ₹2,100 |
| Upstash Redis | ₹0–₹400 |
| Cloudflare (Pages + R2) | ₹0–₹130 |
| All other third-party (Clerk/Resend/Sentry/Better Stack) | ₹0 (free tiers) |
| **Total** | **₹5,800–₹8,130** |

See `docs/HYBRID_DEPLOYMENT_PLAN.md` for full cost breakdown and upgrade triggers.
