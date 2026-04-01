import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
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
} from 'lucide-react'
import CreateOpportunityModal from '@/components/CreateOpportunityModal'
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
    color: 'from-primary to-primary-dark',
    accent: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    description:
      'Institutional-grade real estate investments — RERA-verified properties across India\'s top cities. Earn passive rental income and long-term capital appreciation through fractional ownership.',
    risk: 'Moderate',
    riskColor: 'text-amber-600 bg-amber-50',
    href: '/marketplace?vault=wealth',
    cta: 'Explore Properties',
    videoSrc: 'https://www.w3schools.com/html/mov_bbb.mp4',
    comingSoon: false,
  },
  {
    id: 'opportunity',
    title: 'Opportunity Vault',
    icon: Rocket,
    color: 'from-violet-500 to-violet-700',
    accent: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    description:
      'Back high-potential startup ideas from vetted founders. From deep-tech to consumer brands — invest early in tomorrow\'s market leaders and earn equity-linked returns.',
    risk: 'High',
    riskColor: 'text-red-600 bg-red-50',
    href: '/marketplace?vault=opportunity',
    cta: 'Discover Startups',
    videoSrc: 'https://www.w3schools.com/html/movie.mp4',
    comingSoon: true,
  },
  {
    id: 'community',
    title: 'Community Vault',
    icon: Users,
    color: 'from-emerald-500 to-emerald-700',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description:
      'Community-driven opportunities where passionate individuals need collaborators — not just capital. Help establish sports complexes, co-working spaces, local businesses, and more by contributing your time, network, or expertise alongside funding.',
    risk: 'Low–Moderate',
    riskColor: 'text-emerald-600 bg-emerald-50',
    href: '/marketplace?vault=community',
    cta: 'Join Opportunities',
    videoSrc: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    comingSoon: false,
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
  onPlayVideo,
  onComingSoon,
}: {
  vault: (typeof VAULTS)[number]
  stats?: { totalInvested: number; investorCount: number; expectedIrr: number | null; actualIrr: number | null; opportunityCount: number }
  opportunities: OpportunityItem[]
  onPlayVideo: () => void
  onComingSoon: () => void
}) {
  const Icon = vault.icon
  const isCommunity = vault.id === 'community'

  const handleCTAClick = (e: React.MouseEvent) => {
    if (vault.comingSoon) {
      e.preventDefault()
      onComingSoon()
    }
  }

  /* Resolve expected IRR: API value → default → null (community has none) */
  const expectedIrr = isCommunity
    ? null
    : (stats?.expectedIrr ?? DEFAULT_EXPECTED_IRR[vault.id] ?? null)

  return (
    <div className={`rounded-2xl border ${vault.border} bg-white overflow-hidden shadow-sm hover:shadow-lg transition-shadow group flex flex-col`}>
      {/* Header band */}
      <div className={`bg-gradient-to-r ${vault.color} px-6 py-5`}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-display text-xl font-bold text-white flex-1">{vault.title}</h3>
          {vault.comingSoon && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/20 px-2.5 py-1 rounded-full">
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
            <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg">
              Want to know more? Click here
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5 flex-1 flex flex-col">
        <p className="text-sm text-gray-600 leading-relaxed">{vault.description}</p>

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
        {opportunities.length > 0 && (
          <div className="space-y-2">
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
          </div>
        )}

        {/* CTA */}
        {vault.comingSoon ? (
          <button
            onClick={onComingSoon}
            className={`w-full inline-flex items-center justify-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors bg-gray-200 text-gray-500 cursor-not-allowed mt-auto`}
          >
            <Lock className="h-4 w-4" />
            Launching Soon — Stay Tuned!
          </button>
        ) : (
          <Link
            to={vault.href}
            onClick={handleCTAClick}
            className={`w-full inline-flex items-center justify-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors bg-gradient-to-r ${vault.color} text-white hover:opacity-90 mt-auto`}
          >
            {vault.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
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
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center`}>
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
  const [comingSoonToast, setComingSoonToast] = useState(false)
  const userRole = useUserStore((s) => s.user?.role)

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
      <section className="bg-gradient-to-br from-gray-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Pick Your Arena 🏟️
          </h1>
          <p className="text-gray-500 max-w-2xl text-lg leading-relaxed">
            Three curated vaults — each designed for a different opportunity class. Pick the one that vibes with your goals and start stacking wealth today.
          </p>
        </div>
      </section>

      {/* Vaults Grid */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
          <div className="grid md:grid-cols-3 gap-8">
            {VAULTS.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                stats={statsMap.get(vault.id)}
                opportunities={oppsMap[vault.id] ?? []}
                onPlayVideo={() => setActiveVideo({ title: vault.title, videoSrc: resolveVideo(VAULT_VIDEO_TAGS[vault.id], vault.videoSrc) })}
                onComingSoon={showComingSoon}
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
