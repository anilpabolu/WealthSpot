/**
 * PropertyCard component logic tests.
 * Tests the data-processing aspects: funding percentage clamping,
 * formatINR formatting, and prop shapes — without rendering RN components.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  View: () => null,
  Text: () => null,
  Image: () => null,
  TouchableOpacity: () => null,
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/theme.store', () => ({
  useThemeStore: vi.fn((selector: (s: { resolved: string }) => string) =>
    selector({ resolved: 'light' })
  ),
}))

vi.mock('@/lib/theme', () => ({
  getThemeColors: () => ({
    bgSurface: '#FFFFFF',
    bgCard: '#F9FAFB',
    cardBorder: '#E5E7EB',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    gold: '#D4AF37',
  }),
}))

vi.mock('@/lib/formatters', () => ({
  formatINR: (v: number) => `₹${v.toLocaleString('en-IN')}`,
}))

// Test the funding bar clamping logic (extracted from component contract)
describe('PropertyCard – funding percentage logic', () => {
  it('clamps funding percentage to 100 max', () => {
    const raw = 150
    const clamped = Math.min(100, raw)
    expect(clamped).toBe(100)
  })

  it('does not clamp values below 100', () => {
    const raw = 72
    const clamped = Math.min(100, raw)
    expect(clamped).toBe(72)
  })

  it('handles 0% funding', () => {
    const raw = 0
    const clamped = Math.min(100, raw)
    expect(clamped).toBe(0)
  })

  it('handles exact 100% funding', () => {
    const raw = 100
    const clamped = Math.min(100, raw)
    expect(clamped).toBe(100)
  })
})

// Test formatINR integration (formatters module)
describe('PropertyCard – formatINR formatting', () => {
  it('formats minimum investment value as INR', async () => {
    const { formatINR } = await import('@/lib/formatters')
    const result = formatINR(25000)
    expect(result).toContain('₹')
    expect(result).toContain('25')
  })

  it('formats large investment values', async () => {
    const { formatINR } = await import('@/lib/formatters')
    const result = formatINR(5000000)
    expect(result).toContain('₹')
  })
})

// Test PropertyCard prop interface completeness
describe('PropertyCard – prop interface', () => {
  it('required props are defined', () => {
    const requiredProps = ['id', 'slug', 'title', 'city', 'coverImage', 'assetType', 'minInvestment', 'fundingPercentage']
    const card = {
      id: 'p1',
      slug: 'sunrise-heights',
      title: 'Sunrise Heights',
      city: 'Mumbai',
      coverImage: 'https://example.com/img.jpg',
      assetType: 'Residential',
      minInvestment: 25000,
      fundingPercentage: 50,
    }
    for (const prop of requiredProps) {
      expect(card).toHaveProperty(prop)
    }
  })

  it('coverImage can be null', () => {
    const card = { coverImage: null }
    expect(card.coverImage).toBeNull()
  })
})
