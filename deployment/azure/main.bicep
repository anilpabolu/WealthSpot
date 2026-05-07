// ── WealthSpot — Azure Infrastructure Orchestrator ────────────────────────────
// Deploys all Azure resources for the WealthSpot hybrid deployment:
//   ACR → Key Vault → KYC Storage → Log Analytics + CAE → Monitoring → RBAC → Container App
//
// Usage:
//   az deployment group create \
//     --resource-group rg-wealthspot-prod \
//     --template-file deployment/azure/main.bicep \
//     --parameters deployment/azure/main.parameters.bicepparam

targetScope = 'resourceGroup'

@description('Short suffix appended to globally unique resource names (ACR, Key Vault, Storage).')
@minLength(2)
@maxLength(6)
param nameSuffix string = 'prod'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Cloudflare R2 S3-compatible endpoint URL.')
param r2EndpointUrl string

@description('Cloudflare R2 public URL for served media.')
param r2PublicUrl string = 'https://media.wealthspot.in'

@description('Cloudflare R2 bucket name for public media.')
param r2Bucket string = 'wealthspot-media'

@description('Container image to deploy. Set to helloworld placeholder until first CI/CD run.')
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Alert notification email address.')
param alertEmail string = 'admin@wealthspot.in'

// ── Derived resource names ────────────────────────────────────────────────────
var acrName           = 'wealthspotcr${nameSuffix}'   // e.g. wealthspotcrprod
var kvName            = 'wealthspot-kv-${nameSuffix}' // e.g. wealthspot-kv-prod
var storageKycName    = 'wealthspotkyc${nameSuffix}'  // e.g. wealthspotkycprod
var lawName           = 'law-wealthspot-${nameSuffix}'
var caeName           = 'cae-wealthspot-${nameSuffix}'
var appInsightsName   = 'ai-wealthspot-${nameSuffix}'
var containerAppName  = 'wealthspot-api'
var identityName      = 'id-wealthspot-api'

// ── Module: Container Registry ───────────────────────────────────────────────
module registry './modules/registry.bicep' = {
  name: 'deploy-registry'
  params: {
    name: acrName
    location: location
  }
}

// ── Module: Key Vault ─────────────────────────────────────────────────────────
module keyVault './modules/keyvault.bicep' = {
  name: 'deploy-keyvault'
  params: {
    name: kvName
    location: location
  }
}

// ── Module: KYC Document Storage ─────────────────────────────────────────────
module storageKyc './modules/storage-kyc.bicep' = {
  name: 'deploy-storage-kyc'
  params: {
    name: storageKycName
    location: location
  }
}

// ── Module: Container Apps Environment (depends on Log Analytics) ─────────────
module cae './modules/container-apps-env.bicep' = {
  name: 'deploy-cae'
  params: {
    lawName: lawName
    caeName: caeName
    location: location
  }
}

// ── Module: Application Insights + Alerts ────────────────────────────────────
module monitoring './modules/monitoring.bicep' = {
  name: 'deploy-monitoring'
  params: {
    appInsightsName: appInsightsName
    location: location
    logAnalyticsWorkspaceId: cae.outputs.lawId
    alertEmail: alertEmail
  }
}

// ── Module: Managed Identity + Role Assignments ──────────────────────────────
module rbac './modules/rbac.bicep' = {
  name: 'deploy-rbac'
  params: {
    identityName: identityName
    location: location
    acrId: registry.outputs.acrId
    kvId: keyVault.outputs.kvId
    storageId: storageKyc.outputs.storageId
  }
}

// ── Module: Container App ─────────────────────────────────────────────────────
module api './modules/api-container-app.bicep' = {
  name: 'deploy-api'
  params: {
    name: containerAppName
    location: location
    caeId: cae.outputs.caeId
    identityId: rbac.outputs.identityId
    identityClientId: rbac.outputs.identityClientId
    kvUri: keyVault.outputs.kvUri
    containerImage: containerImage
    appInsightsConnectionString: monitoring.outputs.connectionString
    s3EndpointUrl: r2EndpointUrl
    s3PublicUrl: r2PublicUrl
    s3Bucket: r2Bucket
    kycEndpointUrl: storageKyc.outputs.blobEndpoint
    acrLoginServer: registry.outputs.loginServer
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────
output acrLoginServer    string = registry.outputs.loginServer
output acrName           string = registry.outputs.acrName
output kvUri             string = keyVault.outputs.kvUri
output kvName            string = keyVault.outputs.kvName
output storageAccount    string = storageKyc.outputs.storageAccountName
output blobEndpoint      string = storageKyc.outputs.blobEndpoint
output containerAppFqdn  string = api.outputs.containerAppFqdn
output containerAppName  string = api.outputs.containerAppName
output identityClientId  string = rbac.outputs.identityClientId
output identityPrincipalId string = rbac.outputs.identityPrincipalId
output appInsightsConnStr string = monitoring.outputs.connectionString
