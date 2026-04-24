import { createApiClient } from '@wealthspot/api-client'
import { API_BASE_URL } from './constants'
import { diagApiTrace } from '@/components/DiagnosticPanel'
import { useUserStore } from '@/stores/user.store'

const activeTraces = new Map<string, ReturnType<typeof diagApiTrace>>()

const { api, apiGet, apiPost, apiPut, apiPatch, apiDelete } = createApiClient({
  baseURL: API_BASE_URL,
  storage: {
    getAccessToken: () => localStorage.getItem('ws_token'),
    getRefreshToken: () => localStorage.getItem('ws_refresh_token'),
    setTokens: (access, refresh) => {
      localStorage.setItem('ws_token', access)
      localStorage.setItem('ws_refresh_token', refresh)
    },
    // Web intentionally does NOT clear tokens on refresh failure — useBackendSync
    // handles re-authentication; clearing here causes a destructive race condition.
    clearTokens: () => {},
  },
  hooks: {
    onRequestStart: (config) => {
      const method = config.method ?? 'GET'
      const url = (config.url ?? '').replace(API_BASE_URL, '')
      const trace = diagApiTrace(method, url)
      const reqId = `${method}-${url}-${Date.now()}`
      activeTraces.set(reqId, trace)
      return reqId
    },
    onResponseEnd: (traceId, info) => {
      if (!traceId || !activeTraces.has(traceId)) return
      const trace = activeTraces.get(traceId)!
      if (info.kind === 'success') {
        trace.done(info.status, true)
      } else if (info.kind === 'error') {
        trace.done(info.status, false, info.detail)
      } else if (info.kind === 'network-error') {
        trace.fail(info.message)
      }
      // 'discarded' = request was retried after refresh; the retry creates its own trace
      activeTraces.delete(traceId)
    },
    onResponseError: (error) => {
      const response = error.response
      if (!response || response.status !== 403) return
      const data = response.data
      if (typeof data !== 'object' || data === null || !('error' in data)) return
      const errorData = data as { error: { code: string; redirect?: string } }
      if (errorData.error.code === 'KYC_REQUIRED' && errorData.error.redirect?.startsWith('/')) {
        window.location.href = errorData.error.redirect
      }
    },
    onRefreshFailure: () => {
      useUserStore.getState().logout()
    },
  },
})

export { api, apiGet, apiPost, apiPut, apiPatch, apiDelete }
