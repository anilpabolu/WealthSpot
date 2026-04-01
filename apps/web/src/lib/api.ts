import axios, { type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from './constants'
import { diagApiTrace } from '@/components/DiagnosticPanel'
import { useUserStore } from '@/stores/user.store'

// ─── snake_case → camelCase deep converter ────────────
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

function convertKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(convertKeys)
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), convertKeys(v)])
    )
  }
  return obj
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Token refresh queue ──────────────────────────────
let _isRefreshing = false
let _refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processRefreshQueue(token: string | null, error: unknown = null) {
  _refreshQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  _refreshQueue = []
}

// Request interceptor: attach auth token + start diagnostic trace
const _activeTraces = new Map<string, ReturnType<typeof diagApiTrace>>()

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('ws_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Start diagnostic trace
    const method = config.method ?? 'GET'
    const url = (config.url ?? '').replace(API_BASE_URL, '')
    const trace = diagApiTrace(method, url)
    const reqId = `${method}-${url}-${Date.now()}`
    config.headers['X-Diag-Id'] = reqId
    _activeTraces.set(reqId, trace)
    return config
  },
  (error: unknown) => Promise.reject(error)
)

// Response interceptor: convert keys, log diagnostics, handle 401 refresh
api.interceptors.response.use(
  (response) => {
    response.data = convertKeys(response.data)
    // Complete diagnostic trace
    const reqId = response.config.headers?.['X-Diag-Id'] as string | undefined
    if (reqId && _activeTraces.has(reqId)) {
      _activeTraces.get(reqId)!.done(response.status, true)
      _activeTraces.delete(reqId)
    }
    return response
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const reqId = error.config?.headers?.['X-Diag-Id'] as string | undefined

      // ─── Automatic token refresh on 401 ─────────────
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        // Don't try refresh for auth endpoints
        const url = originalRequest.url ?? ''
        if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/check')) {
          // Log diagnostic for auth endpoints that 401
          if (reqId && _activeTraces.has(reqId)) {
            let detail: string | undefined
            if (error.response.data) {
              detail = typeof error.response.data === 'object'
                ? JSON.stringify(error.response.data, null, 2)
                : String(error.response.data)
            }
            _activeTraces.get(reqId)!.done(401, false, detail)
            _activeTraces.delete(reqId)
          }
          return Promise.reject(error)
        }

        originalRequest._retry = true
        const refreshToken = localStorage.getItem('ws_refresh_token')

        if (!refreshToken) {
          // No refresh token — log diagnostic, clear stale session
          if (reqId && _activeTraces.has(reqId)) {
            _activeTraces.get(reqId)!.done(401, false, '"No refresh token available"')
            _activeTraces.delete(reqId)
          }
          useUserStore.getState().logout()
          return Promise.reject(error)
        }

        if (_isRefreshing) {
          // Queue this request until the in-flight refresh resolves
          // Remove trace – the retried request will create its own
          if (reqId && _activeTraces.has(reqId)) _activeTraces.delete(reqId)
          return new Promise<string>((resolve, reject) => {
            _refreshQueue.push({ resolve, reject })
          }).then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          })
        }

        _isRefreshing = true
        try {
          // Use raw axios to avoid our interceptor loop
          const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const data = resp.data as { access_token: string; refresh_token: string }
          localStorage.setItem('ws_token', data.access_token)
          localStorage.setItem('ws_refresh_token', data.refresh_token)
          processRefreshQueue(data.access_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          // Silently drop the 401 trace – the retried request gets its own trace
          if (reqId && _activeTraces.has(reqId)) _activeTraces.delete(reqId)
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed – NOW log the 401 diagnostic
          if (reqId && _activeTraces.has(reqId)) {
            _activeTraces.get(reqId)!.done(401, false, '"Token refresh failed"')
            _activeTraces.delete(reqId)
          }
          processRefreshQueue(null, refreshError)
          useUserStore.getState().logout()
          return Promise.reject(refreshError)
        } finally {
          _isRefreshing = false
        }
      }

      // ─── Diagnostic logging for non-401 errors ─────────────
      if (reqId && _activeTraces.has(reqId)) {
        const status = error.response?.status ?? 0
        const msg = error.message || 'Network error'
        if (error.response) {
          let detail: string | undefined
          if (error.response.data) {
            detail = typeof error.response.data === 'object'
              ? JSON.stringify(error.response.data, null, 2)
              : String(error.response.data)
          }
          _activeTraces.get(reqId)!.done(status, false, detail)
        } else {
          _activeTraces.get(reqId)!.fail(msg)
        }
        _activeTraces.delete(reqId)
      }

      if (error.response) {
        const { status, data } = error.response as { status: number; data: unknown }
        if (status === 403 && typeof data === 'object' && data !== null && 'error' in data) {
          const errorData = data as { error: { code: string; redirect?: string } }
          if (errorData.error.code === 'KYC_REQUIRED' && errorData.error.redirect) {
            // Validate redirect URL - only allow same-origin paths
            const redirect = errorData.error.redirect
            if (redirect.startsWith('/')) {
              window.location.href = redirect
            }
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

// ─── Typed API helpers (backend returns raw objects, NOT wrapped) ──────
export async function apiGet<T>(url: string, config?: { params?: Record<string, unknown> }): Promise<T> {
  const response = await api.get<T>(url, config)
  return response.data
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.post<T>(url, body)
  return response.data
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.put<T>(url, body)
  return response.data
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.patch<T>(url, body)
  return response.data
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const response = await api.delete<T>(url)
  return response.data
}
