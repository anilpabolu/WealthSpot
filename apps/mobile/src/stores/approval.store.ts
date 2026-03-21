/**
 * Approval filter store – mirrors web's approval.store.ts.
 */

import { create } from 'zustand'

export interface ApprovalFilters {
  category: string
  status: string
  priority: string
  page: number
  pageSize: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface ApprovalState {
  filters: ApprovalFilters
  setFilter: <K extends keyof ApprovalFilters>(key: K, value: ApprovalFilters[K]) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: ApprovalFilters = {
  category: '',
  status: '',
  priority: '',
  page: 1,
  pageSize: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
}

export const useApprovalStore = create<ApprovalState>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
}))
