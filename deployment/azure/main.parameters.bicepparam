// ── WealthSpot Azure Infrastructure Parameters ────────────────────────────────
// Fill in r2EndpointUrl and r2Bucket before running 01-deploy-azure-infra.sh.
// Sensitive values (storage keys, API keys) go into Key Vault via
// 02-configure-secrets.sh — NOT in this file.
//
// Usage:
//   az deployment group create \
//     --resource-group rg-wealthspot-prod \
//     --template-file deployment/azure/main.bicep \
//     --parameters deployment/azure/main.parameters.bicepparam

using './main.bicep'

// ── Required: fill these before first deploy ──────────────────────────────────

// Your Cloudflare R2 endpoint. Find it in:
// Cloudflare Dashboard → R2 → wealthspot-media → Settings → S3 API
param r2EndpointUrl = 'https://33fb2c1e5523aeb4cf5971fd9e385a3e.r2.cloudflarestorage.com'

// ── Optional overrides (defaults are sensible for production) ─────────────────

// Short suffix for globally-unique resource names (2-6 chars, alphanumeric only)
param nameSuffix = 'prod'

// Azure region — Central India (cheapest India region with Container Apps)
param location = 'centralindia'

// Public URL for media files served via Cloudflare R2
// Using direct R2 URL — update to https://media.wealthspot.in once custom domain is configured in Cloudflare dashboard
param r2PublicUrl = 'https://media.wealthspot.in'

// Cloudflare R2 bucket name
param r2Bucket = 'wealthspot-media-prod'

// Alert email — receives critical API error notifications
param alertEmail = 'ops@wealthspot.in'

// Container image — defaults to a placeholder. GitHub Actions will update this
// after the first successful build via `az containerapp update --image`.
param containerImage = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
