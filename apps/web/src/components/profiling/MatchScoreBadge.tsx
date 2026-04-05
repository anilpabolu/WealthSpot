/**
 * MatchScoreBadge – Animated match score ring with vault-aware styling
 * and personality archetype labels.
 *
 * Variants:
 *  - "compact" — small ring + percentage (for cards)
 *  - "full"    — large ring with tier badge, archetype, strengths, breakdown
 */

import { useMemo } from 'react'
import { Sparkles, TrendingUp, Target, Zap, Star, Heart } from 'lucide-react'
import type { MatchScore, MatchBreakdown } from '@/hooks/useProfiling'

/* ─── Vault-Specific Color Maps ───────────────────────────────────────── */

const VAULT_COLORS: Record<string, { primary: string; accent: string; ringHex: string; bg: string }> = {
  wealth: { primary: 'text-[#1B2A4A]', accent: 'text-[#D4AF37]', ringHex: '#D4AF37', bg: 'bg-[#F5F0E1]' },
  opportunity: { primary: 'text-[#FF6B6B]', accent: 'text-[#20E3B2]', ringHex: '#20E3B2', bg: 'bg-[#FFF0F0]' },
  community: { primary: 'text-[#D97706]', accent: 'text-[#065F46]', ringHex: '#065F46', bg: 'bg-[#FFFBEB]' },
}

/* ─── Tier Configuration ────────────────────────────────────────────────── */

interface TierConfig {
  label: string
  emoji: string
  color: string
  ringColor: string
  bg: string
  glow: string
}

const TIERS = {
  excellent: {
    label: 'Excellent Match',
    emoji: '🌟',
    color: 'text-emerald-600',
    ringColor: 'stroke-emerald-500',
    bg: 'bg-emerald-50',
    glow: 'shadow-glow-teal',
  },
  great: {
    label: 'Great Match',
    emoji: '🔥',
    color: 'text-violet-600',
    ringColor: 'stroke-violet-500',
    bg: 'bg-violet-50',
    glow: 'shadow-glow-primary',
  },
  good: {
    label: 'Good Match',
    emoji: '👍',
    color: 'text-blue-600',
    ringColor: 'stroke-blue-500',
    bg: 'bg-blue-50',
    glow: '',
  },
  partial: {
    label: 'Partial Match',
    emoji: '🤔',
    color: 'text-amber-600',
    ringColor: 'stroke-amber-400',
    bg: 'bg-amber-50',
    glow: '',
  },
  exploring: {
    label: 'Exploring',
    emoji: '🔍',
    color: 'text-gray-500',
    ringColor: 'stroke-gray-300',
    bg: 'bg-gray-50',
    glow: '',
  },
} satisfies Record<string, TierConfig>

function getTier(score: number): TierConfig {
  if (score >= 85) return TIERS.excellent
  if (score >= 70) return TIERS.great
  if (score >= 50) return TIERS.good
  if (score >= 35) return TIERS.partial
  return TIERS.exploring
}

/* ─── SVG Ring ─────────────────────────────────────────────────────────── */

