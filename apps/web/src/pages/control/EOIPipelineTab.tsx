import { useState, useCallback, useMemo } from 'react'
import {
  Search,
  User,
  Building2,
  ExternalLink,
  Gift,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
  Phone,
  MapPin,
  Shield,
  Briefcase,
  Calendar,
  Eye,
} from 'lucide-react'
import {
  useAdminEOIPipeline,
  useUpdateEOIStatus,
  EOI_PIPELINE_STATUSES,
  EOI_STATUS_LABELS,
  type EOIItem,
  type EOIUser,
} from '@/hooks/useEOI'
import { formatINR } from '@/lib/formatters'
import { CenteredLoader } from './shared'

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                                */
/* ------------------------------------------------------------------ */

const uniformStyle = { bg: 'bg-[var(--bg-surface)]', border: 'border-[#D4AF37]', text: 'text-[#D4AF37]', dot: 'bg-[#D4AF37]' }
const PIPELINE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  submitted: uniformStyle,
  builder_connected: uniformStyle,
  deal_in_progress: uniformStyle,
  payment_done: uniformStyle,
  deal_completed: uniformStyle,
}

function UserDetailField({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-8 w-8 rounded-lg bg-theme-surface flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-theme-tertiary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-theme-tertiary uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-theme-primary break-all">{value || '—'}</p>
      </div>
    </div>
  )
}

