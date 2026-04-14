import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock zustand/middleware so persist is a pass-through — avoids jsdom localStorage issues.
vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zustand/middleware')>()
  return {
    ...actual,
    persist: (fn: unknown) => fn,
  }
})

// Provide a minimal localStorage mock for the store's direct calls
const lsStore: Record<string, string> = {}
const mockStorage = {
  getItem: vi.fn((key: string) => lsStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { lsStore[key] = value }),
  removeItem: vi.fn((key: string) => { delete lsStore[key] }),
  clear: vi.fn(() => { for (const k in lsStore) delete lsStore[k] }),
  get length() { return Object.keys(lsStore).length },
  key: vi.fn((i: number) => Object.keys(lsStore)[i] ?? null),
}
vi.stubGlobal('localStorage', mockStorage)

import { useUserStore } from './user.store'

const testUser = {
  id: 'u1',
  email: 'test@example.com',
  name: 'Test User',
  phone: '9876543210',
  role: 'investor' as const,
  roles: ['investor'],
  primaryRole: 'investor',
  builderApproved: false,
  personaSelectedAt: null,
  kycStatus: 'NOT_STARTED',
  referralCode: 'ABCD1234',
  wealthPassActive: false,
  createdAt: '2025-01-01T00:00:00Z',
}

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('starts with no user', () => {
    const state = useUserStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setUser marks authenticated', () => {
    useUserStore.getState().setUser(testUser)
    const state = useUserStore.getState()
    expect(state.user?.email).toBe('test@example.com')
    expect(state.isAuthenticated).toBe(true)
  })

  it('setToken persists to localStorage', () => {
    useUserStore.getState().setToken('jwt-abc')
    expect(mockStorage.setItem).toHaveBeenCalledWith('ws_token', 'jwt-abc')
    expect(useUserStore.getState().token).toBe('jwt-abc')
  })

  it('logout clears everything', () => {
    useUserStore.getState().setUser(testUser)
    useUserStore.getState().setToken('jwt-abc')
    useUserStore.getState().logout()

    const state = useUserStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(mockStorage.removeItem).toHaveBeenCalledWith('ws_token')
    expect(mockStorage.removeItem).toHaveBeenCalledWith('ws_refresh_token')
  })

  it('updateKycStatus updates user kyc', () => {
    useUserStore.getState().setUser(testUser)
    useUserStore.getState().updateKycStatus('APPROVED')
    expect(useUserStore.getState().user?.kycStatus).toBe('APPROVED')
  })

  it('updateKycStatus does nothing when no user', () => {
    useUserStore.getState().updateKycStatus('APPROVED')
    expect(useUserStore.getState().user).toBeNull()
  })
})
