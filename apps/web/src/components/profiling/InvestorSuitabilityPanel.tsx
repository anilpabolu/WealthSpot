/**
 * InvestorSuitabilityPanel – Shows an investor how suitable an opportunity
 * is for them based on their profile, personality dimensions, and match score.
 *
 * Displayed to normal users (investors/lenders) when viewing an opportunity.
 * Admins/builders see OpportunityMatchesPanel (matched investors) instead.
 */

import { useMemo } from 'react'
import {
  Sparkles, TrendingUp, Zap, Star, Heart,
  CheckCircle2, AlertCircle, MapPin, Briefcase, Shield,
  Clock, Users, Lightbulb,
} from 'lucide-react'
import type { MatchScore, MatchBreakdown } from '@/hooks/useProfiling'

/* ─── Vault color maps ──────────────────────────────────────────────────── */

const VAULT_COLORS: Record<string, { primary: string; accent: string; ringHex: string; bg: string; accentBg: string }> = {
  wealth:      { primary: 'text-[#1B2A4A]', accent: 'text-[#D4AF37]', ringHex: '#D4AF37', bg: 'bg-[#F5F0E1]', accentBg: 'bg-[#D4AF37]/10' },
  opportunity: { primary: 'text-[#FF6B6B]', accent: 'text-[#20E3B2]', ringHex: '#20E3B2', bg: 'bg-[#FFF0F0]', accentBg: 'bg-[#20E3B2]/10' },
  community:   { primary: 'text-[#D97706]', accent: 'text-[#065F46]', ringHex: '#065F46', bg: 'bg-[#FFFBEB]', accentBg: 'bg-[#065F46]/10' },
}

/* ─── Tier configuration ────────────────────────────────────────────────── */

interface TierConfig {
  label: string
  emoji: string
  color: string
  indicator: string
  ringHex: string
  bgClass: string
  verdict: string
}

function getTier(score: number): TierConfig {
  if (score >= 85) return { label: 'Excellent Fit', emoji: '🌟', color: 'text-emerald-600 dark:text-emerald-400', indicator: 'bg-emerald-500', ringHex: '#10B981', bgClass: 'bg-emerald-50 dark:bg-emerald-900/30', verdict: 'This opportunity is exceptionally well-suited for your profile.' }
  if (score >= 70) return { label: 'Strong Fit', emoji: '🔥', color: 'text-violet-600 dark:text-violet-400', indicator: 'bg-violet-500', ringHex: '#8B5CF6', bgClass: 'bg-violet-50 dark:bg-violet-900/30', verdict: 'Your profile aligns very well with this opportunity.' }
  if (score >= 50) return { label: 'Good Fit', emoji: '👍', color: 'text-blue-600 dark:text-blue-400', indicator: 'bg-blue-500', ringHex: '#3B82F6', bgClass: 'bg-blue-50 dark:bg-blue-900/30', verdict: 'Solid alignment with room to grow — worth exploring.' }
  if (score >= 35) return { label: 'Moderate Fit', emoji: '🤔', color: 'text-amber-600 dark:text-amber-400', indicator: 'bg-amber-500', ringHex: '#F59E0B', bgClass: 'bg-amber-50 dark:bg-amber-900/30', verdict: 'Some aspects align, but review the details carefully.' }
  return { label: 'Exploratory', emoji: '🌱', color: 'text-theme-secondary', indicator: 'bg-gray-400', ringHex: '#9CA3AF', bgClass: 'bg-theme-surface', verdict: 'This may stretch your comfort zone — but that\'s where growth happens!' }
}

/* ─── Dimension config ──────────────────────────────────────────────────── */

const DIMENSION_CONFIG: Record<string, { icon: typeof Sparkles; label: string; context: string }> = {
  risk_appetite:        { icon: Zap,        label: 'Risk Appetite',        context: 'How your risk tolerance matches this opportunity' },
  domain_expertise:     { icon: Briefcase,  label: 'Domain Expertise',     context: 'Your knowledge in this industry/sector' },
  investment_capacity:  { icon: TrendingUp, label: 'Investment Capacity',  context: 'Whether the ticket size fits your investment power' },
  time_commitment:      { icon: Clock,      label: 'Time Commitment',      context: 'Your availability for engagement' },
  network_strength:     { icon: Users,      label: 'Network Strength',     context: 'Your connections relevant to this space' },
  creativity_score:     { icon: Lightbulb,  label: 'Creative Thinking',    context: 'Your innovative approach capability' },
  leadership_score:     { icon: Shield,     label: 'Leadership',           context: 'Your leadership capability' },
  collaboration_score:  { icon: Heart,      label: 'Collaboration',        context: 'How well you work in team settings' },
}

