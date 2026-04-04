/**
 * MatchScoreBadge – Mobile match score display with vault-aware styling,
 * personality archetype labels, animated score rings, and dimension bars.
 */

import { View, Text, Pressable } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import type { MatchScore, MatchBreakdown } from '@/hooks/useProfiling'

/* ─── Vault Color Maps ────────────────────────────────────────────────── */

const VAULT_RING: Record<string, string> = {
  wealth: '#D4AF37',
  opportunity: '#20E3B2',
  community: '#065F46',
}

const VAULT_BG: Record<string, string> = {
  wealth: '#F5F0E1',
  opportunity: '#FFF0F0',
  community: '#FFFBEB',
}

/* ─── Tier helpers ──────────────────────────────────────────────────────── */

function getTier(score: number) {
  if (score >= 85) return { label: 'Excellent Match', emoji: '🌟', color: '#10B981', bg: '#ECFDF5' }
  if (score >= 70) return { label: 'Great Match', emoji: '🔥', color: '#8B5CF6', bg: '#F5F3FF' }
  if (score >= 50) return { label: 'Good Match', emoji: '👍', color: '#3B82F6', bg: '#EFF6FF' }
  if (score >= 35) return { label: 'Partial Match', emoji: '🤔', color: '#F59E0B', bg: '#FFFBEB' }
  return { label: 'Exploring', emoji: '🔍', color: '#9CA3AF', bg: '#F9FAFB' }
}

/* ─── Dimension emoji map ─────────────────────────────────────────────── */

const DIM_EMOJI: Record<string, { emoji: string; color: string }> = {
  riskAppetite: { emoji: '🎯', color: '#EF4444' },
  domainExpertise: { emoji: '🧠', color: '#3B82F6' },
  investmentCapacity: { emoji: '⚡', color: '#F59E0B' },
  timeCommitment: { emoji: '⭐', color: '#10B981' },
  networkStrength: { emoji: '💡', color: '#8B5CF6' },
  creativityScore: { emoji: '✨', color: '#EC4899' },
  leadershipScore: { emoji: '🚀', color: '#F97316' },
  collaborationScore: { emoji: '🏆', color: '#14B8A6' },
}

/* ─── Score Ring SVG ───────────────────────────────────────────────────── */

function ScoreRing({
  score,
  size = 48,
  strokeWidth = 4,
  vaultType,
}: {
  score: number
  size?: number
  strokeWidth?: number
  vaultType?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const tier = getTier(score)
  const ringColor = vaultType ? (VAULT_RING[vaultType] ?? tier.color) : tier.color

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-xs font-bold text-gray-800">{Math.round(score)}</Text>
      </View>
    </View>
  )
}

/* ─── Compact Badge (for use in lists/cards) ───────────────────────────── */

export function MatchScoreCompact({
  score,
  vaultType,
}: {
  score: MatchScore
  vaultType?: string
}) {
  const tier = getTier(score.overallScore)
  const bgColor = vaultType ? (VAULT_BG[vaultType] ?? tier.bg) : tier.bg

  return (
    <View
      className="flex-row items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ backgroundColor: bgColor }}
    >
      <ScoreRing score={score.overallScore} size={28} strokeWidth={3} vaultType={vaultType} />
      <Text className="text-xs font-bold" style={{ color: tier.color }}>
        {tier.emoji} {Math.round(score.overallScore)}%
      </Text>
    </View>
  )
}

/* ─── Inline Badge (minimal, for tight spaces) ────────────────────────── */

export function MatchScoreInline({
  score,
  vaultType,
}: {
  score: number
  vaultType?: string
}) {
  const tier = getTier(score)
  const ringColor = vaultType ? (VAULT_RING[vaultType] ?? tier.color) : tier.color

  return (
    <View className="flex-row items-center gap-1.5">
      <View
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: ringColor }}
      />
      <Text className="text-xs font-bold" style={{ color: tier.color }}>
        {Math.round(score)}% {tier.label}
      </Text>
    </View>
  )
}

/* ─── Full Card (for detail views) ─────────────────────────────────────── */

