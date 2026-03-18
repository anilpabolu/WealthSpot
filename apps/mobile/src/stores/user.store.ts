/**
 * User store (Zustand + MMKV for RN).
 */

import { create } from 'zustand'

type KycStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
type UserRole = 'investor' | 'builder' | 'lender' | 'admin'

interface UserProfile {
  id: string
  email: string
  fullName: string
  phone: string
  role: UserRole
  kycStatus: KycStatus
  avatarUrl: string | null
  referralCode: string | null
}

interface UserState {
  user: UserProfile | null
  token: string | null
  setUser: (user: UserProfile) => void
  setToken: (token: string) => void
  logout: () => void
  updateKycStatus: (status: KycStatus) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),
  updateKycStatus: (kycStatus) =>
    set((state) => ({
      user: state.user ? { ...state.user, kycStatus } : null,
    })),
}))
