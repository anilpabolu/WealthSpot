// ── User-Assigned Managed Identity + Role Assignments ─────────────────────────
// The Container App uses this identity at runtime to:
//   - Pull images from ACR  (AcrPull)
//   - Read secrets from Key Vault  (Key Vault Secrets User)
//   - Write KYC blobs to Storage  (Storage Blob Data Contributor)
//
// GitHub Actions uses a separate Service Principal with OIDC federated credentials
// (configured in 02-configure-secrets.sh) to push images and update Container Apps.
// That SP needs: AcrPush (on ACR) + Contributor (on resource group).

@description('Managed identity name for the Container App')
param identityName string

@description('Azure region')
param location string

@description('ACR resource ID')
param acrId string

@description('Key Vault resource ID')
param kvId string

@description('KYC Storage Account resource ID')
param storageId string

// ── Built-in role definition IDs ─────────────────────────────────────────────
var acrPullRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
var kvSecretsUserRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
var storageBlobDataContributorRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

// AcrPull — allows Container App to pull images from ACR
resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acrId, identity.id, acrPullRoleId)
  scope: resourceGroup()
  properties: {
    roleDefinitionId: acrPullRoleId
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    description: 'Container App pulls images from ACR'
  }
}

// Key Vault Secrets User — allows Container App to read secrets
resource kvSecretsUserAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(kvId, identity.id, kvSecretsUserRoleId)
  scope: resourceGroup()
  properties: {
    roleDefinitionId: kvSecretsUserRoleId
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    description: 'Container App reads secrets from Key Vault'
  }
}

// Storage Blob Data Contributor — allows Container App to read/write KYC blobs
resource storageBlobAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageId, identity.id, storageBlobDataContributorRoleId)
  scope: resourceGroup()
  properties: {
    roleDefinitionId: storageBlobDataContributorRoleId
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    description: 'Container App reads/writes KYC documents in Blob Storage'
  }
}

output identityId string = identity.id
output identityClientId string = identity.properties.clientId
output identityPrincipalId string = identity.properties.principalId
