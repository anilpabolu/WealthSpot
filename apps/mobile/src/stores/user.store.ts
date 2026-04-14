/**
 * User store (Zustand) – mirrors web's user.store.ts with all 8 roles.
 */

import { create } from 'zustand'
import type { UserRole } from '../lib/constants'

export interface UserProfile {
  id: string
  email: string
  name: string
  phone: string
  avatarUrl?: string
  role: UserRole
  roles: string[]
  primaryRole: string
  builderApproved: boolean
  personaSelectedAt: string | null
  kycStatus: string
  referralCode: string
  wealthPassActive: boolean
  createdAt: string
}

interface UserState {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: UserProfile) => void
  setToken: (token: string) => void
  logout: () => void
  updateKycStatus: (status: string) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: true }),

  setToken: (token) =>
    set({ token }),

  logout: () =>
    set({ user: null, token: null, isAuthenticated: false }),

  updateKycStatus: (kycStatus) =>
    set((state) => ({
      user: state.user ? { ...state.user, kycStatus } : null,
    })),
}))
