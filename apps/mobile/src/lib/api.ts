/**
 * WealthSpot Mobile – API client (shared with web via similar interface).
 */

import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Auth interceptor
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('ws-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync('ws-token')
    }
    return Promise.reject(error)
  },
)

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await api.get(url, { params })
  return response.data.data ?? response.data
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.post(url, data)
  return response.data.data ?? response.data
}

export default api