/* ─── Score Ring ────────────────────────────────────────────────────────── */

function SuitabilityRing({ score, size = 90, vaultType }: { score: number; size?: number; vaultType?: string }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const tier = getTier(score)
  const strokeColor = vaultType ? (VAULT_COLORS[vaultType]?.ringHex ?? tier.ringHex) : tier.ringHex

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={6}
          className="text-gray-100 dark:text-white/10"
        />
        {score >= 85 && (
          <circle
            cx={size / 2} cy={size / 2} r={radius + 3}
            fill="none" stroke={strokeColor} strokeWidth={1}
            opacity={0.3} className="animate-pulse"
          />
        )}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={strokeColor} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-theme-primary">{Math.round(score)}</span>
        <span className="text-[9px] text-theme-tertiary font-medium -mt-0.5">% fit</span>
      </div>
    </div>
  )
}

/* ─── Suitability Factor Bar ────────────────────────────────────────────── */

function FactorBar({ dimKey, value, vaultType }: { dimKey: string; value: number; vaultType?: string }) {
  const config = DIMENSION_CONFIG[dimKey]
  if (!config) return null

  const Icon = config.icon
  const barColor = vaultType ? VAULT_COLORS[vaultType]?.ringHex : undefined
  const level = value >= 70 ? 'Strong' : value >= 45 ? 'Moderate' : 'Low'
  const levelColor = value >= 70 ? 'text-emerald-600 dark:text-emerald-400' : value >= 45 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'

  return (
    <div className="group">
      <div className="flex items-center gap-2.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-theme-tertiary shrink-0" />
        <span className="text-xs font-medium text-theme-primary flex-1">{config.label}</span>
        <span className={`text-[10px] font-bold ${levelColor}`}>{level}</span>
        <span className="text-[10px] font-mono text-theme-tertiary w-8 text-right">{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden ml-6">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(value, 100)}%`,
            backgroundColor: barColor || (value >= 70 ? '#10B981' : value >= 45 ? '#3B82F6' : '#F59E0B'),
          }}
        />
      </div>
    </div>
  )
}

/* ─── Insight Card ──────────────────────────────────────────────────────── */

