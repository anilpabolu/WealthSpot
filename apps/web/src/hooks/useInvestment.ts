import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'

export interface Investment {
  id: string
  propertyId: string
  propertyTitle: string
  propertyCity: string
  propertyImage: string
  amount: number
  units: number
  irr: number
  status: string
  paymentStatus: string
  investedAt: string
  maturityDate: string
  currentValue: number
  returns: number
  returnPercentage: number
}

export interface InvestmentSummary {
  totalInvested: number
  currentValue: number
  totalReturns: number
  avgIrr: number
  activeInvestments: number
  propertiesCount: number
}

interface InvestmentInitiatePayload {
  propertyId: string
  amount: number
  units: number
}

interface PaymentInitiateResponse {
  orderId: string
  razorpayOrderId: string
  amount: number
  currency: string
  key: string
}

export function useMyInvestments() {
  return useQuery({
    queryKey: ['investments', 'mine'],
    queryFn: () => apiGet<Investment[]>('/investments/mine'),
    staleTime: 30_000,
  })
}

export function useInvestmentSummary() {
  return useQuery({
    queryKey: ['investments', 'summary'],
    queryFn: () => apiGet<InvestmentSummary>('/investments/summary'),
    staleTime: 30_000,
  })
}

export function useInvestmentById(id: string) {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: () => apiGet<Investment>(`/investments/${id}`),
    enabled: !!id,
  })
}

export function useInitiateInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: InvestmentInitiatePayload) =>
      apiPost<PaymentInitiateResponse>('/investments/initiate', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
    },
  })
}

export function useConfirmPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      orderId: string
      razorpayPaymentId: string
      razorpaySignature: string
    }) => apiPost('/investments/confirm-payment', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}
