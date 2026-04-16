/**
 * ProfilingGateModal — inline profiling questionnaire modal.
 * Shown to explorers who haven't completed a specific vault's DNA profiling.
 * On completion the modal auto-closes and the underlying page re-evaluates access.
 */

import { useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react'
import {
  useVaultQuestions,
  useMyAnswers,
  useSubmitVaultAnswers,
  type VaultProfileQuestion,
} from '@/hooks/useProfiling'

interface Props {
  vaultType: string
  onClose: () => void
  onComplete?: () => void
}

function QuestionCard({
  question,
  answer,
  onAnswer,
}: {
  question: VaultProfileQuestion
  answer: unknown
  onAnswer: (val: unknown) => void
}) {
  const qType = question.questionType

  if (qType === 'single_choice' && question.options) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-theme-primary">{question.questionText}</h3>
        {question.funFact && <p className="text-xs text-theme-tertiary italic">{question.funFact}</p>}
        <div className="grid gap-2">
          {question.options.map((o) => {
            const selected = answer === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onAnswer(o.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                    : 'border-theme hover:bg-theme-surface-hover text-theme-primary'
                }`}
              >
                {o.emoji && <span className="mr-2">{o.emoji}</span>}
                {o.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (qType === 'slider' && question.sliderOptions) {
    const { min, max, step, minLabel, maxLabel } = question.sliderOptions
    const val = typeof answer === 'number' ? answer : min
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-theme-primary">{question.questionText}</h3>
        {question.funFact && <p className="text-xs text-theme-tertiary italic">{question.funFact}</p>}
        <input
          type="range"
          min={min} max={max} step={step}
          value={val}
          onChange={(e) => onAnswer(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-theme-tertiary">
          <span>{minLabel ?? min}</span>
          <span className="font-semibold text-primary text-sm">{val}</span>
          <span>{maxLabel ?? max}</span>
        </div>
      </div>
    )
  }

  // Fallback text input
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-theme-primary">{question.questionText}</h3>
      <input
        type="text"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswer(e.target.value)}
        className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
        placeholder="Your answer…"
      />
    </div>
  )
}

export default function ProfilingGateModal({ vaultType, onClose, onComplete }: Props) {
  const { data: questions, isLoading: qLoading } = useVaultQuestions(vaultType)
  const { data: existingAnswers } = useMyAnswers(vaultType)
  const submitAnswers = useSubmitVaultAnswers()

  // Local answer state: questionId → value
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    const map: Record<string, unknown> = {}
    existingAnswers?.forEach((a) => { map[a.questionId] = a.answerValue })
    return map
  })
  const [stepIdx, setStepIdx] = useState(0)
  const [done, setDone] = useState(false)

  const sorted = (questions ?? []).slice().sort((a, b) => a.displayOrder - b.displayOrder)
  const current = sorted[stepIdx]

  const handleAnswer = useCallback((val: unknown) => {
    if (!current) return
    setAnswers((prev) => ({ ...prev, [current.id]: val }))
  }, [current])

  const canNext = current ? answers[current.id] != null : false

  const handleNext = useCallback(() => {
    if (stepIdx < sorted.length - 1) {
      setStepIdx((i) => i + 1)
    } else {
      // Submit all answers
      const payload = sorted.map((q) => ({
        questionId: q.id,
        answerValue: answers[q.id],
      }))
      submitAnswers.mutate(
        { vaultType, answers: payload },
        {
          onSuccess: () => {
            setDone(true)
            setTimeout(() => {
              onComplete?.()
              onClose()
            }, 1500)
          },
        },
      )
    }
  }, [stepIdx, sorted, answers, submitAnswers, vaultType, onComplete, onClose])

  const handleBack = () => { if (stepIdx > 0) setStepIdx((i) => i - 1) }

  return (
    <div className="modal-overlay p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-panel max-w-md w-full relative">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-theme-primary capitalize">{vaultType} Vault DNA</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>

        <div className="p-6">
          {qLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : done ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-semibold text-theme-primary">DNA Complete!</p>
              <p className="text-sm text-theme-secondary">You now have full investor access to {vaultType} vault.</p>
            </div>
          ) : !current ? (
            <p className="text-center text-sm text-theme-secondary py-8">No profiling questions available.</p>
          ) : (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-theme-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${((stepIdx + 1) / sorted.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-theme-tertiary font-medium">{stepIdx + 1}/{sorted.length}</span>
              </div>

              {/* Question */}
              <QuestionCard question={current} answer={answers[current.id]} onAnswer={handleAnswer} />

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleBack}
                  disabled={stepIdx === 0}
                  className="inline-flex items-center gap-1 text-sm text-theme-secondary hover:text-theme-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canNext || submitAnswers.isPending}
                  className="inline-flex items-center gap-1 px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {submitAnswers.isPending ? 'Saving…' : stepIdx === sorted.length - 1 ? 'Complete' : 'Next'}
                  {!submitAnswers.isPending && stepIdx < sorted.length - 1 && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
