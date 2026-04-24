import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

/**
 * Token storage adapter — methods may be sync (web localStorage) or async (mobile SecureStore).
 * The client awaits all return values so either works.
 */
export interface TokenStorage {
  getAccessToken: () => string | null | Promise<string | null>
  getRefreshToken: () => string | null | Promise<string | null>
  setTokens: (accessToken: string, refreshToken: string) => void | Promise<void>
  clearTokens: () => void | Promise<void>
}

/**
 * Optional hooks for platform-specific cross-cutting concerns.
 * All are no-ops by default. Callers wire in what they need
 * (e.g. web wires diagnostic tracing + KYC redirect; mobile wires nav callback).
 */
export interface ApiClientHooks {
  /** Called at request start. Return a trace id that gets attached as `X-Diag-Id` and passed to onResponseEnd. */
  onRequestStart?: (config: InternalAxiosRequestConfig) => string | undefined
  /** Called when a request finishes (success or error). Receives the trace id from onRequestStart. */
  onResponseEnd?: (
    traceId: string | undefined,
    info:
      | { kind: 'success'; status: number }
      | { kind: 'error'; status: number; detail?: string }
      | { kind: 'network-error'; message: string }
      | { kind: 'discarded' },
  ) => void
  /** Called when a non-401 response error occurs (e.g. for KYC redirect on 403). */
  onResponseError?: (error: AxiosError) => void
  /** Called when token refresh fails (e.g. to navigate to login). */
  onRefreshFailure?: (error: unknown) => void | Promise<void>
}

export interface ApiClientConfig {
  /** Base URL for all API calls — e.g. `http://localhost:8000/api/v1`. */
  baseURL: string
  /** Request timeout in ms. Default: 30000. */
  timeout?: number
  /** Token storage adapter. */
  storage: TokenStorage
  /** Optional cross-cutting hooks. */
  hooks?: ApiClientHooks
}
