#!/usr/bin/env bash
# ── 04-validate.sh ────────────────────────────────────────────────────────────
# Smoke-tests the WealthSpot deployment end-to-end.
# Checks API health, CORS, ACR connectivity, Key Vault, and storage.
#
# Usage:
#   chmod +x deployment/scripts/04-validate.sh
#   ./deployment/scripts/04-validate.sh
#   # Or against a specific host:
#   API_HOST=https://api.wealthspot.in ./deployment/scripts/04-validate.sh

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
pass() { echo -e "  ${GREEN}✔ PASS${NC}  $*"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✖ FAIL${NC}  $*"; FAIL=$((FAIL+1)); }
info() { echo -e "${YELLOW}▶ $*${NC}"; }

PASS=0; FAIL=0

# ── Load infra outputs ─────────────────────────────────────────────────────────
OUTPUTS_FILE="$(dirname "$0")/../../.azure/infra-outputs.env"
if [[ -f "$OUTPUTS_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$OUTPUTS_FILE"
fi

API_HOST="${API_HOST:-https://api.wealthspot.in}"
WEB_HOST="${WEB_HOST:-https://app.wealthspot.in}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  WealthSpot Deployment Smoke Test"
echo "  API: $API_HOST"
echo "  Web: $WEB_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. API Liveness ────────────────────────────────────────────────────────────
info "API Health Checks"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$API_HOST/live" || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
  BODY=$(curl -s --max-time 10 "$API_HOST/live")
  pass "/live → 200  ($BODY)"
else
  fail "/live → $HTTP_CODE (expected 200)"
fi

# ── 2. API Readiness ───────────────────────────────────────────────────────────
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$API_HOST/ready" || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
  BODY=$(curl -s --max-time 15 "$API_HOST/ready")
  DB_OK=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('db','?'))" 2>/dev/null || echo "?")
  REDIS_OK=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('redis','?'))" 2>/dev/null || echo "?")
  pass "/ready → 200  (db=$DB_OK, redis=$REDIS_OK)"
else
  fail "/ready → $HTTP_CODE (expected 200)"
fi

# ── 3. API Deep Health ────────────────────────────────────────────────────────
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$API_HOST/health" || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
  BODY=$(curl -s --max-time 15 "$API_HOST/health")
  MIG=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('migration_head','?'))" 2>/dev/null || echo "?")
  pass "/health → 200  (migration_head=$MIG)"
else
  fail "/health → $HTTP_CODE (expected 200)"
fi

# ── 4. CORS header check ──────────────────────────────────────────────────────
echo ""
info "CORS Check"
CORS_HEADER=$(curl -s -I --max-time 10 \
  -H "Origin: https://app.wealthspot.in" \
  "$API_HOST/live" 2>/dev/null | grep -i "access-control-allow-origin" | tr -d '\r' || echo "")
if echo "$CORS_HEADER" | grep -q "app.wealthspot.in\|*"; then
  pass "CORS origin header present: $CORS_HEADER"
else
  fail "CORS origin header missing. Got: '$CORS_HEADER'"
fi

# ── 5. Web frontend ───────────────────────────────────────────────────────────
echo ""
info "Web Frontend"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$WEB_HOST" || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
  pass "Cloudflare Pages → 200"
else
  fail "Cloudflare Pages → $HTTP_CODE (expected 200)"
fi

# ── 6. Azure resources (requires az login) ────────────────────────────────────
echo ""
info "Azure Resources"
if command -v az >/dev/null 2>&1 && az account show >/dev/null 2>&1; then
  # ACR
  if [[ -n "${ACR_NAME:-}" ]]; then
    ACR_STATUS=$(az acr show --name "$ACR_NAME" --resource-group "${RESOURCE_GROUP:-rg-wealthspot-prod}" --query "provisioningState" -o tsv 2>/dev/null || echo "Error")
    [[ "$ACR_STATUS" == "Succeeded" ]] && pass "ACR $ACR_NAME → $ACR_STATUS" || fail "ACR $ACR_NAME → $ACR_STATUS"
  fi

  # Key Vault
  if [[ -n "${KV_NAME:-}" ]]; then
    KV_STATUS=$(az keyvault show --name "$KV_NAME" --resource-group "${RESOURCE_GROUP:-rg-wealthspot-prod}" --query "properties.provisioningState" -o tsv 2>/dev/null || echo "Error")
    [[ "$KV_STATUS" == "Succeeded" ]] && pass "Key Vault $KV_NAME → $KV_STATUS" || fail "Key Vault $KV_NAME → $KV_STATUS"
    # Secret count
    SECRET_COUNT=$(az keyvault secret list --vault-name "$KV_NAME" --query "length(@)" -o tsv 2>/dev/null || echo "0")
    [[ "$SECRET_COUNT" -ge 15 ]] && pass "Key Vault secrets → $SECRET_COUNT secrets populated" || fail "Key Vault secrets → only $SECRET_COUNT (expected ≥15)"
  fi

  # Storage Account
  if [[ -n "${STORAGE_ACCOUNT:-}" ]]; then
    SA_STATUS=$(az storage account show --name "$STORAGE_ACCOUNT" --resource-group "${RESOURCE_GROUP:-rg-wealthspot-prod}" --query "provisioningState" -o tsv 2>/dev/null || echo "Error")
    [[ "$SA_STATUS" == "Succeeded" ]] && pass "KYC Storage $STORAGE_ACCOUNT → $SA_STATUS" || fail "KYC Storage $STORAGE_ACCOUNT → $SA_STATUS"
  fi

  # Container App
  if [[ -n "${CONTAINER_APP_NAME:-}" ]]; then
    CA_STATUS=$(az containerapp show --name "$CONTAINER_APP_NAME" --resource-group "${RESOURCE_GROUP:-rg-wealthspot-prod}" --query "properties.runningStatus" -o tsv 2>/dev/null || echo "Error")
    [[ "$CA_STATUS" == "Running" ]] && pass "Container App $CONTAINER_APP_NAME → $CA_STATUS" || fail "Container App $CONTAINER_APP_NAME → $CA_STATUS"
  fi
else
  echo -e "  ${CYAN}ℹ Skipping Azure resource checks (az not logged in)${NC}"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS+FAIL))
echo -e "  Results: ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC} / $TOTAL total"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}Deployment has issues. Review the FAIL items above.${NC}"
  exit 1
else
  echo -e "${GREEN}All checks passed. WealthSpot is healthy!${NC}"
fi