function UserDetailsModal({ user, title, onClose }: { user: EOIUser; title: string; onClose: () => void }) {
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const kycLabel: Record<string, string> = {
    not_started: 'Not Started', pending: 'Pending', submitted: 'Submitted', verified: 'Verified', rejected: 'Rejected',
  }
  const roleLabel: Record<string, string> = {
    investor: 'Investor', builder: 'Builder', admin: 'Admin', super_admin: 'Super Admin',
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-md mx-4 max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
          <h3 className="font-display text-lg font-bold text-theme-primary">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[var(--bg-surface-hover)] transition-colors">
            <X className="h-4 w-4 text-theme-secondary" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4 space-y-1 max-h-[65vh]">
          <div className="flex items-center gap-4 pb-4 border-b border-theme mb-2">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-14 w-14 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <p className="text-base font-bold text-theme-primary">{user.fullName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {user.role && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary">
                    {roleLabel[user.role] ?? user.role}
                  </span>
                )}
                {user.kycStatus && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    user.kycStatus === 'verified' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : user.kycStatus === 'rejected' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    {kycLabel[user.kycStatus] ?? user.kycStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
          <UserDetailField icon={Mail} label="Email" value={user.email} />
          <UserDetailField icon={Phone} label="Phone" value={user.phone} />
          <UserDetailField icon={MapPin} label="Location" value={[user.city, user.state].filter(Boolean).join(', ') || null} />
          <UserDetailField icon={Briefcase} label="Occupation" value={user.occupation} />
          <UserDetailField icon={Shield} label="Annual Income" value={user.annualIncome} />
          <UserDetailField icon={Eye} label="Investment Experience" value={user.investmentExperience} />
          <UserDetailField icon={Shield} label="Risk Tolerance" value={user.riskTolerance} />
          <UserDetailField icon={Gift} label="Referral Code" value={user.referralCode} />
          <UserDetailField icon={Calendar} label="Member Since" value={fmtDate(user.createdAt)} />
        </div>
      </div>
    </div>
  )
}

function EOICard({ eoi, onAdvance, onRevert, onShowUser }: {
  eoi: EOIItem
  onAdvance: (eoiId: string, to: string) => void
  onRevert: (eoiId: string, to: string) => void
  onShowUser: (user: EOIUser, label: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })

  const currentIdx = EOI_PIPELINE_STATUSES.indexOf(eoi.status as typeof EOI_PIPELINE_STATUSES[number])
  const nextStatus = currentIdx >= 0 && currentIdx < EOI_PIPELINE_STATUSES.length - 1
    ? EOI_PIPELINE_STATUSES[currentIdx + 1]
    : null
  const prevStatus = currentIdx > 0 ? EOI_PIPELINE_STATUSES[currentIdx - 1] : null

  return (
    <div className="bg-[var(--bg-card)] backdrop-blur-sm rounded-xl border border-theme/60 shadow-sm p-4 space-y-3">
      {prevStatus && (
        <button
          onClick={() => onRevert(eoi.id, prevStatus)}
          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Move back to {EOI_STATUS_LABELS[prevStatus] ?? prevStatus}
        </button>
      )}

      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-theme-primary truncate">{eoi.user?.fullName ?? 'Unknown'}</p>
          <p className="text-[11px] text-theme-tertiary">{fmtDate(eoi.createdAt)}</p>
        </div>
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="p-1 rounded hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-theme-primary transition-colors shrink-0"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex items-center gap-2 p-2 bg-theme-surface rounded-lg">
            <Building2 className="h-4 w-4 text-theme-tertiary shrink-0" />
            <a
              href={`/opportunity/${eoi.opportunity?.slug ?? ''}`}
              className="text-xs font-medium text-theme-primary hover:text-primary truncate"
              target="_blank"
              rel="noopener noreferrer"
            >
              {eoi.opportunity?.title ?? 'N/A'}
            </a>
            <ExternalLink className="h-3 w-3 text-theme-tertiary shrink-0" />
          </div>

          {eoi.investmentAmount != null && (
            <p className="text-xs text-theme-secondary">
              Investment: <span className="font-mono font-semibold text-theme-primary">{formatINR(eoi.investmentAmount)}</span>
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            <Gift className="h-3.5 w-3.5 text-theme-tertiary" />
            {eoi.referrer ? (
              <span className="text-theme-secondary">
                Referred by <span className="font-semibold text-theme-primary">{eoi.referrer.fullName}</span>
              </span>
            ) : (
              <span className="text-theme-tertiary">Direct (no referral)</span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-theme">
            <button
              onClick={() => eoi.user && onShowUser(eoi.user, 'User Details')}
              className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1 disabled:text-theme-tertiary"
              disabled={!eoi.user}
            >
              <User className="h-3 w-3" /> User Details
            </button>
            <span className="text-[var(--border-default)]">|</span>
            <a
              href={`/opportunity/${eoi.opportunity?.slug ?? ''}`}
              className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Building2 className="h-3 w-3" /> Property Details
            </a>
            {eoi.referrer && (
              <>
                <span className="text-[var(--border-default)]">|</span>
                <button
                  onClick={() => eoi.referrer && onShowUser(eoi.referrer, 'Referrer Details')}
                  className="text-[11px] font-medium text-[#D4AF37] hover:underline inline-flex items-center gap-1"
                >
                  <Gift className="h-3 w-3" /> Referrer Details
                </button>
              </>
            )}
          </div>

          {(() => {
            const curIdx = EOI_PIPELINE_STATUSES.indexOf(eoi.status as typeof EOI_PIPELINE_STATUSES[number])
            const relevantStatuses = EOI_PIPELINE_STATUSES.slice(0, curIdx >= 0 ? curIdx + 1 : 1)
            const historyMap = new Map((eoi.stageHistory ?? []).map((h) => [h.status, h.changedAt]))
            if (!historyMap.has('submitted')) historyMap.set('submitted', eoi.createdAt)
            return (
              <div className="pt-2 border-t border-dashed border-theme space-y-1.5">
                <p className="text-[10px] font-semibold text-theme-secondary uppercase tracking-wider mb-1">Stage Timeline</p>
                {relevantStatuses.map((s, idx) => {
                  const enteredAt = historyMap.get(s)
                  const isCurrent = idx === relevantStatuses.length - 1
                  let duration = ''
                  if (enteredAt) {
                    const from = new Date(enteredAt).getTime()
                    const nextStage = relevantStatuses[idx + 1]
                    const to = nextStage && historyMap.get(nextStage)
                      ? new Date(historyMap.get(nextStage)!).getTime()
                      : Date.now()
                    const diffMs = to - from
                    const diffH = Math.floor(diffMs / 3_600_000)
                    const diffD = Math.floor(diffH / 24)
                    if (diffD > 0) duration = `${diffD}d ${diffH % 24}h`
                    else if (diffH > 0) duration = `${diffH}h`
                    else duration = `${Math.max(1, Math.floor(diffMs / 60_000))}m`
                  }
                  return (
                    <div key={s} className="flex items-start gap-2 text-[11px]">
                      <div className="flex flex-col items-center mt-0.5">
                        {isCurrent ? (
                          <div className="h-3 w-3 rounded-full border-2 border-primary bg-primary/20" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-[#D4AF37]" />
                        )}
                        {idx < relevantStatuses.length - 1 && <div className="w-px h-3 bg-[var(--bg-surface-hover)] mt-0.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={isCurrent ? 'font-semibold text-theme-primary' : 'text-theme-secondary'}>
                            {EOI_STATUS_LABELS[s] ?? s}
                          </span>
                          <span className="text-theme-tertiary font-mono text-[10px]">
                            {enteredAt ? fmtDateTime(enteredAt) : '—'}
                          </span>
                        </div>
                        {duration && (
                          <span className={`text-[9px] ${isCurrent ? 'text-primary font-medium' : 'text-theme-tertiary'}`}>
                            {isCurrent ? `In stage: ${duration}` : `Stayed: ${duration}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {nextStatus && (
            <button
              onClick={() => onAdvance(eoi.id, nextStatus)}
              className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Move to {EOI_STATUS_LABELS[nextStatus] ?? nextStatus}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  EOIPipelineTab                                                     */
/* ------------------------------------------------------------------ */

export default function EOIPipelineTab() {
  const { data: allEOIs, isLoading } = useAdminEOIPipeline()
  const updateStatus = useUpdateEOIStatus()
  const [search, setSearch] = useState('')
  const [modalUser, setModalUser] = useState<{ user: EOIUser; label: string } | null>(null)
  const [pendingAdvance, setPendingAdvance] = useState<{
    eoiId: string; to: string; userName: string; fromLabel: string; toLabel: string; direction: 'forward' | 'back'
  } | null>(null)

  const handleAdvance = (eoiId: string, to: string) => {
    const eoi = (allEOIs ?? []).find((e) => e.id === eoiId)
    const currentIdx = EOI_PIPELINE_STATUSES.indexOf((eoi?.status ?? 'submitted') as typeof EOI_PIPELINE_STATUSES[number])
    const fromLabel = EOI_STATUS_LABELS[EOI_PIPELINE_STATUSES[currentIdx] ?? 'submitted'] ?? eoi?.status ?? 'Unknown'
    setPendingAdvance({ eoiId, to, userName: eoi?.user?.fullName ?? 'Unknown', fromLabel, toLabel: EOI_STATUS_LABELS[to] ?? to, direction: 'forward' })
  }

  const handleRevert = (eoiId: string, to: string) => {
    const eoi = (allEOIs ?? []).find((e) => e.id === eoiId)
    const currentIdx = EOI_PIPELINE_STATUSES.indexOf((eoi?.status ?? 'submitted') as typeof EOI_PIPELINE_STATUSES[number])
    const fromLabel = EOI_STATUS_LABELS[EOI_PIPELINE_STATUSES[currentIdx] ?? 'submitted'] ?? eoi?.status ?? 'Unknown'
    setPendingAdvance({ eoiId, to, userName: eoi?.user?.fullName ?? 'Unknown', fromLabel, toLabel: EOI_STATUS_LABELS[to] ?? to, direction: 'back' })
  }

  const confirmAdvance = () => {
    if (!pendingAdvance) return
    updateStatus.mutate({ eoiId: pendingAdvance.eoiId, newStatus: pendingAdvance.to })
    setPendingAdvance(null)
  }

  const handleShowUser = useCallback((user: EOIUser, label: string) => {
    setModalUser({ user, label })
  }, [])

  const filtered = useMemo(() => (allEOIs ?? []).filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.user?.fullName ?? '').toLowerCase().includes(q) ||
      (e.opportunity?.title ?? '').toLowerCase().includes(q) ||
      (e.referrer?.fullName ?? '').toLowerCase().includes(q)
    )
  }), [allEOIs, search])

  const grouped = useMemo(() => EOI_PIPELINE_STATUSES.reduce<Record<string, EOIItem[]>>((acc, status) => {
    acc[status] = filtered.filter((e) => e.status === status)
    return acc
  }, {}), [filtered])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">EOI Pipeline</h2>
        <p className="text-sm text-theme-secondary mt-1">
          Track Expression of Interest from submission to deal completion. Move cards through stages to monitor the deal lifecycle.
        </p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
        <input
          type="text"
          placeholder="Search user, property, referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-theme text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      {isLoading ? (
        <CenteredLoader />
      ) : (
        <div className="grid grid-cols-5 gap-4 pb-4">
          {EOI_PIPELINE_STATUSES.map((status) => {
            const col = PIPELINE_COLORS[status] ?? PIPELINE_COLORS.submitted!
            const items = grouped[status] ?? []
            return (
              <div key={status} className="min-w-0">
                <div className={`${col.bg} ${col.border} border rounded-xl px-4 py-3 mb-3 flex items-center gap-2`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h3 className={`text-sm font-bold ${col.text}`}>{EOI_STATUS_LABELS[status] ?? status}</h3>
                  <span className={`ml-auto text-xs font-mono font-bold ${col.text}`}>{items.length}</span>
                </div>
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-theme-tertiary text-xs">No items</div>
                  ) : (
                    items.map((eoi) => (
                      <EOICard key={eoi.id} eoi={eoi} onAdvance={handleAdvance} onRevert={handleRevert} onShowUser={handleShowUser} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pendingAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPendingAdvance(null)}>
          <div className="bg-[var(--bg-card)] border border-theme rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  pendingAdvance.direction === 'back' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
                }`}>
                  <AlertTriangle className={`h-5 w-5 ${pendingAdvance.direction === 'back' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-primary">
                    {pendingAdvance.direction === 'back' ? 'Revert Stage?' : 'Confirm Stage Change'}
                  </h3>
                  <p className="text-xs text-theme-tertiary mt-0.5">
                    {pendingAdvance.direction === 'back' ? 'This will move the EOI back to a previous stage.' : 'This will move the EOI to the next stage.'}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-theme-surface border border-theme p-3 space-y-2">
                <p className="text-sm text-theme-secondary">
                  <span className="font-semibold text-theme-primary">{pendingAdvance.userName}</span>
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-md bg-[var(--bg-surface-hover)] text-theme-secondary font-medium">{pendingAdvance.fromLabel}</span>
                  {pendingAdvance.direction === 'back'
                    ? <ArrowLeft className="h-3.5 w-3.5 text-red-400" />
                    : <ArrowRight className="h-3.5 w-3.5 text-theme-tertiary" />}
                  <span className={`px-2 py-1 rounded-md font-semibold ${
                    pendingAdvance.direction === 'back' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-primary/10 text-primary'
                  }`}>{pendingAdvance.toLabel}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setPendingAdvance(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-theme text-theme-secondary hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAdvance}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg text-white transition-colors ${
                    pendingAdvance.direction === 'back' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {pendingAdvance.direction === 'back' ? 'Revert' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalUser && (
        <UserDetailsModal user={modalUser.user} title={modalUser.label} onClose={() => setModalUser(null)} />
      )}
    </div>
  )
}
