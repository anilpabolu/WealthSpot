/**
 * VaultProfilingModal – Full-screen overlay for vault profiling.
 *
 * Groups questions into screens of 3 by category (2 screens per vault).
 * Choice cards for single-select, chip tags for multi-select.
 * Shows personality radar chart on completion.
 * Supports resume — pre-fills existing answers and starts at first incomplete screen.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles,
  Brain,
  Target,
  Zap,
  Lightbulb,
  Star,
  Rocket,
  Trophy,
} from 'lucide-react'
import {
  useVaultQuestions,
  useMyAnswers,
  useSubmitVaultAnswers,
  useMyPersonality,
} from '@/hooks/useProfiling'
import type { VaultProfileQuestion, QuestionOption, SliderOptions } from '@/hooks/useProfiling'

/* ─── Vault Themes ────────────────────────────────────────────────────────── */

const VAULT_THEMES = {
  wealth: {
    name: 'Wealth Vault',
    gradient: 'from-slate-900 via-indigo-950 to-slate-900',
    accent: 'text-[#1B2A4A] dark:text-[#D4AF37]',
    accentHex: '#1B2A4A',
    accentBg: 'bg-[#1B2A4A]',
    selectedBorder: 'border-[#D4AF37]',
    selectedBg: 'bg-[#F5F0E1] dark:bg-[#D4AF37]/15',
    progressBar: 'bg-gradient-to-r from-[#1B2A4A] to-[#D4AF37]',
    radarFill: 'rgba(212, 175, 55, 0.15)',
    radarStroke: '#D4AF37',
    emoji: '🏛️',
    tagline: "Let's understand your investment DNA",
  },
  opportunity: {
    name: 'Safe Vault',
    gradient: 'from-[#0D3B2E] via-[#1A5C46] to-[#0D3B2E]',
    accent: 'text-[#065F46] dark:text-[#34D399]',
    accentHex: '#065F46',
    accentBg: 'bg-[#065F46]',
    selectedBorder: 'border-[#34D399]',
    selectedBg: 'bg-[#ECFDF5] dark:bg-[#34D399]/15',
    progressBar: 'bg-gradient-to-r from-[#065F46] to-[#34D399]',
    radarFill: 'rgba(52, 211, 153, 0.15)',
    radarStroke: '#34D399',
    emoji: '🛡️',
    tagline: 'Discover your fixed income investor profile',
  },
  community: {
    name: 'Community Vault',
    gradient: 'from-[#D97706] via-[#F59E0B] to-[#B45309]',
    accent: 'text-[#065F46] dark:text-[#F59E0B]',
    accentHex: '#065F46',
    accentBg: 'bg-[#065F46]',
    selectedBorder: 'border-[#D97706]',
    selectedBg: 'bg-[#FFFBEB] dark:bg-[#D97706]/15',
    progressBar: 'bg-gradient-to-r from-[#D97706] to-[#065F46]',
    radarFill: 'rgba(217, 119, 6, 0.15)',
    radarStroke: '#D97706',
    emoji: '🤝',
    tagline: 'Find your community superpower',
  },
  safe: {
    name: 'Safe Vault',
    gradient: 'from-[#0D3B2E] via-[#1A5C46] to-[#0D3B2E]',
    accent: 'text-[#065F46] dark:text-[#34D399]',
    accentHex: '#065F46',
    accentBg: 'bg-[#065F46]',
    selectedBorder: 'border-[#34D399]',
    selectedBg: 'bg-[#ECFDF5] dark:bg-[#34D399]/15',
    progressBar: 'bg-gradient-to-r from-[#065F46] to-[#34D399]',
    radarFill: 'rgba(52, 211, 153, 0.15)',
    radarStroke: '#34D399',
    emoji: '🛡️',
    tagline: 'Discover your fixed income investor profile',
  },
} as const

type VaultKey = keyof typeof VAULT_THEMES

/* ─── Dimension Icons ─────────────────────────────────────────────────────── */

const DIMENSION_ICONS: Record<string, { icon: typeof Brain; label: string }> = {
  risk_appetite: { icon: Target, label: 'Risk' },
  domain_expertise: { icon: Brain, label: 'Expertise' },
  investment_capacity: { icon: Zap, label: 'Capital' },
  time_commitment: { icon: Star, label: 'Time' },
  network_strength: { icon: Lightbulb, label: 'Network' },
  creativity_score: { icon: Sparkles, label: 'Creative' },
  leadership_score: { icon: Rocket, label: 'Leader' },
  collaboration_score: { icon: Trophy, label: 'Team' },
}

