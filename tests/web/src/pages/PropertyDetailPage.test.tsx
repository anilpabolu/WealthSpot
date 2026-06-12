import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/wealth/FundingBar', () => ({
  default: ({ raised, target }: { raised: number; target: number }) => (
    <div data-testid="funding-bar" data-raised={raised} data-target={target} />
  ),
}))

vi.mock('@/components/wealth/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span data-testid={`status-${status}`}>{status}</span>,
  type: {} as never,
}))

vi.mock('@/components/wealth/PropertySpecsSection', () => ({
  PropertySpecsSection: () => <div data-testid="specs-section" />,
}))

vi.mock('@/components/AuthGateModal', () => ({
  default: ({ open }: { open: boolean }) => open ? <div data-testid="auth-gate-modal" /> : null,
}))

vi.mock('@/components/ui', () => ({
  EmptyState: ({ title, message, actionLabel }: { title: string; message: string; actionLabel?: string }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      {message && <span>{message}</span>}
      {actionLabel && <button>{actionLabel}</button>}
    </div>
  ),
}))

vi.mock('@/hooks/useProperties', () => ({
  useProperty: vi.fn(),
  type: {} as never,
}))

vi.mock('@/hooks/useVaultConfig', () => ({
  useVaultConfig: vi.fn(() => ({ propertyEmptySectionMode: 'hide' })),
}))

vi.mock('@/stores/investment.store', () => ({
  useInvestmentStore: vi.fn(() => ({ startInvestment: vi.fn() })),
}))

vi.mock('@/hooks/useKycBank', () => ({
  useKycStatus: vi.fn(() => ({ data: { kycStatus: 'approved' } })),
  type: {} as never,
}))

vi.mock('@/lib/api', () => ({
  apiPost: vi.fn(),
}))

vi.mock('@/lib/formatters', () => ({
  formatINR: (v: number) => `₹${v.toLocaleString()}`,
  formatINRCompact: (v: number) => `₹${v}`,
  daysRemaining: () => 30,
}))

import PropertyDetailPage from '@/pages/PropertyDetailPage'
import { useProperty } from '@/hooks/useProperties'

const makeProperty = () => ({
  id: 'prop-1',
  slug: 'sunrise-heights',
  title: 'Sunrise Heights',
  tagline: 'Premium residential project',
  description: 'A great property in the heart of Mumbai.',
  city: 'Mumbai',
  micromarket: 'Bandra',
  assetType: 'Residential',
  coverImage: 'https://example.com/img.jpg',
  gallery: ['https://example.com/img.jpg'],
  videoUrl: null,
  minInvestment: 25000,
  unitPrice: 5000,
  totalUnits: 200,
  soldUnits: 100,
  raised: 5000000,
  target: 10000000,
  raisedAmount: 5000000,
  targetAmount: 10000000,
  investorCount: 42,
  fundingPercentage: 50,
  status: 'funding',
  fundingDeadline: '2025-12-31T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  builder: { id: 'b1', companyName: 'Builder Co', verified: true },
})

describe('PropertyDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  const renderPage = (slug = 'sunrise-heights') => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[`/property/${slug}`]}>
          <Routes>
            <Route path="/property/:slug" element={<PropertyDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('shows loading skeleton while fetching', () => {
    vi.mocked(useProperty).mockReturnValue({ data: undefined, isLoading: true } as never)
    const { container } = renderPage()
    expect(container.querySelector('.skeleton')).toBeTruthy()
  })

  it('shows not-found state when property is null', () => {
    vi.mocked(useProperty).mockReturnValue({ data: null, isLoading: false } as never)
    renderPage()
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Property Not Found')).toBeInTheDocument()
  })

  it('renders property title and city', () => {
    vi.mocked(useProperty).mockReturnValue({ data: makeProperty(), isLoading: false } as never)
    renderPage()
    expect(screen.getAllByText('Sunrise Heights').length).toBeGreaterThan(0)
    expect(screen.getByText(/Bandra.*Mumbai|Mumbai.*Bandra/)).toBeInTheDocument()
  })

  it('renders status badge', () => {
    vi.mocked(useProperty).mockReturnValue({ data: makeProperty(), isLoading: false } as never)
    renderPage()
    expect(screen.getAllByTestId('status-funding').length).toBeGreaterThan(0)
  })

  it('renders funding bar', () => {
    vi.mocked(useProperty).mockReturnValue({ data: makeProperty(), isLoading: false } as never)
    renderPage()
    expect(screen.getByTestId('funding-bar')).toBeInTheDocument()
  })

  it('shows invest button for live property', () => {
    vi.mocked(useProperty).mockReturnValue({ data: makeProperty(), isLoading: false } as never)
    renderPage()
    const investBtn = screen.queryByRole('button', { name: /invest now|invest/i })
    // Button visible for live (funding) status
    expect(investBtn).toBeTruthy()
  })

  it('shows marketplace breadcrumb', () => {
    vi.mocked(useProperty).mockReturnValue({ data: makeProperty(), isLoading: false } as never)
    renderPage()
    expect(screen.getByText('Marketplace')).toBeInTheDocument()
  })
})
