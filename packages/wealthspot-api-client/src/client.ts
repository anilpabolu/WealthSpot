import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { convertKeysToCamel } from './transforms'
import type { ApiClientConfig } from './types'

export interface ApiClient {
  api: AxiosInstance
  apiGet: <T>(url: string, config?: { params?: Record<string, unknown> }) => Promise<T>
  apiPost: <T>(url: string, body?: unknown) => Promise<T>
  apiPut: <T>(url: string, body?: unknown) => Promise<T>
  apiPatch: <T>(url: string, body?: unknown) => Promise<T>
  apiDelete: <T = void>(url: string) => Promise<T>
}

const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/check']

function isAuthPath(url: string): boolean {
  return AUTH_PATHS.some((p) => url.includes(p))
}

function describeErrorBody(data: unknown): string | undefined {
  if (data == null) return undefined
  return typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseURL, timeout = 30_000, storage, hooks = {} } = config

  const api = axios.create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json' },
  })

  // Token-refresh queue: while a refresh is in flight, queue subsequent 401s
  // until the new token resolves; then retry each with the fresh token.
  let isRefreshing = false
  let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

  const drainQueue = (token: string | null, error: unknown = null) => {
    refreshQueue.forEach(({ resolve, reject }) => {
      if (token) resolve(token)
      else reject(error)
    })
    refreshQueue = []
  }

  api.interceptors.request.use(
    async (req) => {
      const token = await storage.getAccessToken()
      if (token) {
        req.headers.Authorization = `Bearer ${token}`
      }
      const traceId = hooks.onRequestStart?.(req)
      if (traceId) {
        req.headers['X-Diag-Id'] = traceId
      }
      return req
    },
    (error: unknown) => Promise.reject(error),
  )

  api.interceptors.response.use(
    (response) => {
      response.data = convertKeysToCamel(response.data)
      const traceId = response.config.headers?.['X-Diag-Id'] as string | undefined
      hooks.onResponseEnd?.(traceId, { kind: 'success', status: response.status })
      return response
    },
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(error)
      }
      const axErr = error as AxiosError
      const traceId = axErr.config?.headers?.['X-Diag-Id'] as string | undefined
      const originalRequest = axErr.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined
      const url = originalRequest?.url ?? ''

      const is401 = axErr.response?.status === 401
      const canAttemptRefresh =
        is401 && originalRequest && !originalRequest._retry && !isAuthPath(url)

      if (canAttemptRefresh) {
        originalRequest._retry = true
        const refreshToken = await storage.getRefreshToken()
        if (!refreshToken) {
          hooks.onResponseEnd?.(traceId, {
            kind: 'error',
            status: 401,
            detail: '"No refresh token available"',
          })
          return Promise.reject(error)
        }

        if (isRefreshing) {
          // Queue this request; the in-flight refresh will resolve us.
          // Drop the trace; the retried request will create its own.
          hooks.onResponseEnd?.(traceId, { kind: 'discarded' })
          return new Promise<string>((resolve, reject) => {
            refreshQueue.push({ resolve, reject })
          }).then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          })
        }

        isRefreshing = true
        try {
          // Use raw axios to avoid our own interceptor loop
          const resp = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const data = resp.data as { access_token: string; refresh_token: string }
          await storage.setTokens(data.access_token, data.refresh_token)
          drainQueue(data.access_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          hooks.onResponseEnd?.(traceId, { kind: 'discarded' })
          return api(originalRequest)
        } catch (refreshError) {
          drainQueue(null, refreshError)
          await storage.clearTokens()
          hooks.onResponseEnd?.(traceId, {
            kind: 'error',
            status: 401,
            detail: '"Token refresh failed"',
          })
          await hooks.onRefreshFailure?.(refreshError)
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      // Diagnostics for non-401 errors
      if (axErr.response) {
        hooks.onResponseEnd?.(traceId, {
          kind: 'error',
          status: axErr.response.status,
          detail: describeErrorBody(axErr.response.data),
        })
      } else {
        hooks.onResponseEnd?.(traceId, {
          kind: 'network-error',
          message: axErr.message || 'Network error',
        })
      }

      hooks.onResponseError?.(axErr)
      return Promise.reject(error)
    },
  )

  return {
    api,
    apiGet: async <T>(url: string, cfg?: { params?: Record<string, unknown> }) => {
      const response = await api.get<T>(url, cfg)
      return response.data
    },
    apiPost: async <T>(url: string, body?: unknown) => {
      const response = await api.post<T>(url, body)
      return response.data
    },
    apiPut: async <T>(url: string, body?: unknown) => {
      const response = await api.put<T>(url, body)
      return response.data
    },
    apiPatch: async <T>(url: string, body?: unknown) => {
      const response = await api.patch<T>(url, body)
      return response.data
    },
    apiDelete: async <T = void>(url: string) => {
      const response = await api.delete<T>(url)
      return response.data
    },
  }
}
