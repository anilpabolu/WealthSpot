import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('react-native-mmkv', () => ({
  MMKV: class {
    private _store: Record<string, string> = {}
    set(key: string, value: string) { this._store[key] = value }
    getString(key: string) { return this._store[key] ?? undefined }
    delete(key: string) { delete this._store[key] }
  },
}))

import { useUserStore } from '@/stores/user.store'

const testUser = {
  id: 'u1',
  email: 'investor@example.com',
  name: 'Test Investor',
  phone: '9876543210',
  role: 'investor' as const,
  roles: ['investor'],
  primaryRole: 'investor',
  builderApproved: false,
  personaSelectedAt: null,
  kycStatus: 'NOT_STARTED',
  referralCode: 'REF-ABCD',
  wealthPassActive: false,
  createdAt: '2025-01-01T00:00:00Z',
}

describe('mobile useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  })

  it('starts with empty state', () => {
    const s = useUserStore.getState()
    expect(s.user).toBeNull()
    expect(s.token).toBeNull()
    expect(s.isAuthenticated).toBe(false)
  })

  it('setUser marks authenticated', () => {
    useUserStore.getState().setUser(testUser)
    const s = useUserStore.getState()
    expect(s.user?.email).toBe('investor@example.com')
    expect(s.isAuthenticated).toBe(true)
  })

  it('setToken stores bearer token', () => {
    useUserStore.getState().setToken('jwt-token-123')
    expect(useUserStore.getState().token).toBe('jwt-token-123')
  })

  it('logout clears all state', () => {
    useUserStore.getState().setUser(testUser)
    useUserStore.getState().setToken('some-token')
    useUserStore.getState().logout()
    const s = useUserStore.getState()
    expect(s.user).toBeNull()
    expect(s.token).toBeNull()
    expect(s.isAuthenticated).toBe(false)
  })

  it('updateKycStatus updates kyc field on existing user', () => {
    useUserStore.getState().setUser(testUser)
    useUserStore.getState().updateKycStatus('APPROVED')
    expect(useUserStore.getState().user?.kycStatus).toBe('APPROVED')
  })

  it('updateKycStatus does nothing when no user', () => {
    useUserStore.getState().updateKycStatus('APPROVED')
    expect(useUserStore.getState().user).toBeNull()
  })
})
