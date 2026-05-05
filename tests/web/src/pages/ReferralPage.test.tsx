import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui', () => ({
  EmptyState: ({ title, message }: { title: string; message?: string }) => (
    <div data-testid="empty-state">
      <span data-testid="empty-title">{title}</span>
      {message && <span data-testid="empty-message">{message}</span>}
    </div>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/hooks/useReferrals', () => ({
  useReferralStats: vi.fn(),
  useReferralHistory: vi.fn(),
  type: {} as never,
}))

vi.mock('@/hooks/useSiteContent', () => ({
  useContent: (_s: string, _k: string, fallback: string) => fallback,
}))

vi.mock('@/lib/formatters', () => ({
  formatINR: (v: number) => `₹${v.toLocaleString()}`,
}))

import ReferralPage from '@/pages/ReferralPage'
import { useReferralStats, useReferralHistory } from '@/hooks/useReferrals'

describe('ReferralPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useReferralStats).mockReturnValue({
      data: {
        referralCode: 'WLTH2025',
        referralLink: 'https://wealthspot.in/signup?ref=WLTH2025',
        totalReferrals: 5,
        successfulReferrals: 2,
        totalRewards: 500,
      },
      isLoading: false,
    } as never)
    vi.mocked(useReferralHistory).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)
  })

  const renderPage = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ReferralPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders hero section', () => {
    renderPage()
    expect(screen.getByText('The Referral Hustle')).toBeInTheDocument()
  })

  it('displays referral code', () => {
    renderPage()
    expect(screen.getByText('WLTH2025')).toBeInTheDocument()
  })

  it('renders How It Works section', () => {
    renderPage()
    expect(screen.getByText('How It Works')).toBeInTheDocument()
  })

  it('renders 3 how-it-works steps', () => {
    renderPage()
    expect(screen.getByText('Share Your Code')).toBeInTheDocument()
    expect(screen.getByText('Friend Signs Up')).toBeInTheDocument()
    expect(screen.getByText(/Both Earn/)).toBeInTheDocument()
  })

  it('shows empty state when no referral history', () => {
    renderPage()
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByTestId('empty-title')).toHaveTextContent('No Referrals Yet')
  })

  it('shows referral history when data is present', () => {
    vi.mocked(useReferralHistory).mockReturnValue({
      data: [
        { id: 'r1', refereeName: 'Test Friend', status: 'invested', rewardAmount: 25000, createdAt: '2024-06-01T00:00:00Z' },
      ],
      isLoading: false,
    } as never)
    renderPage()
    expect(screen.getByText('Test Friend')).toBeInTheDocument()
  })

  it('renders copy button for referral code', () => {
    renderPage()
    const copyBtn = screen.queryByRole('button', { name: /copy/i }) ||
                    screen.queryAllByRole('button').find(b => b.querySelector('svg'))
    expect(copyBtn).toBeTruthy()
  })

  it('shows loading state while stats are loading', () => {
    vi.mocked(useReferralStats).mockReturnValue({ data: undefined, isLoading: true } as never)
    vi.mocked(useReferralHistory).mockReturnValue({ data: undefined, isLoading: true } as never)
    renderPage()
    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0)
  })
})
