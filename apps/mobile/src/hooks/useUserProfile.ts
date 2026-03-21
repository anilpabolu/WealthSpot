/**
 * useUserProfile – current user profile hook.
 * Mirrors web's useUserProfile.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import { useUserStore } from '../stores/user.store'

export interface KycDocument {
  id: string
  documentType: string
  verificationStatus: string
  createdAt: string
}

export interface UserProfile {
  id: string
  email: string
  fullName?: string
  phone?: string
  avatarUrl?: string
  role: string
  kycStatus: string
  referralCode?: string
  isActive: boolean
  createdAt: string
  kycDocuments: KycDocument[]
}

export function useUserProfile() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<UserProfile>({
    queryKey: ['user', 'me'],
    queryFn: () => apiGet<UserProfile>('/auth/me'),
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}
