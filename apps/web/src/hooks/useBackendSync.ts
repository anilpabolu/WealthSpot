/**
 * useBackendSync – bridges Clerk authentication with the WealthSpot backend.
 *
 * Flow:
 * 1. User signs in via Clerk
 * 2. Check if user exists in backend DB via /auth/check
 * 3. If NOT registered → sign out of Clerk, flag notRegistered
 * 4. If registered → call /auth/login to get JWT → /auth/me for full profile
 * 5. Populate Zustand user store with role, profile, JWT
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useUser, useClerk } from '@clerk/react'
import { apiPost, apiGet } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'
import type { UserProfile } from '@/stores/user.store'
import { diagLog } from '@/components/DiagnosticPanel'

interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

interface MeResponse {
  id: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: UserProfile['role']
  kycStatus: string
  referralCode: string | null
  wealthPassActive: boolean
  isActive: boolean
  createdAt: string
}

/** Reactive state for unregistered-user banner */
let _notRegisteredListeners: Array<() => void> = []
let _notRegistered = false
let _notRegisteredEmail: string | null = null

function setNotRegistered(email: string | null) {
  _notRegistered = !!email
  _notRegisteredEmail = email
  _notRegisteredListeners.forEach((fn) => fn())
}

export function useNotRegistered() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const fn = () => rerender((c) => c + 1)
    _notRegisteredListeners.push(fn)
    return () => { _notRegisteredListeners = _notRegisteredListeners.filter((f) => f !== fn) }
  }, [])
  return { notRegistered: _notRegistered, email: _notRegisteredEmail, clear: () => setNotRegistered(null) }
}

export function useBackendSync() {
  const { user, isSignedIn, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { setUser, setToken, logout, isAuthenticated } = useUserStore()
  const syncingRef = useRef(false)

  const doSync = useCallback(async () => {
    if (!user || syncingRef.current) return
    syncingRef.current = true

    const email = user.primaryEmailAddress?.emailAddress
    const fullName = user.fullName || user.firstName || email || 'User'

    if (!email) {
      syncingRef.current = false
      return
    }

    diagLog('auth', 'info', `Checking if ${email} is registered…`)

    try {
      // Step 1: Check if user exists in backend
      const { exists } = await apiGet<{ exists: boolean }>(`/auth/check?email=${encodeURIComponent(email)}`)

      if (!exists) {
        diagLog('auth', 'warn', `${email} is not registered. Signing out.`)
        setNotRegistered(email)
        await signOut()
        return
      }

      // Step 2: Login to get backend JWT
      const tokens = await apiPost<LoginResponse>('/auth/login', { email, full_name: fullName })
      localStorage.setItem('ws_token', tokens.accessToken)
      localStorage.setItem('ws_refresh_token', tokens.refreshToken)
      setToken(tokens.accessToken)

      // Step 3: Fetch full profile (includes DB role)
      const profile = await apiGet<MeResponse>('/auth/me')
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.fullName,
        phone: profile.phone ?? '',
        avatarUrl: profile.avatarUrl ?? undefined,
        role: profile.role,
        kycStatus: profile.kycStatus,
        referralCode: profile.referralCode ?? '',
        wealthPassActive: profile.wealthPassActive,
        createdAt: profile.createdAt,
      })
      diagLog('auth', 'info', `Backend sync complete — role: ${profile.role}`)
    } catch (err) {
      diagLog('auth', 'error', `Backend sync failed: ${err}`)
    } finally {
      syncingRef.current = false
    }
  }, [user, signOut, setUser, setToken])

  useEffect(() => {
    if (!isLoaded) return

    // User signed out → clear backend state
    if (!isSignedIn) {
      if (isAuthenticated) {
        logout()
        diagLog('auth', 'info', 'Clerk signed out → cleared backend session')
      }
      return
    }

    // User signed in → sync with backend
    // Also re-sync if Zustand says authenticated but the actual token is missing
    // (happens when a 401 handler cleared localStorage but Zustand persisted stale state)
    const tokenMissing = isAuthenticated && !localStorage.getItem('ws_token')
    if (isSignedIn && user && (!isAuthenticated || tokenMissing) && !syncingRef.current) {
      if (tokenMissing) {
        diagLog('auth', 'warn', 'Token missing from storage — re-syncing with backend')
      }
      doSync()
    }
  }, [isLoaded, isSignedIn, user, isAuthenticated, logout, doSync])
}
