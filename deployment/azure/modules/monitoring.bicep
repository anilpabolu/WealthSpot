// ── Application Insights + Alert Rules ────────────────────────────────────────
// Application Insights ingestion capped at 1 GB/day (~₹560/month at cap).
// Alert rules for high error rate and slow response time.

@description('Application Insights resource name')
param appInsightsName string

@description('Azure region')
param location string

@description('Log Analytics workspace resource ID (for workspace-based AI)')
param logAnalyticsWorkspaceId string

@description('Action group email for alerts (the deployer\'s email)')
param alertEmail string = 'admin@wealthspot.in'

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspaceId
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    RetentionInDays: 30
    DisableIpMasking: false
  }
}

// Note: workspace-based App Insights uses Log Analytics billing — no pricingPlan resource needed.
// Set daily cap via Portal: App Insights → Usage and estimated costs → Daily cap → 1 GB.

// ── Action group for alert emails ─────────────────────────────────────────────
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-wealthspot-alerts'
  location: 'global'
  properties: {
    groupShortName: 'WSAlerts'
    enabled: true
    emailReceivers: [
      {
        name: 'Admin'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

// ── Alert: HTTP 5xx error rate > 5% over 5 minutes ────────────────────────────
resource highErrorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-high-error-rate'
  location: 'global'
  properties: {
    description: 'API returning >5% 5xx responses over 5-minute window'
    severity: 1
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'HighFailedRequests'
          metricName: 'requests/failed'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Count'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// ── Alert: Average response time > 3 seconds ─────────────────────────────────
resource slowResponseAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-slow-response'
  location: 'global'
  properties: {
    description: 'API average response time exceeded 3 seconds'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'SlowDuration'
          metricName: 'requests/duration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 3000  // milliseconds
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

output appInsightsId string = appInsights.id
output instrumentationKey string = appInsights.properties.InstrumentationKey
output connectionString string = appInsights.properties.ConnectionString
