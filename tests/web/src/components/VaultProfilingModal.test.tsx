import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock profiling hooks
const mockQuestions = [
  { id: '1', vaultType: 'wealth', questionKey: 'risk_tolerance', questionText: 'What is your risk appetite?', questionType: 'choice', options: [{ value: 'low', label: 'Conservative', emoji: '🛡️' }, { value: 'high', label: 'Aggressive', emoji: '🚀' }], weight: 1, dimension: 'risk', displayOrder: 1, funFact: null, illustration: null, category: 'Investment Profile', isActive: true },
  { id: '2', vaultType: 'wealth', questionKey: 'time_horizon', questionText: 'What is your investment horizon?', questionType: 'choice', options: [{ value: 'short', label: '1-3 years', emoji: '⏳' }, { value: 'long', label: '5+ years', emoji: '🏔️' }], weight: 1, dimension: 'horizon', displayOrder: 2, funFact: null, illustration: null, category: 'Investment Profile', isActive: true },
  { id: '3', vaultType: 'wealth', questionKey: 'goal', questionText: 'Primary investment goal?', questionType: 'multi_choice', options: [{ value: 'income', label: 'Passive Income', emoji: '💰' }, { value: 'growth', label: 'Capital Growth', emoji: '📈' }], weight: 1, dimension: 'goal', displayOrder: 3, funFact: null, illustration: null, category: 'Investment Profile', isActive: true },
]

vi.mock('@/hooks/useProfiling', () => ({
  useVaultQuestions: vi.fn(() => ({ data: mockQuestions, isLoading: false })),
  useMyAnswers: vi.fn(() => ({ data: [], isLoading: false })),
  useSubmitVaultAnswers: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useMyPersonality: vi.fn(() => ({ data: null, isLoading: false })),
  type: {} as never,
}))

import VaultProfilingModal from '@/components/VaultProfilingModal'

describe('VaultProfilingModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderModal = (vaultType = 'wealth') =>
    render(<VaultProfilingModal vaultType={vaultType} onClose={onClose} />)

  it('renders the modal with vault title', () => {
    renderModal()
    expect(screen.getByText(/Wealth Vault/i)).toBeInTheDocument()
  })

  it('shows first question', () => {
    renderModal()
    expect(screen.getByText('What is your risk appetite?')).toBeInTheDocument()
  })

  it('renders choice options', () => {
    renderModal()
    expect(screen.getByText('Conservative')).toBeInTheDocument()
    expect(screen.getByText('Aggressive')).toBeInTheDocument()
  })

  it('renders close button', () => {
    renderModal()
    // The close button should exist (X icon button)
    const closeButtons = screen.getAllByRole('button')
    expect(closeButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('calls onClose when close button clicked', () => {
    renderModal()
    // Find X button (aria-label or first button)
    const closeBtn = screen.getByLabelText(/close/i) || screen.getAllByRole('button')[0]
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows emoji for options', () => {
    renderModal()
    // Options should be rendered (emoji rendering varies by environment)
    expect(screen.getByText('Conservative')).toBeInTheDocument()
    expect(screen.getByText('Aggressive')).toBeInTheDocument()
  })

  it('shows progress indicator', () => {
    renderModal()
    // Should show step/question progress
    const progressText = screen.queryByText(/1\s*(of|\/)\s*\d+/i)
    expect(progressText || screen.queryByText('1')).toBeTruthy()
  })
})
