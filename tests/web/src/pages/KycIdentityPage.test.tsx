import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui', () => ({
  Input: ({ placeholder, ...rest }: { placeholder?: string; [k: string]: unknown }) => (
    <input data-testid="input" placeholder={placeholder} {...(rest as object)} />
  ),
  Textarea: ({ placeholder }: { placeholder?: string }) => (
    <textarea data-testid="textarea" placeholder={placeholder} />
  ),
}))

vi.mock('@/hooks/useKycBank', () => ({
  useSubmitKycDetails: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUploadKycDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useSubmitKycForReview: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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

import KycIdentityPage from '@/pages/KycIdentityPage'

describe('KycIdentityPage', () => {
  beforeEach(() => vi.clearAllMocks())

  const renderPage = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <KycIdentityPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders step 1 Personal Details by default', () => {
    renderPage()
    expect(screen.getAllByText('Personal Details').length).toBeGreaterThan(0)
  })

  it('renders all 3 step labels', () => {
    renderPage()
    expect(screen.getAllByText('Personal Details').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Document Upload').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Selfie Verification').length).toBeGreaterThan(0)
  })

  it('step indicator shows step numbers', () => {
    renderPage()
    // Numbers 1, 2, 3 are shown in the step indicator
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
  })

  it('shows KYC form inputs on step 1', () => {
    renderPage()
    const inputs = screen.getAllByTestId('input')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('renders a submit/next button', () => {
    renderPage()
    const nextBtn = screen.queryByRole('button', { name: /next|continue|proceed/i })
    expect(nextBtn).toBeTruthy()
  })
})
