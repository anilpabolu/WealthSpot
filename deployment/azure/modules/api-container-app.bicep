// ── WealthSpot API — Azure Container App ─────────────────────────────────────
// Consumption plan: min 1 replica (no cold start), max 3 (scale on HTTP load).
// All sensitive configuration is pulled from Key Vault via managed identity.
// Non-secret config (URLs, region, bucket names) is set as plain env vars.

@description('Container App name')
param name string

@description('Azure region')
param location string

@description('Container Apps Environment resource ID')
param caeId string

@description('User-assigned managed identity resource ID')
param identityId string

@description('User-assigned managed identity client ID (for KV secret refs)')
param identityClientId string

@description('Key Vault URI (e.g. https://wealthspot-kv-prod.vault.azure.net/)')
param kvUri string

@description('Full container image reference (e.g. wealthspotcr.azurecr.io/wealthspot-api:abc123)')
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Application Insights connection string (non-secret, long but not sensitive)')
param appInsightsConnectionString string = ''

@description('CORS origins (comma-separated)')
param corsOrigins string = 'https://app.wealthspot.in,https://wealthspot.in'

@description('R2 public URL prefix for media files')
param s3PublicUrl string = 'https://media.wealthspot.in'

@description('R2 S3-compatible endpoint URL')
param s3EndpointUrl string

@description('Cloudflare R2 bucket name for public media')
param s3Bucket string = 'wealthspot-media'

@description('Azure Blob endpoint for KYC documents')
param kycEndpointUrl string

@description('Azure Blob container name for KYC docs')
param kycBucket string = 'kyc-documents'

@description('ACR login server (e.g. wealthspotcrprod.azurecr.io)')
param acrLoginServer string = ''

