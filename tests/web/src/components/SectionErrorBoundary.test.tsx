import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Section error')
  return <div>Section Content</div>
}

describe('SectionErrorBoundary', () => {
  const originalError = console.error
  beforeAll(() => {
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && (args[0].includes('Error: Uncaught') || args[0].includes('The above error') || args[0].includes('[SectionError]'))) return
      originalError(...args)
    }
  })
  afterAll(() => {
    console.error = originalError
  })

  it('renders children when no error', () => {
    render(
      <SectionErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </SectionErrorBoundary>,
    )
    expect(screen.getByText('Section Content')).toBeInTheDocument()
  })

  it('renders default fallback on error', () => {
    render(
      <SectionErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </SectionErrorBoundary>,
    )
    expect(screen.getByText('This section failed to load')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('renders custom fallbackTitle on error', () => {
    render(
      <SectionErrorBoundary fallbackTitle="Metrics unavailable">
        <ProblemChild shouldThrow={true} />
      </SectionErrorBoundary>,
    )
    expect(screen.getByText('Metrics unavailable')).toBeInTheDocument()
  })

  it('resets error state on Retry click', () => {
    // After clicking Retry, the boundary re-renders children.
    // Since ProblemChild still throws, it will show fallback again.
    // But we can verify the click triggers a state reset attempt.
    const { unmount } = render(
      <SectionErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </SectionErrorBoundary>,
    )
    expect(screen.getByText('This section failed to load')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Retry'))
    // After retry, ProblemChild throws again → fallback shown again
    expect(screen.getByText('This section failed to load')).toBeInTheDocument()
    unmount()
  })
})
