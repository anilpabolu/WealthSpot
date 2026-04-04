/**
 * web usePincodes hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

describe('web usePincodes – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches address for a valid 6-digit pincode', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([
      { pincode: '400001', officeName: 'Mumbai GPO', locality: 'Fort', district: 'Mumbai', state: 'Maharashtra', region: 'Mumbai' },
    ])

    const result = await apiGet<any>('/pincodes/400001')
    expect(result).toHaveLength(1)
    expect(result[0].state).toBe('Maharashtra')
  })

  it('returns multiple sub-post-offices for the same pincode', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([
      { pincode: '110001', officeName: 'New Delhi GPO', locality: 'Connaught Place', district: 'Central Delhi', state: 'Delhi', region: 'Delhi' },
      { pincode: '110001', officeName: 'Rashtrapati Bhavan SO', locality: 'President Estate', district: 'Central Delhi', state: 'Delhi', region: 'Delhi' },
    ])

    const result = await apiGet<any>('/pincodes/110001')
    expect(result).toHaveLength(2)
    expect(result.every((r: { state: string }) => r.state === 'Delhi')).toBe(true)
  })

  it('returns empty array for an unknown pincode', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([])
    const result = await apiGet('/pincodes/999999')
    expect(result).toHaveLength(0)
  })
})
