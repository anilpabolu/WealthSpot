import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

export interface UserProfile {
  id: string
  email: string
  name: string
  phone: string
  avatarUrl?: string
  role: 'investor' | 'builder' | 'admin' | 'lender' | 'founder' | 'community_lead' | 'approver' | 'super_admin'
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
          set({ user, isAuthenticated: true }, false, 'setUser'),

        setToken: (token) => {
          localStorage.setItem('ws_token', token)
          set({ token }, false, 'setToken')
        },

        logout: () => {
          localStorage.removeItem('ws_token')
          localStorage.removeItem('ws_refresh_token')
          set({ user: null, token: null, isAuthenticated: false }, false, 'logout')
        },

        updateKycStatus: (kycStatus) =>
          set(
            (state) => ({
              user: state.user ? { ...state.user, kycStatus } : null,
            }),
            false,
            'updateKycStatus'
          ),
      }),
      {
        name: 'ws-user-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'UserStore' }
  )
)
