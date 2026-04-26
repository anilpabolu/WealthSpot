import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/components/layout/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }))
vi.mock('@/components/layout/Footer', () => ({ default: () => <footer data-testid="footer" /> }))

vi.mock('@/components/ui', () => ({
  EmptyState: ({ title, message }: { title: string; message: string }) => (
    <div data-testid="empty-state">{title}: {message}</div>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/components/VaultComingSoonOverlay', () => ({
  VaultComingSoonPortfolioCard: () => null,
}))

vi.mock('@/hooks/usePortfolio', () => ({
  usePortfolioSummary: vi.fn(),
  usePortfolioProperties: vi.fn(),
  useRecentTransactions: vi.fn(),
  useVaultWisePortfolio: vi.fn(),
  usePortfolioHoldings: vi.fn(),
  useSnapshotConfig: vi.fn(),
  useOpportunityAppreciationHistory: vi.fn(),
  type: {} as never,
}))

vi.mock('@/hooks/useOpportunityActions', () => ({
  useUserActivities: vi.fn(() => ({ data: [] })),
  type: {} as never,
}))

vi.mock('@/hooks/useProfiling', () => ({
  useOverallProgress: vi.fn(),
}))

vi.mock('@/hooks/useVaultConfig', () => ({
  useVaultConfig: vi.fn(() => ({
    isVaultEnabled: () => true,
  })),
}))

vi.mock('@/hooks/useSiteContent', () => ({
  useContent: (_s: string, _k: string, fallback: string) => fallback,
}))

vi.mock('@/stores/user.store', () => ({
  useUserStore: vi.fn((selector?: (s: unknown) => unknown) =>
    selector ? selector({ user: { role: 'investor' } }) : { user: { role: 'investor' } }
  ),
}))

import PortfolioPage from '@/pages/PortfolioPage'
import { usePortfolioSummary, usePortfolioProperties, useRecentTransactions, useVaultWisePortfolio, usePortfolioHoldings, useSnapshotConfig, useOpportunityAppreciationHistory } from '@/hooks/usePortfolio'
import { useOverallProgress } from '@/hooks/useProfiling'

describe('PortfolioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOverallProgress).mockReturnValue({
      data: { vaults: { wealth: { isComplete: true } } },
      isLoading: false,
    } as never)
    vi.mocked(usePortfolioSummary).mockReturnValue({
      data: { totalInvested: 500000, currentValue: 600000, totalReturns: 100000, xirr: 15.2, propertiesCount: 3, citiesCount: 2, assetAllocation: [], monthlyReturns: [] },
      isLoading: false,
    } as never)
    vi.mocked(usePortfolioProperties).mockReturnValue({
      data: [{ propertyId: 'p1', propertyTitle: 'Test Property', propertyCity: 'Mumbai', assetType: 'Residential', propertyImage: '', investedAmount: 100000, currentValue: 120000, returnPercentage: 20, units: 10, irr: 14.5, investedAt: '2024-01-01' }],
      isLoading: false,
    } as never)
    vi.mocked(useRecentTransactions).mockReturnValue({
      data: [{ id: 't1', type: 'investment', amount: 50000, date: '2024-01-15', propertyTitle: 'Test', status: 'confirmed' }],
      isLoading: false,
    } as never)
    vi.mocked(useVaultWisePortfolio).mockReturnValue({
      data: { vaults: [{ vaultType: 'wealth', totalInvested: 500000, currentValue: 600000, returns: 100000, returnPct: 20, expectedIrr: 15, opportunityCount: 3, avgDurationDays: 180 }], grandTotalInvested: 500000, grandCurrentValue: 600000, grandReturns: 100000, grandReturnPct: 20 },
      isLoading: false,
    } as never)
    vi.mocked(usePortfolioHoldings).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)
    vi.mocked(useSnapshotConfig).mockReturnValue({
      data: { sections: [] },
      isLoading: false,
    } as never)
    vi.mocked(useOpportunityAppreciationHistory).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    )

  it('renders portfolio hero', () => {
    renderPage()
    expect(screen.getByText('The War Chest')).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
  })

  it('renders Holdings section', () => {
    renderPage()
    expect(screen.getByText('Holdings')).toBeInTheDocument()
  })

  it('shows profiling gate for investor without completed DNA', () => {
    vi.mocked(useOverallProgress).mockReturnValue({
      data: { vaults: { wealth: { isComplete: false } } },
      isLoading: false,
    } as never)
    renderPage()
    expect(screen.getByText(/Complete Your Profile First/)).toBeInTheDocument()
  })

  it('renders vault-wise breakdown section', () => {
    renderPage()
    expect(screen.getByText('Vault-Wise Breakdown')).toBeInTheDocument()
  })

  it('renders recent transactions section', () => {
    renderPage()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })
})
