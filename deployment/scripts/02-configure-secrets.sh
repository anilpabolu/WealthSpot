#!/usr/bin/env bash
# ── 02-configure-secrets.sh ───────────────────────────────────────────────────
# Populates Azure Key Vault with all application secrets (interactive prompts).
# Also creates the GitHub Actions OIDC Service Principal and federated credential.
#
# Usage:
#   chmod +x deployment/scripts/02-configure-secrets.sh
#   ./deployment/scripts/02-configure-secrets.sh
#
# Prerequisites:
#   - 01-deploy-azure-infra.sh completed successfully (.azure/infra-outputs.env exists)
#   - All third-party accounts created (see docs/manual_prod_steps.md steps 4–10)
#   - Your GitHub org/username and repository name ready

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${YELLOW}▶ $*${NC}"; }
success() { echo -e "${GREEN}✔ $*${NC}"; }
prompt()  { echo -e "${CYAN}❓ $*${NC}"; }
error()   { echo -e "${RED}✖ $*${NC}" >&2; exit 1; }

# ── Load infra outputs ─────────────────────────────────────────────────────────
OUTPUTS_FILE="$(dirname "$0")/../../.azure/infra-outputs.env"
[[ -f "$OUTPUTS_FILE" ]] || error "infra-outputs.env not found. Run 01-deploy-azure-infra.sh first."
# shellcheck source=/dev/null
source "$OUTPUTS_FILE"
info "Loaded infra outputs. Key Vault: $KV_NAME"

# ── Helper: write secret to Key Vault ─────────────────────────────────────────
set_secret() {
  local secret_name="$1"
  local secret_value="$2"
  az keyvault secret set \
    --vault-name "$KV_NAME" \
    --name "$secret_name" \
    --value "$secret_value" \
    --output none
  success "Set $secret_name"
}

read_secret() {
  local prompt_text="$1"
  local var_name="$2"
  prompt "$prompt_text"
  read -r -s "$var_name"
  echo ""  # newline after hidden input
}

read_plain() {
  local prompt_text="$1"
  local var_name="$2"
  prompt "$prompt_text"
  read -r "$var_name"
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  WealthSpot — Key Vault Secret Configuration"
echo "  Have all values ready from docs/manual_prod_steps.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Database ──────────────────────────────────────────────────────────────────
info "--- Database (Supabase) ---"
read_secret "Supabase connection string (postgresql+asyncpg://...): " DB_URL
set_secret "database-url" "$DB_URL"

# ── Auth ──────────────────────────────────────────────────────────────────────
info "--- JWT ---"
read_secret "JWT Secret Key (64-char random string — generate with: python -c \"import secrets; print(secrets.token_urlsafe(64))\"): " JWT_KEY
set_secret "jwt-secret-key" "$JWT_KEY"

# ── Encryption ────────────────────────────────────────────────────────────────
info "--- Fernet Encryption Key ---"
read_secret "Fernet Encryption Key (generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"): " ENC_KEY
set_secret "encryption-key" "$ENC_KEY"

# ── Clerk ─────────────────────────────────────────────────────────────────────
info "--- Clerk ---"
read_secret "Clerk Webhook Secret (whsec_...): " CLERK_WH
set_secret "clerk-webhook-secret" "$CLERK_WH"
read_secret "Clerk API Key (sk_live_...): " CLERK_KEY
set_secret "clerk-api-key" "$CLERK_KEY"

# ── Redis ─────────────────────────────────────────────────────────────────────
info "--- Upstash Redis ---"
read_secret "Redis TLS URL (rediss://default:...@....upstash.io:6379): " REDIS
set_secret "redis-url" "$REDIS"
read_secret "Celery Broker URL (same host, append /1): " CELERY
set_secret "celery-broker-url" "$CELERY"

# ── Cloudflare R2 ─────────────────────────────────────────────────────────────
info "--- Cloudflare R2 (public media) ---"
read_secret "R2 Access Key ID: " R2_KEY_ID
set_secret "aws-access-key-id" "$R2_KEY_ID"
read_secret "R2 Secret Access Key: " R2_SECRET
set_secret "aws-secret-access-key" "$R2_SECRET"

# ── Azure KYC Storage ─────────────────────────────────────────────────────────
info "--- Azure Blob Storage (KYC documents) ---"
echo "  Storage account name: $STORAGE_ACCOUNT"
echo "  To get the key: Azure Portal → $STORAGE_ACCOUNT → Access keys → key1 → Show"
read_secret "Azure Storage Account Key (base64, ~88 chars): " AZ_STORAGE_KEY
set_secret "kyc-access-key-id"     "$STORAGE_ACCOUNT"
set_secret "kyc-secret-access-key" "$AZ_STORAGE_KEY"

# ── Razorpay ──────────────────────────────────────────────────────────────────
info "--- Razorpay ---"
read_secret "Razorpay Key ID (rzp_live_...): " RZP_KEY_ID
set_secret "razorpay-key-id" "$RZP_KEY_ID"
read_secret "Razorpay Key Secret: " RZP_SECRET
set_secret "razorpay-key-secret" "$RZP_SECRET"

