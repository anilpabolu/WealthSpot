import { useParams, useNavigate, Link } from 'react-router-dom'
import { PortalLayout } from '@/components/layout'
import FundingBar from '@/components/wealth/FundingBar'
import StatusBadge, { type StatusType } from '@/components/wealth/StatusBadge'
import IrrBadge from '@/components/wealth/IrrBadge'
import BuilderUpdatesPanel from '@/components/BuilderUpdatesPanel'
import { ShieldSection } from '@/components/shield/ShieldSection'
import { BuilderShieldPanel } from '@/components/shield/BuilderShieldPanel'
import { useOpportunity } from '@/hooks/useOpportunities'
import { formatINRCompact, formatDate } from '@/lib/formatters'
import { EmptyState } from '@/components/ui'
import {
  ArrowLeft, Edit, MapPin, Calendar, Users, Building2, Rocket,
  Eye, Loader2, IndianRupee, Target, TrendingUp, FileText,
} from 'lucide-react'

export default function BuilderListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: opp, isLoading, isError } = useOpportunity(id ?? '')

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

  const VaultIcon = opp.vaultType === 'wealth' ? Building2 : opp.vaultType === 'opportunity' ? Rocket : Users
  const vaultLabel = opp.vaultType === 'wealth' ? 'Wealth Vault' : opp.vaultType === 'opportunity' ? 'Opportunity Vault' : 'Community Vault'
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
