import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

/* ── Mocks ── */
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockApiPost = vi.fn()
vi.mock('@/lib/api', () => ({ apiPost: (...args: unknown[]) => mockApiPost(...args) }))
vi.mock('@/components/layout/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }))
vi.mock('@/components/layout/Footer', () => ({ default: () => <footer data-testid="footer" /> }))

import InviteAcceptPage from '@/pages/InviteAcceptPage'

describe('InviteAcceptPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const ui = (token = 'abc123') =>
    render(
      <MemoryRouter initialEntries={[`/invite/${token}`]}>
        <Routes>
          <Route path="/invite/:token" element={<InviteAcceptPage />} />
        </Routes>
      </MemoryRouter>,
    )

  it('shows loading spinner initially', () => {
    mockApiPost.mockReturnValue(new Promise(() => {})) // never resolves
    ui()
    expect(screen.getByText('Accepting invite…')).toBeInTheDocument()
  })

  it('shows success on resolved invite', async () => {
    mockApiPost.mockResolvedValue({ message: 'Welcome aboard!' })
    ui()
    await waitFor(() => expect(screen.getByText('Welcome!')).toBeInTheDocument())
    expect(screen.getByText('Welcome aboard!')).toBeInTheDocument()
  })

  it('shows error on rejected invite', async () => {
    mockApiPost.mockRejectedValue({ response: { data: { detail: 'Token expired' } } })
    ui()
    await waitFor(() => expect(screen.getByText('Invite Failed')).toBeInTheDocument())
    expect(screen.getByText('Token expired')).toBeInTheDocument()
  })

  it('renders navbar and footer', () => {
    mockApiPost.mockReturnValue(new Promise(() => {}))
    ui()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })
})
