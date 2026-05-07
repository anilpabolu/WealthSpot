// ── Azure Key Vault (Standard tier) ──────────────────────────────────────────
// RBAC authorization model. Purge protection enabled (7-day soft delete).
// Secrets are set via deployment/scripts/02-configure-secrets.sh.
// Container App reads secrets via its managed identity (Key Vault Secrets User role).

@description('Key Vault name — 3-24 chars, alphanumeric and hyphens')
param name string

@description('Azure region')
param location string

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

output kvId string = kv.id
output kvUri string = kv.properties.vaultUri
output kvName string = kv.name
