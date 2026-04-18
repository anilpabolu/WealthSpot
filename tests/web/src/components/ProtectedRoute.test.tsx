import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@clerk/react', () => ({
  useUser: vi.fn(),
}))

import ProtectedRoute from '@/components/ProtectedRoute'
import { useUser } from '@clerk/react'

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders children when user is authenticated', () => {
    vi.mocked(useUser).mockReturnValue({ isLoaded: true, user: { id: 'u1' } } as never)
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('redirects to / when no user', () => {
    vi.mocked(useUser).mockReturnValue({ isLoaded: true, user: null } as never)
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Landing Page</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
    expect(screen.getByText('Landing Page')).toBeInTheDocument()
  })

  it('renders nothing while loading', () => {
    vi.mocked(useUser).mockReturnValue({ isLoaded: false, user: null } as never)
    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )
    expect(container.innerHTML).toBe('')
  })
})
