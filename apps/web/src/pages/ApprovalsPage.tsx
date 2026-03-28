import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  X,
  LayoutGrid,
  List,
  User as UserIcon,
  Calendar,
  Tag,
  FileText,
  ArrowRight,
  Pencil,
  Save,
} from 'lucide-react'
import { UserButton } from '@clerk/react'
import { useApprovals, useAllApprovals, useApprovalStats, useReviewApproval, type Approval } from '@/hooks/useApprovals'
import { useApprovalStore } from '@/stores/approval.store'
import { useOpportunity, useUpdateOpportunity, type OpportunityItem } from '@/hooks/useOpportunities'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'role_assignment', label: 'Role Assignment' },
  { value: 'pillar_access', label: 'Pillar Access' },
  { value: 'opportunity_listing', label: 'Opportunity Listing' },
  { value: 'property_listing', label: 'Property Listing' },
  { value: 'kyc_verification', label: 'KYC Verification' },
  { value: 'community_project', label: 'Community Project' },
  { value: 'builder_verification', label: 'Builder Verification' },
  { value: 'template_upload', label: 'Template Upload' },
]

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'auto_approved', label: 'Auto-Approved' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]

const STATUS_BADGE: Record<string, { icon: typeof Clock; className: string }> = {
  pending: { icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { icon: Search, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' },
  auto_approved: { icon: CheckCircle2, className: 'bg-teal-50 text-teal-700 border-teal-200' },
  cancelled: { icon: AlertCircle, className: 'bg-gray-50 text-gray-500 border-gray-200' },
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-gray-100 text-gray-600',
  low: 'bg-gray-50 text-gray-400',
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.pending!
  const Icon = cfg.icon
  const label = STATUSES.find((s) => s.value === status)?.label ?? status
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Review Modal                                                       */
/* ------------------------------------------------------------------ */

function ReviewModal({
  approval,
  action,
  onClose,
}: {
  approval: Approval
  action: 'approve' | 'reject'
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const review = useReviewApproval()

  const handleSubmit = async () => {
    await review.mutateAsync({ id: approval.id, action, reviewNote: note || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-gray-900">
            {action === 'approve' ? 'Approve Request' : 'Reject Request'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          <strong>{approval.title}</strong> — from {approval.requester?.fullName ?? 'Unknown'}
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {action === 'reject' ? 'Rejection Reason *' : 'Note (optional)'}
          </label>
          <textarea
            rows={3}
            required={action === 'reject'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            placeholder={action === 'reject' ? 'Why is this being rejected?' : 'Add a note...'}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={review.isPending || (action === 'reject' && !note.trim())}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors disabled:opacity-50 ${
              action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {review.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Kanban Column Config — auto-derived from STATUSES                  */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  in_review: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
  auto_approved: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', border: 'border-teal-200' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', border: 'border-gray-200' },
}

const DEFAULT_COL_COLOR = { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' }

const BOARD_COLUMNS = STATUSES
  .filter((s) => s.value !== '')
  .map((s) => ({
    status: s.value,
    label: s.label,
  }))

/* ------------------------------------------------------------------ */
/*  Edit Opportunity Panel (inline in Detail Popup)                    */
/* ------------------------------------------------------------------ */

function EditOpportunityPanel({
  opportunity,
  onSaved,
  onCancel,
}: {
  opportunity: OpportunityItem
  onSaved: () => void
  onCancel: () => void
}) {
  const updateMutation = useUpdateOpportunity()
  const [form, setForm] = useState({
    title: opportunity.title,
    tagline: opportunity.tagline ?? '',
    description: opportunity.description ?? '',
    city: opportunity.city ?? '',
    state: opportunity.state ?? '',
    targetAmount: opportunity.targetAmount?.toString() ?? '',
    minInvestment: opportunity.minInvestment?.toString() ?? '',
    targetIrr: opportunity.targetIrr?.toString() ?? '',
    industry: opportunity.industry ?? '',
    stage: opportunity.stage ?? '',
    founderName: opportunity.founderName ?? '',
    communityType: opportunity.communityType ?? '',
    collaborationType: opportunity.collaborationType ?? '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const data: Record<string, string | number | undefined> = {}
    if (form.title !== opportunity.title) data.title = form.title
    if (form.tagline !== (opportunity.tagline ?? '')) data.tagline = form.tagline
    if (form.description !== (opportunity.description ?? '')) data.description = form.description
    if (form.city !== (opportunity.city ?? '')) data.city = form.city
    if (form.state !== (opportunity.state ?? '')) data.state = form.state
    if (form.targetAmount !== (opportunity.targetAmount?.toString() ?? ''))
      data.targetAmount = form.targetAmount ? Number(form.targetAmount) : undefined
    if (form.minInvestment !== (opportunity.minInvestment?.toString() ?? ''))
      data.minInvestment = form.minInvestment ? Number(form.minInvestment) : undefined
    if (form.targetIrr !== (opportunity.targetIrr?.toString() ?? ''))
      data.targetIrr = form.targetIrr ? Number(form.targetIrr) : undefined
    if (form.industry !== (opportunity.industry ?? '')) data.industry = form.industry
    if (form.stage !== (opportunity.stage ?? '')) data.stage = form.stage
    if (form.founderName !== (opportunity.founderName ?? '')) data.founderName = form.founderName
    if (form.communityType !== (opportunity.communityType ?? '')) data.communityType = form.communityType
    if (form.collaborationType !== (opportunity.collaborationType ?? '')) data.collaborationType = form.collaborationType

    if (Object.keys(data).length === 0) {
      onSaved()
      return
    }

    await updateMutation.mutateAsync({ id: opportunity.id, data })
    onSaved()
  }

  const vt = opportunity.vaultType

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Pencil className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-bold text-gray-900">Edit Opportunity Before Approving</h4>
      </div>

      {/* Common fields */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
        <input
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tagline</label>
        <input
          value={form.tagline}
          onChange={(e) => handleChange('tagline', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
          <input
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
          <input
            value={form.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Target Amount</label>
          <input
            type="number"
            value={form.targetAmount}
            onChange={(e) => handleChange('targetAmount', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min Investment</label>
          <input
            type="number"
            value={form.minInvestment}
            onChange={(e) => handleChange('minInvestment', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Target IRR (%)</label>
          <input
            type="number"
            step="0.01"
            value={form.targetIrr}
            onChange={(e) => handleChange('targetIrr', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Vault-specific fields */}
      {vt === 'opportunity' && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
            <input
              value={form.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
            <input
              value={form.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Founder</label>
            <input
              value={form.founderName}
              onChange={(e) => handleChange('founderName', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      )}
      {vt === 'community' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Community Type</label>
            <input
              value={form.communityType}
              onChange={(e) => handleChange('communityType', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Collaboration Type</label>
            <input
              value={form.collaborationType}
              onChange={(e) => handleChange('collaborationType', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending || !form.title.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail Popup — visual representation of a request                  */
/* ------------------------------------------------------------------ */

function DetailPopup({ approval, onClose, onReview }: {
  approval: Approval
  onClose: () => void
  onReview: (action: 'approve' | 'reject') => void
}) {
  const [editMode, setEditMode] = useState(false)
  const isOpportunityApproval = approval.resourceType === 'opportunity' && !!approval.resourceId
  const { data: opportunity, isLoading: oppLoading } = useOpportunity(
    isOpportunityApproval ? approval.resourceId! : ''
  )

  const catLabel = CATEGORIES.find((c) => c.value === approval.category)?.label ?? approval.category
  const statusCfg = STATUS_BADGE[approval.status] ?? STATUS_BADGE.pending!
  const StatusIcon = statusCfg.icon
  const canAct = approval.status === 'pending' || approval.status === 'in_review'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored header band */}
        <div className={`px-6 py-4 ${statusCfg.className} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-wide">
                {STATUSES.find((s) => s.value === approval.status)?.label ?? approval.status}
              </span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">{approval.title}</h3>
            {approval.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{approval.description}</p>
            )}
          </div>

          {/* Visual info grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoBlock icon={Tag} label="Category" value={catLabel} />
            <InfoBlock
              icon={AlertCircle}
              label="Priority"
              value={approval.priority}
              valueClass={PRIORITY_BADGE[approval.priority]}
            />
            <InfoBlock icon={UserIcon} label="Requester" value={approval.requester?.fullName ?? 'Unknown'} />
            <InfoBlock
              icon={Calendar}
              label="Created"
              value={new Date(approval.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
            {approval.resourceType && (
              <InfoBlock icon={FileText} label="Resource" value={`${approval.resourceType} #${approval.resourceId ?? '—'}`} />
            )}
            {approval.reviewedAt && (
              <InfoBlock
                icon={Calendar}
                label="Reviewed"
                value={new Date(approval.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              />
            )}
          </div>

          {/* Reviewer info */}
          {approval.reviewer && (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
              {approval.reviewer.avatarUrl ? (
                <img src={approval.reviewer.avatarUrl} className="h-8 w-8 rounded-full" alt="" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {approval.reviewer.fullName[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{approval.reviewer.fullName}</p>
                <p className="text-xs text-gray-400">Reviewer</p>
              </div>
            </div>
          )}

          {/* Review note */}
          {approval.reviewNote && (
            <div className="rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Review Note</p>
              <p className="text-sm text-gray-700">{approval.reviewNote}</p>
            </div>
          )}

          {/* Payload preview */}
          {approval.payload && Object.keys(approval.payload).length > 0 && (
            <div className="rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Request Data</p>
              <div className="space-y-1">
                {Object.entries(approval.payload).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400 font-mono w-32 shrink-0 truncate">{k}</span>
                    <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
                    <span className="text-gray-700 truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Opportunity panel (inline) */}
          {editMode && isOpportunityApproval && (
            oppLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : opportunity ? (
              <EditOpportunityPanel
                opportunity={opportunity}
                onSaved={() => setEditMode(false)}
                onCancel={() => setEditMode(false)}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Could not load opportunity details.</p>
            )
          )}

          {/* Action buttons */}
          {canAct && !editMode && (
            <div className="flex gap-3 pt-1">
              {isOpportunityApproval && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
              <button
                onClick={() => onReview('approve')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => onReview('reject')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ icon: Icon, label, value, valueClass }: {
  icon: typeof Tag
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      {valueClass ? (
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${valueClass}`}>{value}</span>
      ) : (
        <p className="text-sm font-medium text-gray-900">{value}</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Kanban Board                                                       */
/* ------------------------------------------------------------------ */

function KanbanBoard({
  categoryFilter,
  onSelectApproval,
}: {
  categoryFilter: string
  onSelectApproval: (a: Approval) => void
}) {
  const { data, isLoading } = useAllApprovals(categoryFilter || undefined)
  const approvals = data?.items ?? []

  // Group approvals by status
  const grouped = useMemo(() => {
    const map: Record<string, Approval[]> = {}
    for (const col of BOARD_COLUMNS) map[col.status] = []
    for (const a of approvals) {
      if (map[a.status]) map[a.status]!.push(a)
    }
    return map
  }, [approvals])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      {BOARD_COLUMNS.map((col) => {
        const cards = grouped[col.status] ?? []
        const colColor = STATUS_COLORS[col.status] ?? DEFAULT_COL_COLOR
        return (
          <div
            key={col.status}
            className={`shrink-0 w-72 rounded-xl border ${colColor.border} bg-white flex flex-col max-h-[calc(100vh-260px)]`}
          >
            {/* Column header */}
            <div className={`px-4 py-3 rounded-t-xl ${colColor.bg} border-b ${colColor.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${colColor.dot}`} />
                  <h3 className={`text-sm font-bold ${colColor.text}`}>{col.label}</h3>
                </div>
                <span className={`text-xs font-bold ${colColor.text} bg-white/60 px-2 py-0.5 rounded-full`}>
                  {cards.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {cards.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-6">No items</p>
              ) : (
                cards.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectApproval(a)}
                    className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    {/* Title */}
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                      {a.title}
                    </p>

                    {/* Category badge */}
                    <span className="inline-block text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1.5">
                      {CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category}
                    </span>

                    {/* Footer: avatar + priority + date */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        {a.requester?.avatarUrl ? (
                          <img src={a.requester.avatarUrl} className="h-5 w-5 rounded-full" alt="" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                            {(a.requester?.fullName ?? '?')[0]}
                          </div>
                        )}
                        <span className="text-[11px] text-gray-400 truncate max-w-[100px]">
                          {a.requester?.fullName ?? 'Unknown'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[a.priority] ?? 'bg-gray-100 text-gray-400'}`}>
                        {a.priority}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ApprovalsPage() {
  const { filters, setFilter } = useApprovalStore()
  const { data, isLoading } = useApprovals()
  const { data: stats } = useApprovalStats()
  const [view, setView] = useState<'board' | 'table'>('board')
  const [reviewAction, setReviewAction] = useState<{ approval: Approval; action: 'approve' | 'reject' } | null>(null)
  const [detailApproval, setDetailApproval] = useState<Approval | null>(null)
  const [boardCategory, setBoardCategory] = useState('')

  const approvals = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const toggleSort = (col: string) => {
    if (filters.sortBy === col) {
      setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setFilter('sortBy', col)
      setFilter('sortOrder', 'desc')
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12 flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/vaults" className="flex items-center gap-2 shrink-0">
                <Shield className="h-8 w-8 text-primary" />
                <span className="font-display text-xl font-bold tracking-tight text-gray-900">
                  Wealth<span className="text-primary">Spot</span>
                </span>
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-semibold text-gray-600">Approvals</span>
            </div>

            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
                <button
                  onClick={() => setView('board')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'board' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 inline mr-1" />
                  Board
                </button>
                <button
                  onClick={() => setView('table')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'table' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="h-3.5 w-3.5 inline mr-1" />
                  Table
                </button>
              </div>
              <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9 ring-2 ring-primary/20' } }} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12 py-8">
          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Pending', value: stats.pending, color: 'text-amber-600 bg-amber-50' },
                { label: 'In Review', value: stats.inReview, color: 'text-blue-600 bg-blue-50' },
                { label: 'Approved', value: stats.approved, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Rejected', value: stats.rejected, color: 'text-red-600 bg-red-50' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl px-5 py-4 ${s.color}`}>
                  <p className="text-2xl font-bold font-mono">{s.value}</p>
                  <p className="text-xs font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* === BOARD VIEW === */}
          {view === 'board' && (
            <>
              {/* Category filter for board */}
              <div className="mb-6">
                <SelectFilter
                  value={boardCategory}
                  options={CATEGORIES}
                  onChange={(v) => setBoardCategory(v)}
                />
              </div>
              <KanbanBoard
                categoryFilter={boardCategory}
                onSelectApproval={(a) => setDetailApproval(a)}
              />
            </>
          )}

          {/* === TABLE VIEW === */}
          {view === 'table' && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <SelectFilter value={filters.category} options={CATEGORIES} onChange={(v) => setFilter('category', v)} />
                <SelectFilter value={filters.status} options={STATUSES} onChange={(v) => setFilter('status', v)} />
                <SelectFilter value={filters.priority} options={PRIORITIES} onChange={(v) => setFilter('priority', v)} />
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {[
                          { key: 'title', label: 'Title' },
                          { key: 'category', label: 'Category' },
                          { key: 'requester', label: 'Requester' },
                          { key: 'priority', label: 'Priority' },
                          { key: 'status', label: 'Status' },
                          { key: 'created_at', label: 'Created' },
                        ].map((col) => (
                          <th
                            key={col.key}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                            onClick={() => toggleSort(col.key)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              <ArrowUpDown className="h-3 w-3" />
                            </span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                          </td>
                        </tr>
                      ) : approvals.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                            No approval requests found
                          </td>
                        </tr>
                      ) : (
                        approvals.map((a) => (
                          <tr
                            key={a.id}
                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                            onClick={() => setDetailApproval(a)}
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">{a.title}</p>
                              {a.description && (
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{a.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                {CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {a.requester?.avatarUrl ? (
                                  <img src={a.requester.avatarUrl} className="h-6 w-6 rounded-full" alt="" />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {(a.requester?.fullName ?? '?')[0]}
                                  </div>
                                )}
                                <span className="text-sm text-gray-700">{a.requester?.fullName ?? 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[a.priority] ?? ''}`}>
                                {a.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={a.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              {(a.status === 'pending' || a.status === 'inReview') && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setReviewAction({ approval: a, action: 'approve' })}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setReviewAction({ approval: a, action: 'reject' })}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                    <p className="text-xs text-gray-400">
                      Page {filters.page} of {totalPages} · {data?.total ?? 0} total
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={filters.page <= 1}
                        onClick={() => setFilter('page', filters.page - 1)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        disabled={filters.page >= totalPages}
                        onClick={() => setFilter('page', filters.page + 1)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Detail popup (from board or table click) */}
      {detailApproval && (
        <DetailPopup
          approval={detailApproval}
          onClose={() => setDetailApproval(null)}
          onReview={(action) => {
            setDetailApproval(null)
            setReviewAction({ approval: detailApproval, action })
          }}
        />
      )}

      {/* Review modal */}
      {reviewAction && (
        <ReviewModal
          approval={reviewAction.approval}
          action={reviewAction.action}
          onClose={() => setReviewAction(null)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Tiny Select Filter                                                 */
/* ------------------------------------------------------------------ */

function SelectFilter({
  value,
  options,
  onChange,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )
}