/* ─── PersonalityRadar (SVG) ──────────────────────────────────────────────── */

function PersonalityRadar({ dimensions, radarFill, radarStroke }: { dimensions: Record<string, number>; radarFill?: string; radarStroke?: string }) {
  const labels = [
    { key: 'risk_appetite', label: 'Risk', color: '#EF4444' },
    { key: 'domain_expertise', label: 'Expertise', color: '#3B82F6' },
    { key: 'investment_capacity', label: 'Capital', color: '#F59E0B' },
    { key: 'time_commitment', label: 'Time', color: '#10B981' },
    { key: 'network_strength', label: 'Network', color: '#8B5CF6' },
    { key: 'creativity_score', label: 'Creative', color: '#EC4899' },
    { key: 'leadership_score', label: 'Leader', color: '#F97316' },
    { key: 'collaboration_score', label: 'Team', color: '#14B8A6' },
  ]
  const cx = 150, cy = 150, r = 100
  const n = labels.length
  const angleStep = (2 * Math.PI) / n

  const points = labels.map((l, i) => {
    const val = Math.min((dimensions[l.key] || 0) / 100, 1)
    const angle = i * angleStep - Math.PI / 2
    return {
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
      labelX: cx + (r + 30) * Math.cos(angle),
      labelY: cy + (r + 30) * Math.sin(angle),
      label: l.label,
      color: l.color,
      value: Math.round(dimensions[l.key] || 0),
    }
  })

  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[260px] mx-auto">
      {rings.map((scale) => (
        <polygon key={scale} points={labels.map((_, i) => { const a = i * angleStep - Math.PI / 2; return `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}` }).join(' ')} fill="none" stroke="#E5E7EB" strokeWidth="1" />
      ))}
      {labels.map((_, i) => { const a = i * angleStep - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#E5E7EB" strokeWidth="1" /> })}
      <polygon points={polyPoints} fill={radarFill || 'rgba(91,79,207,0.15)'} stroke={radarStroke || '#5B4FCF'} strokeWidth="2.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={p.color} stroke="white" strokeWidth="2" />
          <text x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle" className="text-[9px] font-semibold fill-gray-500">{p.label}</text>
          <text x={p.labelX} y={p.labelY + 12} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold" fill={p.color}>{p.value}</text>
        </g>
      ))}
    </svg>
  )
}

/* ─── Choice Card ─────────────────────────────────────────────────────────── */

function ChoiceCard({ option, selected, onSelect, theme }: {
  option: QuestionOption
  selected: boolean
  onSelect: () => void
  theme: (typeof VAULT_THEMES)[VaultKey]
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
        selected
          ? `${theme.selectedBorder} ${theme.selectedBg} shadow-lg scale-[1.02]`
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0">{option.emoji || '•'}</span>
        <span className={`font-medium text-sm ${selected ? theme.accent : 'text-gray-800 dark:text-gray-200'}`}>{option.label}</span>
        {selected && <CheckCircle2 className={`h-5 w-5 ${theme.accent} ml-auto shrink-0`} />}
      </div>
    </button>
  )
}

/* ─── Multi-Choice Chip ───────────────────────────────────────────────────── */

function MultiChoiceChip({ option, selected, onToggle, theme }: {
  option: QuestionOption
  selected: boolean
  onToggle: () => void
  theme: (typeof VAULT_THEMES)[VaultKey]
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? `${theme.selectedBorder} ${theme.selectedBg} shadow-md`
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
        <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xl">{option.emoji || '•'}</span>
        <span className={`text-xs font-semibold ${selected ? theme.accent : 'text-gray-700 dark:text-gray-300'}`}>{option.label}</span>
      </div>
      {selected && (
        <div className={`absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full ${theme.accentBg} flex items-center justify-center`}>
          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
        </div>
      )}
    </button>
  )
}

/* ─── Screen type ─────────────────────────────────────────────────────────── */

interface QuestionScreen {
  category: string
  label: string
  questions: VaultProfileQuestion[]
}

/* ─── Main Modal ──────────────────────────────────────────────────────────── */

