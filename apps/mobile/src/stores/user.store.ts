/**
 * User store (Zustand) – mirrors web's user.store.ts with all 8 roles.
 */

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'
import type { UserRole } from '../lib/constants'

const storage = new MMKV()
const mmkvZustandStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value)
  },
  getItem: (name: string) => {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem: (name: string) => {
    return storage.delete(name)
  },
}

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
  emailVerified?: boolean
  phoneVerified?: boolean
  profileCompletionPct?: number
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

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
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
      }),
      {
        name: 'ws-mobile-user-store',
        storage: createJSONStorage(() => mmkvZustandStorage),
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'UserStoreMobile' }
  )
)
