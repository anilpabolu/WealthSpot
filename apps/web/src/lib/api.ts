import axios from 'axios'
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

// Request interceptor: attach auth token (Clerk JWT or demo token)
api.interceptors.request.use(
  async (config) => {
    const token =
      localStorage.getItem('__clerk_token') ??
      localStorage.getItem('ws_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

// Response interceptor: convert snake_case keys to camelCase & normalize errors
api.interceptors.response.use(
  (response) => {
    response.data = convertKeys(response.data)
    return response
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response as { status: number; data: unknown }
      if (status === 401) {
        window.location.href = '/auth/login'
      }
      if (status === 403 && typeof data === 'object' && data !== null && 'error' in data) {
        const errorData = data as { error: { code: string; redirect?: string } }
        if (errorData.error.code === 'KYC_REQUIRED' && errorData.error.redirect) {
          window.location.href = errorData.error.redirect
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

export async function apiDelete<T = void>(url: string): Promise<T> {
  const response = await api.delete<T>(url)
  return response.data
}
