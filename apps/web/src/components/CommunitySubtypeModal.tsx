import { X, PlayCircle, Wallet, Handshake } from 'lucide-react'
import { usePublicVideos } from '@/hooks/useAppVideos'
import { useVaultConfig } from '@/hooks/useVaultConfig'

const SUBTYPES = [
  {
    value: 'co_investor' as const,
    label: 'Co-Investor',
    badge: 'Capital Only',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: Wallet,
    iconBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-700/40 hover:border-amber-400 hover:shadow-amber-100',
    videoTag: 'community_co_investor_explainer',
    description:
      'Contribute capital to fund a community project and earn returns through profit-sharing, rental income, or equity appreciation — without active involvement.',
    highlights: ['Passive investment', 'Profit-sharing returns', 'No time commitment required'],
  },
  {
    value: 'co_partner' as const,
    label: 'Co-Partner',
    badge: 'Capital + Active Role',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    icon: Handshake,
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-700/40 hover:border-emerald-400 hover:shadow-emerald-100',
    videoTag: 'community_co_partner_explainer',
    description:
      'Partner up by contributing capital plus your time, skills, and network. Earn equity and profit share in exchange for hands-on involvement in the project.',
    highlights: ['Equity & profit share', 'Active involvement', 'Leverage your skills & network'],
  },
] as const

export type CommunitySubtypeValue = 'co_investor' | 'co_partner'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (subtype: CommunitySubtypeValue) => void
  /** Heading variant — 'explore' for VaultsPage, 'create' for CreateOpportunityModal */
  mode: 'explore' | 'create'
}

export default function CommunitySubtypeModal({ open, onClose, onSelect, mode }: Props) {
  const { data: videos } = usePublicVideos('vaults')
  const { vaultVideosEnabled } = useVaultConfig()

  if (!open) return null

  const getVideoUrl = (sectionTag: string) =>
    vaultVideosEnabled ? videos?.find((v) => v.sectionTag === sectionTag)?.videoUrl : undefined

  return (
    <div className="modal-overlay z-[9999]" onClick={onClose}>
      <div
        className="modal-panel max-w-xl mx-4 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">
                {mode === 'explore' ? 'Explore Community Opportunities' : 'What type of community opportunity?'}
              </h2>
              <p className="text-sm text-white/80 mt-1">
                {mode === 'explore'
                  ? 'Choose how you want to participate in community projects.'
                  : 'Select the type of opportunity you want to create.'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="p-6 space-y-4">
          {SUBTYPES.map((st) => {
            const Icon = st.icon
            const videoUrl = getVideoUrl(st.videoTag)
            return (
              <button
                key={st.value}
                onClick={() => onSelect(st.value)}
                className={`w-full text-left p-5 rounded-xl border-2 ${st.border} transition-all hover:shadow-md group`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${st.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-theme-primary">{st.label}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${st.badgeColor}`}>
                        {st.badge}
                      </span>
                    </div>
                    <p className="text-sm text-theme-secondary leading-relaxed">{st.description}</p>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {st.highlights.map((h) => (
                        <span key={h} className="text-[11px] text-theme-secondary bg-theme-surface-hover px-2 py-0.5 rounded-full">
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Video explainer link */}
                    {videoUrl && (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-medium mt-3 hover:underline"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Watch Explainer Video
                      </a>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
