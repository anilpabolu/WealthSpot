import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface InvestmentDraft {
  propertyId: string
  propertyName: string
  amount: number
  units: number
  minAmount: number
  unitPrice: number
}

interface InvestmentState {
  /** Current active investment draft (in investment flow) */
  draft: InvestmentDraft | null
  /** Current step in investment flow */
  step: 'select' | 'review' | 'payment' | 'confirm' | null
  /** Set a new investment draft and start flow */
  startInvestment: (draft: InvestmentDraft) => void
  /** Update the draft amount/units */
  updateDraft: (updates: Partial<InvestmentDraft>) => void
  /** Go to next step */
  nextStep: () => void
  /** Go to previous step */
  prevStep: () => void
  /** Cancel investment flow */
  cancelInvestment: () => void
}

const STEPS = ['select', 'review', 'payment', 'confirm'] as const

export const useInvestmentStore = create<InvestmentState>()(
  devtools(
    (set, get) => ({
      draft: null,
      step: null,

      startInvestment: (draft) =>
        set({ draft, step: 'select' }, false, 'startInvestment'),

      updateDraft: (updates) =>
        set(
          (state) => ({
            draft: state.draft ? { ...state.draft, ...updates } : null,
          }),
          false,
          'updateDraft'
        ),

      nextStep: () => {
        const { step } = get()
        if (!step) return
        const idx = STEPS.indexOf(step as typeof STEPS[number])
        if (idx < STEPS.length - 1) {
          set({ step: STEPS[idx + 1] }, false, 'nextStep')
        }
      },

      prevStep: () => {
        const { step } = get()
        if (!step) return
        const idx = STEPS.indexOf(step as typeof STEPS[number])
        if (idx > 0) {
          set({ step: STEPS[idx - 1] }, false, 'prevStep')
        }
      },

      cancelInvestment: () =>
        set({ draft: null, step: null }, false, 'cancelInvestment'),
    }),
    { name: 'InvestmentStore' }
  )
)
