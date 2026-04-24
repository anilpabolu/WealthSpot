/**
 * WealthSpot Mobile – API client.
 * Uses the shared @wealthspot/api-client; only token storage and the auth-failure
 * callback are wired in here. Mobile-specific token keys (`ws-token`) live in SecureStore.
 */

import { createApiClient } from '@wealthspot/api-client'
import * as SecureStore from 'expo-secure-store'
import { API_BASE_URL } from './constants'

let _onAuthFailure: (() => void) | null = null

/** Register a callback to be invoked when token refresh fails (e.g. navigate to login). */
export function setOnAuthFailure(cb: () => void): void {
  _onAuthFailure = cb
}

const { api, apiGet, apiPost, apiPut, apiPatch, apiDelete } = createApiClient({
  baseURL: API_BASE_URL,
  storage: {
    getAccessToken: () => SecureStore.getItemAsync('ws-token'),
    getRefreshToken: () => SecureStore.getItemAsync('ws-refresh-token'),
    setTokens: async (access, refresh) => {
      await SecureStore.setItemAsync('ws-token', access)
      await SecureStore.setItemAsync('ws-refresh-token', refresh)
    },
    clearTokens: async () => {
      await SecureStore.deleteItemAsync('ws-token')
      await SecureStore.deleteItemAsync('ws-refresh-token')
    },
  },
  hooks: {
    onRefreshFailure: () => {
      _onAuthFailure?.()
    },
  },
})

export { api, apiGet, apiPost, apiPut, apiPatch, apiDelete }
export default api
