import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/useVaultFeatures', () => ({
  useCanAccess: vi.fn(),
}))

import FeatureGate from '@/components/FeatureGate'
import { useCanAccess } from '@/hooks/useVaultFeatures'

describe('FeatureGate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders children when access is allowed', () => {
    vi.mocked(useCanAccess).mockReturnValue({ allowed: true, isLoading: false } as never)
    render(
      <FeatureGate vault="wealth" feature="invest">
        <div>Protected Content</div>
      </FeatureGate>,
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders fallback when access denied', () => {
    vi.mocked(useCanAccess).mockReturnValue({ allowed: false, isLoading: false } as never)
    render(
      <FeatureGate vault="wealth" feature="invest" fallback={<div>Access Denied</div>}>
        <div>Protected Content</div>
      </FeatureGate>,
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('renders nothing (null fallback) when access denied and no fallback', () => {
    vi.mocked(useCanAccess).mockReturnValue({ allowed: false, isLoading: false } as never)
    const { container } = render(
      <FeatureGate vault="wealth" feature="invest">
        <div>Protected Content</div>
      </FeatureGate>,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing while loading', () => {
    vi.mocked(useCanAccess).mockReturnValue({ allowed: false, isLoading: true } as never)
    const { container } = render(
      <FeatureGate vault="wealth" feature="invest">
        <div>Protected Content</div>
      </FeatureGate>,
    )
    expect(container.innerHTML).toBe('')
  })

  it('passes vault and feature to useCanAccess', () => {
    vi.mocked(useCanAccess).mockReturnValue({ allowed: true, isLoading: false } as never)
    render(
      <FeatureGate vault="opportunity" feature="eoi">
        <div>Content</div>
      </FeatureGate>,
    )
    expect(useCanAccess).toHaveBeenCalledWith('opportunity', 'eoi')
  })
})