# ── Sentry ────────────────────────────────────────────────────────────────────
info "--- Sentry ---"
read_secret "Sentry DSN (https://...@....ingest.sentry.io/...): " SENTRY
set_secret "sentry-dsn" "$SENTRY"

# ── Resend SMTP ───────────────────────────────────────────────────────────────
info "--- Resend (SMTP password = API key) ---"
read_secret "Resend API Key (re_...): " RESEND_KEY
set_secret "smtp-password" "$RESEND_KEY"

# ── Twilio ────────────────────────────────────────────────────────────────────
info "--- Twilio ---"
read_plain "Twilio Account SID (ACXXXXXXXX): " TWILIO_SID
read_secret "Twilio Auth Token: " TWILIO_TOKEN
set_secret "twilio-account-sid"  "$TWILIO_SID"
set_secret "twilio-auth-token"   "$TWILIO_TOKEN"

echo ""
success "All secrets written to Key Vault: $KV_NAME"

# ── GitHub Actions OIDC Service Principal setup ───────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GitHub Actions OIDC Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read_plain "GitHub org/username (e.g. yourorg or yourusername): " GH_ORG
read_plain "GitHub repository name (e.g. WealthSpot): " GH_REPO

SUBSCRIPTION=$(az account show --query id -o tsv)
TENANT=$(az account show --query tenantId -o tsv)
SP_NAME="sp-wealthspot-github-actions"

info "Creating Service Principal: $SP_NAME ..."
SP_JSON=$(az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role Contributor \
  --scopes "/subscriptions/$SUBSCRIPTION/resourceGroups/$RESOURCE_GROUP" \
  --output json)

CLIENT_ID=$(echo "$SP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['appId'])")

# Grant AcrPush role for image pushes
ACR_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv)
az role assignment create \
  --assignee "$CLIENT_ID" \
  --role AcrPush \
  --scope "$ACR_ID" \
  --output none
success "Granted AcrPush on ACR to Service Principal."

# Grant Key Vault Secrets Officer (to allow CI to verify secrets exist if needed)
KV_ID=$(az keyvault show --name "$KV_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv)
az role assignment create \
  --assignee "$CLIENT_ID" \
  --role "Key Vault Secrets User" \
  --scope "$KV_ID" \
  --output none
success "Granted Key Vault Secrets User to Service Principal."

# Create federated credential for main branch pushes
APP_OBJECT_ID=$(az ad sp show --id "$CLIENT_ID" --query appId -o tsv)
APP_OBJECT_ID=$(az ad app list --filter "appId eq '$CLIENT_ID'" --query "[0].id" -o tsv)

az ad app federated-credential create \
  --id "$APP_OBJECT_ID" \
  --parameters "{
    \"name\": \"github-main\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GH_ORG}/${GH_REPO}:ref:refs/heads/main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" \
  --output none
success "Created OIDC federated credential for main branch."

# Create federated credential for workflow_dispatch (manual triggers)
az ad app federated-credential create \
  --id "$APP_OBJECT_ID" \
  --parameters "{
    \"name\": \"github-workflow-dispatch\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GH_ORG}/${GH_REPO}:ref:refs/heads/main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" \
  --output none 2>/dev/null || true  # may already exist

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "GitHub OIDC configured. Add these GitHub Actions secrets:"
echo ""
printf "  %-35s %s\n" "Secret Name" "Value"
echo "  ─────────────────────────────────────────────────────────"
printf "  %-35s %s\n" "AZURE_CLIENT_ID"           "$CLIENT_ID"
printf "  %-35s %s\n" "AZURE_TENANT_ID"           "$TENANT"
printf "  %-35s %s\n" "AZURE_SUBSCRIPTION_ID"     "$SUBSCRIPTION"
printf "  %-35s %s\n" "ACR_LOGIN_SERVER"           "$ACR_LOGIN_SERVER"
printf "  %-35s %s\n" "CONTAINER_APP_NAME"         "$CONTAINER_APP_NAME"
printf "  %-35s %s\n" "RESOURCE_GROUP"             "$RESOURCE_GROUP"
printf "  %-35s %s\n" "KV_NAME"                   "$KV_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}For Cloudflare Pages secrets (set separately in GitHub):${NC}"
printf "  %-35s %s\n" "CLOUDFLARE_API_TOKEN"       "(from Cloudflare Dashboard → API Tokens)"
printf "  %-35s %s\n" "CLOUDFLARE_ACCOUNT_ID"      "(from Cloudflare Dashboard → Overview)"
printf "  %-35s %s\n" "CF_PAGES_PROJECT_NAME"      "wealthspot-web"
printf "  %-35s %s\n" "VITE_CLERK_PUBLISHABLE_KEY" "(from Clerk Dashboard → API Keys)"
printf "  %-35s %s\n" "VITE_API_URL"               "https://api.wealthspot.in"
printf "  %-35s %s\n" "VITE_SENTRY_DSN"            "(Sentry project DSN)"
printf "  %-35s %s\n" "VITE_RAZORPAY_KEY_ID"       "(rzp_live_... from Razorpay)"
echo ""
echo -e "${YELLOW}Next step: run ${GREEN}./deployment/scripts/03-run-migrations.sh${YELLOW} after the first API image is built.${NC}"
