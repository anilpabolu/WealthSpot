/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_RAZORPAY_KEY_ID: string
  readonly VITE_POSTHOG_KEY: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_ENABLE_DIAGNOSTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
