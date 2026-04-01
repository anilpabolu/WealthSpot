import { describe, expect, it, beforeEach } from 'vitest'
import { useInvestmentStore } from './investment.store'

const mockDraft = {
  propertyId: 'prop-1',
  propertyName: 'Test Property',
  amount: 50000,
  units: 5,
  minAmount: 10000,
  unitPrice: 10000,
}

describe('useInvestmentStore', () => {
  beforeEach(() => {
    useInvestmentStore.getState().cancelInvestment()
  })

  it('starts with null draft and step', () => {
    const state = useInvestmentStore.getState()
    expect(state.draft).toBeNull()
    expect(state.step).toBeNull()
  })

  it('startInvestment sets draft and first step', () => {
    useInvestmentStore.getState().startInvestment(mockDraft)
    const state = useInvestmentStore.getState()
    expect(state.draft?.propertyId).toBe('prop-1')
    expect(state.step).toBe('select')
  })

  it('updateDraft updates draft fields', () => {
    useInvestmentStore.getState().startInvestment(mockDraft)
    useInvestmentStore.getState().updateDraft({ amount: 100000, units: 10 })

    const state = useInvestmentStore.getState()
    expect(state.draft?.amount).toBe(100000)
    expect(state.draft?.units).toBe(10)
    expect(state.draft?.propertyName).toBe('Test Property') // preserved
  })

  it('updateDraft does nothing when no draft', () => {
    useInvestmentStore.getState().updateDraft({ amount: 100000 })
    expect(useInvestmentStore.getState().draft).toBeNull()
  })

  it('nextStep progresses through steps', () => {
    useInvestmentStore.getState().startInvestment(mockDraft)
    expect(useInvestmentStore.getState().step).toBe('select')

    useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBe('review')

    useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBe('payment')

    useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBe('confirm')
  })

  it('nextStep does not go past confirm', () => {
    useInvestmentStore.getState().startInvestment(mockDraft)
    for (let i = 0; i < 5; i++) useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBe('confirm')
  })

  it('prevStep goes backwards', () => {
    useInvestmentStore.getState().startInvestment(mockDraft)
    useInvestmentStore.getState().nextStep() // review
    useInvestmentStore.getState().nextStep() // payment

    useInvestmentStore.getState().prevStep()
    expect(useInvestmentStore.getState().step).toBe('review')

    useInvestmentStore.getState().prevStep()
    expect(useInvestmentStore.getState().step).toBe('select')
  })

  it('prevStep does not go before select', () => {
    useInvestmentStore.getState().startInvestment(mockDraft)
    useInvestmentStore.getState().prevStep()
    expect(useInvestmentStore.getState().step).toBe('select')
  })

  it('nextStep/prevStep do nothing when step is null', () => {
    useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBeNull()

    useInvestmentStore.getState().prevStep()
    expect(useInvestmentStore.getState().step).toBeNull()
  })

  it('cancelInvestment resets everything', () => {
    useInvestmentStore.getState().startInvestment(mockDraft)
    useInvestmentStore.getState().nextStep()
    useInvestmentStore.getState().cancelInvestment()

    const state = useInvestmentStore.getState()
    expect(state.draft).toBeNull()
    expect(state.step).toBeNull()
  })
})
