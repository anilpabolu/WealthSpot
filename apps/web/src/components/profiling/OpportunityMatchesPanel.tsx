/**
 * OpportunityMatchesPanel – Shows matched users for an opportunity.
 *
 * Used by opportunity creators to see who's a good fit based on
 * profiling data. Vault-aware card layout with avatars,
 * match rings, archetype labels, and strength badges.
 */

import { Users, Sparkles, Trophy } from 'lucide-react'
import { useOpportunityMatches } from '@/hooks/useProfiling'
import type { MatchedUser } from '@/hooks/useProfiling'

/* ─── Tier helpers ──────────────────────────────────────────────────────── */

function getTierConfig(score: number) {
  if (score >= 85) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', ring: 'ring-emerald-400', emoji: '🌟' }
  if (score >= 70) return { label: 'Great', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30', ring: 'ring-violet-400', emoji: '🔥' }
  if (score >= 50) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', ring: 'ring-blue-400', emoji: '👍' }
  if (score >= 35) return { label: 'Partial', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', ring: 'ring-amber-400', emoji: '🤔' }
  return { label: 'Exploring', color: 'text-theme-secondary', bg: 'bg-theme-surface', ring: 'ring-gray-300', emoji: '🔍' }
}

/* ─── Vault Color Helpers ──────────────────────────────────────────────── */

const VAULT_RING_COLORS: Record<string, string> = {
  wealth: '#D4AF37',
  opportunity: '#20E3B2',
  community: '#065F46',
}

const VAULT_ACCENT_BG: Record<string, string> = {
  wealth: 'bg-[#F5F0E1]',
  opportunity: 'bg-[#D5F5EC]',
  community: 'bg-[#FFFBEB]',
}

const VAULT_ACCENT_TEXT: Record<string, string> = {
  wealth: 'text-[#1B2A4A]',
  opportunity: 'text-[#FF6B6B]',
  community: 'text-[#065F46]',
}

/* ─── Mini Score Ring ──────────────────────────────────────────────────── */

function MiniRing({ score, size = 40, vaultType }: { score: number; size?: number; vaultType?: string }) {
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const vaultColor = vaultType ? VAULT_RING_COLORS[vaultType] : undefined
  const strokeColor = vaultColor || (score >= 85 ? '#10B981' : score >= 70 ? '#8B5CF6' : score >= 50 ? '#3B82F6' : score >= 35 ? '#F59E0B' : '#9CA3AF')

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={3} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={strokeColor} strokeWidth={3}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-theme-primary">
        {Math.round(score)}
      </span>
    </div>
  )
}

/* ─── Matched User Card ────────────────────────────────────────────────── */

function MatchedUserCard({ user, vaultType }: { user: MatchedUser; vaultType?: string }) {
  const tier = getTierConfig(user.overallScore)
  const accentBg = vaultType ? (VAULT_ACCENT_BG[vaultType] ?? tier.bg) : tier.bg
  const accentText = vaultType ? (VAULT_ACCENT_TEXT[vaultType] ?? '') : ''

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${accentBg} border-theme hover:shadow-md transition-all group`}>
      {/* Avatar with score ring */}
      <div className="relative shrink-0">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.fullName} className={`w-10 h-10 rounded-full object-cover ring-2 ${tier.ring}`} />
        ) : (
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-violet-200 flex items-center justify-center ring-2 ${tier.ring}`}>
            <span className="text-sm font-bold text-primary">{user.fullName.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-theme-primary truncate">{user.fullName}</p>
          <span className="text-sm">{tier.emoji}</span>
        </div>
        {/* Archetype label */}
        {user.archetypeLabel && (
          <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${accentBg} ${accentText || tier.color}`}>
            {user.archetypeLabel}
          </span>
        )}
        {user.topStrengths.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {user.topStrengths.slice(0, 3).map((s: string) => (
              <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-theme-secondary capitalize">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
        {/* Compatibility label */}
        {user.archetypeCompatibility && (
          <p className="text-[10px] text-theme-tertiary mt-1 font-medium">{user.archetypeCompatibility}</p>
        )}
      </div>

      {/* Score */}
      <MiniRing score={user.overallScore} vaultType={vaultType} />
    </div>
  )
}

/* ─── Main Panel ───────────────────────────────────────────────────────── */

export default function OpportunityMatchesPanel({ opportunityId, vaultType }: { opportunityId: string; vaultType?: string }) {
  const { data, isLoading } = useOpportunityMatches(opportunityId)
  const accentText = vaultType ? (VAULT_ACCENT_TEXT[vaultType] ?? 'text-primary') : 'text-primary'

  if (isLoading) {
    return (
      <div className="card p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-[var(--bg-surface-hover)] rounded w-40" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-hover)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[var(--bg-surface-hover)] rounded w-24" />
              <div className="h-2 bg-theme-surface-hover rounded w-40" />
            </div>
            <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-hover)]" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.matches.length === 0) {
    return (
      <div className="card p-6 text-center rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-3">
          <Users className="h-7 w-7 text-primary/40" />
        </div>
        <p className="font-hero text-sm font-bold text-theme-primary">No Matches Yet</p>
        <p className="text-xs text-theme-tertiary mt-1">Matches will appear as users complete their profiling.</p>
      </div>
    )
  }

  const topMatch = data.matches[0]

  return (
    <div className="card p-6 space-y-4 rounded-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={`h-5 w-5 ${accentText}`} />
          <h3 className="font-hero text-base font-bold text-theme-primary">
            Matched Investors
          </h3>
        </div>
        <span className="text-xs font-medium text-theme-tertiary">
          {data.totalMatches} match{data.totalMatches !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Top match highlight */}
      {topMatch && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${vaultType ? (VAULT_ACCENT_BG[vaultType] ?? 'bg-primary/5') : 'bg-primary/5'}`}>
          <Trophy className="h-5 w-5 text-amber-500" />
          <p className="text-xs text-theme-secondary">
            <strong className="text-theme-primary">Top match:</strong>{' '}
            {topMatch.fullName}
            {topMatch.archetypeLabel && <span className="text-theme-tertiary"> ({topMatch.archetypeLabel})</span>}
            {' — '}{Math.round(topMatch.overallScore)}% compatibility
            {topMatch.archetypeCompatibility && (
              <span className={`ml-1.5 font-bold ${accentText}`}>{topMatch.archetypeCompatibility}</span>
            )}
          </p>
        </div>
      )}

      {/* Matched user list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {data.matches.map((user) => (
          <MatchedUserCard key={user.userId} user={user} vaultType={vaultType} />
        ))}
      </div>
    </div>
  )
}