// ── Key Vault secret references ────────────────────────────────────────────────
// Container Apps pulls these at startup via the managed identity.
// Names must match what 02-configure-secrets.sh writes to Key Vault.
var kvSecrets = [
  { name: 'database-url',              keyVaultUrl: '${kvUri}secrets/database-url' }
  { name: 'jwt-secret-key',            keyVaultUrl: '${kvUri}secrets/jwt-secret-key' }
  { name: 'encryption-key',            keyVaultUrl: '${kvUri}secrets/encryption-key' }
  { name: 'clerk-webhook-secret',      keyVaultUrl: '${kvUri}secrets/clerk-webhook-secret' }
  { name: 'clerk-api-key',             keyVaultUrl: '${kvUri}secrets/clerk-api-key' }
  { name: 'redis-url',                 keyVaultUrl: '${kvUri}secrets/redis-url' }
  { name: 'celery-broker-url',         keyVaultUrl: '${kvUri}secrets/celery-broker-url' }
  { name: 'aws-access-key-id',         keyVaultUrl: '${kvUri}secrets/aws-access-key-id' }
  { name: 'aws-secret-access-key',     keyVaultUrl: '${kvUri}secrets/aws-secret-access-key' }
  { name: 'kyc-access-key-id',         keyVaultUrl: '${kvUri}secrets/kyc-access-key-id' }
  { name: 'kyc-secret-access-key',     keyVaultUrl: '${kvUri}secrets/kyc-secret-access-key' }
  { name: 'razorpay-key-id',           keyVaultUrl: '${kvUri}secrets/razorpay-key-id' }
  { name: 'razorpay-key-secret',       keyVaultUrl: '${kvUri}secrets/razorpay-key-secret' }
  { name: 'sentry-dsn',                keyVaultUrl: '${kvUri}secrets/sentry-dsn' }
  { name: 'smtp-password',             keyVaultUrl: '${kvUri}secrets/smtp-password' }
  { name: 'twilio-auth-token',         keyVaultUrl: '${kvUri}secrets/twilio-auth-token' }
  { name: 'twilio-account-sid',        keyVaultUrl: '${kvUri}secrets/twilio-account-sid' }
  { name: 'encryption-key-fernet',     keyVaultUrl: '${kvUri}secrets/encryption-key' }
]

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: caeId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8000
        transport: 'auto'
        corsPolicy: {
          allowedOrigins: [
            'https://app.wealthspot.in'
            'https://wealthspot.in'
          ]
          allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
          maxAge: 600
        }
      }
      secrets: [for secret in kvSecrets: {
        name: secret.name
        keyVaultUrl: secret.keyVaultUrl
        identity: identityId
      }]
      registries: acrLoginServer != '' ? [
        {
          server: acrLoginServer
          identity: identityId
        }
      ] : []
    }
    template: {
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            // ── Non-secret configuration ─────────────────────────────────
            { name: 'APP_ENV',                value: 'production' }
            { name: 'DEBUG',                  value: 'false' }
            { name: 'CORS_ORIGINS',           value: corsOrigins }
            { name: 'AWS_REGION',             value: 'auto' }
            { name: 'AWS_S3_BUCKET',          value: s3Bucket }
            { name: 'S3_ENDPOINT_URL',        value: s3EndpointUrl }
            { name: 'S3_PUBLIC_URL',          value: s3PublicUrl }
            { name: 'KYC_AWS_S3_BUCKET',      value: kycBucket }
            { name: 'KYC_S3_ENDPOINT_URL',    value: kycEndpointUrl }
            { name: 'KYC_S3_PUBLIC_URL',      value: '' }
            { name: 'SMTP_HOST',              value: 'smtp.resend.com' }
            { name: 'SMTP_PORT',              value: '587' }
            { name: 'SMTP_USERNAME',          value: 'resend' }
            { name: 'SMTP_FROM_EMAIL',        value: 'no-reply@wealthspot.in' }
            { name: 'SMTP_FROM_NAME',         value: 'WealthSpot' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
            // ── Secret references from Key Vault ──────────────────────────
            { name: 'DATABASE_URL',           secretRef: 'database-url' }
            { name: 'JWT_SECRET_KEY',         secretRef: 'jwt-secret-key' }
            { name: 'ENCRYPTION_KEY',         secretRef: 'encryption-key' }
            { name: 'CLERK_WEBHOOK_SECRET',   secretRef: 'clerk-webhook-secret' }
            { name: 'CLERK_API_KEY',          secretRef: 'clerk-api-key' }
            { name: 'REDIS_URL',              secretRef: 'redis-url' }
            { name: 'CELERY_BROKER_URL',      secretRef: 'celery-broker-url' }
            { name: 'AWS_ACCESS_KEY_ID',      secretRef: 'aws-access-key-id' }
            { name: 'AWS_SECRET_ACCESS_KEY',  secretRef: 'aws-secret-access-key' }
            { name: 'KYC_AWS_ACCESS_KEY_ID',  secretRef: 'kyc-access-key-id' }
            { name: 'KYC_AWS_SECRET_ACCESS_KEY', secretRef: 'kyc-secret-access-key' }
            { name: 'RAZORPAY_KEY_ID',        secretRef: 'razorpay-key-id' }
            { name: 'RAZORPAY_KEY_SECRET',    secretRef: 'razorpay-key-secret' }
            { name: 'SENTRY_DSN',             secretRef: 'sentry-dsn' }
            { name: 'SMTP_PASSWORD',          secretRef: 'smtp-password' }
            { name: 'TWILIO_AUTH_TOKEN',      secretRef: 'twilio-auth-token' }
            { name: 'TWILIO_ACCOUNT_SID',     secretRef: 'twilio-account-sid' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/live'
                port: 8000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 30
              failureThreshold: 3
              timeoutSeconds: 5
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/ready'
                port: 8000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 30
              periodSeconds: 10
              failureThreshold: 3
              timeoutSeconds: 10
            }
            {
              type: 'Startup'
              httpGet: {
                path: '/live'
                port: 8000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 5
              periodSeconds: 5
              failureThreshold: 12
              timeoutSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-scale'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

output containerAppId string = containerApp.id
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output containerAppName string = containerApp.name
