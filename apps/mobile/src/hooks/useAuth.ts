/**
 * useAuth – authentication state for mobile.
 */

import { useEffect, useState, useCallback } from 'react'
import * as SecureStore from 'expo-secure-store'
import { apiGet } from '../lib/api'
import { useUserStore } from '../stores/user.store'

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { setUser, logout } = useUserStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('ws-token')
      if (!token) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }
      const user = await apiGet<{
        id: string
        email: string
        full_name: string
        phone: string
        role: 'investor' | 'builder' | 'lender' | 'admin'
        kyc_status: string
        avatar_url: string | null
        referral_code: string | null
      }>('/users/me')
      setUser({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone ?? '',
        role: user.role,
        kycStatus: user.kyc_status as 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
        avatarUrl: user.avatar_url,
        referralCode: user.referral_code,
      })
      setIsAuthenticated(true)
    } catch {
      await SecureStore.deleteItemAsync('ws-token')
      logout()
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync('ws-token')
    logout()
    setIsAuthenticated(false)
  }, [logout])

  return { isLoading, isAuthenticated, signOut, checkAuth }
}
