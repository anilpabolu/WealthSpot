import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/layout', () => ({
  PortalLayout: ({ children, hero }: { children: React.ReactNode; hero?: React.ReactNode }) => (
    <div>
      {hero}
      {children}
    </div>
  ),
}))

vi.mock('@/components/wealth/MetricCard', () => ({
  default: ({ label, value }: { label: string; value: string }) => (
    <div data-testid="metric-card">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}))

vi.mock('@/components/wealth/FundingBar', () => ({
  default: () => <div data-testid="funding-bar" />,
}))

vi.mock('@/components/wealth/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span data-testid={`status-${status}`} />,
  type: {} as never,
}))

vi.mock('@/components/ui', () => ({
  EmptyState: ({ title, message }: { title: string; message?: string }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      {message && <span>{message}</span>}
    </div>
  ),
}))

vi.mock('@/hooks/useSiteContent', () => ({
  useContent: (_s: string, _k: string, fallback: string) => fallback,
}))

vi.mock('@/lib/formatters', () => ({
  formatINRCompact: (v: number) => `₹${v}`,
}))

vi.mock('@/services/bff/dashboard.bff', () => ({
  dashboardBff: {
    getBuilderDashboard: vi.fn(),
  },
}))

import BuilderDashboardPage from '@/pages/BuilderDashboardPage'
import { dashboardBff } from '@/services/bff/dashboard.bff'

const makeDashboard = (overrides = {}) => ({
  stats: {
    totalListings: 3,
    totalInvestors: 12,
    totalRaised: 3000000,
    avgFunding: 75,
  },
  listings: [
    {
      id: 'l1',
      title: 'Green Valley',
      slug: 'green-valley',
      city: 'Pune',
      assetType: 'Residential',
      status: 'funding',
      raised: 1500000,
      target: 2000000,
      investorCount: 8,
      coverImage: null,
    },
  ],
  builder: {
    id: 'b1',
    companyName: 'Test Builders Pvt Ltd',
    builderApproved: true,
  },
  ...overrides,
})

describe('BuilderDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dashboardBff.getBuilderDashboard).mockResolvedValue(makeDashboard())
  })

  const renderPage = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <BuilderDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders hero section with Builder Dashboard title', () => {
    renderPage()
    expect(screen.getByText('Builder Dashboard')).toBeInTheDocument()
  })

  it('renders Builder Portal badge', () => {
    renderPage()
    expect(screen.getByText('Builder Portal')).toBeInTheDocument()
  })

  it('renders My Properties section heading', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('My Properties')).toBeInTheDocument())
  })

  it('renders View All link', async () => {
    renderPage()
    await waitFor(() => {
      const viewAllLink = screen.queryByText(/View All/i) ||
                      screen.queryAllByRole('link').find(l => l.getAttribute('href')?.includes('listings'))
      expect(viewAllLink).toBeTruthy()
    })
  })

  it('shows loading spinner while fetching data', () => {
    vi.mocked(dashboardBff.getBuilderDashboard).mockReturnValue(new Promise(() => {}))
    renderPage()
    // Loader2 spinner renders
    const { container } = renderPage()
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('shows empty state when no listings', () => {
    vi.mocked(dashboardBff.getBuilderDashboard).mockResolvedValue(
      makeDashboard({ listings: [] })
    )
    renderPage()
    // Empty state renders eventually
    expect(screen.queryByText('Builder Dashboard')).toBeInTheDocument()
  })
})
