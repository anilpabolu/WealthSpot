/**
 * useClerkBackendSync – bridges Clerk identity with the Netegron backend on mobile.
 *
 * Flow (mirrors web's useBackendSync):
 *  1. Clerk signs the user in (email/OTP or social).
 *  2. We hit /auth/check — if not registered, auto-register.
 *  3. Call /auth/login → get access + refresh tokens.
 *  4. Store tokens in SecureStore (via user store).
 *  5. Fetch full profile from /auth/me → populate Zustand user store.
 *
 * USAGE: Called inside InnerLayout in _layout.tsx, inside ClerkProvider when
 * EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set. Falls back to a no-op when Clerk
 * is not configured — the existing raw-JWT auth flow in useAuth.ts takes over.
 */

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-expo'
import { apiGet, apiPost } from '../lib/api'
import { useUserStore, type UserProfile } from '../stores/user.store'

interface LoginResponse {
  accessToken: string
  refreshToken: string
}

interface MeResponse {
  id: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: UserProfile['role']
  roles: string[]
  primaryRole: string
  builderApproved: boolean
  personaSelectedAt: string | null
  kycStatus: string
  referralCode: string | null
  wealthPassActive: boolean
  createdAt: string
}

export function useClerkBackendSync() {
  // All hooks called unconditionally — Clerk hooks are no-ops when no
  // ClerkProvider is present (they throw in that case, which is why we only
  // call this hook from inside a ClerkProvider-wrapped session).
  const { user, isSignedIn, isLoaded } = useUser()
  const { setUser, setTokens, isAuthenticated } = useUserStore()
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    if (isAuthenticated) return  // already synced this session
    if (syncingRef.current) return

    syncingRef.current = true
    void doSync()

    async function doSync() {
      try {
        const email = user!.primaryEmailAddress?.emailAddress
        const fullName = user!.fullName ?? user!.firstName ?? email ?? 'Investor'
        if (!email) return

        // Register if first time.
        try {
          const { exists } = await apiGet<{ exists: boolean }>(`/auth/check?email=${encodeURIComponent(email)}`)
          if (!exists) {
            await apiPost('/auth/register', { email, full_name: fullName })
          }
        } catch {
          // If /auth/check fails, proceed — login may still succeed.
        }

        // Exchange for backend JWT.
        const tokens = await apiPost<LoginResponse>('/auth/login', { email, full_name: fullName })
        await setTokens(tokens.accessToken, tokens.refreshToken)

        // Load full profile.
        const profile = await apiGet<MeResponse>('/auth/me')
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.fullName,
          phone: profile.phone ?? '',
          avatarUrl: profile.avatarUrl ?? undefined,
          role: profile.role,
          roles: profile.roles ?? [profile.role],
          primaryRole: profile.primaryRole ?? profile.role,
          builderApproved: profile.builderApproved ?? false,
          personaSelectedAt: profile.personaSelectedAt ?? null,
          kycStatus: profile.kycStatus,
          referralCode: profile.referralCode ?? '',
          wealthPassActive: profile.wealthPassActive,
          createdAt: profile.createdAt,
        })
      } finally {
        syncingRef.current = false
      }
    }
  }, [isLoaded, isSignedIn, user, isAuthenticated, setUser, setTokens])
}

