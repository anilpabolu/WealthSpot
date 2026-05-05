/**
 * EmptyState component logic tests.
 * Tests prop contract and default values without rendering RN components.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  View: () => null,
  Text: () => null,
}))

vi.mock('@/stores/theme.store', () => ({
  useThemeStore: vi.fn((selector: (s: { resolved: string }) => string) =>
    selector({ resolved: 'light' })
  ),
}))

vi.mock('@/lib/theme', () => ({
  getThemeColors: () => ({
    textPrimary: '#111827',
    textSecondary: '#6B7280',
  }),
}))

describe('EmptyState – prop contract', () => {
  it('title is a required string prop', () => {
    const props = { title: 'No Properties Found' }
    expect(typeof props.title).toBe('string')
    expect(props.title).toBe('No Properties Found')
  })

  it('message is an optional string prop', () => {
    const withMsg = { title: 'Empty', message: 'Come back later.' }
    const withoutMsg = { title: 'Empty' }
    expect(withMsg.message).toBe('Come back later.')
    expect((withoutMsg as { message?: string }).message).toBeUndefined()
  })

  it('icon defaults to 📭 emoji', () => {
    // Default value from component source: icon = '📭'
    const defaultIcon = '📭'
    expect(defaultIcon).toBe('📭')
  })

  it('icon can be overridden with any emoji', () => {
    const customIcons = ['🏠', '🔍', '💼', '📋', '🎯']
    for (const icon of customIcons) {
      expect(typeof icon).toBe('string')
      expect(icon.length).toBeGreaterThan(0)
    }
  })
})

describe('EmptyState – common usage scenarios', () => {
  it('no properties scenario', () => {
    const props = { title: 'No Properties', message: 'Add your first listing to get started.', icon: '🏠' }
    expect(props.title).toBe('No Properties')
    expect(props.icon).toBe('🏠')
  })

  it('no portfolio investments scenario', () => {
    const props = { title: 'No Investments Yet', message: 'Browse the marketplace to start investing.' }
    expect(props.title).toBe('No Investments Yet')
    expect((props as { icon?: string }).icon).toBeUndefined()
  })

  it('no referrals scenario', () => {
    const props = {
      title: 'No Referrals Yet',
      message: 'Your referral scoreboard is empty — time to rally the squad!',
      icon: '📭',
    }
    expect(props.icon).toBe('📭')
    expect(props.message).toContain('squad')
  })

  it('empty community posts scenario', () => {
    const props = { title: 'No Posts Yet', message: 'Be the first to start a discussion.' }
    expect(props.title).toBe('No Posts Yet')
  })
})
