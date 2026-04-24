/**
 * useAuth – authentication state for mobile.
 * Works with the 8-role user store and SecureStore tokens.
 */

import { useEffect, useState, useCallback } from 'react'
import * as SecureStore from 'expo-secure-store'
import { apiGet } from '../lib/api'
import { useUserStore } from '../stores/user.store'
import type { UserRole } from '../lib/constants'

interface MeResponse {
  id: string
  email: string
  fullName: string
  phone: string
  role: UserRole
  roles: string[]
  primaryRole: string
  builderApproved: boolean
  personaSelectedAt: string | null
  kycStatus: string
  avatarUrl: string | null
  referralCode: string | null
  wealthPassActive: boolean
  createdAt: string
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, setUser, setToken, logout } = useUserStore()

  useEffect(() => {
    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('ws-token')
      if (!token) {
        setIsLoading(false)
        return
      }
      setToken(token)
      const user = await apiGet<MeResponse>('/auth/me')
      setUser({
        id: user.id,
        email: user.email,
        name: user.fullName ?? '',
        phone: user.phone ?? '',
        role: user.role,
        roles: user.roles ?? [user.role],
        primaryRole: user.primaryRole ?? user.role,
        builderApproved: user.builderApproved ?? false,
        personaSelectedAt: user.personaSelectedAt ?? null,
        kycStatus: user.kycStatus,
        avatarUrl: user.avatarUrl ?? undefined,
        referralCode: user.referralCode ?? '',
        wealthPassActive: user.wealthPassActive ?? false,
        createdAt: user.createdAt ?? '',
      })
    } catch {
      await SecureStore.deleteItemAsync('ws-token')
      await SecureStore.deleteItemAsync('ws-refresh-token')
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync('ws-token')
    await SecureStore.deleteItemAsync('ws-refresh-token')
    logout()
  }, [logout])

  return { isLoading, isAuthenticated, signOut, checkAuth }
}
