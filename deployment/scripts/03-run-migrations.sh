#!/usr/bin/env bash
# ── 03-run-migrations.sh ──────────────────────────────────────────────────────
# Runs `alembic upgrade head` as a one-off Azure Container Apps Job.
# The job uses the same image as the running Container App, so it has the
# same code, config, and access to all Key Vault secrets.
#
# Usage:
#   chmod +x deployment/scripts/03-run-migrations.sh
#   ./deployment/scripts/03-run-migrations.sh [--image <full-image-ref>]
#
# The --image flag is optional; defaults to the image currently deployed
# in the wealthspot-api Container App.
#
# Prerequisites:
#   - az login && az account set
#   - .azure/infra-outputs.env exists (created by 01-deploy-azure-infra.sh)
#   - API image has been built and pushed to ACR at least once

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${YELLOW}▶ $*${NC}"; }
success() { echo -e "${GREEN}✔ $*${NC}"; }
error()   { echo -e "${RED}✖ $*${NC}" >&2; exit 1; }

# ── Load infra outputs ─────────────────────────────────────────────────────────
OUTPUTS_FILE="$(dirname "$0")/../../.azure/infra-outputs.env"
[[ -f "$OUTPUTS_FILE" ]] || error "infra-outputs.env not found. Run 01-deploy-azure-infra.sh first."
# shellcheck source=/dev/null
source "$OUTPUTS_FILE"

# ── Parse flags ───────────────────────────────────────────────────────────────
IMAGE_OVERRIDE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --image) IMAGE_OVERRIDE="$2"; shift 2 ;;
    *) error "Unknown argument: $1" ;;
  esac
done

# ── Determine image to use ────────────────────────────────────────────────────
if [[ -n "$IMAGE_OVERRIDE" ]]; then
  MIGRATION_IMAGE="$IMAGE_OVERRIDE"
else
  info "Fetching current image from Container App $CONTAINER_APP_NAME..."
  MIGRATION_IMAGE=$(az containerapp show \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.template.containers[0].image" \
    -o tsv)
fi
info "Using image: $MIGRATION_IMAGE"

# ── Create migration job name (unique per run) ────────────────────────────────
JOB_NAME="migrate-$(date +%Y%m%d-%H%M%S)"
CAE_ID=$(az containerapp env show \
  --name "cae-wealthspot-prod" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv 2>/dev/null || \
  az containerapp show \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.managedEnvironmentId" -o tsv)

IDENTITY_ID=$(az containerapp show \
  --name "$CONTAINER_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "identity.userAssignedIdentities | keys(@)[0]" -o tsv)

info "Creating Container Apps migration job: $JOB_NAME"
az containerapp job create \
  --name "$JOB_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CAE_ID" \
  --trigger-type Manual \
  --replica-timeout 300 \
  --replica-retry-limit 0 \
  --image "$MIGRATION_IMAGE" \
  --cpu "0.5" \
  --memory "1Gi" \
  --mi-user-assigned "$IDENTITY_ID" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-identity "$IDENTITY_ID" \
  --env-vars "APP_ENV=production" \
  --command "alembic" "upgrade" "head" \
  --output none
success "Job created."

# ── Start the job execution ───────────────────────────────────────────────────
info "Starting migration job execution..."
EXECUTION_NAME=$(az containerapp job start \
  --name "$JOB_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "name" -o tsv)
info "Execution: $EXECUTION_NAME"

# ── Poll until complete ────────────────────────────────────────────────────────
info "Waiting for migration to complete (timeout: 5 minutes)..."
TIMEOUT=300
ELAPSED=0
STATUS="Running"
while [[ "$STATUS" == "Running" || "$STATUS" == "Processing" ]]; do
  sleep 10
  ELAPSED=$((ELAPSED + 10))
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    az containerapp job delete --name "$JOB_NAME" --resource-group "$RESOURCE_GROUP" --yes --no-wait
    error "Migration timed out after ${TIMEOUT}s. Check logs in Azure Portal."
  fi
  STATUS=$(az containerapp job execution show \
    --name "$JOB_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --job-execution-name "$EXECUTION_NAME" \
    --query "properties.status" -o tsv 2>/dev/null || echo "Running")
  echo "  Status: $STATUS (${ELAPSED}s elapsed)"
done

# ── Stream logs from Log Analytics ────────────────────────────────────────────
info "Fetching migration output from logs..."
sleep 5  # Allow logs to flush
az containerapp job execution show \
  --name "$JOB_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --job-execution-name "$EXECUTION_NAME" \
  --output json | python3 -c "
import sys, json
data = json.load(sys.stdin)
status = data.get('properties', {}).get('status', 'Unknown')
print(f'Final status: {status}')
" || true

# ── Check success ─────────────────────────────────────────────────────────────
if [[ "$STATUS" == "Succeeded" ]]; then
  success "Migration completed successfully!"
else
  error "Migration failed with status: $STATUS. Check Azure Portal → Container Apps Jobs → $JOB_NAME for logs."
fi

# ── Cleanup ────────────────────────────────────────────────────────────────────
info "Cleaning up migration job..."
az containerapp job delete \
  --name "$JOB_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --yes \
  --output none
success "Job $JOB_NAME deleted."
echo ""
echo -e "${YELLOW}Next step: run ${GREEN}./deployment/scripts/04-validate.sh${YELLOW} to smoke-test the deployment.${NC}"
