/**
 * usePortfolio – React Query hooks for portfolio data.
 * Mirrors web's usePortfolio.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export interface PortfolioProperty {
  propertyId: string
  propertyTitle: string
  propertyCity: string
  propertyImage: string
  assetType: string
  investedAmount: number
  currentValue: number
  units: number
  irr: number
  returnPercentage: number
  status: string
  investedAt: string
  lastPayoutDate: string | null
  nextPayoutDate: string | null
}

export interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  totalReturns: number
  unrealizedGains: number
  avgIrr: number
  xirr: number
  propertiesCount: number
  citiesCount: number
  monthlyIncome: number
  assetAllocation: Array<{ type: string; percentage: number; value: number }>
  cityDistribution: Array<{ city: string; percentage: number; value: number }>
  monthlyReturns: Array<{ month: string; returns: number; invested: number }>
}

export interface RecentTransaction {
  id: string
  type: 'investment' | 'payout' | 'referral_bonus' | 'wealthpass'
  amount: number
  propertyTitle: string
  date: string
  status: string
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: () => apiGet<PortfolioSummary>('/portfolio/summary'),
    staleTime: 30_000,
  })
}

export function usePortfolioProperties() {
  return useQuery({
    queryKey: ['portfolio', 'properties'],
    queryFn: () => apiGet<PortfolioProperty[]>('/portfolio/properties'),
    staleTime: 30_000,
  })
}

export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: ['portfolio', 'transactions', limit],
    queryFn: () =>
      apiGet<RecentTransaction[]>('/portfolio/transactions', {
        params: { limit },
      }),
    staleTime: 30_000,
  })
}
