import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFoundPage from '@/pages/NotFoundPage'

describe('NotFoundPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

  it('renders 404 text', () => {
    renderPage()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('shows "Page not found" message', () => {
    renderPage()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('has a Go Home link pointing to /', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('has a Go Back button that calls history.back', () => {
    const spy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
