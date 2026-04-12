import { Lock, Sparkles } from 'lucide-react'

/* ── Vault-specific creative messaging ─────────────────────────── */

const VAULT_COMING_SOON: Record<
  string,
  { emoji: string; headline: string; subtext: string; button: string; toast: string; toastSub: string; portfolioText: string }
> = {
  opportunity: {
    emoji: '🚀',
    headline: 'The launchpad is being built.\nBig things ahead.',
    subtext: 'We\'re curating the boldest founders and hottest startups. Front-row seats, coming your way.',
    button: 'Launching Soon — Stay Tuned!',
    toast: 'Opportunity Vault is gearing up for liftoff 🚀',
    toastSub: 'We\'re curating something extraordinary. Stay tuned!',
    portfolioText: 'Your startup portfolio awaits. We\'re hand-picking the boldest founders for you.',
  },
  community: {
    emoji: '🤝',
    headline: 'We\'re rallying the tribe.\nSomething powerful is brewing.',
    subtext: 'Community-powered ventures need the right crowd. We\'re building the hive — you\'ll be first in.',
    button: 'The Hive Awakens Soon!',
    toast: 'Community Vault: Where crowds build kingdoms 🏰',
    toastSub: 'Great things take a village. Watch this space.',
    portfolioText: 'The community treasury is warming up. Collective power, coming soon.',
  },
}

export function getVaultComingSoonText(vaultId: string) {
  return VAULT_COMING_SOON[vaultId] ?? VAULT_COMING_SOON.opportunity!
}

/* ── Card Overlay ─────────────────────────────────────────────── */

/**
 * Glassmorphism overlay for vault cards — used on VaultsPage and PortfolioPage.
 * Wraps or sits atop a vault card to communicate "coming soon" status.
 */
export function VaultComingSoonCard({ vaultId }: { vaultId: string }) {
  const text = getVaultComingSoonText(vaultId)

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-md bg-white/40 border border-white/30 px-6 text-center transition-all">
      <div className="relative">
        <Lock className="h-7 w-7 text-gray-500 animate-pulse" />
        <Sparkles className="h-3.5 w-3.5 text-amber-400 absolute -top-1 -right-2" />
      </div>
      <p className="text-sm font-bold text-gray-800 whitespace-pre-line leading-snug">{text.headline}</p>
      <p className="text-xs text-gray-500 max-w-[16rem] leading-relaxed">{text.subtext}</p>
    </div>
  )
}

/* ── Portfolio Placeholder Card ────────────────────────────────── */

/**
 * Placeholder card shown in "Vault Breakdown" when a vault is disabled
 * and the user has no holdings in it.
 */
export function VaultComingSoonPortfolioCard({
  vaultId,
  icon: Icon,
  label,
  gradient,
  accent,
}: {
  vaultId: string
  icon: React.ElementType
  label: string
  gradient: string
  accent: string
}) {
  const text = getVaultComingSoonText(vaultId)

  return (
    <div className={`rounded-xl border ${accent} overflow-hidden relative group`}>
      <div className={`bg-gradient-to-r ${gradient} px-5 py-4`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-white">{label}</h3>
            <p className="text-white/70 text-xs flex items-center gap-1">
              <Lock className="h-3 w-3" /> Coming Soon
            </p>
          </div>
        </div>
      </div>
      <div className="px-5 py-6 flex flex-col items-center gap-2 text-center relative">
        {/* Glassmorphism hover overlay */}
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center px-4 z-10">
          <p className="text-xs font-semibold text-gray-700 leading-relaxed">{text.subtext}</p>
        </div>
        <span className="text-2xl">{text.emoji}</span>
        <p className="text-sm font-semibold text-gray-700">{text.portfolioText}</p>
      </div>
    </div>
  )
}

/* ── Marketplace Banner ────────────────────────────────────────── */

/**
 * Full-width banner shown when user navigates to a disabled vault's marketplace.
 */
export function VaultComingSoonBanner({
  vaultId,
  onExploreOther,
}: {
  vaultId: string
  onExploreOther: () => void
}) {
  const text = getVaultComingSoonText(vaultId)

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-4">
        <span className="text-5xl">{text.emoji}</span>
        <div className="absolute -bottom-1 -right-1">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <h2 className="font-display text-2xl font-bold text-gray-900 mb-2 whitespace-pre-line">{text.headline}</h2>
      <p className="text-sm text-gray-500 max-w-md mb-6">{text.subtext}</p>
      <button
        onClick={onExploreOther}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
      >
        Explore Other Vaults
      </button>
    </div>
  )
}
