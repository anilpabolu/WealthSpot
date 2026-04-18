import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  apiPost: vi.fn(),
}))

vi.mock('@/stores/user.store', () => ({
  useUserStore: vi.fn(() => ({ user: { id: '1' }, setUser: vi.fn() })),
}))

vi.mock('@/hooks/useSiteContent', () => ({
  useContent: (_section: string, _key: string, fallback: string) => fallback,
}))

import PersonaSelectionPage from '@/pages/PersonaSelectionPage'
import { apiPost } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

describe('PersonaSelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <PersonaSelectionPage />
      </MemoryRouter>,
    )

  it('renders page title and subtitle', () => {
    renderPage()
    expect(screen.getByText('Choose Your Persona')).toBeInTheDocument()
    expect(screen.getByText(/Select how you want to use WealthSpot/)).toBeInTheDocument()
  })

  it('renders investor and builder persona cards', () => {
    renderPage()
    expect(screen.getByText('Investor')).toBeInTheDocument()
    expect(screen.getByText('Builder')).toBeInTheDocument()
  })

  it('investor is selected by default', () => {
    renderPage()
    // The continue button should be enabled since investor is selected
    const btn = screen.getByRole('button', { name: /continue/i })
    expect(btn).not.toBeDisabled()
  })

  it('redirects to /vaults when persona already selected', () => {
    vi.mocked(useUserStore).mockReturnValue({
      user: { id: '1', personaSelectedAt: '2024-01-01' } as never,
      setUser: vi.fn(),
    } as never)
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/vaults', { replace: true })
  })

  it('submits selected personas and navigates to /onboarding', async () => {
    vi.mocked(useUserStore).mockReturnValue({
      user: { id: '1' } as never,
      setUser: vi.fn(),
    } as never)
    vi.mocked(apiPost).mockResolvedValueOnce({
      roles: ['investor'],
      primaryRole: 'investor',
      personaSelectedAt: '2024-01-01',
      builderApproved: false,
    })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/auth/select-persona', {
        roles: ['investor'],
        primary_role: 'investor',
      })
    })
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding')
  })

  it('shows error message on submit failure', async () => {
    vi.mocked(apiPost).mockRejectedValueOnce(new Error('Network error'))

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/Failed to save persona selection/)).toBeInTheDocument()
    })
  })
})