function ScoreRing({
  score,
  size = 48,
  strokeWidth = 4,
  className = '',
  vaultType,
}: {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
  vaultType?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const tier = getTier(score)
  const vaultRingColor = vaultType ? VAULT_COLORS[vaultType]?.ringHex : undefined

  return (
    <svg width={size} height={size} className={`-rotate-90 ${className}`}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-100"
      />
      {/* Decorative outer ring (layered effect for excellent matches) */}
      {score >= 85 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 2}
          fill="none"
          stroke={vaultRingColor || 'currentColor'}
          strokeWidth={1}
          opacity={0.3}
          className="animate-pulse-glow"
        />
      )}
      {/* Score ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        stroke={vaultRingColor}
        className={`${!vaultRingColor ? tier.ringColor : ''} transition-all duration-1000 ease-out`}
        style={{ animation: 'match-ring 1.2s ease-out forwards' }}
      />
    </svg>
  )
}

/* ─── Dimension Icons ──────────────────────────────────────────────────── */

const DIMENSION_CONFIG: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
  risk_appetite: { icon: Zap, color: 'text-amber-500', label: 'Risk' },
  domain_expertise: { icon: Star, color: 'text-blue-500', label: 'Expertise' },
  investment_capacity: { icon: TrendingUp, color: 'text-emerald-500', label: 'Capital' },
  time_commitment: { icon: Target, color: 'text-violet-500', label: 'Time' },
  network_strength: { icon: Heart, color: 'text-pink-500', label: 'Network' },
  creativity_score: { icon: Sparkles, color: 'text-orange-500', label: 'Creative' },
}

/* ─── Compact Variant (for cards, lists) ───────────────────────────────── */

export function MatchScoreCompact({ score, vaultType }: { score: MatchScore; vaultType?: string }) {
  const tier = getTier(score.overallScore)

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${tier.bg} ${tier.glow}`}>
      <div className="relative">
        <ScoreRing score={score.overallScore} size={28} strokeWidth={3} vaultType={vaultType} />
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700">
          {Math.round(score.overallScore)}
        </span>
      </div>
      <span className={`text-xs font-bold ${tier.color}`}>
        {tier.emoji} {Math.round(score.overallScore)}%
      </span>
    </div>
  )
}

/* ─── Full Variant (for detail pages) ──────────────────────────────────── */

export function MatchScoreFull({ score, vaultType }: { score: MatchScore; vaultType?: string }) {
  const tier = getTier(score.overallScore)
  const breakdown = score.breakdown as MatchBreakdown | null
  const vaultColors = vaultType ? VAULT_COLORS[vaultType] : undefined

  const topDimensions = useMemo((): [string, number][] => {
    if (!score.dimensionScores) return []
    const entries: [string, number][] = Object.entries(score.dimensionScores) as [string, number][]
    return entries.sort(([, a], [, b]) => b - a).slice(0, 4)
  }, [score.dimensionScores])

  return (
    <div className={`rounded-3xl border ${vaultColors?.bg || tier.bg} p-6 space-y-5 ${score.overallScore >= 85 ? tier.glow : ''}`}>
      {/* Header with ring */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <ScoreRing score={score.overallScore} size={80} strokeWidth={6} vaultType={vaultType} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{Math.round(score.overallScore)}</span>
            <span className="text-[9px] text-gray-400 font-medium -mt-0.5">%</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tier.emoji}</span>
            <h3 className={`font-hero text-lg font-bold ${vaultColors?.primary || tier.color}`}>{tier.label}</h3>
          </div>
          {breakdown?.note && (
            <p className="text-sm text-gray-500 mt-1">{breakdown.note}</p>
          )}
          {/* Archetype compatibility label */}
          {score.archetypeCompatibility && (
            <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${vaultColors?.bg || 'bg-primary/5'} ${vaultColors?.accent || 'text-primary'}`}>
              {score.archetypeCompatibility}
            </span>
          )}
        </div>
      </div>

      {/* Dimension bars */}
      {topDimensions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">How You Match</p>
          {topDimensions.map(([key, value]) => {
            const config = DIMENSION_CONFIG[key]
            const Icon = config?.icon ?? Sparkles
            const label = config?.label ?? key.replace(/_/g, ' ')
            return (
              <div key={key} className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${config?.color ?? 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 capitalize">{label}</span>
                    <span className="text-xs font-bold text-gray-900">{Math.round(value)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(value, 100)}%`,
                        backgroundColor: vaultColors?.ringHex || undefined,
                        animation: 'progress-fill 1s ease-out forwards',
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Strengths & Growth */}
      {breakdown && (
        <div className="grid grid-cols-2 gap-4">
          {breakdown.strengths.length > 0 && (
            <div>
              <p className="text-xs font-bold text-emerald-600 mb-2">Strengths</p>
              <div className="space-y-1.5">
                {breakdown.strengths.map((s: string) => (
                  <span key={s} className="block text-xs text-gray-600 capitalize bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          {breakdown.areasToGrow.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-600 mb-2">Growth Areas</p>
              <div className="space-y-1.5">
                {breakdown.areasToGrow.map((a: string) => (
                  <span key={a} className="block text-xs text-gray-600 capitalize bg-amber-50 px-2.5 py-1 rounded-lg">
                    {a.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Prompt to Profile (when no score exists) ─────────────────────────── */

export function ProfilePrompt({ vaultType, className = '' }: { vaultType: string; className?: string }) {
  const vaultConfig: Record<string, { label: string; emoji: string; gradient: string; bg: string; border: string }> = {
    wealth: { label: 'Wealth', emoji: '🏛️', gradient: 'from-[#1B2A4A] to-[#D4AF37]', bg: 'bg-[#F5F0E1]/50', border: 'border-[#D4AF37]/30' },
    opportunity: { label: 'Opportunity', emoji: '🚀', gradient: 'from-[#FF6B6B] to-[#20E3B2]', bg: 'bg-[#FFF0F0]/50', border: 'border-[#20E3B2]/30' },
    community: { label: 'Community', emoji: '🤝', gradient: 'from-[#D97706] to-[#065F46]', bg: 'bg-[#FFFBEB]/50', border: 'border-[#D97706]/30' },
  }
  const defaultVc = { label: 'Wealth', emoji: '🏛️', gradient: 'from-[#1B2A4A] to-[#D4AF37]', bg: 'bg-[#F5F0E1]/50', border: 'border-[#D4AF37]/30' }
  const vc = vaultConfig[vaultType] ?? defaultVc

  return (
    <div className={`rounded-3xl border border-dashed ${vc.border} ${vc.bg} p-5 text-center ${className}`}>
      <div className="text-3xl mb-2">{vc.emoji}</div>
      <h3 className="font-hero text-base font-bold text-gray-900 mb-1">
        Complete Your {vc.label} Profile
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Answer a few fun questions so we can find your perfect match!
      </p>
      <a
        href={`/vault-profiling?vault=${vaultType}`}
        className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${vc.gradient} text-white text-sm font-bold rounded-2xl hover:opacity-90 hover:scale-[1.02] transition-all shadow-md`}
      >
        <Sparkles className="h-4 w-4" />
        Start Profiling
      </a>
    </div>
  )
}

export default MatchScoreFull
