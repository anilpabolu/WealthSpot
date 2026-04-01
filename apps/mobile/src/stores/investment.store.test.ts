import { describe, expect, it, beforeEach } from 'vitest'
import { useInvestmentStore } from './investment.store'

describe('mobile useInvestmentStore', () => {
  beforeEach(() => {
    useInvestmentStore.getState().cancelInvestment()
  })

  const sampleDraft = {
    propertyId: 'prop-1',
    propertyName: 'Test Property',
    amount: 500000,
    units: 2,
    minAmount: 100000,
    unitPrice: 250000,
  }

  it('starts with no draft and no step', () => {
    const s = useInvestmentStore.getState()
    expect(s.draft).toBeNull()
    expect(s.step).toBeNull()
  })

  it('startInvestment sets draft and first step', () => {
    useInvestmentStore.getState().startInvestment(sampleDraft)
    const s = useInvestmentStore.getState()
    expect(s.draft?.propertyId).toBe('prop-1')
    expect(s.step).toBe('select')
  })

  it('updateDraft modifies draft fields', () => {
    useInvestmentStore.getState().startInvestment(sampleDraft)
    useInvestmentStore.getState().updateDraft({ amount: 750000, units: 3 })
    const s = useInvestmentStore.getState()
    expect(s.draft?.amount).toBe(750000)
    expect(s.draft?.units).toBe(3)
    expect(s.draft?.propertyId).toBe('prop-1') // unchanged
  })

  it('nextStep progresses through wizard', () => {
    useInvestmentStore.getState().startInvestment(sampleDraft)
    expect(useInvestmentStore.getState().step).toBe('select')

    useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBe('review')

    useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBe('payment')

    useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBe('confirm')

    // Can't go past confirm
    useInvestmentStore.getState().nextStep()
    expect(useInvestmentStore.getState().step).toBe('confirm')
  })

  it('prevStep navigates backward', () => {
    useInvestmentStore.getState().startInvestment(sampleDraft)
    useInvestmentStore.getState().nextStep() // review
    useInvestmentStore.getState().nextStep() // payment
    useInvestmentStore.getState().prevStep()
    expect(useInvestmentStore.getState().step).toBe('review')

    useInvestmentStore.getState().prevStep()
    expect(useInvestmentStore.getState().step).toBe('select')

    // Can't go before select
    useInvestmentStore.getState().prevStep()
    expect(useInvestmentStore.getState().step).toBe('select')
  })

  it('cancelInvestment resets everything', () => {
    useInvestmentStore.getState().startInvestment(sampleDraft)
    useInvestmentStore.getState().nextStep()
    useInvestmentStore.getState().cancelInvestment()
    const s = useInvestmentStore.getState()
    expect(s.draft).toBeNull()
    expect(s.step).toBeNull()
  })
})
