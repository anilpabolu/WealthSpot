import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/hooks/usePlatformStats', () => ({
  usePlatformStats: vi.fn(() => ({
    data: { memberCount: 1200, capitalDeployed: 50000000, opportunities: 45, markets: 8, investors: 300 },
  })),
}))

vi.mock('@/hooks/useVaultConfig', () => ({
  useVaultConfig: vi.fn(() => ({
    introVideosEnabled: false,
    wealthEnabled: true,
    opportunityEnabled: true,
    communityEnabled: false,
  })),
}))

vi.mock('@/hooks/useSiteContent', () => ({
  useContent: (_s: string, _k: string, fallback: string) => fallback,
}))

vi.mock('@/components/OnboardingVideo', () => ({
  default: () => <div data-testid="onboarding-video" />,
}))

vi.mock('@clerk/react', () => ({
  useClerk: () => ({ openSignUp: vi.fn() }),
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import LandingPage from '@/pages/LandingPage'

describe('LandingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  const renderPage = () =>
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

  it('renders hero title', () => {
    renderPage()
    expect(screen.getByText('Private Access to Exceptional Real Asset Opportunities.')).toBeInTheDocument()
  })

  it('does not render hero CTA buttons', () => {
    renderPage()
    expect(screen.queryByText('Request Private Access')).not.toBeInTheDocument()
    expect(screen.queryByText('Explore WealthSpot')).not.toBeInTheDocument()
  })

  it('renders thesis section', () => {
    renderPage()
    expect(screen.getByText('WealthSpot Thesis')).toBeInTheDocument()
    expect(screen.getByText('Where access, judgment, and trust align.')).toBeInTheDocument()
  })

  it('renders platform stats labels', () => {
    renderPage()
    expect(screen.getByText('Platform Members')).toBeInTheDocument()
    expect(screen.getByText('Capital Deployed')).toBeInTheDocument()
  })

  it('renders vault sections', () => {
    renderPage()
    // The page has vault sections mentioning Wealth Vault, Opportunity Vault, Community Vault
    expect(screen.getByText(/Wealth Vault/)).toBeInTheDocument()
  })
})
