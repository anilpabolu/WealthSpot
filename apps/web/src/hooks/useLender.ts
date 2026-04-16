import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

// ── Types (match backend LoanRead / LoanSummary) ─────────────────────────

export interface LoanItem {
  id: string
  lenderId: string
  propertyId: string
  principal: number
  interestRate: number
  tenureMonths: number
  amountRepaid: number
  status: string
  nextPaymentDate: string | null
  createdAt: string
  propertyTitle: string | null
  propertyCity: string | null
}

interface LoanSummary {
  activeLoans: number
  totalLent: number
  totalInterestEarned: number
  upcomingPayments: number
}

interface PaginatedLoans {
  items: LoanItem[]
  total: number
  page: number
  totalPages: number
}

// ── Hooks ─────────────────────────────────────────────────────────────────

export function useLenderDashboard() {
  return useQuery({
    queryKey: ['lender', 'dashboard'],
    queryFn: () => apiGet<LoanSummary>('/lender/dashboard'),
    staleTime: 30_000,
  })
}

export function useLenderLoans(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['lender', 'loans', params],
    queryFn: () =>
      apiGet<PaginatedLoans>('/lender/loans', {
        params: {
          ...(params?.status && { status: params.status }),
          page: params?.page ?? 1,
        },
      }),
    staleTime: 15_000,
  })
}
