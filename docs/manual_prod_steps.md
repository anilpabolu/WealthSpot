# WealthSpot — Manual Production Steps (DIY Guide)

This is a step-by-step guide for deploying WealthSpot to production for the first time.  
Each step is ordered and includes **exactly what to do, where to click, and what to copy**.  
No step assumes prior cloud experience — every field name and menu path is explicit.

**Time estimate:** 2–4 hours for a complete first deployment.

**Prerequisites before you start:**
- Git repository with push access to `main`
- Linux/macOS terminal OR Windows Subsystem for Linux (WSL2)
- Azure CLI installed: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
- Node.js 20+ installed
- A credit card (for Azure account and third-party services that require one for verification)

---

## Quick Navigation

| # | Step | Time |
|---|---|---|
| 1 | [Create Azure Account and Subscription](#step-1-create-azure-account-and-subscription) | 15 min |
| 2 | [Log in to Azure CLI](#step-2-log-in-to-azure-cli) | 5 min |
| 3 | [Create the Resource Group](#step-3-create-the-resource-group) | 1 min |
| 4 | [Create Supabase Database (Mumbai)](#step-4-create-supabase-database-mumbai) | 10 min |
| 5 | [Create Upstash Redis (Mumbai)](#step-5-create-upstash-redis-mumbai) | 5 min |
| 6 | [Create Cloudflare Account + R2 Bucket](#step-6-create-cloudflare-account--r2-bucket) | 15 min |
| 7 | [Create Cloudflare Pages Project](#step-7-create-cloudflare-pages-project) | 10 min |
| 8 | [Configure Custom Domain on Cloudflare Pages](#step-8-configure-custom-domain-on-cloudflare-pages) | 10 min |
| 9 | [Set Up Resend for Email](#step-9-set-up-resend-for-email) | 10 min |
| 10 | [Set Up Sentry](#step-10-set-up-sentry) | 5 min |
| 11 | [Set Up Better Stack Uptime Monitor](#step-11-set-up-better-stack-uptime-monitor) | 5 min |
| 12 | [Edit the Bicep Parameters File](#step-12-edit-the-bicep-parameters-file) | 5 min |
| 13 | [Deploy Azure Infrastructure](#step-13-deploy-azure-infrastructure) | 10 min |
| 14 | [Populate Key Vault Secrets + GitHub OIDC](#step-14-populate-key-vault-secrets--github-oidc) | 20 min |
| 15 | [Add GitHub Actions Secrets](#step-15-add-github-actions-secrets) | 10 min |
| 16 | [Trigger First Deployment](#step-16-trigger-first-deployment) | 5 min |
| 17 | [Run Database Migrations](#step-17-run-database-migrations) | 5 min |
| 18 | [Configure Custom Domains on Azure](#step-18-configure-custom-domains-on-azure) | 10 min |
| 19 | [Configure Clerk for Production](#step-19-configure-clerk-for-production) | 10 min |
| 20 | [Run Final Validation](#step-20-run-final-validation) | 10 min |

---

## Step 1: Create Azure Account and Subscription

1. Go to https://azure.microsoft.com/en-in/free
2. Click **Start free** and sign in with your Microsoft/GitHub account.
3. Fill in the billing information. Azure gives you ₹13,500 free credits for 30 days.
4. Once signed in, go to https://portal.azure.com
5. In the search bar, type **Subscriptions** and open it.
6. You should see a subscription listed (e.g., "Azure subscription 1" or "Pay-As-You-Go").
7. Copy the **Subscription ID** (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
   - Save this — you will need it in Step 2.

> **Billing Note:** Select Pay-As-You-Go when prompted. Do NOT buy any reserved instances now. See `docs/final_deployment.md` for when reservations make sense.

---

## Step 2: Log In to Azure CLI

Open a terminal:

```bash
# Login to Azure (opens browser)
az login

# Set your subscription (replace with your Subscription ID from Step 1)
az account set --subscription "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Verify it worked
az account show --query "{name:name, subscriptionId:id, state:state}"
# Should print your subscription name and state: "Enabled"
```

> If `az login` says the browser cannot open, use: `az login --use-device-code`

---

## Step 3: Create the Resource Group

This command creates the Azure resource group that will hold all WealthSpot Azure resources:

```bash
az group create \
  --name rg-wealthspot-prod \
  --location centralindia

# Should output: "provisioningState": "Succeeded"
```

---

## Step 4: Create Supabase Database (Mumbai)

1. Go to https://supabase.com and click **Start your project** (free signup with GitHub).
2. Click **New project**.
3. Fill in:
   - **Name:** `wealthspot-prod`
   - **Database Password:** Generate a strong password and save it (you will not see it again).
   - **Region:** **South Asia (Mumbai)** — this is critical for India data residency.
   - **Pricing Plan:** Pro ($25/month) — required for PITR backups and performance.
4. Click **Create new project** and wait for it to initialize (2–3 minutes).
5. Once ready, go to **Settings** (gear icon in left sidebar) → **Database**.
6. Scroll to **Connection string** → select **URI** tab.
7. Switch the tab from **Direct connection** to **Transaction pooler** (uses port 6543).
8. Copy the URI — it looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
   Replace `[PASSWORD]` with the password you set in step 3.
9. Save this as **DATABASE_URL** — you will need it in Step 14.

> **Why Transaction pooler?** The API uses async SQLAlchemy with connection pooling. The transaction pooler (PgBouncer) works correctly with async drivers like asyncpg. The direct connection string (port 5432) has connection limits that will be hit under load.

---

## Step 5: Create Upstash Redis (Mumbai)

1. Go to https://upstash.com and sign up (GitHub login works).
2. Click **Create Database**.
3. Fill in:
   - **Name:** `wealthspot-prod`
   - **Type:** Regional
   - **Region:** `AP-SOUTH-1` (Mumbai, AWS — this pairs with Supabase)
   - **Enable TLS:** Yes (required)
4. Click **Create**.
5. On the database details page, scroll to **REST API** section.
6. Click the **Redis** tab (not REST).
7. Copy the **Endpoint** URL — looks like:
   ```
   rediss://default:AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxAA@ap-south-1-redis.upstash.io:6379
   ```
8. Save this as **REDIS_URL**.
9. For **CELERY_BROKER_URL**: use the same URL but append `/1` at the end:
   ```
   rediss://default:AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxAA@ap-south-1-redis.upstash.io:6379/1
   ```

---

## Step 6: Create Cloudflare Account + R2 Bucket

### Create Account

1. Go to https://cloudflare.com → **Sign up** (free).
2. Complete email verification.

### Create R2 Bucket

1. In the Cloudflare dashboard, click **R2 Object Storage** in the left sidebar.
2. Click **Create bucket**.
3. Fill in:
   - **Bucket name:** `wealthspot-media`
   - **Location:** Automatic (Cloudflare picks the closest region)
4. Click **Create bucket**.

### Get R2 API Credentials

1. In R2 → Overview, click **Manage R2 API tokens**.
2. Click **Create API token**.
3. Fill in:
   - **Token name:** `wealthspot-api`
   - **Permissions:** Object Read & Write
   - **Specify bucket:** `wealthspot-media`
4. Click **Create API token**.
5. Copy the following (shown only once):
   - **Access Key ID** → save as **AWS_ACCESS_KEY_ID**
   - **Secret Access Key** → save as **AWS_SECRET_ACCESS_KEY**
6. Back on the R2 Overview page, copy your **Account ID** from the top right.
7. Your R2 endpoint URL is: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - Save this as **S3_ENDPOINT_URL**
   - Save Account ID separately — you'll need it for GitHub secrets.

### Configure Custom Domain for Media Bucket

1. In R2 → `wealthspot-media` bucket → **Settings** → **Custom Domains**.
2. Click **Connect Domain**.
3. Enter: `media.wealthspot.in`
4. Add the CNAME record that Cloudflare shows to your DNS provider.
   - If your domain is also on Cloudflare, this is automatic.
5. Save `https://media.wealthspot.in` as **S3_PUBLIC_URL**.

---

## Step 7: Create Cloudflare Pages Project

1. In Cloudflare dashboard → **Pages** → **Create a project**.
2. Click **Connect to Git**.
3. Authorize Cloudflare to access your GitHub account.
4. Select the **WealthSpot** repository.
5. Fill in:
   - **Project name:** `wealthspot-web` — **exactly this, lowercase**
   - **Production branch:** `main`
   - **Build command:** `npm run build:web` (or leave blank — the GitHub Action will deploy, not Cloudflare's auto-build)
   - **Build output directory:** `apps/web/dist`
6. Click **Save and Deploy** (the initial auto-build will likely fail — that's OK, the GitHub Action will deploy later).

> **Note:** The GitHub Actions workflow (`deploy-web.yml`) handles actual builds and deploys. Cloudflare Pages' auto-build is disabled by the workflow. You just need the project to exist.

---

## Step 8: Configure Custom Domain on Cloudflare Pages

1. In Cloudflare Pages → `wealthspot-web` project → **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter: `app.wealthspot.in`
4. Cloudflare will automatically add the required DNS records if your domain's DNS is on Cloudflare.
   - If DNS is elsewhere, add the CNAME record pointing `app` → `wealthspot-web.pages.dev`.
5. Wait for SSL certificate provisioning (usually takes 1–5 minutes).

---

## Step 9: Set Up Resend for Email

1. Go to https://resend.com → **Sign up**.
2. After sign-in, click **Add Domain** in the left sidebar.
3. Enter your domain: `wealthspot.in`
4. Resend will show DNS records to add (SPF, DKIM, DMARC). Add them to your DNS provider.
5. Once verified (green checkmark), go to **API Keys** → **Create API key**.
6. Fill in:
   - **Name:** `wealthspot-prod`
   - **Permission:** Full access
7. Copy the API key (starts with `re_`).
8. Save as **SMTP_PASSWORD**.
9. Your SMTP settings are:
   - `SMTP_HOST=smtp.resend.com`
   - `SMTP_PORT=587`
   - `SMTP_USERNAME=resend`
   - `SMTP_FROM_EMAIL=noreply@wealthspot.in`

---

## Step 10: Set Up Sentry

1. Go to https://sentry.io → **Sign up** (free).
2. Click **Create Project**.
3. Select **Python** as the platform.
4. Fill in:
   - **Project name:** `wealthspot-api`
   - **Team:** your default team
5. Click **Create Project**.
6. Copy the **DSN** shown on the next page — looks like:
   ```
   https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
   ```
7. Save as **SENTRY_DSN**.

---

## Step 11: Set Up Better Stack Uptime Monitor

1. Go to https://betterstack.com → **Uptime** → **Sign up** (free).
2. Click **Add Monitor**.
3. Fill in:
   - **URL:** `https://api.wealthspot.in/live`
   - **Monitor name:** `WealthSpot API`
   - **Check interval:** 3 minutes
   - **Locations:** Select India (if available) + one other
4. Click **Create Monitor**.
5. (Optional) Add a second monitor for `https://app.wealthspot.in`.
6. Set up alert notifications to your email.

---

## Step 12: Edit the Bicep Parameters File

Open `deployment/azure/main.parameters.bicepparam` in your editor:

```bicep
using 'main.bicep'

param nameSuffix = 'prod'
param location = 'centralindia'
param r2EndpointUrl = 'https://REPLACE_WITH_YOUR_ACCOUNT_ID.r2.cloudflarestorage.com'  // ← EDIT THIS
param r2PublicUrl = 'https://media.wealthspot.in'
param r2Bucket = 'wealthspot-media'
param containerImage = 'wealthspotcrprod.azurecr.io/wealthspot-api:latest'
param alertEmail = 'ops@wealthspot.in'  // ← Change to your ops email
```

**What to change:**
1. Replace `REPLACE_WITH_YOUR_ACCOUNT_ID` with your Cloudflare Account ID from Step 6.
2. Change `ops@wealthspot.in` to the email address where you want Azure alerts sent.
3. Save the file.

---

## Step 13: Deploy Azure Infrastructure

Make the script executable and run it:

```bash
chmod +x deployment/scripts/*.sh
./deployment/scripts/01-deploy-azure-infra.sh
```

This script will:
1. Check that you are logged in and the resource group exists
2. Validate the Bicep template
3. Deploy all Azure resources (takes 3–6 minutes)
4. Print a summary table of all created resources
5. Save outputs to `.azure/infra-outputs.env` for use by the next script

**Expected output at the end:**
```
✅ DEPLOYMENT COMPLETE
─────────────────────────────────────────────────────────
Container App FQDN:     wealthspot-api.gentlewater-xxxxx.centralindia.azurecontainerapps.io
ACR Login Server:       wealthspotcrprod.azurecr.io
Key Vault URI:          https://wealthspot-kv-prod.vault.azure.net/
Storage Account:        wealthspotkycprod
App Insights:           ai-wealthspot-prod
Managed Identity:       id-wealthspot-api
─────────────────────────────────────────────────────────
Outputs saved to .azure/infra-outputs.env
```

If the script fails, read the error message — common causes:
- `az login` session expired → run `az login` again
- Resource name already taken → the names are unique; this is unlikely but possible
- Quota exceeded → contact Azure Support to increase vCPU quotas in centralindia

---

## Step 14: Populate Key Vault Secrets + GitHub OIDC

Run the second script:

```bash
./deployment/scripts/02-configure-secrets.sh
```

This script will prompt you **interactively** for each secret. Have these values ready from previous steps:

| Prompt | Value Source |
|---|---|
| Database URL | Step 4: Supabase transaction pooler URI |
| JWT secret key | Generate: `python3 -c "import secrets; print(secrets.token_urlsafe(64))"` |
| Encryption key | Generate: `python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| Clerk webhook secret | Clerk Dashboard → Webhooks → signing secret |
| Clerk API key | Clerk Dashboard → API Keys → Secret key (sk_live_...) |
| Redis URL | Step 5: Upstash rediss:// URL |
| Celery broker URL | Step 5: Upstash URL + `/1` |
| R2 Access Key ID | Step 6: Cloudflare R2 API token access key |
| R2 Secret Access Key | Step 6: Cloudflare R2 API token secret key |
| KYC storage key | Script fetches this automatically from Azure |
| Razorpay Key ID | Razorpay Dashboard → Settings → API Keys → Key ID |
| Razorpay Key Secret | Razorpay Dashboard → Settings → API Keys → Key Secret |
| Sentry DSN | Step 10 |
| SMTP password | Step 9: Resend API key (re_...) |
| Twilio Account SID | Twilio Console → Account Info (AC...) |
| Twilio Auth Token | Twilio Console → Account Info |

At the end, the script will:
1. Create a GitHub Service Principal named `sp-wealthspot-github-actions`
2. Assign it the required roles (Contributor, AcrPush, Key Vault Secrets User)
3. Create an OIDC federated credential for the `main` branch
4. Print a table of **13 values you must add as GitHub Actions secrets**

> **IMPORTANT:** Copy the entire output table before closing the terminal. These values are shown once.

---

## Step 15: Add GitHub Actions Secrets

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** for each of the following:

### Azure Secrets (from 02-configure-secrets.sh output)

| Secret Name | Value |
|---|---|
| `AZURE_CLIENT_ID` | From script output |
| `AZURE_TENANT_ID` | From script output |
| `AZURE_SUBSCRIPTION_ID` | Your subscription ID (from Step 1) |
| `ACR_LOGIN_SERVER` | `wealthspotcrprod.azurecr.io` |
| `CONTAINER_APP_NAME` | `wealthspot-api` |
| `RESOURCE_GROUP` | `rg-wealthspot-prod` |
| `KV_NAME` | `wealthspot-kv-prod` |

### Cloudflare Secrets

| Secret Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Pages" template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → top right → your Account ID |
| `CF_PAGES_PROJECT_NAME` | `wealthspot-web` |

### Frontend Build Variables (NOT sensitive but stored as secrets for consistency)

| Secret Name | Value |
|---|---|
| `VITE_API_URL` | `https://api.wealthspot.in` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys → Publishable key (pk_live_...) |
| `VITE_SENTRY_DSN` | Same Sentry DSN from Step 10 |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys → Key ID |

### Create Cloudflare API Token (for Pages deploy)

1. Go to https://dash.cloudflare.com → **My Profile** → **API Tokens** → **Create Token**.
2. Click **Use template** next to **"Edit Cloudflare Pages"**.
3. Keep defaults and click **Continue to summary** → **Create Token**.
4. Copy the token and add as `CLOUDFLARE_API_TOKEN`.

---

## Step 16: Trigger First Deployment

### Option A: Push a commit (automatic)

```bash
# Make a small change (e.g., update a comment in services/api/app/main.py)
git add -A
git commit -m "chore: trigger first production deployment"
git push origin main
```

This will trigger:
- `deploy-api.yml` (detects changes in `services/api/**`)
- `deploy-web.yml` (the workflow_dispatch can also trigger it manually)

### Option B: Manual trigger

1. Go to GitHub repository → **Actions** tab.
2. Click **Deploy API to Azure Container Apps** → **Run workflow** → **Run workflow**.
3. Click **Deploy Web to Cloudflare Pages** → **Run workflow** → **Run workflow**.

### Monitor the deployment

1. In GitHub Actions, click into the running workflow.
2. The **build** job runs first (~3 minutes for API via ACR build).
3. The **deploy** job runs after build succeeds.
4. If either step fails, click the failed step to see the error logs.

**Common first-time failures:**
- `az acr build` fails: Verify `ACR_LOGIN_SERVER` secret is correct and OIDC login succeeded
- `az containerapp update` fails: Verify the Container App was created in Step 13
- Cloudflare Pages deploy fails: Verify `CLOUDFLARE_API_TOKEN` has edit Pages permissions

---

## Step 17: Run Database Migrations

> **Always run this AFTER the API image is deployed.**

1. Go to GitHub repository → **Actions** tab.
2. Click **Run Database Migrations** in the left sidebar.
3. Click **Run workflow** (top right).
4. Fill in:
   - **Type 'migrate' to confirm:** `migrate`
   - **Dry run:** leave unchecked
5. Click **Run workflow**.
6. Watch the logs — the migration job will:
   - Create a Container Apps Job
   - Run `alembic upgrade head` inside the API container
   - Print all applied migration IDs
   - Delete the job after completion
7. Expected completion time: 30–90 seconds.

**If migrations fail:**
- Check the Container Apps Job logs in the Azure Portal for the actual Python traceback
- Most common cause: incorrect `DATABASE_URL` in Key Vault (wrong password or connection string format)
- Fix the Key Vault secret: `az keyvault secret set --vault-name wealthspot-kv-prod --name database-url --value "postgresql://..."`
- Then re-run the migration workflow

---

## Step 18: Configure Custom Domains on Azure

### Add api.wealthspot.in to Container App

1. Go to https://portal.azure.com → search **Container Apps** → click `wealthspot-api`.
2. In the left sidebar, click **Custom domains**.
3. Click **Add custom domain**.
4. Enter: `api.wealthspot.in`
5. Azure will show you a **TXT record** and a **CNAME record** to add to your DNS:
   - TXT record: for domain ownership verification
   - CNAME: `api.wealthspot.in` → `wealthspot-api.gentlewater-xxxxx.centralindia.azurecontainerapps.io`
6. Add both records to your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.).
7. Come back to Azure Portal and click **Validate** (may take 1–5 minutes for DNS propagation).
8. After validation, select **Managed Certificate** for free TLS.
9. Click **Add** to finalize.

> **If your DNS is on Cloudflare:** When adding the CNAME for `api.wealthspot.in`, set the Proxy Status to **DNS only** (grey cloud), NOT proxied. Azure manages the TLS certificate and needs direct DNS resolution.

---

## Step 19: Configure Clerk for Production

### Add Production Domain

1. Go to https://dashboard.clerk.com → select your application.
2. Click **Domains** in the left sidebar.
3. Click **Add domain**.
4. Enter: `app.wealthspot.in`
5. Follow any DNS verification steps Clerk requires.

### Update Allowed Origins

1. In Clerk Dashboard → **API Keys** → scroll to **Allowed origins**.
2. Add: `https://app.wealthspot.in`
3. Remove any localhost entries if they are not needed.

### Configure Webhook

1. In Clerk Dashboard → **Webhooks** → **Add endpoint**.
2. Fill in:
   - **Endpoint URL:** `https://api.wealthspot.in/api/v1/webhooks/clerk`
   - **Events:** Select all user events: `user.created`, `user.updated`, `user.deleted`
3. Click **Create**.
4. Copy the **Signing Secret** (starts with `whsec_`).
5. Update the Key Vault secret:
   ```bash
   az keyvault secret set \
     --vault-name wealthspot-kv-prod \
     --name clerk-webhook-secret \
     --value "whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   ```
6. Restart the Container App to pick up the new secret:
   ```bash
   az containerapp revision restart \
     --name wealthspot-api \
     --resource-group rg-wealthspot-prod \
     --revision $(az containerapp show \
       --name wealthspot-api \
       --resource-group rg-wealthspot-prod \
       --query "properties.latestRevisionName" -o tsv)
   ```

### Configure Razorpay Webhook (Production)

1. Go to https://dashboard.razorpay.com → **Settings** → **Webhooks**.
2. Click **Add New Webhook**.
3. Fill in:
   - **Webhook URL:** `https://api.wealthspot.in/api/v1/webhooks/razorpay`
   - **Secret:** Generate a new secret and save it. Add it to Key Vault as `razorpay-webhook-secret` if the app uses it.
   - **Events:** Enable: `payment.captured`, `payment.failed`, `order.paid`
4. Click **Save**.

---

## Step 20: Run Final Validation

Run the automated smoke test:

```bash
./deployment/scripts/04-validate.sh
```

Then manually verify each item in the checklist from `docs/final_deployment.md` § Post-Deploy Smoke Test Checklist.

### Verify Azure Portal

1. Portal → Container Apps → `wealthspot-api` → **Monitoring** → **Log stream** → confirm API is receiving requests.
2. Portal → Application Insights → `ai-wealthspot-prod` → **Live Metrics** → confirm requests appear.
3. Portal → Storage Accounts → `wealthspotkycprod` → **Containers** → `kyc-documents` → confirm container exists and is empty.

### Verify Cloudflare

1. Cloudflare Pages → `wealthspot-web` → **Deployments** → confirm latest deployment is **Success**.
2. Open `https://app.wealthspot.in` in an incognito window.
3. The app should load without console errors.

### Verify Better Stack

1. Better Stack → Uptime → `WealthSpot API` → Status should be **Up** (green).

---

## Troubleshooting Common Issues

### API container keeps restarting

```bash
# Check recent logs
az containerapp logs show \
  --name wealthspot-api \
  --resource-group rg-wealthspot-prod \
  --type console \
  --tail 100
```

Common causes:
- `DATABASE_URL` wrong in Key Vault (asyncpg can't connect to Supabase)
- `ENCRYPTION_KEY` not a valid Fernet key (run: `python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`)
- `KYC_S3_ENDPOINT_URL` empty (check Key Vault `kyc-secret-access-key`)

### GitHub Action fails at Azure login

```
Error: AADSTS700016: Application not found in the directory
```

Cause: The federated credential in the service principal was created for the wrong repo or branch.

Fix:
```bash
# Re-run the configure-secrets script to regenerate credentials
./deployment/scripts/02-configure-secrets.sh
```

### Vite build fails in deploy-web.yml

```
Error: Cannot find module '@wealthspot/types'
```

Cause: The `npm run build:packages` step failed or wasn't run first.

Fix: Check that `packages/wealthspot-types/package.json` has a `build` script, and that `turbo.json` includes it in the build pipeline.

### Cloudflare Pages shows a 1101 error

Cause: The `dist` folder is empty or the build output is in the wrong path.

Fix: The `apps/web/dist` directory must exist after the Vite build. Check the deploy-web.yml workflow logs to confirm the build step succeeded before the deploy step ran.

### Key Vault access denied from Container App

```
ERROR: Unable to get secret from Key Vault: Forbidden
```

Cause: The managed identity `id-wealthspot-api` doesn't have the `Key Vault Secrets User` role.

Fix:
```bash
# Get the managed identity object ID
IDENTITY_PRINCIPAL=$(az identity show \
  --name id-wealthspot-api \
  --resource-group rg-wealthspot-prod \
  --query principalId -o tsv)

# Get Key Vault resource ID
KV_ID=$(az keyvault show \
  --name wealthspot-kv-prod \
  --resource-group rg-wealthspot-prod \
  --query id -o tsv)

# Assign the missing role
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee "$IDENTITY_PRINCIPAL" \
  --scope "$KV_ID"
```

---

## All Generated Files Reference

| File | Purpose |
|---|---|
| [azure.yaml](../azure.yaml) | Azure Developer CLI config |
| [deployment/README.md](../deployment/README.md) | Quick-start guide |
| [deployment/config/dev.env.example](../deployment/config/dev.env.example) | Local dev env template |
| [deployment/config/prod.env.example](../deployment/config/prod.env.example) | Production env reference |
| [deployment/azure/main.bicep](../deployment/azure/main.bicep) | Azure infrastructure entry point |
| [deployment/azure/main.parameters.bicepparam](../deployment/azure/main.parameters.bicepparam) | Bicep parameters |
| [deployment/azure/modules/registry.bicep](../deployment/azure/modules/registry.bicep) | ACR |
| [deployment/azure/modules/keyvault.bicep](../deployment/azure/modules/keyvault.bicep) | Key Vault |
| [deployment/azure/modules/storage-kyc.bicep](../deployment/azure/modules/storage-kyc.bicep) | KYC Blob Storage |
| [deployment/azure/modules/container-apps-env.bicep](../deployment/azure/modules/container-apps-env.bicep) | Container Apps environment |
| [deployment/azure/modules/api-container-app.bicep](../deployment/azure/modules/api-container-app.bicep) | Container App |
| [deployment/azure/modules/monitoring.bicep](../deployment/azure/modules/monitoring.bicep) | App Insights + alerts |
| [deployment/azure/modules/rbac.bicep](../deployment/azure/modules/rbac.bicep) | Managed identity + roles |
| [deployment/scripts/01-deploy-azure-infra.sh](../deployment/scripts/01-deploy-azure-infra.sh) | Deploy Azure infra |
| [deployment/scripts/02-configure-secrets.sh](../deployment/scripts/02-configure-secrets.sh) | Populate KV + GitHub OIDC |
| [deployment/scripts/03-run-migrations.sh](../deployment/scripts/03-run-migrations.sh) | Run Alembic locally |
| [deployment/scripts/04-validate.sh](../deployment/scripts/04-validate.sh) | Smoke tests |
| [.github/workflows/deploy-api.yml](../.github/workflows/deploy-api.yml) | API CI/CD |
| [.github/workflows/deploy-web.yml](../.github/workflows/deploy-web.yml) | Web CI/CD |
| [.github/workflows/run-migrations.yml](../.github/workflows/run-migrations.yml) | Manual migrations |
| [docs/final_deployment.md](final_deployment.md) | Architecture + cost guide |
| [docs/manual_prod_steps.md](manual_prod_steps.md) | This file |

---

## Pending / Revisit Later

### ⚠️ Rotate Exposed Cloudflare API Tokens

Two Cloudflare API tokens were accidentally committed in plain text in `scripts/add_cf_pages_domain.py` and `scripts/add_dns_records.py` (commit `cfc4b9d`, "prod deployment 1"). They were squashed out of history on 2026-05-11, but anyone who had pulled/cloned before that rebase may still have the old values.

**Action required:**

1. Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Find and **revoke** the following tokens (identify by creation date ~2026-05-10):
   - Pages token (`cfut_EWK…`) — used in `add_cf_pages_domain.py`
   - Zone/DNS token (`cfut_zH3…`) — used in `add_cf_pages_domain.py` and `add_dns_records.py`
3. Create replacement tokens with the same permissions and store them securely (e.g., in Azure Key Vault or a local `.env` file that is gitignored).
4. Update any CI/CD secrets or local scripts that reference the old tokens.
