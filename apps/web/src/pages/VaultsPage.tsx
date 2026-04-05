import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useProfilingProgress, useOverallProgress } from '@/hooks/useProfiling'
import {
  Building2,
  Rocket,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  Wallet,
  Clock,
  Network,
  GraduationCap,
  AlertTriangle,
  PlayCircle,
  X,
  Lock,
  Sparkles,
} from 'lucide-react'
import CreateOpportunityModal from '@/components/CreateOpportunityModal'
import CommunitySubtypeModal, { type CommunitySubtypeValue } from '@/components/CommunitySubtypeModal'
import { useUserStore } from '@/stores/user.store'
import { useVaultStats, useOpportunities, type OpportunityItem } from '@/hooks/useOpportunities'
import { usePublicVideos } from '@/hooks/useAppVideos'

/* Map vault/pillar IDs → app_videos section_tag */
const VAULT_VIDEO_TAGS: Record<string, string> = {
  wealth: 'wealth_vault_intro',
  opportunity: 'opportunity_vault_intro',
  community: 'community_vault_intro',
}
const PILLAR_VIDEO_TAGS: Record<string, string> = {
  'Wealth Investors': 'wealth_investors_pillar',
  'Time Investors': 'time_investors_pillar',
  'Network Investors': 'network_investors_pillar',
  'Education Investors': 'education_investors_pillar',
}

/* ------------------------------------------------------------------ */
/*  Vault data                                                         */
/* ------------------------------------------------------------------ */

const VAULTS = [
  {
    id: 'wealth',
    title: 'Wealth Vault',
    icon: Building2,
    color: 'from-[#1B2A4A] via-[#2D3F5E] to-[#1B2A4A]',
    accent: 'text-[#D4AF37]',
    accentHex: '#D4AF37',
    bg: 'bg-[#F5F0E1]',
    border: 'border-[#D4AF37]/20',
    hoverShadow: 'hover:shadow-vault-wealth',
    borderLeft: 'border-l-[#D4AF37]',
    description:
      'Institutional-grade real estate investments — RERA-verified properties across India\'s top cities. Earn passive rental income and long-term capital appreciation through fractional ownership.',
    risk: 'Moderate',
    riskColor: 'text-amber-700 bg-amber-50',
    href: '/marketplace?vault=wealth',
    cta: 'Explore Properties',
    videoSrc: 'https://www.w3schools.com/html/mov_bbb.mp4',
    comingSoon: false,
    emoji: '🏛️',
  },
  {
    id: 'opportunity',
    title: 'Opportunity Vault',
    icon: Rocket,
    color: 'from-[#FF6B6B] via-[#FF8E8E] to-[#CC4848]',
    accent: 'text-[#FF6B6B]',
    accentHex: '#20E3B2',
    bg: 'bg-[#FFF0F0]',
    border: 'border-[#20E3B2]/20',
    hoverShadow: 'hover:shadow-vault-opportunity',
    borderLeft: 'border-l-[#20E3B2]',
    description:
      'Back high-potential startup ideas from vetted founders. From deep-tech to consumer brands — invest early in tomorrow\'s market leaders and earn equity-linked returns.',
    risk: 'High',
    riskColor: 'text-red-600 bg-red-50',
    href: '/marketplace?vault=opportunity',
    cta: 'Discover Startups',
    videoSrc: 'https://www.w3schools.com/html/movie.mp4',
    comingSoon: true,
    emoji: '🚀',
  },
  {
    id: 'community',
    title: 'Community Vault',
    icon: Users,
    color: 'from-[#D97706] via-[#F59E0B] to-[#B45309]',
    accent: 'text-[#065F46]',
    accentHex: '#065F46',
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#065F46]/20',
    hoverShadow: 'hover:shadow-vault-community',
    borderLeft: 'border-l-[#065F46]',
    description:
      'Community-driven opportunities where passionate individuals need collaborators — not just capital. Help establish sports complexes, co-working spaces, local businesses, and more by contributing your time, network, or expertise alongside funding.',
    risk: 'Low–Moderate',
    riskColor: 'text-emerald-700 bg-emerald-50',
    href: '/marketplace?vault=community',
    cta: 'Explore Communities',
    videoSrc: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    comingSoon: false,
    emoji: '🤝',
  },
]

