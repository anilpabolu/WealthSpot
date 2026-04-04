/**
 * mobile usePincodes hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '../lib/api'

describe('mobile usePincodes – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches address details for a 6-digit pincode', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([
      { pincode: '400001', officeName: 'Mumbai GPO', locality: 'Fort', district: 'Mumbai', state: 'Maharashtra', region: 'Mumbai' },
    ])

      const result = await apiGet<any>('/pincodes/400001')
    expect(result).toHaveLength(1)
    expect(result[0].state).toBe('Maharashtra')
    expect(result[0].district).toBe('Mumbai')
  })

  it('returns multiple post offices for one pincode', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([
      { pincode: '110001', officeName: 'New Delhi GPO', locality: 'Connaught Place', district: 'Central Delhi', state: 'Delhi', region: 'Delhi' },
      { pincode: '110001', officeName: 'Rashtrapati Bhavan SO', locality: 'President Estate', district: 'Central Delhi', state: 'Delhi', region: 'Delhi' },
    ])

      const result = await apiGet<any>('/pincodes/110001')
    expect(result).toHaveLength(2)
    expect(result[0].state).toBe('Delhi')
  })

  it('returns empty array for unknown pincode', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([])
    const result = await apiGet('/pincodes/999999')
    expect(result).toHaveLength(0)
  })
})
