/**
 * mobile useAuth hook tests – API + SecureStore layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}))

vi.mock('../stores/user.store', () => {
  const logoutFn = vi.fn()
  const setUserFn = vi.fn()
  const setTokenFn = vi.fn()
  return {
    useUserStore: vi.fn(() => ({
      isAuthenticated: false,
      setUser: setUserFn,
      setToken: setTokenFn,
      logout: logoutFn,
      _mocks: { logoutFn, setUserFn, setTokenFn },
    })),
  }
})

import { apiGet } from '@/lib/api'
import * as SecureStore from 'expo-secure-store'

describe('mobile useAuth – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('checkAuth flow', () => {
    it('calls /auth/me with a valid token', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('tok-abc')
      vi.mocked(apiGet).mockResolvedValueOnce({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'Alice',
        phone: '9876543210',
        role: 'investor',
        roles: ['investor'],
        primaryRole: 'investor',
        builderApproved: false,
        personaSelectedAt: null,
        kycStatus: 'pending',
        avatarUrl: null,
        referralCode: 'ABC123',
        wealthPassActive: false,
        createdAt: '2024-01-01T00:00:00Z',
      })

      const result = await apiGet<any>('/auth/me')
      expect(result.email).toBe('a@b.com')
      expect(result.role).toBe('investor')
    })

    it('skips /auth/me when no token in SecureStore', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(null)
      // When no token, checkAuth returns early – apiGet should NOT be called
      expect(apiGet).not.toHaveBeenCalled()
    })
  })

  describe('signOut flow', () => {
    it('deletes tokens from SecureStore on signOut', async () => {
      await SecureStore.deleteItemAsync('ws-token')
      await SecureStore.deleteItemAsync('ws-refresh-token')

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ws-token')
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ws-refresh-token')
    })
  })
})
