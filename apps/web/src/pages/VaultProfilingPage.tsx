/**
 * VaultProfilingPage – Creative, animated questionnaire for vault onboarding.
 *
 * Design philosophy (INFLUISH-inspired):
 *  - One question at a time, full-screen immersive
 *  - Playful emoji-driven option cards
 *  - Animated transitions between questions
 *  - Progress bar with personality dimension preview
 *  - Fun facts after each answer
 *  - Personality reveal at the end with animated radar chart
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Brain,
  Target,
  Zap,
  Lightbulb,
  Star,
  Rocket,
  Trophy,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useThemeStore } from '@/stores/theme.store'
import { useVaultQuestions, useSubmitVaultAnswers, useProfilingProgress, useMyAnswers } from '@/hooks/useProfiling'
import type { VaultProfileQuestion, QuestionOption, SliderOptions } from '@/hooks/useProfiling'

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Vault-specific theme configuration                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

const VAULT_THEMES = {
  wealth: {
    name: 'Wealth Vault',
    gradient: 'from-slate-900 via-indigo-950 to-slate-900',
    bgGradient: 'from-[#F5F0E1] via-[#FAF6ED] to-[#F5F0E1]',
    cardBg: 'bg-[var(--bg-card)] backdrop-blur-xl',
    accent: 'text-[#1B2A4A] dark:text-[#D4AF37]',
    accentHex: '#1B2A4A',
    accentBg: 'bg-[#1B2A4A]',
    ring: 'ring-[#D4AF37]',
    progressBar: 'bg-gradient-to-r from-[#1B2A4A] to-[#D4AF37]',
    selectedBorder: 'border-[#D4AF37]',
    selectedBg: 'bg-[#F5F0E1] dark:bg-[#D4AF37]/15',
    radarFill: 'rgba(212, 175, 55, 0.15)',
    radarStroke: '#D4AF37',
    emoji: '🏛️',
    tagline: 'Let\'s understand your investment DNA',
    illustration: '💎',
  },
  opportunity: {
    name: 'Opportunity Vault',
    gradient: 'from-[#FF6B6B] via-[#FF8E8E] to-[#CC4848]',
    bgGradient: 'from-[#FFF0F0] via-[#FFF5F5] to-[#FFF0F0]',
    cardBg: 'bg-[var(--bg-card)] backdrop-blur-xl',
    accent: 'text-[#FF6B6B] dark:text-[#20E3B2]',
    accentHex: '#FF6B6B',
    accentBg: 'bg-[#FF6B6B]',
    ring: 'ring-[#20E3B2]',
    progressBar: 'bg-gradient-to-r from-[#FF6B6B] to-[#20E3B2]',
    selectedBorder: 'border-[#20E3B2]',
    selectedBg: 'bg-[#D5F5EC] dark:bg-[#20E3B2]/15',
    radarFill: 'rgba(32, 227, 178, 0.15)',
    radarStroke: '#20E3B2',
    emoji: '🚀',
    tagline: 'Discover your startup investor persona',
    illustration: '🦄',
  },
  community: {
    name: 'Community Vault',
    gradient: 'from-[#D97706] via-[#F59E0B] to-[#B45309]',
    bgGradient: 'from-[#FFFBEB] via-[#FFFDF5] to-[#FFFBEB]',
    cardBg: 'bg-[var(--bg-card)] backdrop-blur-xl',
    accent: 'text-[#065F46] dark:text-[#F59E0B]',
    accentHex: '#065F46',
    accentBg: 'bg-[#065F46]',
    ring: 'ring-[#D97706]',
    progressBar: 'bg-gradient-to-r from-[#D97706] to-[#065F46]',
    selectedBorder: 'border-[#D97706]',
    selectedBg: 'bg-[#FFFBEB] dark:bg-[#D97706]/15',
    radarFill: 'rgba(217, 119, 6, 0.15)',
    radarStroke: '#D97706',
    emoji: '🤝',
    tagline: 'Find your community superpower',
    illustration: '🌍',
  },
} as const

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Illustration Map (emoji characters for each question illustration key)    */
/* ─────────────────────────────────────────────────────────────────────────── */

