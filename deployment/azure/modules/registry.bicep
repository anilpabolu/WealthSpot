// ── Azure Container Registry (Basic tier) ──────────────────────────────────
// Admin login is disabled; the Container App pulls via its managed identity (ACRPull role).

@description('ACR name — must be globally unique, 5-50 chars, alphanumeric only')
param name string

@description('Azure region')
param location string

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: name
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    zoneRedundancy: 'Disabled'
  }
}

output acrId string = acr.id
output loginServer string = acr.properties.loginServer
output acrName string = acr.name
