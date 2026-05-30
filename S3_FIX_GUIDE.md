# 🔍 S3 UPLOAD ISSUE - ROOT CAUSE ANALYSIS & FIX

## Problem Summary
**Error:** `POST /api/v1/uploads/opportunity/.../media?is_cover=true` returns **500 Internal Server Error**
**Root Cause:** Invalid S3 credentials + Missing endpoint configuration

---

## Diagnostic Results

### ❌ Critical Issues Found:

1. **S3_ENDPOINT_URL is NOT SET**
   - Currently using AWS default (us-east-1)
   - Should be using Cloudflare R2 endpoint
   - Causes boto3 to try AWS S3 instead of R2

2. **S3_PUBLIC_URL is MISSING**
   - No public URL configured for CDN
   - Fallback to AWS S3 URL format won't work with R2

3. **InvalidAccessKeyId Error**
   - Credentials don't match the endpoint
   - R2 credentials being sent to AWS S3 endpoint

4. **403 Access Denied** on both buckets
   - KYC_S3_ENDPOINT_URL is set correctly to Azure Blob
   - But credentials may not have permission

---

## Required Fixes

### Step 1: Get Cloudflare R2 Endpoint

```bash
# In Cloudflare Dashboard → R2 → Overview
# Copy your Account ID and construct endpoint:
# https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### Step 2: Update Container App Environment Variables

```bash
az containerapp update \
  -n wealthspot-api \
  -g rg-wealthspot-prod \
  --set-env-vars \
    S3_ENDPOINT_URL="https://<ACCOUNT_ID>.r2.cloudflarestorage.com" \
    S3_PUBLIC_URL="https://media.wealthspot.in" \
    AWS_REGION="auto"
```

### Step 3: Verify Credentials in Key Vault

```bash
az keyvault secret show --vault-name "wealthspot-kv-prod" --name "aws-access-key-id"
az keyvault secret show --vault-name "wealthspot-kv-prod" --name "aws-secret-access-key"
```

Expected values:
- `AWS_ACCESS_KEY_ID`: Should be R2 access key (24 chars)
- `AWS_SECRET_ACCESS_KEY`: Should be R2 secret key (24 chars)
- `AWS_S3_BUCKET`: Should be "wealthspot-media-prod"

### Step 4: Verify KYC Storage Credentials

```bash
az keyvault secret show --vault-name "wealthspot-kv-prod" --name "kyc-access-key-id"
az keyvault secret show --vault-name "wealthspot-kv-prod" --name "kyc-secret-access-key"
```

Expected:
- `KYC_AWS_ACCESS_KEY_ID`: Azure storage account name
- `KYC_AWS_SECRET_ACCESS_KEY`: Azure storage account key (base64)

### Step 5: Restart Container App

```bash
az containerapp restart \
  -n wealthspot-api \
  -g rg-wealthspot-prod
```

---

## Configuration Validation

After applying fixes, run diagnostic again:

```bash
cd services/api
python test_s3_diagnostic.py
```

Expected output:
```
✅ S3_ENDPOINT_URL                          OK              Value: https://xxx.r2.cloudflarestorage.com
✅ S3_PUBLIC_URL                            OK              Value: https://media.wealthspot.in
✅ Media Bucket Access                      OK              HTTP 200
✅ Media Upload                             OK              Successfully uploaded test file
```

---

## Environment Variables Checklist

### Media S3 (Cloudflare R2)
- [ ] `AWS_ACCESS_KEY_ID` = R2 access key
- [ ] `AWS_SECRET_ACCESS_KEY` = R2 secret key  
- [ ] `AWS_S3_BUCKET` = "wealthspot-media-prod"
- [ ] `S3_ENDPOINT_URL` = "https://<ID>.r2.cloudflarestorage.com"
- [ ] `S3_PUBLIC_URL` = "https://media.wealthspot.in"
- [ ] `AWS_REGION` = "auto"

### KYC Storage (Azure Blob)
- [ ] `KYC_AWS_ACCESS_KEY_ID` = Storage account name
- [ ] `KYC_AWS_SECRET_ACCESS_KEY` = Storage account key (base64)
- [ ] `KYC_AWS_S3_BUCKET` = "kyc-documents-prod"
- [ ] `KYC_S3_ENDPOINT_URL` = "https://wealthspotkycprod.blob.core.windows.net"

---

## Testing the Fix

After deployment, test with curl:

```bash
# Test API health
curl https://api.wealthspot.in/health

# Attempt upload (requires auth token)
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@test.jpg" \
  https://api.wealthspot.in/api/v1/uploads/opportunity/<ID>/media?is_cover=true
```

Expected response:
```json
[
  {
    "id": "uuid...",
    "media_type": "image",
    "url": "https://media.wealthspot.in/opportunities/...",
    "filename": "test.jpg",
    "is_cover": true
  }
]
```

---

## Why This Was Failing

1. **Without S3_ENDPOINT_URL set**: boto3 tries to connect to AWS S3 (us-east-1)
2. **With R2 credentials**: AWS rejects them (InvalidAccessKeyId)
3. **With 403 errors**: R2 credentials don't work on AWS S3 endpoint
4. **Result**: Every upload attempt fails with 500 error

---

## Prevention

Add to deployment validation:
- [ ] Verify S3_ENDPOINT_URL is set and accessible
- [ ] Test credentials before container restart
- [ ] Run diagnostic script after each deployment
- [ ] Monitor upload failures in logs

