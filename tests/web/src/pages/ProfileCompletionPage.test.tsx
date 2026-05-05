import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui', () => ({
  Select: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}))

vi.mock('@/hooks/useProfileAPI', () => ({
  useFullProfile: vi.fn(),
  useUpdateProfileSection: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useSendOtp: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useVerifyOtp: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useProfileCompletionStatus: vi.fn(),
  useUpdatePhone: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  type: {} as never,
}))

vi.mock('@/hooks/useSiteContent', () => ({
  useContent: (_s: string, _k: string, fallback: string) => fallback,
}))

import ProfileCompletionPage from '@/pages/ProfileCompletionPage'
import { useFullProfile, useProfileCompletionStatus } from '@/hooks/useProfileAPI'

describe('ProfileCompletionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFullProfile).mockReturnValue({
      data: {
        id: 'u1',
        fullName: 'Test User',
        email: 'test@wealthspot.in',
        phone: '+919876543210',
        dateOfBirth: null,
        gender: null,
        occupation: null,
        interests: [],
        preferredCities: [],
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        pincode: null,
        country: 'India',
      },
      isLoading: false,
    } as never)
    vi.mocked(useProfileCompletionStatus).mockReturnValue({
      data: { isComplete: false, completionPercentage: 40, missingSections: ['interests', 'address'] },
      isLoading: false,
    } as never)
  })

  const renderPage = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ProfileCompletionPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders hero section', () => {
    renderPage()
    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
  })

  it('renders step 1 by default (About You)', () => {
    renderPage()
    expect(screen.getAllByText('About You').length).toBeGreaterThan(0)
  })

  it('renders all 4 step labels', () => {
    renderPage()
    const stepLabels = ['About You', 'Interests', 'Address', 'Verify']
    for (const label of stepLabels) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('shows completion hero subtitle', () => {
    renderPage()
    expect(screen.getByText(/Unlock premium features/i)).toBeInTheDocument()
  })

  it('renders Next button on step 1', () => {
    renderPage()
    const nextBtn = screen.queryByRole('button', { name: /next|continue|save/i })
    expect(nextBtn).toBeTruthy()
  })

  it('shows celebration when profile is already complete', () => {
    vi.mocked(useProfileCompletionStatus).mockReturnValue({
      data: { isComplete: true, completionPercentage: 100, missingSections: [] },
      isLoading: false,
    } as never)
    renderPage()
    // Celebration state shows 100% verified state
    expect(screen.getByText("You're 100% Verified! 🎉")).toBeInTheDocument()
  })
})
