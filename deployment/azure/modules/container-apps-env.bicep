// ── Container Apps Environment + Log Analytics Workspace ─────────────────────
// Log Analytics workspace stores structured logs from all Container Apps.
// 30-day retention. Container Apps Environment is in "consumption" plan.

@description('Log Analytics workspace name')
param lawName string

@description('Container Apps Environment name')
param caeName string

@description('Azure region')
param location string

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: lawName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 1  // 1 GB/day cap — adjust if log volume grows
    }
  }
}

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: caeName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    zoneRedundant: false
  }
}

output caeId string = containerAppsEnv.id
output caeName string = containerAppsEnv.name
output lawId string = logAnalytics.id
output lawCustomerId string = logAnalytics.properties.customerId