export default function VaultProfilingModal({ vaultType, onClose }: { vaultType: string; onClose: () => void }) {
  const vaultKey = (vaultType in VAULT_THEMES ? vaultType : 'wealth') as VaultKey
  const theme = VAULT_THEMES[vaultKey]

  const { data: questions = [], isLoading } = useVaultQuestions(vaultType)
  const { data: existingAnswers = [] } = useMyAnswers(vaultType)
  const { data: personality, refetch: refetchPersonality } = useMyPersonality(vaultType)
  const submitMutation = useSubmitVaultAnswers()

  const [currentScreen, setCurrentScreen] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [showResult, setShowResult] = useState(false)

  // Group questions by category into screens
  const screens: QuestionScreen[] = useMemo(() => {
    const categoryMap = new Map<string, VaultProfileQuestion[]>()
    const sorted = [...questions].sort((a, b) => a.displayOrder - b.displayOrder)
    for (const q of sorted) {
      const cat = q.category || 'general'
      if (!categoryMap.has(cat)) categoryMap.set(cat, [])
      categoryMap.get(cat)!.push(q)
    }
    return Array.from(categoryMap.entries()).map(([category, qs]) => ({
      category,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      questions: qs,
    }))
  }, [questions])

  // Pre-fill existing answers (resume support)
  useEffect(() => {
    if (existingAnswers.length === 0) return
    const prefilled: Record<string, unknown> = {}
    for (const ans of existingAnswers) {
      prefilled[ans.questionId] = ans.answerValue
    }
    setAnswers((prev) => ({ ...prefilled, ...prev }))

    // Find first screen with unanswered questions
    const answeredIds = new Set(existingAnswers.map((a) => a.questionId))
    const idx = screens.findIndex((s) => s.questions.some((q) => !answeredIds.has(q.id)))
    if (idx > 0) setCurrentScreen(idx)
  }, [existingAnswers, screens])

  const screen = screens[currentScreen]
  const totalScreens = screens.length
  const isLastScreen = currentScreen >= totalScreens - 1

  // Check if all questions on current screen are answered
  const isScreenComplete = screen?.questions.every((q) => {
    const val = answers[q.id]
    // Slider/scale questions default to midpoint — always considered answered
    if (q.questionType === 'scale' || q.questionType === 'slider') return true
    if (val === undefined || val === null) return false
    if (Array.isArray(val) && val.length === 0) return false
    return true
  }) ?? false

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const toggleMulti = useCallback((questionId: string, optionValue: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[] | undefined) ?? []
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue]
      return { ...prev, [questionId]: next }
    })
  }, [])

  const handleNext = () => {
    if (isLastScreen) {
      handleSubmit()
    } else {
      setCurrentScreen((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (currentScreen > 0) setCurrentScreen((s) => s - 1)
  }

  const handleSubmit = () => {
    const allAnswers = Object.entries(answers).map(([questionId, answerValue]) => ({
      questionId,
      answerValue,
    }))
    submitMutation.mutate(
      { vaultType, answers: allAnswers },
      {
        onSuccess: () => {
          refetchPersonality()
          setShowResult(true)
        },
      },
    )
  }

  // Progress percentage across all screens
  const totalQuestions = questions.length
  const answeredCount = questions.filter((q) => {
    const val = answers[q.id]
    if (val === undefined || val === null) return false
    if (Array.isArray(val) && val.length === 0) return false
    return true
  }).length
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  // Compute dimension display from personality data
  const personalityDimensions = useMemo(() => {
    if (!personality) return null
    return {
      risk_appetite: personality.riskAppetite,
      domain_expertise: personality.domainExpertise,
      investment_capacity: personality.investmentCapacity,
      time_commitment: personality.timeCommitment,
      network_strength: personality.networkStrength,
      creativity_score: personality.creativityScore,
      leadership_score: personality.leadershipScore ?? 0,
      collaboration_score: personality.collaborationScore ?? 0,
    }
  }, [personality])

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Handle Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  /* ─── Loading state ─── */
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 shadow-2xl">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-indigo-500 rounded-full mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Loading questions...</p>
        </div>
      </div>
    )
  }

  /* ─── Result screen ─── */
  if (showResult && personalityDimensions) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <span className="text-5xl mb-3 block">{theme.emoji}</span>
            <h2 className="font-hero text-2xl font-bold text-gray-900 dark:text-white">Your Investor DNA</h2>
            <p className="text-gray-500 text-sm mt-1">{theme.name} — Personality Profile</p>
          </div>

          <PersonalityRadar
            dimensions={personalityDimensions}
            radarFill={theme.radarFill}
            radarStroke={theme.radarStroke}
          />

          {personality?.archetypeLabel && (
            <div className="mt-6 text-center">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${theme.accentBg} text-white`}>
                {personality.archetypeLabel}
              </span>
              {personality.archetypeDescription && (
                <p className="text-gray-500 text-sm mt-3 leading-relaxed">{personality.archetypeDescription}</p>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className={`mt-8 w-full py-3 rounded-xl font-bold text-white ${theme.accentBg} hover:opacity-90 transition`}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  /* ─── Question screens ─── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Close">
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className={`bg-gradient-to-r ${theme.gradient} px-8 py-6 rounded-t-3xl text-white shrink-0`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{theme.emoji}</span>
            <div>
              <h2 className="font-hero text-xl font-bold">{theme.name}</h2>
              <p className="text-white/70 text-xs">{theme.tagline}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full ${theme.progressBar} rounded-full transition-all duration-500`} style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-white/80">
              Screen {currentScreen + 1}/{totalScreens}
            </span>
          </div>

          {/* Screen category label */}
          {screen && (
            <div className="mt-2 flex items-center gap-2">
              {screen.questions[0]?.dimension && DIMENSION_ICONS[screen.questions[0].dimension] && (() => {
                const DimIcon = DIMENSION_ICONS[screen.questions[0]!.dimension!]!.icon
                return <DimIcon className="h-4 w-4 text-white/70" />
              })()}
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{screen.label}</span>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {screen?.questions.map((q) => (
            <div key={q.id} className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">{q.questionText}</h3>

              {q.questionType === 'choice' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt) => (
                    <ChoiceCard
                      key={opt.value}
                      option={opt}
                      selected={answers[q.id] === opt.value}
                      onSelect={() => setAnswer(q.id, opt.value)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}

              {q.questionType === 'multi_choice' && q.options && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {q.options.map((opt) => (
                    <MultiChoiceChip
                      key={opt.value}
                      option={opt}
                      selected={((answers[q.id] as string[] | undefined) ?? []).includes(opt.value)}
                      onToggle={() => toggleMulti(q.id, opt.value)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}

              {(q.questionType === 'scale' || q.questionType === 'slider') && (() => {
                const sliderOpts = !Array.isArray(q.options) && q.options ? (q.options as unknown as SliderOptions) : null
                if (!sliderOpts) return null
                const val = (answers[q.id] as number) ?? Math.round((sliderOpts.min + sliderOpts.max) / 2)
                // Auto-set default so answer is recorded
                if (answers[q.id] === undefined) setAnswer(q.id, val)
                return (
                  <div className="space-y-6 w-full max-w-md mx-auto">
                    <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
                      <span>{sliderOpts.minLabel}</span>
                      <span>{sliderOpts.maxLabel}</span>
                    </div>
                    <input
                      type="range"
                      min={sliderOpts.min}
                      max={sliderOpts.max}
                      step={sliderOpts.step}
                      value={val}
                      onChange={(e) => setAnswer(q.id, Number(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${theme.accentHex} ${((val - sliderOpts.min) / (sliderOpts.max - sliderOpts.min)) * 100}%, #e5e7eb ${((val - sliderOpts.min) / (sliderOpts.max - sliderOpts.min)) * 100}%)`,
                      }}
                    />
                    <div className="text-center">
                      <span className={`text-4xl font-bold ${theme.accent}`}>{val}</span>
                      <span className="text-gray-400 text-sm ml-1">/ {sliderOpts.max}</span>
                    </div>
                  </div>
                )
              })()}

              {q.questionType === 'text' && (
                <textarea
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Share your thoughts..."
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}

              {/* Fun fact hint */}
              {q.funFact && answers[q.id] !== undefined && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl px-4 py-2.5 flex items-start gap-2">
                  <span className="text-lg shrink-0">💡</span>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{q.funFact}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="px-8 py-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <button
            onClick={currentScreen > 0 ? handleBack : onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentScreen > 0 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={handleNext}
            disabled={!isScreenComplete || submitMutation.isPending}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition ${
              isScreenComplete && !submitMutation.isPending
                ? `${theme.accentBg} hover:opacity-90 shadow-lg`
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            {submitMutation.isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : isLastScreen ? (
              <>
                <Sparkles className="h-4 w-4" />
                Reveal My DNA
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
