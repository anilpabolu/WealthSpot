import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PortalLayout } from '@/components/layout'
import FundingBar from '@/components/wealth/FundingBar'
import StatusBadge, { type StatusType } from '@/components/wealth/StatusBadge'
import IrrBadge from '@/components/wealth/IrrBadge'
import BuilderUpdatesPanel from '@/components/BuilderUpdatesPanel'
import { ShieldSection } from '@/components/shield/ShieldSection'
import { BuilderShieldPanel } from '@/components/shield/BuilderShieldPanel'
import { useOpportunity } from '@/hooks/useOpportunities'
import { useCreateAppreciation, useAppreciationHistory } from '@/hooks/useAppreciation'
import { formatINRCompact, formatDate } from '@/lib/formatters'
import { EmptyState } from '@/components/ui'
import {
  ArrowLeft, Edit, MapPin, Calendar, Users, Building2, ShieldCheck,
  Eye, Loader2, IndianRupee, Target, TrendingUp, FileText, Clock, X, ChevronDown, ChevronUp,
} from 'lucide-react'

export default function BuilderListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: opp, isLoading, isError } = useOpportunity(id ?? '')

  // Appreciation state
  const [appMode, setAppMode] = useState<'percentage' | 'absolute'>('percentage')
  const [appValue, setAppValue] = useState('')
  const [appNote, setAppNote] = useState('')
  const [showAppForm, setShowAppForm] = useState(false)
  const [showAppHistory, setShowAppHistory] = useState(false)
  const createAppreciation = useCreateAppreciation(id ?? '')
  const { data: appHistory } = useAppreciationHistory(showAppHistory ? id : undefined)

  if (isLoading) {
    return (
      <PortalLayout variant="builder">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </PortalLayout>
    )
  }

  if (isError || !opp) {
    return (
      <PortalLayout variant="builder">
        <EmptyState icon={Building2} title="Listing not found" message="The listing you're looking for doesn't exist or you don't have access." actionLabel="Back to Listings" onAction={() => navigate('/portal/builder/listings')} />
      </PortalLayout>
    )
  }

  const VaultIcon = opp.vaultType === 'wealth' ? Building2 : opp.vaultType === 'safe' ? ShieldCheck : Users
  const vaultLabel = opp.vaultType === 'wealth' ? 'Wealth Vault' : opp.vaultType === 'safe' ? 'Safe Vault' : 'Community Vault'
  const fundingPct = opp.targetAmount ? Math.round((opp.raisedAmount / opp.targetAmount) * 100) : 0
  const images = opp.media?.filter((m) => m.mediaType === 'image') ?? []
  const documents = opp.media?.filter((m) => m.mediaType === 'document') ?? []

  return (
    <PortalLayout variant="builder">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/portal/builder/listings')} className="text-theme-secondary hover:text-theme-primary">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="section-title text-2xl">{opp.title}</h1>
                <StatusBadge status={opp.status as StatusType} />
              </div>
              <p className="text-theme-secondary text-sm mt-0.5">{opp.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/portal/builder/listings/${opp.id}/edit`} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Edit className="h-4 w-4" /> Edit
            </Link>
            <Link to={`/vault/${opp.vaultType}/${opp.slug}`} target="_blank" className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-theme text-theme-secondary hover:text-theme-primary transition-colors">
              <Eye className="h-4 w-4" /> Public View
            </Link>
          </div>
        </div>

        {/* Vault Badge + meta row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-theme-secondary">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <VaultIcon className="h-3.5 w-3.5" />
            {vaultLabel}
          </span>
          {opp.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{opp.city}</span>}
          {opp.company && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{opp.company.companyName}</span>}
          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Created {formatDate(opp.createdAt)}</span>
        </div>

        {/* Cover image gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.slice(0, 6).map((img) => (
              <img key={img.id} src={img.url} alt={img.filename ?? opp.title} className="h-40 w-full object-cover rounded-lg border border-theme" />
            ))}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-secondary text-xs mb-1"><Target className="h-3.5 w-3.5" />Target</div>
            <p className="text-lg font-bold text-theme-primary">{opp.targetAmount ? formatINRCompact(opp.targetAmount) : '—'}</p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-secondary text-xs mb-1"><IndianRupee className="h-3.5 w-3.5" />Raised</div>
            <p className="text-lg font-bold text-theme-primary">{formatINRCompact(opp.raisedAmount)}</p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-secondary text-xs mb-1"><Users className="h-3.5 w-3.5" />Investors</div>
            <p className="text-lg font-bold text-theme-primary">{opp.investorCount}</p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-secondary text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" />IRR</div>
            <p className="text-lg font-bold text-theme-primary">{opp.targetIrr != null ? <IrrBadge value={opp.targetIrr} /> : '—'}</p>
          </div>
        </div>

        {/* Funding bar */}
        {opp.targetAmount && opp.targetAmount > 0 && (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-theme-primary">Funding Progress</span>
              <span className="text-sm text-theme-secondary">{fundingPct}%</span>
            </div>
            <FundingBar raised={opp.raisedAmount} target={opp.targetAmount} />
          </div>
        )}

        {/* Description */}
        {opp.description && (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6">
            <h2 className="text-sm font-semibold text-theme-primary mb-2">Description</h2>
            <p className="text-sm text-theme-secondary whitespace-pre-line">{opp.description}</p>
          </div>
        )}

        {/* Key Details Grid */}
        <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6">
          <h2 className="text-sm font-semibold text-theme-primary mb-4">Key Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {opp.address && <Detail label="Address" value={opp.address} />}
            {opp.industry && <Detail label="Industry" value={opp.industry} />}
            {opp.stage && <Detail label="Stage" value={opp.stage} />}
            {opp.founderName && <Detail label="Founder" value={opp.founderName} />}
            {opp.communityType && <Detail label="Community Type" value={opp.communityType} />}
            {opp.collaborationType && <Detail label="Collaboration" value={opp.collaborationType} />}
            {opp.communitySubtype && <Detail label="Community Model" value={opp.communitySubtype === 'co_investor' ? 'Co-Investor' : 'Co-Partner'} />}
            {opp.projectPhase && <Detail label="Phase" value={opp.projectPhase} />}
            {opp.launchDate && <Detail label="Launch Date" value={formatDate(opp.launchDate)} />}
            {opp.closingDate && <Detail label="Closing Date" value={formatDate(opp.closingDate)} />}
          </div>
        </div>

        {/* WealthSpot Shield — editable builder answers */}
        <div id="shield">
          <BuilderShieldPanel opportunityId={opp.id} />
        </div>

        {/* WealthSpot Shield — read-only summary */}
        <ShieldSection opportunityId={opp.id} mode="builder" />

        {/* Documents */}
        {documents.length > 0 && (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6">
            <h2 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Documents ({documents.length})</h2>
            <div className="space-y-2">
              {documents.map((doc) => (
                <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg border border-theme hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <FileText className="h-4 w-4 text-theme-tertiary" />
                  <span className="text-sm text-theme-primary flex-1 truncate">{doc.filename ?? 'Document'}</span>
                  {doc.sizeBytes != null && <span className="text-xs text-theme-tertiary">{(doc.sizeBytes / 1024).toFixed(0)} KB</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Builder Updates */}
        <BuilderUpdatesPanel opportunityId={opp.id} />

        {/* Valuation & Appreciation */}
        <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-theme-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Valuation & Appreciation
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAppHistory((p) => !p)}
                className="inline-flex items-center gap-1 text-xs text-theme-secondary hover:text-theme-primary transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                History
                {showAppHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {!showAppForm && (
                <button
                  onClick={() => setShowAppForm(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/40 transition-colors"
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Appreciate
                </button>
              )}
            </div>
          </div>

          {/* Current valuation */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-theme-primary">
              {formatINRCompact(opp.currentValuation ?? opp.raisedAmount ?? 0)}
            </span>
            {opp.currentValuation && opp.raisedAmount && opp.currentValuation > opp.raisedAmount && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                +{(((opp.currentValuation - opp.raisedAmount) / opp.raisedAmount) * 100).toFixed(1)}% since raise
              </span>
            )}
          </div>

          {/* Appreciation form */}
          {showAppForm && (
            <div className="border border-theme rounded-xl p-4 space-y-3 mb-4 bg-[var(--bg-surface-hover)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-theme-secondary">Apply Appreciation</span>
                <button onClick={() => { setShowAppForm(false); setAppValue(''); setAppNote('') }} className="p-0.5 rounded hover:bg-theme-surface">
                  <X className="h-3.5 w-3.5 text-theme-tertiary" />
                </button>
              </div>
              {/* Mode toggle */}
              <div className="flex rounded-lg border border-theme overflow-hidden">
                <button
                  onClick={() => setAppMode('percentage')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${appMode === 'percentage' ? 'bg-emerald-500 text-white' : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'}`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setAppMode('absolute')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${appMode === 'absolute' ? 'bg-emerald-500 text-white' : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'}`}
                >
                  Absolute (₹)
                </button>
              </div>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={appValue}
                onChange={(e) => setAppValue(e.target.value)}
                placeholder={appMode === 'percentage' ? 'e.g. 10 for 10%' : 'e.g. 500000'}
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
              />
              {appValue && parseFloat(appValue) > 0 && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/40 text-xs text-emerald-700 dark:text-emerald-300">
                  New valuation:{' '}
                  <span className="font-bold">
                    {formatINRCompact(
                      appMode === 'percentage'
                        ? (opp.currentValuation ?? opp.raisedAmount ?? 0) * (1 + parseFloat(appValue) / 100)
                        : (opp.currentValuation ?? opp.raisedAmount ?? 0) + parseFloat(appValue)
                    )}
                  </span>
                </div>
              )}
              <input
                type="text"
                value={appNote}
                onChange={(e) => setAppNote(e.target.value)}
                placeholder="Note (optional, e.g. Q1 market update)"
                maxLength={500}
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAppForm(false); setAppValue(''); setAppNote('') }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-theme text-xs font-medium text-theme-secondary hover:bg-theme-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const val = parseFloat(appValue)
                    if (!val || val <= 0) return
                    createAppreciation.mutate(
                      { mode: appMode, value: val, note: appNote || undefined },
                      { onSuccess: () => { setShowAppForm(false); setAppValue(''); setAppNote('') } },
                    )
                  }}
                  disabled={!appValue || parseFloat(appValue) <= 0 || createAppreciation.isPending}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                >
                  {createAppreciation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Appreciation history */}
          {showAppHistory && appHistory && appHistory.length > 0 && (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              <p className="text-xs font-medium text-theme-secondary mb-1">History</p>
              {appHistory.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between p-2 bg-[var(--bg-surface-hover)] rounded-lg text-xs">
                  <div>
                    <span className="font-medium text-theme-primary">
                      {evt.mode === 'percentage' ? `+${evt.inputValue}%` : `+${formatINRCompact(evt.inputValue)}`}
                    </span>
                    <span className="text-theme-tertiary ml-2">
                      {formatINRCompact(evt.oldValuation)} → {formatINRCompact(evt.newValuation)}
                    </span>
                    {evt.note && <p className="text-theme-secondary mt-0.5">{evt.note}</p>}
                  </div>
                  <div className="text-right text-theme-tertiary shrink-0 ml-3">
                    <p>{evt.creatorName ?? 'You'}</p>
                    <p>{new Date(evt.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showAppHistory && (!appHistory || appHistory.length === 0) && (
            <p className="text-xs text-theme-tertiary">No appreciation history yet.</p>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-theme-tertiary">{label}</span>
      <p className="font-medium text-theme-primary">{value}</p>
    </div>
  )
}
