import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

  const renderPage = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders hero headlines', () => {
    renderPage()
    expect(screen.getByText('Invest together in')).toBeInTheDocument()
    expect(screen.getByText('curated opportunities.')).toBeInTheDocument()
  })

  it('does not render hero CTA buttons', () => {
    renderPage()
    expect(screen.queryByText('Request Private Access')).not.toBeInTheDocument()
    expect(screen.queryByText('Explore WealthSpot')).not.toBeInTheDocument()
  })

  it('renders intro section', () => {
    renderPage()
    expect(screen.getByText('Is WealthSpot For Me?')).toBeInTheDocument()
  })

  it('renders vault sections', () => {
    renderPage()
    // The page has vault sections mentioning Wealth Vault, Opportunity Vault, Community Vault
    expect(screen.getByText(/Wealth Vault/)).toBeInTheDocument()
  })
})
