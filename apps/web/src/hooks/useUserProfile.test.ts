/**
 * web useUserProfile hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

vi.mock('@/stores/user.store', () => ({
  useUserStore: vi.fn(() => ({ isAuthenticated: true })),
}))

import { apiGet } from '@/lib/api'

describe('web useUserProfile – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches profile for authenticated user', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      id: 'u1',
      email: 'alice@example.com',
      fullName: 'Alice Smith',
      phone: '+91 98765 43210',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
      role: 'investor',
      kycStatus: 'APPROVED',
      referralCode: 'ALICE10',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      kycDocuments: [
        { id: 'd1', documentType: 'PAN', verificationStatus: 'VERIFIED', createdAt: '2024-06-01T00:00:00Z' },
      ],
      emailVerified: true,
      phoneVerified: false,
      profileCompletionPct: 85,
    })

    const result = await apiGet<any>('/auth/me')
    expect(result.fullName).toBe('Alice Smith')
    expect(result.kycStatus).toBe('APPROVED')
    expect(result.profileCompletionPct).toBe(85)
    expect(result.kycDocuments).toHaveLength(1)
  })

  it('returns minimal profile for new unverified user', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      id: 'u2',
      email: 'new@example.com',
      fullName: null,
      phone: null,
      avatarUrl: null,
      role: 'investor',
      kycStatus: 'NOT_STARTED',
      referralCode: null,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      kycDocuments: [],
      emailVerified: false,
      phoneVerified: false,
      profileCompletionPct: 0,
    })

    const result = await apiGet<any>('/auth/me')
    expect(result.kycStatus).toBe('NOT_STARTED')
    expect(result.kycDocuments).toHaveLength(0)
    expect(result.profileCompletionPct).toBe(0)
  })
})
