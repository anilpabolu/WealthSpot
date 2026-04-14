/**
 * useBackendSync – bridges Clerk authentication with the WealthSpot backend.
 *
 * Flow:
 * 1. User signs in via Clerk
 * 2. Check if user exists in backend DB via /auth/check
 * 3. If NOT registered → auto-register in backend
 * 4. Call /auth/login to get JWT → /auth/me for full profile
 * 5. Populate Zustand user store with role, profile, JWT
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useUser } from '@clerk/react'
import axios from 'axios'
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
  roles: string[]
  primaryRole: string
  builderApproved: boolean
  personaSelectedAt: string | null
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

/**
 * Decode a JWT's payload and check if it's expired.
 * Returns true if the token is expired or unparseable.
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const payload = JSON.parse(atob(parts[1]!))
    // 60s buffer so we refresh before it actually expires
    return payload.exp * 1000 < Date.now() - 60_000
  } catch {
    return true
  }
}

export function useBackendSync() {
  const { user, isSignedIn, isLoaded } = useUser()
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
        diagLog('auth', 'info', `${email} not found in backend. Auto-registering…`)
        await apiPost('/auth/register', { email, full_name: fullName })
        setNotRegistered(null)
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
        roles: profile.roles ?? [],
        primaryRole: profile.primaryRole ?? profile.role,
        builderApproved: profile.builderApproved ?? false,
        personaSelectedAt: profile.personaSelectedAt ?? null,
        kycStatus: profile.kycStatus,
        referralCode: profile.referralCode ?? '',
        wealthPassActive: profile.wealthPassActive,
        createdAt: profile.createdAt,
      })
      diagLog('auth', 'info', `Backend sync complete — role: ${profile.role}`)

      // Step 4: Auto-apply referral code if captured from ?ref= URL param
      const pendingRef = localStorage.getItem('ws_referral_code')
      if (pendingRef) {
        try {
          await apiPost('/referrals/apply', { code: pendingRef })
          diagLog('auth', 'info', `Referral code ${pendingRef} applied`)
        } catch {
          // Already applied or invalid — silently ignore
        }
        localStorage.removeItem('ws_referral_code')
      }

      // Step 5: Auto-apply property referral code if captured from ?pref= URL param
      const pendingPref = localStorage.getItem('ws_property_referral_code')
      if (pendingPref) {
        try {
          await apiPost('/referrals/apply', { code: pendingPref })
          diagLog('auth', 'info', `Property referral code ${pendingPref} applied`)
        } catch {
          // Already applied or invalid — silently ignore
        }
        localStorage.removeItem('ws_property_referral_code')
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        const detail = (err.response.data as { detail?: string } | undefined)?.detail
        if (detail === 'USER_NOT_REGISTERED') {
          diagLog('auth', 'info', `${email} missing at login. Auto-registering and retrying…`)
          await apiPost('/auth/register', { email, full_name: fullName })
          const tokens = await apiPost<LoginResponse>('/auth/login', { email, full_name: fullName })
          localStorage.setItem('ws_token', tokens.accessToken)
          localStorage.setItem('ws_refresh_token', tokens.refreshToken)
          setToken(tokens.accessToken)

          const profile = await apiGet<MeResponse>('/auth/me')
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.fullName,
            phone: profile.phone ?? '',
            avatarUrl: profile.avatarUrl ?? undefined,
            role: profile.role,
            roles: profile.roles ?? [],
            primaryRole: profile.primaryRole ?? profile.role,
            builderApproved: profile.builderApproved ?? false,
            personaSelectedAt: profile.personaSelectedAt ?? null,
            kycStatus: profile.kycStatus,
            referralCode: profile.referralCode ?? '',
            wealthPassActive: profile.wealthPassActive,
            createdAt: profile.createdAt,
          })
          setNotRegistered(null)
          diagLog('auth', 'info', `Backend sync complete — role: ${profile.role}`)
          return
        }
      }
      diagLog('auth', 'error', `Backend sync failed: ${err}`)
    } finally {
      syncingRef.current = false
    }
  }, [user, setUser, setToken])

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
    // Re-sync if: not authenticated, token missing, or token expired
    const storedToken = localStorage.getItem('ws_token')
    const tokenMissing = isAuthenticated && !storedToken
    const tokenExpired = isAuthenticated && storedToken && isTokenExpired(storedToken)

    if (isSignedIn && user && (!isAuthenticated || tokenMissing || tokenExpired) && !syncingRef.current) {
      if (tokenMissing) {
        diagLog('auth', 'warn', 'Token missing from storage — re-syncing with backend')
      } else if (tokenExpired) {
        diagLog('auth', 'warn', 'Token expired — re-syncing with backend')
      }
      doSync()
    }
  }, [isLoaded, isSignedIn, user, isAuthenticated, logout, doSync])
}