/* ------------------------------------------------------------------ */
/*  4 Investor Pillars                                                 */
/* ------------------------------------------------------------------ */

const PILLARS = [
  {
    title: 'Wealth Investors',
    subtitle: 'Capital that compounds',
    icon: Wallet,
    color: 'from-primary/10 to-primary/5',
    iconColor: 'text-primary',
    description:
      'Deploy capital across vaults and earn passive returns through rental income, equity appreciation, and profit-sharing — all from ₹10,000.',
    videoSrc: 'https://www.w3schools.com/html/mov_bbb.mp4',
    contributeHref: '/contribute/wealth',
  },
  {
    title: 'Time Investors',
    subtitle: 'Hours that create value',
    icon: Clock,
    color: 'from-amber-100 to-amber-50',
    iconColor: 'text-amber-600',
    description:
      'Contribute your time and effort to community projects. Mentor founders, manage on-ground execution, or volunteer expertise — earn equity for your hours.',
    videoSrc: 'https://www.w3schools.com/html/movie.mp4',
    contributeHref: '/contribute/time',
  },
  {
    title: 'Network Investors',
    subtitle: 'Connections that catalyse',
    icon: Network,
    color: 'from-violet-100 to-violet-50',
    iconColor: 'text-violet-600',
    description:
      'Open doors with your relationships. Introduce startups to customers, connect projects to suppliers, or bring in co-investors — your network is your investment.',
    videoSrc: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    contributeHref: '/contribute/network',
  },
  {
    title: 'Education Investors',
    subtitle: 'Knowledge that empowers',
    icon: GraduationCap,
    color: 'from-emerald-100 to-emerald-50',
    iconColor: 'text-emerald-600',
    description:
      'Share domain expertise, conduct workshops, or provide strategic advisory. Help ventures succeed through the power of what you know.',
    videoSrc: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    contributeHref: '/contribute/education',
  },
]

/* ------------------------------------------------------------------ */
/*  Video Popup                                                        */
/* ------------------------------------------------------------------ */

