/**
 * Clerk Expo wiring — SecureStore-backed token cache.
 *
 * Clerk on web persists in localStorage; on mobile we want SecureStore so
 * the session token is OS-encrypted and survives app restarts without sitting
 * in plaintext. This module exports the cache shape Clerk expects, plus a
 * sentinel for the publishable-key env var.
 */

import * as SecureStore from 'expo-secure-store'

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''

/**
 * Token cache passed to <ClerkProvider tokenCache={...}> — Clerk reads/writes
 * its session JWT through this. We swallow SecureStore errors because Web
 * preview can return null without breaking the app.
 */
export const clerkTokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {
      /* swallow — see comment above */
    }
  },
}
