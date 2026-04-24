/**
 * VaultProfilingScreen – One-question-at-a-time, immersive questionnaire.
 *
 * INFLUISH-inspired design: vibrant gradients, playful emoji cards,
 * fun facts, progress tracking, personality reveal at the end.
 *
 * Route: /profiling?vault=wealth|opportunity|community
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, Polygon, Line } from 'react-native-svg'
import { EmptyState, Input } from '@/components/ui'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import {
  useVaultQuestions,
  useSubmitVaultAnswers,
  useProfilingProgress,
  useMyPersonality,
} from '@/hooks/useProfiling'
import type { VaultProfileQuestion, QuestionOption, SliderOptions } from '@/hooks/useProfiling'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Vault Theme Configuration                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

const VAULT_THEMES: Record<string, {
  name: string
  primary: string
  secondary: string
  accent: string
  bgLight: string
  radarFill: string
  radarStroke: string
  emoji: string
  tagline: string
}> = {
  wealth: {
    name: 'Wealth Vault',
    primary: '#1B2A4A',
    secondary: '#2D3F5E',
    accent: '#D4AF37',
    bgLight: '#F5F0E1',
    radarFill: '#D4AF37',
    radarStroke: '#D4AF37',
    emoji: '🏛️',
    tagline: "Let's understand your investment DNA",
  },
  safe: {
    name: 'Safe Vault',
    primary: '#0F766E',
    secondary: '#0D9488',
    accent: '#5EEAD4',
    bgLight: '#F0FDFA',
    radarFill: '#5EEAD4',
    radarStroke: '#5EEAD4',
    emoji: '🔒',
    tagline: 'Secure fixed returns, backed by property',
  },
  community: {
    name: 'Community Vault',
    primary: '#D97706',
    secondary: '#B45309',
    accent: '#065F46',
    bgLight: '#FFFBEB',
    radarFill: '#065F46',
    radarStroke: '#065F46',
    emoji: '🤝',
    tagline: 'Find your collaboration style',
  },
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Illustration Map                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

const ILLUSTRATION_MAP: Record<string, string> = {
  risk_meter: '🎯', lightning: '⚡', target: '🎯', brain: '🧠',
  chart: '📈', money: '💰', clock: '⏰', handshake: '🤝',
  palette: '🎨', lightbulb: '💡', compass: '🧭', trophy: '🏆',
  rocket: '🚀', star: '⭐', heart: '❤️', diamond: '💎',
  fire: '🔥', globe: '🌍', crown: '👑', sparkles: '✨',
  coins: '🪙', mountain: '⛰️', calendar: '📅', shield: '🛡️',
  book: '📖', balance: '⚖️', superhero: '🦸', team: '👥',
  stars: '✨', piggybank: '🐷', seed: '🌱', industry: '🏭',
  dice: '🎲',
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Dimension Info                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

const DIMENSION_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  risk_appetite: { emoji: '🎯', label: 'Risk', color: '#EF4444' },
  riskAppetite: { emoji: '🎯', label: 'Risk', color: '#EF4444' },
  domain_expertise: { emoji: '🧠', label: 'Expertise', color: '#3B82F6' },
  domainExpertise: { emoji: '🧠', label: 'Expertise', color: '#3B82F6' },
  investment_capacity: { emoji: '⚡', label: 'Capital', color: '#F59E0B' },
  investmentCapacity: { emoji: '⚡', label: 'Capital', color: '#F59E0B' },
  time_commitment: { emoji: '⭐', label: 'Time', color: '#10B981' },
  timeCommitment: { emoji: '⭐', label: 'Time', color: '#10B981' },
  network_strength: { emoji: '💡', label: 'Network', color: '#8B5CF6' },
  networkStrength: { emoji: '💡', label: 'Network', color: '#8B5CF6' },
  creativity_score: { emoji: '✨', label: 'Creative', color: '#EC4899' },
  creativityScore: { emoji: '✨', label: 'Creative', color: '#EC4899' },
  leadership_score: { emoji: '🚀', label: 'Leader', color: '#F97316' },
  leadershipScore: { emoji: '🚀', label: 'Leader', color: '#F97316' },
  collaboration_score: { emoji: '🏆', label: 'Team', color: '#14B8A6' },
  collaborationScore: { emoji: '🏆', label: 'Team', color: '#14B8A6' },
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Choice Card                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function ChoiceCard({
  option,
  selected,
  onSelect,
  accentColor,
}: {
  option: QuestionOption
  selected: boolean
  onSelect: () => void
  accentColor: string
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-3 p-4 rounded-2xl border-2 mb-3 ${
        selected ? 'bg-white' : 'bg-white/60'
      }`}
      style={{
        borderColor: selected ? accentColor : 'rgba(0, 0, 0, 0.15)',
        shadowColor: selected ? accentColor : 'transparent',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: selected ? 0.25 : 0,
        shadowRadius: 8,
        elevation: selected ? 6 : 0,
      }}
    >
      <Text className="text-2xl">{option.emoji ?? '🔘'}</Text>
      <Text
        className={`flex-1 text-base font-semibold ${
          selected ? 'text-gray-900' : 'text-gray-700'
        }`}
      >
        {option.label}
      </Text>
      {selected && (
        <View
          className="w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
      )}
    </Pressable>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Multi-Choice Card                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function MultiChoiceCard({
  option,
  selected,
  onToggle,
  accentColor,
}: {
  option: QuestionOption
  selected: boolean
  onToggle: () => void
  accentColor: string
}) {
  return (
    <Pressable
      onPress={onToggle}
      className={`items-center gap-2 px-4 py-3 rounded-xl border-2 ${
        selected ? 'bg-white' : 'bg-white/50'
      }`}
      style={{
        borderColor: selected ? accentColor : 'rgba(0, 0, 0, 0.15)',
        minWidth: (SCREEN_WIDTH - 56) / 3,
      }}
    >
      <Text className="text-xl">{option.emoji ?? '•'}</Text>
      <Text
        className={`text-xs font-semibold text-center ${
          selected ? 'text-gray-900' : 'text-gray-600'
        }`}
      >
        {option.label}
      </Text>
      {selected && (
        <View
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <Ionicons name="checkmark" size={12} color="white" />
        </View>
      )}
    </Pressable>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Slider Input                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function SliderInput({
  options,
  value,
  onChange,
  themeColor,
}: {
  options: SliderOptions
  value: number
  onChange: (v: number) => void
  themeColor: string
}) {
  const steps = []
  for (let i = options.min; i <= options.max; i += options.step) {
    steps.push(i)
  }

  return (
    <View className="space-y-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs text-gray-500">{options.minLabel}</Text>
        <Text className="text-xs text-gray-500">{options.maxLabel}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2 justify-center">
        {steps.map((step) => (
          <Pressable
            key={step}
            onPress={() => onChange(step)}
            className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
              step === value ? 'bg-white' : 'bg-white/50'
            }`}
            style={{
              borderColor: step === value ? themeColor : '#E5E7EB',
            }}
          >
            <Text
              className={`text-base font-bold ${
                step === value ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {step}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="items-center mt-2">
        <Text className="text-3xl font-bold" style={{ color: themeColor }}>
          {value}
        </Text>
        <Text className="text-xs text-gray-400">/ {options.max}</Text>
      </View>
    </View>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Fun Fact Toast                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function FunFact({ text, onDismiss }: { text: string; onDismiss?: () => void }) {
  return (
    <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-start gap-3 mt-4">
      <Text className="text-xl">💡</Text>
      <View className="flex-1">
        <Text className="text-xs font-bold text-amber-700 mb-1">DID YOU KNOW?</Text>
        <Text className="text-sm text-amber-800 leading-5">{text}</Text>
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} className="ml-1">
          <Text className="text-amber-500 text-base font-bold">✕</Text>
        </Pressable>
      )}
    </View>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Personality Radar Chart (SVG)                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function PersonalityRadar({
  dimensions,
  radarFill,
  radarStroke,
}: {
  dimensions: Record<string, number>
  radarFill: string
  radarStroke: string
}) {
  const labels = Object.keys(dimensions)
  const values = Object.values(dimensions)
  const n = labels.length
  if (n === 0) return null

  const size = 220
  const cx = size / 2
  const cy = size / 2
  const r = 80

  const angleStep = (2 * Math.PI) / n

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1]

  // Data polygon points
  const points = values
    .map((v, i) => {
      const angle = i * angleStep - Math.PI / 2
      const pct = Math.min(v / 100, 1)
      return `${cx + r * pct * Math.cos(angle)},${cy + r * pct * Math.sin(angle)}`
    })
    .join(' ')

  // Grid ring polygon points
  const ringPoints = (scale: number) =>
    labels
      .map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`
      })
      .join(' ')

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {/* Grid rings as polygons */}
        {rings.map((scale) => (
          <Polygon
            key={scale}
            points={ringPoints(scale)}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {labels.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="#E5E7EB"
              strokeWidth={0.5}
            />
          )
        })}

        {/* Data polygon */}
        <Polygon
          points={points}
          fill={radarFill}
          fillOpacity={0.15}
          stroke={radarStroke}
          strokeWidth={2.5}
        />

        {/* Data points with colored dots */}
        {values.map((v, i) => {
          const angle = i * angleStep - Math.PI / 2
          const pct = Math.min(v / 100, 1)
          const info = DIMENSION_INFO[labels[i]]
          return (
            <Circle
              key={i}
              cx={cx + r * pct * Math.cos(angle)}
              cy={cy + r * pct * Math.sin(angle)}
              r={5}
              fill={info?.color ?? radarStroke}
              stroke="white"
              strokeWidth={2}
            />
          )
        })}
      </Svg>

      {/* Labels below */}
      <View className="flex-row flex-wrap justify-center gap-3 mt-3 px-2">
        {labels.map((key) => {
          const info = DIMENSION_INFO[key]
          return (
            <View key={key} className="flex-row items-center gap-1">
              <Text className="text-xs">{info?.emoji ?? '📊'}</Text>
              <Text className="text-[10px] text-gray-500 font-semibold">
                {info?.label ?? key.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
              <Text
                className="text-[10px] font-bold"
                style={{ color: info?.color ?? radarStroke }}
              >
                {Math.round(dimensions[key])}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Dimension Card (for result grid)                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

function DimensionCard({ dimKey, value }: { dimKey: string; value: number }) {
  const info = DIMENSION_INFO[dimKey]
  if (!info) return null
  return (
    <View className="bg-white rounded-2xl p-3 items-center shadow-sm border border-gray-100"
      style={{ width: (SCREEN_WIDTH - 56) / 4 }}
    >
      <Text className="text-lg mb-1">{info.emoji}</Text>
      <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
        {info.label}
      </Text>
      <Text className="text-xl font-bold text-gray-900 mt-0.5">{Math.round(value)}</Text>
    </View>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Screen                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function VaultProfilingScreen() {
  const { vault: vaultParam } = useLocalSearchParams<{ vault: string }>()
  const vaultType = vaultParam || 'wealth'
  const theme = VAULT_THEMES[vaultType] ?? VAULT_THEMES.wealth
  const { isVaultEnabled } = useVaultConfig()

  const { data: questions, isLoading } = useVaultQuestions(vaultType)
  const submitAnswers = useSubmitVaultAnswers()
  const { data: progress } = useProfilingProgress(vaultType)
  const { data: personality } = useMyPersonality(vaultType)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [showFunFact, setShowFunFact] = useState(false)
  const [showPersonality, setShowPersonality] = useState(false)

  // Auto-show results if profiling already completed
  useEffect(() => {
    if (progress?.isComplete && progress.personality) {
      setShowPersonality(true)
    }
  }, [progress])

  const sorted = useMemo(
    () => (questions ?? []).slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [questions],
  )

  const currentQ = sorted[currentIdx] as VaultProfileQuestion | undefined
  const isLastQuestion = currentIdx === sorted.length - 1
  const progressPct = sorted.length > 0 ? ((currentIdx + 1) / sorted.length) * 100 : 0

  const setAnswer = useCallback(
    (val: unknown) => {
      if (!currentQ) return
      setAnswers((prev) => ({ ...prev, [currentQ.id]: val }))
      if (currentQ.funFact) {
        setShowFunFact(true)
        setTimeout(() => setShowFunFact(false), 3000)
      }
    },
    [currentQ],
  )

  const handleNext = useCallback(async () => {
    if (!currentQ || answers[currentQ.id] === undefined) return

    if (isLastQuestion) {
      const payload = {
        vaultType: vaultType,
        answers: Object.entries(answers).map(([qId, val]) => ({
          questionId: qId,
          vaultType: vaultType,
          answerValue: val,
        })),
      }
      await submitAnswers.mutateAsync(payload as any)
      setShowPersonality(true)
    } else {
      setCurrentIdx((i) => i + 1)
      setShowFunFact(false)
    }
  }, [currentQ, answers, isLastQuestion, vaultType, submitAnswers])

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1)
      setShowFunFact(false)
    } else {
      router.back()
    }
  }

  const handleRetake = () => {
    setShowPersonality(false)
    setCurrentIdx(0)
    setAnswers({})
    setShowFunFact(false)
  }

  // ── Vault Disabled ──────────────────────────────────────────────────────
  if (!isVaultEnabled(vaultType)) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: theme.bgLight }}>
        <EmptyState
          icon="lock-closed-outline"
          title={vaultType === 'community' ? 'Rallying the Tribe...' : 'The Launchpad is Being Built...'}
          message={`${theme.name} profiling will be available once this vault launches. Stay tuned!`}
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bgLight }}>
        <Text className="text-5xl mb-3">{theme.emoji}</Text>
        <Text className="text-base font-semibold text-gray-600">Loading your profiling journey...</Text>
        <Text className="text-xs text-gray-400 mt-1">{theme.tagline}</Text>
      </View>
    )
  }

  // ── Personality Reveal Screen ───────────────────────────────────────────
  if (showPersonality) {
    const dims: Record<string, number> = personality
      ? {
          riskAppetite: personality.riskAppetite ?? 0,
          domainExpertise: personality.domainExpertise ?? 0,
          investmentCapacity: personality.investmentCapacity ?? 0,
          timeCommitment: personality.timeCommitment ?? 0,
          networkStrength: personality.networkStrength ?? 0,
          creativityScore: personality.creativityScore ?? 0,
          leadershipScore: personality.leadershipScore ?? 0,
          collaborationScore: personality.collaborationScore ?? 0,
        }
      : {}

    const archLabel = personality?.archetypeLabel
    const archDesc = personality?.archetypeDescription

    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ backgroundColor: theme.bgLight }}
      >
        <View className="px-5 pt-16 pb-6 items-center">
          <Text className="text-6xl mb-4">{theme.emoji}</Text>

          {archLabel ? (
            <>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                You are
              </Text>
              <Text
                className="text-3xl font-bold text-center mb-3"
                style={{ color: theme.primary }}
              >
                {archLabel}
              </Text>
              {archDesc && (
                <Text className="text-sm text-gray-500 text-center mb-8 px-4 leading-5">
                  {archDesc}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
                Your {theme.name} DNA
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-8">
                Here is what your answers reveal about your investment personality
              </Text>
            </>
          )}

          {/* Radar Chart */}
          <View className="bg-white/90 rounded-3xl p-6 w-full shadow-lg border border-gray-100">
            {Object.keys(dims).length > 0 ? (
              <PersonalityRadar
                dimensions={dims}
                radarFill={theme.radarFill}
                radarStroke={theme.radarStroke}
              />
            ) : (
              <Text className="text-sm text-gray-500 text-center py-8">
                Computing your personality profile...
              </Text>
            )}
          </View>

          {/* Dimension Cards Grid */}
          {Object.keys(dims).length > 0 && (
            <View className="flex-row flex-wrap justify-center gap-2 mt-4">
              {Object.entries(dims).map(([key, value]) => (
                <DimensionCard key={key} dimKey={key} value={value} />
              ))}
            </View>
          )}

          {/* CTAs */}
          <View className="flex-row gap-3 mt-8">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 py-4 rounded-2xl items-center shadow-lg"
              style={{ backgroundColor: theme.primary }}
            >
              <Text className="text-white font-bold text-sm">
                Explore Opportunities →
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRetake}
              className="py-4 px-5 rounded-2xl items-center border-2 border-gray-300"
            >
              <Text className="text-gray-600 font-semibold text-sm">Retake</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    )
  }

  // ── No Questions ────────────────────────────────────────────────────────
  if (!currentQ) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: theme.bgLight }}>
        <EmptyState
          icon="construct-outline"
          title="Profiling Coming Soon"
          message={`We're crafting the perfect questions for ${theme.name}. Check back soon!`}
          actionLabel="Back to Vaults"
          onAction={() => router.back()}
        />
      </View>
    )
  }

  const illustration = currentQ.illustration
    ? ILLUSTRATION_MAP[currentQ.illustration] ?? '✨'
    : '✨'

  const isChoice = currentQ.questionType === 'choice'
  const isMultiChoice = currentQ.questionType === 'multi_choice' || currentQ.questionType === 'multiChoice'
  const isSlider = currentQ.questionType === 'slider' || currentQ.questionType === 'scale'
  const isText = currentQ.questionType === 'text'
  const options = (Array.isArray(currentQ.options) ? currentQ.options : []) as QuestionOption[]
  const sliderOpts = (!Array.isArray(currentQ.options) && currentQ.options) as SliderOptions | null
  const currentAnswer = answers[currentQ.id]
  const hasAnswer = currentAnswer !== undefined

  // Dimension being measured
  const dim = currentQ.dimension ?? currentQ.dimensionMapping
  const dimInfo = dim ? DIMENSION_INFO[dim] : null

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bgLight }}>
      {/* Header */}
      <View
        className="px-5 pt-14 pb-6 rounded-b-3xl"
        style={{ backgroundColor: theme.primary }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={handleBack} className="flex-row items-center gap-1">
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text className="text-white text-sm font-semibold">
              {currentIdx === 0 ? 'Exit' : 'Back'}
            </Text>
          </Pressable>
          <Text className="text-white/80 text-xs font-mono font-bold">
            {currentIdx + 1}/{sorted.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="h-2 rounded-full bg-white/20 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              backgroundColor: theme.accent,
            }}
          />
        </View>

        {/* Dimension badge */}
        {dimInfo && (
          <View className="flex-row items-center gap-2 mt-3">
            <Text className="text-sm">{dimInfo.emoji}</Text>
            <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              Measuring: {dimInfo.label}
            </Text>
          </View>
        )}
      </View>

      {/* Question Card */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration & Category */}
        <View className="flex-row items-center gap-4 mb-5">
          <Text className="text-4xl">{illustration}</Text>
          <View className="flex-1">
            <Text
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: theme.primary, opacity: 0.6 }}
            >
              {currentQ.category ?? 'Profiling'}
            </Text>
            <Text className="text-xl font-bold text-gray-900 leading-7">
              {currentQ.questionText}
            </Text>
          </View>
        </View>

        {/* Choice */}
        {isChoice && options.map((opt) => (
          <ChoiceCard
            key={opt.value}
            option={opt}
            selected={currentAnswer === opt.value}
            onSelect={() => setAnswer(opt.value)}
            accentColor={theme.accent}
          />
        ))}

        {/* Multi-choice */}
        {isMultiChoice && (
          <View className="flex-row flex-wrap gap-2">
            {options.map((opt) => {
              const selected = Array.isArray(currentAnswer) && currentAnswer.includes(opt.value)
              return (
                <MultiChoiceCard
                  key={opt.value}
                  option={opt}
                  selected={selected}
                  onToggle={() => {
                    const prev = (Array.isArray(currentAnswer) ? currentAnswer : []) as string[]
                    setAnswer(
                      selected ? prev.filter((v) => v !== opt.value) : [...prev, opt.value],
                    )
                  }}
                  accentColor={theme.accent}
                />
              )
            })}
          </View>
        )}

        {/* Slider / Scale */}
        {isSlider && sliderOpts && (
          <SliderInput
            options={sliderOpts}
            value={typeof currentAnswer === 'number' ? currentAnswer : sliderOpts.min}
            onChange={setAnswer}
            themeColor={theme.primary}
          />
        )}

        {/* Text Input */}
        {isText && (
          <Input
            placeholder="Share your thoughts..."
            multiline
            numberOfLines={5}
            value={(currentAnswer as string) ?? ''}
            onChangeText={(text) => setAnswer(text)}
          />
        )}

        {/* Fun Fact */}
        {showFunFact && currentQ.funFact && (
          <FunFact text={currentQ.funFact} onDismiss={() => setShowFunFact(false)} />
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-4 bg-white/95 border-t border-gray-100">
        <Pressable
          onPress={handleNext}
          disabled={!hasAnswer || submitAnswers.isPending}
          className={`py-4 rounded-2xl items-center flex-row justify-center gap-2 ${!hasAnswer ? 'opacity-40' : ''}`}
          style={{ backgroundColor: theme.primary }}
        >
          {submitAnswers.isPending ? (
            <Text className="text-white font-bold text-base">Analyzing...</Text>
          ) : isLastQuestion ? (
            <>
              <Ionicons name="sparkles" size={16} color="white" />
              <Text className="text-white font-bold text-base">Reveal My Profile</Text>
            </>
          ) : (
            <>
              <Text className="text-white font-bold text-base">Next</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  )
}