function VaultVideoPopup({ title, videoSrc, onClose }: { title: string; videoSrc: string; onClose: () => void }) {
  const [videoError, setVideoError] = useState(false)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: '75vw', height: '75vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Title bar */}
        <div className="absolute top-3 left-4 z-10">
          <span className="text-white/80 text-sm font-semibold">{title}</span>
        </div>

        {/* Video */}
        {videoError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <PlayCircle className="h-12 w-12 text-white/20" />
            <p className="text-white/50 text-sm">Video could not be loaded</p>
            <button onClick={() => setVideoError(false)} className="text-xs text-primary hover:underline">Retry</button>
          </div>
        ) : (
          <video
            src={videoSrc}
            className="w-full h-full object-contain"
            autoPlay
            muted
            controls
            playsInline
            onError={() => setVideoError(true)}
          />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helper: format INR compact                                         */
/* ------------------------------------------------------------------ */

function formatINRCompact(num: number): string {
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(1)} Cr`
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)} L`
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(0)}K`
  return `₹${num.toLocaleString('en-IN')}`
}

/* ------------------------------------------------------------------ */
/*  Vault Card                                                         */
/* ------------------------------------------------------------------ */

/* Default expected IRR per vault (shown when API returns null) */
const DEFAULT_EXPECTED_IRR: Record<string, number> = {
  wealth: 14,
  opportunity: 18,
}

function VaultCard({
  vault,
  stats,
  opportunities,
  profilingPct,
  archetype,
  onPlayVideo,
  onComingSoon,
  onCommunityExplore,
}: {
  vault: (typeof VAULTS)[number]
  stats?: { totalInvested: number; investorCount: number; expectedIrr: number | null; actualIrr: number | null; opportunityCount: number }
  opportunities: OpportunityItem[]
  profilingPct: number
  archetype?: string | null
  onPlayVideo: () => void
  onComingSoon: () => void
  onCommunityExplore?: () => void
}) {
  const Icon = vault.icon
  const isCommunity = vault.id === 'community'

  const handleCTAClick = (e: React.MouseEvent) => {
    if (vault.comingSoon) {
      e.preventDefault()
      onComingSoon()
    } else if (vault.id === 'community' && onCommunityExplore) {
      e.preventDefault()
      onCommunityExplore()
    }
  }

  /* Resolve expected IRR: API value → default → null (community has none) */
  const expectedIrr = isCommunity
    ? null
    : (stats?.expectedIrr ?? DEFAULT_EXPECTED_IRR[vault.id] ?? null)

  return (
    <div className={`rounded-3xl border ${vault.border} border-l-4 ${vault.borderLeft} bg-white overflow-hidden shadow-sm ${vault.hoverShadow} transition-all duration-300 group flex flex-col h-full`}>
      {/* Header band */}
      <div className={`bg-gradient-to-r ${vault.color} px-6 py-5 relative overflow-hidden`}>
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 text-8xl">{vault.emoji}</div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-hero text-xl font-bold text-white flex-1 tracking-tight">{vault.title}</h3>
          {vault.comingSoon && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Lock className="h-3 w-3" />
              Soon
            </span>
          )}
          <button
            onClick={onPlayVideo}
            className="relative shrink-0 group/tip"
            aria-label={`Watch ${vault.title} intro video`}
          >
            <PlayCircle className="h-7 w-7 text-white/70 hover:text-white transition-colors cursor-pointer" />
            <span className="pointer-events-none absolute -bottom-9 right-0 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg z-50">
              Watch Intro
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5 flex-1 flex flex-col">
        <p className="text-sm text-gray-600 leading-relaxed min-h-[4.5rem]">{vault.description}</p>

        {/* Metrics grid — real data from API */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Risk</span>
            </div>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${vault.riskColor}`}>
              {vault.risk}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Invested</span>
            </div>
            <p className="font-mono text-sm font-bold text-gray-900">
              {stats ? formatINRCompact(stats.totalInvested) : '—'}
            </p>
          </div>

          {isCommunity ? (
            <>
              {/* Community vault: Projects Launched / Projects Successful instead of Investors / IRR */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Rocket className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Projects Launched</span>
                </div>
                <p className="font-mono text-sm font-bold text-gray-900">
                  {stats ? stats.opportunityCount.toLocaleString('en-IN') : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Projects Successful</span>
                </div>
                <p className="font-mono text-sm font-bold text-gray-900">—</p>
              </div>
              {/* Spacer row to match Wealth/Opportunity cards' Actual IRR row */}
              <div className="col-span-2" aria-hidden="true" />
            </>
          ) : (
            <>
              {/* Wealth / Opportunity vaults: Investors + IRR */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Investors</span>
                </div>
                <p className="font-mono text-sm font-bold text-gray-900">
                  {stats ? stats.investorCount.toLocaleString('en-IN') : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Expected IRR</span>
                </div>
                <p className={`font-mono text-sm font-bold ${vault.accent}`}>
                  {expectedIrr != null ? `${expectedIrr}%` : '—'}
                </p>
              </div>
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">Actual IRR</span>
                </div>
                <p className="font-mono text-sm font-bold text-emerald-600">
                  {stats?.actualIrr != null ? `${stats.actualIrr}%` : '—'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Approved opportunities in this vault */}
        <div className="space-y-2 min-h-[2.5rem]">
          {opportunities.length > 0 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Active Opportunities ({opportunities.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {opportunities.slice(0, 5).map((opp) => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-gray-800 truncate flex-1 mr-2">{opp.title}</span>
                    <span className="text-gray-400 shrink-0">{opp.city ?? '—'}</span>
                  </div>
                ))}
                {opportunities.length > 5 && (
                  <p className="text-[10px] text-gray-400 text-center">+{opportunities.length - 5} more</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom section: profiling + CTA anchored to card bottom */}
        <div className="mt-auto space-y-4">
          {/* Profiling progress */}
          {!vault.comingSoon && (
            <div className={`rounded-2xl ${vault.bg} p-3.5 space-y-2 border ${vault.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className={`h-3.5 w-3.5 ${vault.accent}`} />
                  <span className="text-[11px] font-semibold text-gray-700">
                    {profilingPct >= 100 ? 'Profile Complete ✨' : 'Investor Profile'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold ${vault.accent}`}>{Math.round(profilingPct)}%</span>
              </div>
              {profilingPct >= 100 && archetype && (
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 ${vault.accent}`}>
                    {archetype}
                  </span>
                </div>
              )}
              <div className="h-2 rounded-full bg-white overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${vault.color} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.min(profilingPct, 100)}%` }}
                />
              </div>
              {profilingPct < 100 && (
                <Link
                  to={`/vault-profiling?vault=${vault.id}`}
                  className={`text-[11px] font-bold ${vault.accent} hover:underline`}
                >
                  {profilingPct > 0 ? 'Continue Profiling →' : 'Start Profiling →'}
                </Link>
              )}
            </div>
          )}

          {/* CTA */}
          {vault.comingSoon ? (
            <button
              onClick={onComingSoon}
              className="w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl transition-colors bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              Launching Soon — Stay Tuned!
            </button>
          ) : (
            <Link
              to={vault.href}
              onClick={handleCTAClick}
              className={`w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl transition-all duration-300 bg-gradient-to-r ${vault.color} text-white hover:opacity-90 hover:scale-[1.02] shadow-md`}
            >
              {vault.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Pillar Card                                                        */
/* ------------------------------------------------------------------ */

function PillarCard({ pillar, onPlayVideo }: { pillar: (typeof PILLARS)[number]; onPlayVideo: () => void }) {
  const Icon = pillar.icon

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${pillar.color} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${pillar.iconColor}`} />
        </div>
        <button
          onClick={onPlayVideo}
          className="relative group/tip shrink-0"
          aria-label={`Watch ${pillar.title} explainer video`}
        >
          <PlayCircle className="h-5 w-5 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer" />
          <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg">
            Learn more
          </span>
        </button>
      </div>
      <h4 className="font-display text-base font-bold text-gray-900 mb-0.5">{pillar.title}</h4>
      <p className="text-xs font-medium text-gray-400 mb-2">{pillar.subtitle}</p>
      <p className="text-sm text-gray-600 leading-relaxed flex-1">{pillar.description}</p>
      {/* Contribute link hidden until feature is ready */}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function VaultsPage() {
  const [activeVideo, setActiveVideo] = useState<{ title: string; videoSrc: string } | null>(null)
  const [activePillarVideo, setActivePillarVideo] = useState<{ title: string; videoSrc: string } | null>(null)
  const [showCreateOpp, setShowCreateOpp] = useState(false)
  const [showCommunityExplore, setShowCommunityExplore] = useState(false)
  const [comingSoonToast, setComingSoonToast] = useState(false)
  const userRole = useUserStore((s) => s.user?.role)
  const navigate = useNavigate()

  // Fetch profiling progress per vault
  const { data: wealthProgress } = useProfilingProgress('wealth')
  const { data: opportunityProgress } = useProfilingProgress('opportunity')
  const { data: communityProgress } = useProfilingProgress('community')
  const { data: overall } = useOverallProgress()
  const profilingMap: Record<string, number> = {
    wealth: wealthProgress?.completionPct ?? 0,
    opportunity: opportunityProgress?.completionPct ?? 0,
    community: communityProgress?.completionPct ?? 0,
  }
  const archetypeMap: Record<string, string | null> = {
    wealth: overall?.vaults.wealth?.archetype ?? null,
    opportunity: overall?.vaults.opportunity?.archetype ?? null,
    community: overall?.vaults.community?.archetype ?? null,
  }

  // Fetch real vault stats from API
  const { data: vaultStatsData } = useVaultStats()
  const statsMap = new Map(
    (vaultStatsData ?? []).map((s) => [s.vaultType, s])
  )

  // Fetch all opportunities per vault for vault-card mini-lists
  const { data: wealthOpps } = useOpportunities({ vaultType: 'wealth' })
  const { data: opportunityOpps } = useOpportunities({ vaultType: 'opportunity' })
  const { data: communityOpps } = useOpportunities({ vaultType: 'community' })
  const oppsMap: Record<string, OpportunityItem[]> = {
    wealth: wealthOpps?.items ?? [],
    opportunity: opportunityOpps?.items ?? [],
    community: communityOpps?.items ?? [],
  }

  // Fetch managed video URLs — override hardcoded defaults
  const { data: managedVideos } = usePublicVideos('vaults')
  const videoUrlMap = new Map(
    (managedVideos ?? []).map((v) => [v.sectionTag, v.videoUrl])
  )
  const resolveVideo = (tag: string | undefined, fallback: string): string =>
    (tag ? videoUrlMap.get(tag) : undefined) ?? fallback

  const showComingSoon = () => {
    setComingSoonToast(true)
    setTimeout(() => setComingSoonToast(false), 3000)
  }

  return (
    <>
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Shared Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20" style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #2D3F5E 25%, #5B4FCF 50%, #D97706 75%, #FF6B6B 100%)', backgroundSize: '200% 200%', animation: 'gradient-shift 12s ease infinite' }}>
        {/* Decorative floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-8 left-[10%] text-5xl opacity-20 animate-float">🏛️</div>
          <div className="absolute top-16 right-[15%] text-4xl opacity-15 animate-float" style={{ animationDelay: '1s' }}>🚀</div>
          <div className="absolute bottom-12 left-[25%] text-4xl opacity-15 animate-float" style={{ animationDelay: '2s' }}>🤝</div>
          <div className="absolute top-24 left-[60%] text-3xl opacity-10 animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>💎</div>
          <div className="absolute bottom-8 right-[30%] text-3xl opacity-10 animate-bounce-gentle" style={{ animationDelay: '1.5s' }}>⚡</div>
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
          <div className="animate-fade-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-bold uppercase tracking-widest mb-5">
              Three Vaults. Infinite Possibilities.
            </span>
            <h1 className="font-hero text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight">
              Pick Your Arena
            </h1>
            <p className="text-white/70 max-w-2xl text-lg leading-relaxed font-body">
              Each vault is designed for a different investment class — real estate, startups, or community ventures. Find the one that matches your ambition.
            </p>
          </div>
        </div>
      </section>

      {/* Vaults Grid */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {VAULTS.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                stats={statsMap.get(vault.id)}
                opportunities={oppsMap[vault.id] ?? []}
                profilingPct={profilingMap[vault.id] ?? 0}
                archetype={archetypeMap[vault.id]}
                onPlayVideo={() => setActiveVideo({ title: vault.title, videoSrc: resolveVideo(VAULT_VIDEO_TAGS[vault.id], vault.videoSrc) })}
                onComingSoon={showComingSoon}
                onCommunityExplore={vault.id === 'community' ? () => setShowCommunityExplore(true) : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4 Investor Pillars — super_admin only */}
      {userRole === 'super_admin' && (
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">The Four Pillars</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              Every Investor Has Something Unique to Offer
            </h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              At WealthSpot, investing isn't just about money. We recognise four types of investors — each contributing a different kind of capital to create outsized value together.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar) => (
              <PillarCard
                key={pillar.title}
                pillar={pillar}
                onPlayVideo={() => setActivePillarVideo({ title: pillar.title, videoSrc: resolveVideo(PILLAR_VIDEO_TAGS[pillar.title], pillar.videoSrc) })}
              />
            ))}
          </div>
        </div>
      </section>
      )}
    </div>

      {/* Vault intro video popup */}
      {activeVideo && (
        <VaultVideoPopup
          title={activeVideo.title}
          videoSrc={activeVideo.videoSrc}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Pillar explainer video popup */}
      {activePillarVideo && (
        <VaultVideoPopup
          title={activePillarVideo.title}
          videoSrc={activePillarVideo.videoSrc}
          onClose={() => setActivePillarVideo(null)}
        />
      )}

      {/* Create Opportunity modal */}
      <CreateOpportunityModal open={showCreateOpp} onClose={() => setShowCreateOpp(false)} />

      {/* Community subtype explore modal */}
      <CommunitySubtypeModal
        open={showCommunityExplore}
        onClose={() => setShowCommunityExplore(false)}
        mode="explore"
        onSelect={(subtype: CommunitySubtypeValue) => {
          setShowCommunityExplore(false)
          navigate(`/marketplace?vault=community&subtype=${subtype}`)
        }}
      />

      {/* Coming soon toast */}
      {comingSoonToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-xl shadow-2xl">
            <Lock className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Opportunity Vault is Coming Soon 🚀</p>
              <p className="text-xs text-gray-400 mt-0.5">We're curating something special. Stay tuned!</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
