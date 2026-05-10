/**
 * User store (Zustand) – mirrors web's user.store.ts with all 8 roles.
 *
 * Tokens are NOT persisted here. They live only in expo-secure-store, wired
 * through `apps/mobile/src/lib/api.ts`. Persisting tokens to MMKV would put
 * them in plaintext on device.
 */

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'
import * as SecureStore from 'expo-secure-store'
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
  isAuthenticated: boolean
  token: string | null
  setUser: (user: UserProfile) => void
  setToken: (token: string) => void
  setTokens: (access: string, refresh: string) => Promise<void>
  logout: () => void
  updateKycStatus: (status: string) => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        token: null,

        setUser: (user) =>
          set({ user, isAuthenticated: true }),

        setToken: (token) => {
          SecureStore.setItemAsync('ws-token', token).catch(() => {})
          set({ token })
        },

        setTokens: async (access, refresh) => {
          await SecureStore.setItemAsync('ws-token', access)
          await SecureStore.setItemAsync('ws-refresh-token', refresh)
        },

        logout: () => {
          SecureStore.deleteItemAsync('ws-token').catch(() => {})
          SecureStore.deleteItemAsync('ws-refresh-token').catch(() => {})
          set({ user: null, token: null, isAuthenticated: false })
        },

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
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'UserStoreMobile' }
  )
)
