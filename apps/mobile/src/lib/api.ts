/**
 * WealthSpot Mobile – API client (mirrors web's api.ts with RN adaptations).
 *
 * Features:
 *   - snake_case → camelCase auto-conversion on responses
 *   - Bearer token via SecureStore
 *   - Automatic 401 token refresh with request queuing
 *   - Typed helpers: apiGet, apiPost, apiPut, apiDelete
 */

import axios, { type InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_BASE_URL } from './constants'

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

// Request interceptor: attach auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('ws-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

// Response interceptor: convert keys + handle 401 refresh
api.interceptors.response.use(
  (response) => {
    response.data = convertKeys(response.data)
    return response
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      // ─── Automatic token refresh on 401 ─────────────
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        const url = originalRequest.url ?? ''
        if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/check')) {
          return Promise.reject(error)
        }

        originalRequest._retry = true
        const refreshToken = await SecureStore.getItemAsync('ws-refresh-token')

        if (!refreshToken) {
          await SecureStore.deleteItemAsync('ws-token')
          await SecureStore.deleteItemAsync('ws-refresh-token')
          return Promise.reject(error)
        }

        if (_isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            _refreshQueue.push({ resolve, reject })
          }).then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          })
        }

        _isRefreshing = true
        try {
          const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const data = resp.data as { access_token: string; refresh_token: string }
          await SecureStore.setItemAsync('ws-token', data.access_token)
          await SecureStore.setItemAsync('ws-refresh-token', data.refresh_token)
          processRefreshQueue(data.access_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return api(originalRequest)
        } catch (refreshError) {
          processRefreshQueue(null, refreshError)
          await SecureStore.deleteItemAsync('ws-token')
          await SecureStore.deleteItemAsync('ws-refresh-token')
          return Promise.reject(refreshError)
        } finally {
          _isRefreshing = false
        }
      }
    }
    return Promise.reject(error)
  }
)

// ─── Typed API helpers ────────────────────────────────
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

export default api
