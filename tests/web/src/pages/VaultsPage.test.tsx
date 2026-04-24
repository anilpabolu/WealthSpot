import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock layout
vi.mock('@/components/layout/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}))
vi.mock('@/components/layout/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))
vi.mock('@/components/VaultProfilingModal', () => ({
  default: ({ vaultType }: { vaultType: string; onClose: () => void }) => (
    <div data-testid="vault-profiling-modal">{vaultType}</div>
  ),
}))
vi.mock('@/components/CreateOpportunityModal', () => ({
  default: () => null,
}))
vi.mock('@/components/CommunitySubtypeModal', () => ({
  default: () => null,
  type: {} as never,
}))
vi.mock('@/components/VaultComingSoonOverlay', () => ({
  default: () => null,
  getVaultComingSoonText: () => ({ headline: '', body: '', subtext: '', button: 'Coming Soon' }),
}))

// Mock hooks
vi.mock('@/hooks/useProfileAPI', () => ({
  useProfileCompletionStatus: vi.fn(() => ({
    data: { percentage: 80, completedSteps: 4, totalSteps: 5, completedSections: [] },
    isLoading: false,
  })),
}))
vi.mock('@/hooks/useProfiling', () => ({
  useProfilingProgress: vi.fn(() => ({ data: { completionPct: 50 }, isLoading: false })),
  useOverallProgress: vi.fn(() => ({
    data: { vaults: { wealth: { isComplete: false }, opportunity: { isComplete: false }, community: { isComplete: false } } },
    isLoading: false,
  })),
  useRecordExplorer: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))
vi.mock('@/hooks/useOpportunities', () => ({
  useVaultStats: vi.fn(() => ({
    data: [
      { vaultType: 'wealth', totalInvested: 5000000, investorCount: 42, opportunityCount: 8, expectedIrr: 14, actualIrr: 12.5, explorerCount: 120, dnaInvestorCount: 15, minInvestment: 10000, avgTicketSize: 50000, citiesCovered: 5, sectorsCovered: 3, coInvestorCount: 0, coPartnerCount: 0, platformUsersCount: 200, listingsCount: 8, avgInterestRate: 9, avgProjectSize: 0, collaborationRate: 0 },
      { vaultType: 'opportunity', totalInvested: 2000000, investorCount: 18, opportunityCount: 5, expectedIrr: 22, actualIrr: null, explorerCount: 60, dnaInvestorCount: 8, minInvestment: 50000, avgTicketSize: 100000, citiesCovered: 3, sectorsCovered: 6, coInvestorCount: 0, coPartnerCount: 0, platformUsersCount: 200, listingsCount: 5, avgInterestRate: 0, avgProjectSize: 0, collaborationRate: 0 },
      { vaultType: 'community', totalInvested: 800000, investorCount: 10, opportunityCount: 3, expectedIrr: null, actualIrr: null, explorerCount: 30, dnaInvestorCount: 4, minInvestment: 5000, avgTicketSize: 25000, citiesCovered: 4, sectorsCovered: 2, coInvestorCount: 12, coPartnerCount: 7, platformUsersCount: 200, listingsCount: 3, avgInterestRate: 0, avgProjectSize: 100000, collaborationRate: 0.6 },
    ],
    isLoading: false,
  })),
  useOpportunities: vi.fn(() => ({ data: { items: [] }, isLoading: false })),
  type: {} as never,
}))
vi.mock('@/hooks/useAppVideos', () => ({
  usePublicVideos: vi.fn(() => ({ data: [], isLoading: false })),
}))
vi.mock('@/hooks/useVaultConfig', () => ({
  useVaultConfig: vi.fn(() => ({
    wealthEnabled: true,
    opportunityEnabled: true,
    communityEnabled: true,
    isVaultEnabled: () => true,
  })),
}))
vi.mock('@/hooks/useVaultMetricsConfig', () => ({
  useVaultMetricsConfig: vi.fn(() => ({
    data: {
      wealth: ['total_invested', 'investor_count', 'explorer_count', 'dna_investor_count', 'properties_listed', 'min_investment', 'cities_covered'],
      opportunity: ['total_invested', 'investor_count', 'explorer_count', 'dna_investor_count', 'startups_listed', 'avg_ticket_size', 'sectors_covered'],
      community: ['total_invested', 'investor_count', 'explorer_count', 'dna_investor_count', 'projects_launched', 'co_investors', 'co_partners', 'avg_project_size', 'cities_covered'],
    },
    isLoading: false,
  })),
}))
vi.mock('@/hooks/useSiteContent', () => ({
  useContent: vi.fn((_page: string, _tag: string, fallback: string) => fallback),
}))
vi.mock('@/stores/user.store', () => ({
  useUserStore: vi.fn((selector?: (s: unknown) => unknown) =>
    selector
      ? selector({ user: { id: '1', role: 'investor', fullName: 'Test User' } })
      : { user: { id: '1', role: 'investor', fullName: 'Test User' } }
  ),
}))

import VaultsPage from '@/pages/VaultsPage'

describe('VaultsPage', () => {
  let qc: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderPage = () =>
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/vaults']}>
          <VaultsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

  it('renders all three vault cards', () => {
    renderPage()
    expect(screen.getByText('Wealth Vault')).toBeInTheDocument()
    expect(screen.getByText('Safe Vault')).toBeInTheDocument()
    expect(screen.getByText('Community Vault')).toBeInTheDocument()
  })

  it('renders navbar and footer', () => {
    renderPage()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('displays live metrics from API data', () => {
    renderPage()
    // Wealth vault should show investor count of 42
    expect(screen.getByText('42')).toBeInTheDocument()
    // Cities covered metrics should be present
    expect(screen.getAllByText('Cities Covered').length).toBeGreaterThanOrEqual(1)
  })

  it('displays formatted investment amounts', () => {
    renderPage()
    // ₹50 L for wealth (5000000)
    expect(screen.getByText('₹50.0 L')).toBeInTheDocument()
  })

  it('renders profiling percentage circles', () => {
    renderPage()
    // 50% profiling progress
    const percentages = screen.getAllByText('50%')
    expect(percentages.length).toBeGreaterThanOrEqual(1)
  })

  it('renders CTA buttons for each vault', () => {
    renderPage()
    expect(screen.getByText('Explore Properties')).toBeInTheDocument()
  })

  it('renders metric labels', () => {
    renderPage()
    expect(screen.getAllByText('Total Invested').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Investors').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Explorers').length).toBeGreaterThanOrEqual(1)
  })

  it('shows DNA Investors count', () => {
    renderPage()
    expect(screen.getByText('15')).toBeInTheDocument()
  })
})
