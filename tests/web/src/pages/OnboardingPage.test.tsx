import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/* ── Mocks ── */
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('@/hooks/useVaultConfig', () => ({
  useVaultConfig: vi.fn(() => ({ introVideosEnabled: true })),
}))

const store: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true })

import OnboardingPage from '@/pages/OnboardingPage'

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete store['ws_onboarded']
  })

  const ui = () =>
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    )

  it('redirects to /vaults if already onboarded', () => {
    store['ws_onboarded'] = 'true'
    ui()
    expect(mockNavigate).toHaveBeenCalledWith('/vaults', { replace: true })
  })

  it('sets onboarded flag and navigates on mount', () => {
    ui()
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('ws_onboarded', 'true')
    expect(mockNavigate).toHaveBeenCalledWith('/vaults', { replace: true })
  })
})