export function MatchScoreFull({
  score,
  vaultType,
}: {
  score: MatchScore
  vaultType?: string
}) {
  const tier = getTier(score.overallScore)
  const breakdown = score.breakdown as MatchBreakdown | null
  const bgColor = vaultType ? (VAULT_BG[vaultType] ?? tier.bg) : tier.bg
  const barColor = vaultType ? (VAULT_RING[vaultType] ?? tier.color) : tier.color

  const topDims: [string, number][] = score.dimensionScores
    ? (Object.entries(score.dimensionScores) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
    : []

  return (
    <View className="rounded-3xl p-5" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <View className="flex-row items-center gap-4 mb-4">
        <ScoreRing score={score.overallScore} size={64} strokeWidth={5} vaultType={vaultType} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl">{tier.emoji}</Text>
            <Text className="text-base font-bold" style={{ color: tier.color }}>
              {tier.label}
            </Text>
          </View>
          {breakdown?.note && (
            <Text className="text-xs text-gray-500 mt-1">{breakdown.note}</Text>
          )}
          {/* Archetype compatibility */}
          {score.archetypeCompatibility && (
            <View
              className="mt-2 self-start px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${barColor}20` }}
            >
              <Text
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: barColor }}
              >
                {score.archetypeCompatibility}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Dimension bars */}
      {topDims.length > 0 && (
        <View className="mb-4">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
            HOW YOU MATCH
          </Text>
          {topDims.map(([key, value]) => {
            const dimMeta = DIM_EMOJI[key]
            return (
              <View key={key} className="flex-row items-center gap-2.5 mb-2">
                <Text className="text-sm">{dimMeta?.emoji ?? '📊'}</Text>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] font-semibold text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <Text className="text-[11px] font-bold text-gray-900">
                      {Math.round(value)}%
                    </Text>
                  </View>
                  <View className="h-2 rounded-full bg-white overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(value, 100)}%`,
                        backgroundColor: dimMeta?.color ?? barColor,
                      }}
                    />
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Strengths & Growth */}
      {breakdown && (breakdown.strengths.length > 0 || breakdown.areasToGrow.length > 0) && (
        <View className="flex-row gap-3">
          {breakdown.strengths.length > 0 && (
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-emerald-600 mb-1.5">
                Strengths
              </Text>
              {breakdown.strengths.map((s: string) => (
                <View key={s} className="bg-emerald-50 px-2.5 py-1.5 rounded-lg mb-1">
                  <Text className="text-[11px] text-emerald-700 capitalize font-medium">
                    {s.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {breakdown.areasToGrow.length > 0 && (
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-amber-600 mb-1.5">
                Growth Areas
              </Text>
              {breakdown.areasToGrow.map((a: string) => (
                <View key={a} className="bg-amber-50 px-2.5 py-1.5 rounded-lg mb-1">
                  <Text className="text-[11px] text-amber-700 capitalize font-medium">
                    {a.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

/* ─── Profile Prompt ───────────────────────────────────────────────────── */

export function ProfilePrompt({
  vaultType,
  onPress,
  completionPct,
}: {
  vaultType: string
  onPress?: () => void
  completionPct?: number
}) {
  const config: Record<string, { label: string; emoji: string; primary: string; bg: string }> = {
    wealth: { label: 'Wealth', emoji: '🏛️', primary: '#1B2A4A', bg: '#F5F0E1' },
    opportunity: { label: 'Opportunity', emoji: '🚀', primary: '#FF6B6B', bg: '#FFF0F0' },
    community: { label: 'Community', emoji: '🤝', primary: '#D97706', bg: '#FFFBEB' },
  }
  const vc = config[vaultType] ?? config.wealth!
  const hasProgress = completionPct !== undefined && completionPct > 0 && completionPct < 100

  return (
    <View
      className="rounded-3xl border border-gray-200 p-5 items-center"
      style={{ backgroundColor: vc.bg }}
    >
      <Text className="text-3xl mb-2">{vc.emoji}</Text>
      <Text className="text-base font-bold text-gray-900 mb-1 text-center">
        {hasProgress ? `Continue Your ${vc.label} Profile` : `Complete Your ${vc.label} Profile`}
      </Text>
      <Text className="text-xs text-gray-500 text-center mb-3">
        {hasProgress
          ? `${Math.round(completionPct)}% complete — pick up where you left off!`
          : 'Answer a few fun questions to find your match!'}
      </Text>

      {/* Progress bar */}
      {hasProgress && (
        <View className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
          <View
            className="h-full rounded-full"
            style={{ width: `${completionPct}%`, backgroundColor: vc.primary }}
          />
        </View>
      )}

      <Pressable
        onPress={onPress}
        className="px-6 py-3 rounded-2xl flex-row items-center gap-2 shadow-md"
        style={{ backgroundColor: vc.primary }}
      >
        <Ionicons name="sparkles" size={16} color="white" />
        <Text className="text-white font-bold text-sm">
          {hasProgress ? 'Continue Profiling' : 'Start Profiling'}
        </Text>
      </Pressable>
    </View>
  )
}