export const ILLUSTRATION_MAP: Record<string, string> = {
  coins: '🪙',
  mountain: '⛰️',
  calendar: '📅',
  shield: '🛡️',
  book: '📖',
  balance: '⚖️',
  superhero: '🦸',
  lightbulb: '💡',
  team: '👥',
  stars: '✨',
  rocket: '🚀',
  clock: '⏰',
  globe: '🌍',
  piggybank: '🐷',
  seed: '🌱',
  industry: '🏭',
  handshake: '🤝',
  dice: '🎲',
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Dimension Icons                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

const DIMENSION_ICONS: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  risk_appetite: { icon: Target, color: 'text-red-500', label: 'Risk' },
  domain_expertise: { icon: Brain, color: 'text-blue-500', label: 'Expertise' },
  investment_capacity: { icon: Zap, color: 'text-amber-500', label: 'Capital' },
  time_commitment: { icon: Star, color: 'text-green-500', label: 'Time' },
  network_strength: { icon: Lightbulb, color: 'text-purple-500', label: 'Network' },
  creativity_score: { icon: Sparkles, color: 'text-pink-500', label: 'Creative' },
  leadership_score: { icon: Rocket, color: 'text-orange-500', label: 'Leader' },
  collaboration_score: { icon: Trophy, color: 'text-teal-500', label: 'Team' },
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Single-Choice Card                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

function ChoiceCard({
  option,
  selected,
  onSelect,
  theme,
  index,
}: {
  option: QuestionOption
  selected: boolean
  onSelect: () => void
  theme: (typeof VAULT_THEMES)[keyof typeof VAULT_THEMES]
  index: number
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        group relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-300
        ${
          selected
            ? `${theme.selectedBorder} ${theme.selectedBg} shadow-lg scale-[1.02]`
            : 'border-theme bg-[var(--bg-surface)] hover:border-theme hover:shadow-md'
        }
      `}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Emoji */}
        <span className="text-3xl shrink-0 group-hover:animate-bounce-gentle">
          {option.emoji || '•'}
        </span>

        {/* Label */}
        <span className={`font-body text-base font-medium ${selected ? theme.accent : 'text-theme-primary'}`}>
          {option.label}
        </span>

        {/* Check */}
        {selected && (
          <CheckCircle2 className={`h-5 w-5 ${theme.accent} ml-auto shrink-0 animate-scale-in`} />
        )}
      </div>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Multi-Choice Card                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function MultiChoiceCard({
  option,
  selected,
  onToggle,
  theme,
  index,
}: {
  option: QuestionOption
  selected: boolean
  onToggle: () => void
  theme: (typeof VAULT_THEMES)[keyof typeof VAULT_THEMES]
  index: number
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        group relative p-4 rounded-xl border-2 transition-all duration-300
        ${
          selected
            ? `${theme.selectedBorder} ${theme.selectedBg} shadow-md`
            : 'border-theme bg-[var(--bg-surface)] hover:border-theme hover:shadow-sm'
        }
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-2xl group-hover:animate-bounce-gentle">
          {option.emoji || '•'}
        </span>
        <span className={`text-xs font-semibold ${selected ? theme.accent : 'text-theme-primary'}`}>
          {option.label}
        </span>
        {selected && (
          <div className={`absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full ${theme.accentBg} flex items-center justify-center animate-scale-in`}>
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Slider Input                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function SliderInput({
  options,
  value,
  onChange,
  theme,
}: {
  options: SliderOptions
  value: number
  onChange: (v: number) => void
  theme: (typeof VAULT_THEMES)[keyof typeof VAULT_THEMES]
}) {
  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      <div className="flex justify-between text-sm font-medium text-theme-secondary">
        <span>{options.minLabel}</span>
        <span>{options.maxLabel}</span>
      </div>
      <input
        type="range"
        min={options.min}
        max={options.max}
        step={options.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer accent-primary"
        style={{
          background: `linear-gradient(to right, var(--tw-gradient-from, #5B4FCF) ${
            ((value - options.min) / (options.max - options.min)) * 100
          }%, #e5e7eb ${((value - options.min) / (options.max - options.min)) * 100}%)`,
        }}
      />
      <div className="text-center">
        <span className={`text-4xl font-hero font-bold ${theme.accent}`}>{value}</span>
        <span className="text-theme-tertiary text-sm ml-1">/ {options.max}</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Fun Fact Toast                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

function FunFact({ text, onDismiss }: { text: string; onDismiss?: () => void }) {
  return (
    <div className="animate-fade-up bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 flex items-start gap-3 max-w-lg mx-auto">
      <span className="text-xl shrink-0">💡</span>
      <p className="text-sm text-amber-800 leading-relaxed font-body flex-1">{text}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-amber-500 hover:text-amber-700 text-sm font-bold shrink-0 ml-1"
          aria-label="Dismiss fun fact"
        >
          ✕
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Progress Header                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

export function ProgressHeader({
  current,
  total,
  theme,
  question,
}: {
  current: number
  total: number
  theme: (typeof VAULT_THEMES)[keyof typeof VAULT_THEMES]
  question: VaultProfileQuestion | undefined
}) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0
  const dim = question?.dimension
  const dimInfo = dim ? DIMENSION_ICONS[dim] : null

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
          <div
            className={`h-full ${theme.progressBar} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-theme-tertiary">
          {current + 1}/{total}
        </span>
      </div>

      {/* Dimension badge */}
      {dimInfo && (
        <div className="flex items-center gap-2 animate-fade-up">
          <dimInfo.icon className={`h-4 w-4 ${dimInfo.color}`} />
          <span className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">
            Measuring: {dimInfo.label}
          </span>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Personality Radar Chart (SVG)                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function PersonalityRadar({ dimensions, radarFill, radarStroke, gridColor = '#D1C49D', labelColor = '#6B7280' }: { dimensions: Record<string, number>; radarFill?: string; radarStroke?: string; gridColor?: string; labelColor?: string }) {
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

  const cx = 150
  const cy = 150
  const r = 100
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

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto animate-personality-reveal">
      {/* Grid rings */}
      {rings.map((scale) => (
        <polygon
          key={scale}
          points={labels
            .map((_, i) => {
              const angle = i * angleStep - Math.PI / 2
              return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`
            })
            .join(' ')}
          fill="none"
          stroke={gridColor}
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {labels.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke={gridColor}
            strokeWidth="1"
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polyPoints}
        fill={radarFill || 'rgba(91, 79, 207, 0.15)'}
        stroke={radarStroke || '#5B4FCF'}
        strokeWidth="2.5"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={p.color} stroke="white" strokeWidth="2" />
          <text
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] font-semibold"
            fill={labelColor}
          >
            {p.label}
          </text>
          <text
            x={p.labelX}
            y={p.labelY + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-bold"
            fill={p.color}
          >
            {p.value}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function VaultProfilingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const vaultType = (params.get('vault') || 'community') as keyof typeof VAULT_THEMES
  const theme = VAULT_THEMES[vaultType] || VAULT_THEMES.community

  const { data: questions = [], isLoading } = useVaultQuestions(vaultType)
  const { data: existingAnswers = [] } = useMyAnswers(vaultType)
  const { data: progress } = useProfilingProgress(vaultType)
  const submitMutation = useSubmitVaultAnswers()

  const [currentScreen, setCurrentScreen] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [showResult, setShowResult] = useState(false)
  const [resultDimensions, setResultDimensions] = useState<Record<string, number> | null>(null)

  // Group questions by category into screens
  interface QuestionScreen { category: string; label: string; questions: VaultProfileQuestion[] }
  const screens: QuestionScreen[] = useMemo(() => {
    const categoryMap = new Map<string, VaultProfileQuestion[]>()
    const sorted = [...questions].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
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
    const answeredIds = new Set(existingAnswers.map((a) => a.questionId))
    const idx = screens.findIndex((s) => s.questions.some((q) => !answeredIds.has(q.id)))
    if (idx > 0) setCurrentScreen(idx)
  }, [existingAnswers, screens])

  const screen = screens[currentScreen]
  const totalScreens = screens.length
  const isLastScreen = currentScreen >= totalScreens - 1

  const isScreenComplete = screen?.questions.every((q) => {
    const val = answers[q.id]
    if (val === undefined || val === null) return false
    if (Array.isArray(val) && val.length === 0) return false
    return true
  }) ?? false

  const totalQuestions = questions.length
  const answeredCount = questions.filter((q) => {
    const val = answers[q.id]
    if (val === undefined || val === null) return false
    if (Array.isArray(val) && val.length === 0) return false
    return true
  }).length
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  // If already completed, show result
  useEffect(() => {
    if (progress?.isComplete && progress.personality) {
      setShowResult(true)
      const pd = progress.personality
      setResultDimensions({
        risk_appetite: pd.riskAppetite,
        domain_expertise: pd.domainExpertise,
        investment_capacity: pd.investmentCapacity,
        time_commitment: pd.timeCommitment,
        network_strength: pd.networkStrength,
        creativity_score: pd.creativityScore,
        leadership_score: pd.leadershipScore ?? 0,
        collaboration_score: pd.collaborationScore ?? 0,
      })
    }
  }, [progress])

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

  const handleNext = useCallback(() => {
    if (isLastScreen) {
      const payload = {
        vaultType,
        answers: Object.entries(answers).map(([qId, val]) => ({
          questionId: qId,
          answerValue: val,
        })),
      }
      submitMutation.mutate(payload, {
        onSuccess: () => {
          setShowResult(true)
        },
      })
    } else {
      setCurrentScreen((s) => s + 1)
    }
  }, [isLastScreen, answers, vaultType, submitMutation])

  const handleBack = useCallback(() => {
    if (currentScreen > 0) setCurrentScreen((s) => s - 1)
    else navigate('/vaults')
  }, [currentScreen, navigate])

  // ── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-theme-surface">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 animate-pulse">
            <span className="text-6xl">{theme.illustration}</span>
            <p className="text-theme-secondary font-body">Loading your profiling journey...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Result State ───────────────────────────────────────────────────────────

  if (showResult) {
    const archLabel = progress?.personality?.archetypeLabel
    const archDesc = progress?.personality?.archetypeDescription
    const isDark = useThemeStore.getState().theme === 'dark'
    const gridColor = isDark ? 'rgba(255,255,255,0.15)' : '#D1C49D'
    const labelColor = isDark ? 'rgba(255,255,255,0.6)' : '#6B7280'
    const radarFill = theme.radarFill
    const radarStroke = theme.radarStroke

    return (
      <div className="min-h-screen flex flex-col bg-theme-surface">
        <Navbar />
        <div className={`flex-1 bg-gradient-to-br ${theme.bgGradient}`}>
          <div className="mx-auto max-w-2xl px-6 py-12 space-y-8">
            {/* Archetype Reveal */}
            <div className="text-center space-y-4 animate-fade-up">
              <span className="text-7xl animate-float inline-block">{theme.emoji}</span>
              {archLabel ? (
                <>
                  <p className="text-sm font-bold uppercase tracking-widest text-theme-tertiary">You are</p>
                  <h1 className="font-hero text-4xl sm:text-5xl font-bold animate-personality-reveal">
                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${theme.accentHex}, ${theme.accentHex}88)` }}>
                      {archLabel}
                    </span>
                  </h1>
                  {archDesc && (
                    <p className="text-theme-secondary max-w-md mx-auto text-lg font-body leading-relaxed">
                      {archDesc}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h1 className="font-hero text-3xl font-bold text-theme-primary">
                    Your {theme.name} DNA
                  </h1>
                  <p className="text-theme-secondary max-w-md mx-auto">
                    Here's what your answers reveal about your investment personality.
                    This helps us match you with the perfect opportunities!
                  </p>
                </>
              )}
            </div>

            {/* Radar Chart */}
            {resultDimensions && (
              <div className="bg-white dark:bg-[var(--bg-surface)] rounded-4xl shadow-lg dark:shadow-vault-card p-8 animate-scale-in border border-[var(--frame-border)]">
                <PersonalityRadar
                  dimensions={resultDimensions}
                  radarFill={radarFill}
                  radarStroke={radarStroke}
                  gridColor={gridColor}
                  labelColor={labelColor}
                />
              </div>
            )}

            {/* Dimension Cards */}
            {resultDimensions && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(DIMENSION_ICONS).map(([key, info], i) => {
                  const value = Math.round(resultDimensions[key] || 0)
                  const Icon = info.icon
                  return (
                    <div
                      key={key}
                      className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl p-4 text-center shadow-md animate-fade-up border border-[var(--frame-border)] hover:shadow-lg transition-shadow"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <Icon className={`h-5 w-5 mx-auto mb-2 ${info.color}`} />
                      <p className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider">
                        {info.label}
                      </p>
                      <p className="text-2xl font-hero font-bold text-theme-primary mt-1">{value}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => navigate(`/marketplace?vault=${vaultType}`)}
                className={`px-8 py-3.5 rounded-2xl text-white font-bold bg-gradient-to-r ${theme.gradient} hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg`}
              >
                Explore Matching Opportunities →
              </button>
              <button
                onClick={() => {
                  setShowResult(false)
                  setCurrentScreen(0)
                  setAnswers({})
                }}
                className="px-6 py-3.5 rounded-2xl font-semibold transition-all hover:scale-[1.02] hover:brightness-110"
                style={{
                  backgroundColor: `${theme.radarStroke}18`,
                  border: `2px solid ${theme.radarStroke}55`,
                  color: theme.radarStroke,
                }}
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Empty State ────────────────────────────────────────────────────────────

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-theme-surface">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <span className="text-6xl">🚧</span>
            <h2 className="font-display text-xl font-bold text-theme-primary">
              Profiling Coming Soon
            </h2>
            <p className="text-theme-secondary max-w-sm">
              We're crafting the perfect questions for {theme.name}. Check back soon!
            </p>
            <button
              onClick={() => navigate('/vaults')}
              className="px-6 py-2.5 rounded-xl bg-[var(--bg-surface-hover)] text-theme-primary font-semibold hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Back to Vaults
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Questionnaire State ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-theme-surface">
      <Navbar />
      <div className={`flex-1 bg-gradient-to-br ${theme.bgGradient}`}>
        <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
          {/* Header with progress */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{theme.emoji}</span>
              <div>
                <h1 className="font-hero text-xl font-bold text-theme-primary">{theme.name}</h1>
                <p className="text-xs text-theme-secondary">{theme.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                <div className={`h-full ${theme.progressBar} rounded-full transition-all duration-500`} style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs font-mono font-bold text-theme-tertiary">
                Screen {currentScreen + 1}/{totalScreens}
              </span>
            </div>
            {screen && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">
                  {screen.label}
                </span>
              </div>
            )}
          </div>

          {/* Questions Card */}
          <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-4xl shadow-vault-card p-8 space-y-8 border border-[var(--frame-border)] max-h-[calc(100vh-280px)] overflow-y-auto">
            {screen?.questions.map((q) => {
              const qOptions = Array.isArray(q.options) ? (q.options as QuestionOption[]) : []
              const sliderOpts = !Array.isArray(q.options) && q.options ? (q.options as SliderOptions) : null
              return (
                <div key={q.id} className="space-y-3">
                  <h3 className="font-semibold text-theme-primary text-base">{q.questionText}</h3>

                  {q.questionType === 'choice' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {qOptions.map((opt, i) => (
                        <ChoiceCard
                          key={opt.value}
                          option={opt}
                          selected={answers[q.id] === opt.value}
                          onSelect={() => setAnswer(q.id, opt.value)}
                          theme={theme}
                          index={i}
                        />
                      ))}
                    </div>
                  )}

                  {q.questionType === 'multi_choice' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {qOptions.map((opt, i) => (
                        <MultiChoiceCard
                          key={opt.value}
                          option={opt}
                          selected={((answers[q.id] as string[] | undefined) ?? []).includes(opt.value)}
                          onToggle={() => toggleMulti(q.id, opt.value)}
                          theme={theme}
                          index={i}
                        />
                      ))}
                    </div>
                  )}

                  {(q.questionType === 'scale' || q.questionType === 'slider') && sliderOpts && (
                    <SliderInput
                      options={sliderOpts}
                      value={(answers[q.id] as number) ?? Math.round((sliderOpts.min + sliderOpts.max) / 2)}
                      onChange={(v) => setAnswer(q.id, v)}
                      theme={theme}
                    />
                  )}

                  {q.questionType === 'text' && (
                    <textarea
                      className="w-full p-4 border-2 border-theme rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none font-body text-sm"
                      rows={3}
                      placeholder="Share your thoughts..."
                      value={(answers[q.id] as string) ?? ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                  )}

                  {q.funFact && answers[q.id] !== undefined && (
                    <FunFact text={q.funFact} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-theme-secondary hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentScreen > 0 ? 'Back' : 'Cancel'}
            </button>

            <button
              onClick={handleNext}
              disabled={!isScreenComplete || submitMutation.isPending}
              className={`
                flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white
                bg-gradient-to-r ${theme.gradient}
                disabled:opacity-40 hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg
                ${submitMutation.isPending ? 'animate-pulse' : ''}
              `}
            >
              {submitMutation.isPending ? (
                'Analyzing...'
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
      <Footer />
    </div>
  )
}