function InsightItem({ text, type }: { text: string; type: 'strength' | 'growth' }) {
  const isStrength = type === 'strength'
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl ${isStrength ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
      {isStrength
        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      }
      <span className={`text-xs leading-relaxed ${isStrength ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
        {text}
      </span>
    </div>
  )
}

/* ─── Main Panel ───────────────────────────────────────────────────────── */

interface InvestorSuitabilityPanelProps {
  score: MatchScore
  vaultType?: string
  opportunityCity?: string | null
  opportunityIndustry?: string | null
  opportunityStage?: string | null
  minInvestment?: number | null
}

export default function InvestorSuitabilityPanel({
  score,
  vaultType,
  opportunityCity,
  opportunityIndustry,
  opportunityStage,
  minInvestment,
}: InvestorSuitabilityPanelProps) {
  const tier = getTier(score.overallScore)
  const breakdown = score.breakdown as MatchBreakdown | null
  const vaultColors = vaultType ? VAULT_COLORS[vaultType] : undefined

  // Sort dimensions by score descending, pick top 6
  const topDimensions = useMemo((): [string, number][] => {
    if (!score.dimensionScores) return []
    const entries: [string, number][] = Object.entries(score.dimensionScores) as [string, number][]
    return entries.sort(([, a], [, b]) => b - a).slice(0, 6)
  }, [score.dimensionScores])

  // Build contextual quick facts
  const quickFacts = useMemo(() => {
    const facts: { icon: typeof MapPin; text: string; positive: boolean }[] = []

    // Location fact
    if (breakdown?.strengths?.some(s => s.toLowerCase().includes('location'))) {
      facts.push({ icon: MapPin, text: `Location aligned${opportunityCity ? ` — ${opportunityCity}` : ''}`, positive: true })
    } else if (opportunityCity) {
      facts.push({ icon: MapPin, text: `Different city — ${opportunityCity}`, positive: false })
    }

    // Industry fact
    if (breakdown?.strengths?.some(s => s.toLowerCase().includes('domain'))) {
      facts.push({ icon: Briefcase, text: `Industry match${opportunityIndustry ? ` — ${opportunityIndustry}` : ''}`, positive: true })
    } else if (opportunityIndustry) {
      facts.push({ icon: Briefcase, text: `Explore ${opportunityIndustry} sector`, positive: false })
    }

    // Risk stage fact
    if (opportunityStage) {
      const riskScore = score.dimensionScores?.risk_appetite ?? 0
      const isHighRiskStage = ['pre-seed', 'seed', 'idea'].includes(opportunityStage.toLowerCase())
      if (isHighRiskStage && riskScore >= 60) {
        facts.push({ icon: Zap, text: `High risk appetite suits ${opportunityStage} stage`, positive: true })
      } else if (isHighRiskStage && riskScore < 40) {
        facts.push({ icon: Zap, text: `${opportunityStage} stage has higher risk`, positive: false })
      } else if (!isHighRiskStage && riskScore >= 40) {
        facts.push({ icon: Shield, text: `Stable ${opportunityStage} stage fits your profile`, positive: true })
      }
    }

    // Investment capacity fact
    if (minInvestment && minInvestment > 0) {
      const capScore = score.dimensionScores?.investment_capacity ?? 0
      if (capScore >= 60) {
        facts.push({ icon: TrendingUp, text: 'Investment capacity covers the minimum', positive: true })
      } else if (capScore < 40) {
        facts.push({ icon: TrendingUp, text: 'Min. investment may be a stretch', positive: false })
      }
    }

    return facts.slice(0, 4)
  }, [breakdown, opportunityCity, opportunityIndustry, opportunityStage, minInvestment, score.dimensionScores])

  return (
    <div className="card rounded-3xl overflow-hidden">
      {/* ── Header with score ── */}
      <div className={`p-5 ${vaultColors?.accentBg || tier.bgClass}`}>
        <div className="flex items-center gap-4">
          <SuitabilityRing score={score.overallScore} vaultType={vaultType} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className={`h-4 w-4 ${vaultColors?.accent || 'text-primary'}`} />
              <h3 className="font-hero text-sm font-bold text-theme-primary">
                Project Suitability
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{tier.emoji}</span>
              <span className={`font-hero text-base font-bold ${vaultColors?.primary || tier.color}`}>
                {tier.label}
              </span>
            </div>
            {score.archetypeCompatibility && (
              <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${vaultColors?.bg || 'bg-primary/5'} ${vaultColors?.accent || 'text-primary'}`}>
                {score.archetypeCompatibility}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Verdict ── */}
        <p className="text-xs text-theme-secondary leading-relaxed">
          {breakdown?.note || tier.verdict}
        </p>

        {/* ── Quick Facts (contextual insights) ── */}
        {quickFacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Quick Insights</p>
            <div className="grid grid-cols-1 gap-1.5">
              {quickFacts.map((fact, i) => {
                const Icon = fact.icon
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
                      fact.positive
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">{fact.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Suitability Factors ── */}
        {topDimensions.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Suitability Factors</p>
            {topDimensions.map(([key, value]) => (
              <FactorBar key={key} dimKey={key} value={value} vaultType={vaultType} />
            ))}
          </div>
        )}

        {/* ── Strengths & Growth Areas ── */}
        {breakdown && (breakdown.strengths.length > 0 || breakdown.areasToGrow.length > 0) && (
          <div className="space-y-2.5">
            {breakdown.strengths.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                  Why This Fits You
                </p>
                <div className="space-y-1.5">
                  {breakdown.strengths.map((s) => (
                    <InsightItem key={s} text={s} type="strength" />
                  ))}
                </div>
              </div>
            )}
            {breakdown.areasToGrow.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                  Things to Consider
                </p>
                <div className="space-y-1.5">
                  {breakdown.areasToGrow.map((a) => (
                    <InsightItem key={a} text={a} type="growth" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <div className={`text-center pt-2 border-t border-theme`}>
          <p className="text-[10px] text-theme-tertiary mt-3">
            <Star className="inline h-3 w-3 mr-1 -mt-0.5" />
            Score based on your profile answers &amp; this opportunity&apos;s attributes
          </p>
        </div>
      </div>
    </div>
  )
}
