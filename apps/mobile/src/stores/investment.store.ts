/**
 * Investment flow store – mirrors web's investment.store.ts.
 */

import { create } from 'zustand'

export interface InvestmentDraft {
  propertyId: string
  propertyName: string
  amount: number
  units: number
  minAmount: number
  unitPrice: number
}

interface InvestmentState {
  draft: InvestmentDraft | null
  step: 'select' | 'review' | 'payment' | 'confirm' | null
  startInvestment: (draft: InvestmentDraft) => void
  updateDraft: (updates: Partial<InvestmentDraft>) => void
  nextStep: () => void
  prevStep: () => void
  cancelInvestment: () => void
}

const STEPS = ['select', 'review', 'payment', 'confirm'] as const

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  draft: null,
  step: null,

  startInvestment: (draft) =>
    set({ draft, step: 'select' }),

  updateDraft: (updates) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, ...updates } : null,
    })),

  nextStep: () => {
    const { step } = get()
    if (!step) return
    const idx = STEPS.indexOf(step as typeof STEPS[number])
    if (idx < STEPS.length - 1) {
      set({ step: STEPS[idx + 1] })
    }
  },

  prevStep: () => {
    const { step } = get()
    if (!step) return
    const idx = STEPS.indexOf(step as typeof STEPS[number])
    if (idx > 0) {
      set({ step: STEPS[idx - 1] })
    }
  },

  cancelInvestment: () =>
    set({ draft: null, step: null }),
}))
