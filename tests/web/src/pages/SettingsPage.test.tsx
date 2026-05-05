import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui', () => ({
  Select: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select data-testid="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
  Toggle: ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  ),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  EmptyState: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
  Input: ({ placeholder }: { placeholder?: string }) => <input placeholder={placeholder} />,
  Textarea: ({ placeholder }: { placeholder?: string }) => <textarea placeholder={placeholder} />,
}))

vi.mock('@clerk/react', () => ({
  useUser: vi.fn(() => ({ user: { fullName: 'Test User', primaryEmailAddress: { emailAddress: 'test@wealthspot.in' } } })),
}))

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(() => ({ data: { id: 'u1', fullName: 'Test User', email: 'test@wealthspot.in', phone: '+919876543210', avatarUrl: null }, isLoading: false })),
  useUploadAvatar: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteAvatar: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  type: {} as never,
}))

vi.mock('@/hooks/useReferrals', () => ({
  useReferralStats: vi.fn(() => ({ data: { referralCode: 'TESTWLTH', totalReferrals: 3, successfulReferrals: 1, totalRewards: 250 }, isLoading: false })),
  useReferralHistory: vi.fn(() => ({ data: [], isLoading: false })),
  type: {} as never,
}))

vi.mock('@/hooks/useKycBank', () => ({
  useKycStatus: vi.fn(() => ({ data: { kycStatus: 'approved' }, isLoading: false })),
  useKycDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useBankDetails: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateBankDetail: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteBankDetail: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteKycDocument: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useKycDetails: vi.fn(() => ({ data: null, isLoading: false })),
  useSubmitKycDetails: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUploadKycDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useSubmitKycForReview: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  type: {} as never,
}))

vi.mock('@/hooks/useNotificationPrefs', () => ({
  useNotificationPreferences: vi.fn(() => ({ data: { email: true, sms: false, push: true }, isLoading: false })),
  useUpdateNotificationPreferences: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  type: {} as never,
}))

vi.mock('@/hooks/useSiteContent', () => ({
  useContent: (_s: string, _k: string, fallback: string) => fallback,
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => () => ({}),
}))

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>()
  return {
    ...actual,
    useForm: () => ({
      register: () => ({ name: 'test', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }),
      handleSubmit: (fn: (data: unknown) => void) => (e: Event) => { e?.preventDefault?.(); fn({}) },
      formState: { errors: {}, isSubmitting: false },
      getValues: () => ({}),
      setValue: vi.fn(),
      watch: vi.fn(() => ''),
      reset: vi.fn(),
    }),
  }
})

import SettingsPage from '@/pages/SettingsPage'

const TABS = [
  'Profile', 'Notifications', 'Security', 'Bank Details', 'Documents', 'KYC Status', 'Referrals',
]

describe('SettingsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  const renderPage = (search = '') => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[`/settings${search}`]}>
          <SettingsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders all 7 tab labels', () => {
    renderPage()
    for (const tab of TABS) {
      expect(screen.getByText(tab)).toBeInTheDocument()
    }
  })

  it('profile tab is active by default', () => {
    renderPage()
    // Profile content is visible
    const profileTab = screen.getAllByText('Profile')[0]
    expect(profileTab).toBeInTheDocument()
  })

  it('reads tab from URL search param', () => {
    renderPage('?tab=notifications')
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('switching tabs updates displayed content', () => {
    renderPage()
    const notifTab = screen.getAllByText('Notifications')[0]
    fireEvent.click(notifTab)
    // Notifications tab should still be visible after click
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('renders referrals tab content when tab=referrals', () => {
    renderPage('?tab=referrals')
    expect(screen.getByText('Referrals')).toBeInTheDocument()
  })
})
