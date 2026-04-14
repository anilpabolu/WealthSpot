import { useState, useMemo } from 'react'
import { Select, Badge, EmptyState } from '@/components/ui'
import {
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
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useApprovals, useAllApprovals, useReviewApproval, type Approval } from '@/hooks/useApprovals'
import { useApprovalStore } from '@/stores/approval.store'
import { useOpportunity, useUpdateOpportunity, type OpportunityItem } from '@/hooks/useOpportunities'
import { useCompany, useUpdateCompany, type CompanyDetail } from '@/hooks/useCompanies'

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
  pending: { icon: Clock, className: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40' },
  in_review: { icon: Search, className: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40' },
  approved: { icon: CheckCircle2, className: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/40' },
  rejected: { icon: XCircle, className: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/40' },
  auto_approved: { icon: CheckCircle2, className: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700/40' },
  cancelled: { icon: AlertCircle, className: 'bg-theme-surface text-theme-secondary border-theme' },
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:text-orange-300',
  normal: 'bg-theme-surface-hover text-theme-secondary',
  low: 'bg-theme-surface text-theme-tertiary',
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const review = useReviewApproval()

  const handleSubmit = async () => {
    try {
      await review.mutateAsync({ id: approval.id, action, reviewNote: note || undefined })
      const msg = action === 'approve'
        ? 'Request approved successfully! Changes are now live.'
        : 'Request has been rejected.'
      setToast({ type: 'success', message: msg })
      setTimeout(() => onClose(), 2000)
    } catch {
      setToast({ type: 'error', message: 'Action failed. Please try again.' })
    }
  }

  return (
    <div className="modal-overlay z-[9999]" onClick={onClose}>
      <div className="modal-panel max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-theme-primary">
            {action === 'approve' ? 'Approve Request' : 'Reject Request'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-surface-hover)] rounded-lg">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>

        <p className="text-sm text-theme-secondary mb-3">
          <strong>{approval.title}</strong> — from {approval.requester?.fullName ?? 'Unknown'}
        </p>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-1">
            {action === 'reject' ? 'Rejection Reason *' : 'Note (optional)'}
          </label>
          <textarea
            rows={3}
            required={action === 'reject'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            placeholder={action === 'reject' ? 'Why is this being rejected?' : 'Add a note...'}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-theme-secondary border border-theme rounded-lg hover:bg-theme-surface">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={review.isPending || (action === 'reject' && !note.trim()) || !!toast}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors disabled:opacity-50 ${
              action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {review.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/40'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Kanban Column Config — auto-derived from STATUSES                  */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  pending: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-700/40' },
  in_review: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-700/40' },
  approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-700/40' },
  rejected: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', border: 'border-red-200 dark:border-red-700/40' },
  auto_approved: { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500', border: 'border-teal-200 dark:border-teal-700/40' },
  cancelled: { bg: 'bg-theme-surface-hover', text: 'text-theme-secondary', dot: 'bg-[var(--text-tertiary)]', border: 'border-theme' },
}

const DEFAULT_COL_COLOR = { bg: 'bg-theme-surface', text: 'text-theme-secondary', dot: 'bg-[var(--text-tertiary)]', border: 'border-theme' }

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
        <h4 className="text-sm font-bold text-theme-primary">Edit Opportunity Before Approving</h4>
      </div>

      {/* Common fields */}
      <div>
        <label className="block text-xs font-medium text-theme-secondary mb-1">Title *</label>
        <input
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-theme-secondary mb-1">Tagline</label>
        <input
          value={form.tagline}
          onChange={(e) => handleChange('tagline', e.target.value)}
          className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">City</label>
          <input
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">State</label>
          <input
            value={form.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Target Amount</label>
          <input
            type="number"
            value={form.targetAmount}
            onChange={(e) => handleChange('targetAmount', e.target.value)}
            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Min Investment</label>
          <input
            type="number"
            value={form.minInvestment}
            onChange={(e) => handleChange('minInvestment', e.target.value)}
            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Target IRR (%)</label>
          <input
            type="number"
            step="0.01"
            value={form.targetIrr}
            onChange={(e) => handleChange('targetIrr', e.target.value)}
            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Vault-specific fields */}
      {vt === 'opportunity' && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">Industry</label>
            <input
              value={form.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">Stage</label>
            <input
              value={form.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">Founder</label>
            <input
              value={form.founderName}
              onChange={(e) => handleChange('founderName', e.target.value)}
              className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      )}
      {vt === 'community' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">Community Type</label>
            <input
              value={form.communityType}
              onChange={(e) => handleChange('communityType', e.target.value)}
              className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">Collaboration Type</label>
            <input
              value={form.collaborationType}
              onChange={(e) => handleChange('collaborationType', e.target.value)}
              className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-theme-secondary border border-theme rounded-lg hover:bg-theme-surface"
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
/*  Edit Company Panel (inline in Detail Popup)                        */
/* ------------------------------------------------------------------ */

function EditCompanyPanel({
  company,
  onSaved,
  onCancel,
}: {
  company: CompanyDetail
  onSaved: () => void
  onCancel: () => void
}) {
  const updateMutation = useUpdateCompany()
  const [form, setForm] = useState({
    companyName: company.companyName ?? '',
    brandName: company.brandName ?? '',
    entityType: company.entityType ?? 'private_limited',
    cin: company.cin ?? '',
    gstin: company.gstin ?? '',
    pan: company.pan ?? '',
    reraNumber: company.reraNumber ?? '',
    website: company.website ?? '',
    description: company.description ?? '',
    contactName: company.contactName ?? '',
    contactEmail: company.contactEmail ?? '',
    contactPhone: company.contactPhone ?? '',
    addressLine1: company.addressLine1 ?? '',
    addressLine2: company.addressLine2 ?? '',
    city: company.city ?? '',
    state: company.state ?? '',
    pincode: company.pincode ?? '',
    country: company.country ?? 'India',
    yearsInBusiness: company.yearsInBusiness?.toString() ?? '',
    projectsCompleted: company.projectsCompleted?.toString() ?? '',
    totalAreaDeveloped: company.totalAreaDeveloped ?? '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const data: Record<string, string | number | undefined> = {}
    if (form.companyName !== (company.companyName ?? '')) data.companyName = form.companyName
    if (form.brandName !== (company.brandName ?? '')) data.brandName = form.brandName
    if (form.entityType !== (company.entityType ?? '')) data.entityType = form.entityType
    if (form.cin !== (company.cin ?? '')) data.cin = form.cin
    if (form.gstin !== (company.gstin ?? '')) data.gstin = form.gstin
    if (form.pan !== (company.pan ?? '')) data.pan = form.pan
    if (form.reraNumber !== (company.reraNumber ?? '')) data.reraNumber = form.reraNumber
    if (form.website !== (company.website ?? '')) data.website = form.website
    if (form.description !== (company.description ?? '')) data.description = form.description
    if (form.contactName !== (company.contactName ?? '')) data.contactName = form.contactName
    if (form.contactEmail !== (company.contactEmail ?? '')) data.contactEmail = form.contactEmail
    if (form.contactPhone !== (company.contactPhone ?? '')) data.contactPhone = form.contactPhone
    if (form.addressLine1 !== (company.addressLine1 ?? '')) data.addressLine1 = form.addressLine1
    if (form.addressLine2 !== (company.addressLine2 ?? '')) data.addressLine2 = form.addressLine2
    if (form.city !== (company.city ?? '')) data.city = form.city
    if (form.state !== (company.state ?? '')) data.state = form.state
    if (form.pincode !== (company.pincode ?? '')) data.pincode = form.pincode
    if (form.country !== (company.country ?? '')) data.country = form.country
    if (form.yearsInBusiness !== (company.yearsInBusiness?.toString() ?? ''))
      data.yearsInBusiness = form.yearsInBusiness ? Number(form.yearsInBusiness) : undefined
    if (form.projectsCompleted !== (company.projectsCompleted?.toString() ?? ''))
      data.projectsCompleted = form.projectsCompleted ? Number(form.projectsCompleted) : undefined
    if (form.totalAreaDeveloped !== (company.totalAreaDeveloped ?? ''))
      data.totalAreaDeveloped = form.totalAreaDeveloped

    if (Object.keys(data).length === 0) {
      onSaved()
      return
    }

    await updateMutation.mutateAsync({ id: company.id, data })
    onSaved()
  }

  const inputClass = 'w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Pencil className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-bold text-theme-primary">Edit Company Before Approving</h4>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Company Name *</label>
          <input value={form.companyName} onChange={(e) => handleChange('companyName', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Brand Name</label>
          <input value={form.brandName} onChange={(e) => handleChange('brandName', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Entity Type</label>
          <Select value={form.entityType} onChange={(v) => handleChange('entityType', v)} options={[
            { value: 'private_limited', label: 'Private Limited' },
            { value: 'public_limited', label: 'Public Limited' },
            { value: 'llp', label: 'LLP' },
            { value: 'partnership', label: 'Partnership' },
            { value: 'proprietorship', label: 'Proprietorship' },
          ]} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">CIN</label>
          <input value={form.cin} onChange={(e) => handleChange('cin', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Legal */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">GSTIN</label>
          <input value={form.gstin} onChange={(e) => handleChange('gstin', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">PAN</label>
          <input value={form.pan} onChange={(e) => handleChange('pan', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">RERA Number</label>
          <input value={form.reraNumber} onChange={(e) => handleChange('reraNumber', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Contact */}
      <div>
        <label className="block text-xs font-medium text-theme-secondary mb-1">Website</label>
        <input value={form.website} onChange={(e) => handleChange('website', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
        <textarea rows={2} value={form.description} onChange={(e) => handleChange('description', e.target.value)} className={`${inputClass} resize-none`} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Contact Name</label>
          <input value={form.contactName} onChange={(e) => handleChange('contactName', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Contact Email</label>
          <input value={form.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Contact Phone</label>
          <input value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Address */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Address Line 1</label>
          <input value={form.addressLine1} onChange={(e) => handleChange('addressLine1', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Address Line 2</label>
          <input value={form.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">City</label>
          <input value={form.city} onChange={(e) => handleChange('city', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">State</label>
          <input value={form.state} onChange={(e) => handleChange('state', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Pincode</label>
          <input value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Country</label>
          <input value={form.country} onChange={(e) => handleChange('country', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Track Record */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Years in Business</label>
          <input type="number" value={form.yearsInBusiness} onChange={(e) => handleChange('yearsInBusiness', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Projects Completed</label>
          <input type="number" value={form.projectsCompleted} onChange={(e) => handleChange('projectsCompleted', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1">Total Area Developed</label>
          <input value={form.totalAreaDeveloped} onChange={(e) => handleChange('totalAreaDeveloped', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-medium text-theme-secondary border border-theme rounded-lg hover:bg-theme-surface">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending || !form.companyName.trim()}
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
/*  Deal Lifecycle Controls                                            */
/* ------------------------------------------------------------------ */

function LifecycleControls({ opportunity }: { opportunity: OpportunityItem }) {
  const updateMutation = useUpdateOpportunity()
  const [closingDate, setClosingDate] = useState(opportunity.closingDate ?? '')

  const handleStatusChange = async (newStatus: string) => {
    const data: Record<string, string | undefined> = { status: newStatus }
    if (newStatus === 'closed') data.closingDate = undefined
    else if (closingDate) data.closingDate = closingDate
    await updateMutation.mutateAsync({ id: opportunity.id, data })
  }

  const currentStatus = (opportunity.status ?? '').toLowerCase()

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 space-y-3">
      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Deal Lifecycle</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-amber-600 dark:text-amber-400 mb-1">Closing Date</label>
          <input
            type="date"
            value={closingDate ? closingDate.slice(0, 10) : ''}
            onChange={(e) => setClosingDate(e.target.value)}
            className="w-full rounded-lg border border-amber-300 px-3 py-1.5 text-sm focus:border-primary outline-none bg-[var(--bg-surface)]"
          />
        </div>
        <button
          onClick={() => handleStatusChange('closing_soon')}
          disabled={updateMutation.isPending || currentStatus === 'closing_soon'}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending ? '…' : 'Mark Closing Soon'}
        </button>
        <button
          onClick={() => handleStatusChange('closed')}
          disabled={updateMutation.isPending || currentStatus === 'closed'}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending ? '…' : 'Close Deal'}
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isOpportunityApproval = approval.resourceType === 'opportunity' && !!approval.resourceId
  const isCompanyApproval = approval.resourceType === 'company' && !!approval.resourceId
  const isEditable = isOpportunityApproval || isCompanyApproval

  const { data: opportunity, isLoading: oppLoading } = useOpportunity(
    isOpportunityApproval ? approval.resourceId! : ''
  )
  const { data: company, isLoading: compLoading } = useCompany(
    isCompanyApproval ? approval.resourceId! : ''
  )

  const review = useReviewApproval()

  const handleSaveAndApprove = async () => {
    try {
      await review.mutateAsync({ id: approval.id, action: 'approve', reviewNote: 'Approved after editing details' })
      setEditMode(false)
      setToast({ type: 'success', message: 'Details updated and request approved! Changes are now live.' })
      setTimeout(() => onClose(), 2500)
    } catch {
      setToast({ type: 'error', message: 'Approval failed. Please try again.' })
    }
  }

  const catLabel = CATEGORIES.find((c) => c.value === approval.category)?.label ?? approval.category
  const statusCfg = STATUS_BADGE[approval.status] ?? STATUS_BADGE.pending!
  const StatusIcon = statusCfg.icon
  const canAct = approval.status === 'pending' || approval.status === 'in_review'

  return (
    <div className="modal-overlay z-[9999]" onClick={onClose}>
      <div
        className="modal-panel max-w-lg mx-4 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored header band */}
        <div className={`px-6 py-4 ${statusCfg.className} border-b shrink-0`}>
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
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <h3 className="font-display text-lg font-bold text-theme-primary">{approval.title}</h3>
            {approval.description && (
              <p className="text-sm text-theme-secondary mt-1 leading-relaxed">{approval.description}</p>
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
            <div className="flex items-center gap-3 rounded-lg bg-theme-surface px-4 py-3">
              {approval.reviewer.avatarUrl ? (
                <img src={approval.reviewer.avatarUrl} className="h-8 w-8 rounded-full" alt="" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {approval.reviewer.fullName[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-theme-primary">{approval.reviewer.fullName}</p>
                <p className="text-xs text-theme-tertiary">Reviewer</p>
              </div>
            </div>
          )}

          {/* Review note */}
          {approval.reviewNote && (
            <div className="rounded-lg border border-theme px-4 py-3">
              <p className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-1">Review Note</p>
              <p className="text-sm text-theme-primary">{approval.reviewNote}</p>
            </div>
          )}

          {/* Payload preview */}
          {approval.payload && Object.keys(approval.payload).length > 0 && (
            <div className="rounded-lg border border-theme px-4 py-3">
              <p className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-2">Request Data</p>
              <div className="space-y-1">
                {Object.entries(approval.payload).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="text-theme-tertiary font-mono w-32 shrink-0 truncate">{k}</span>
                    <ArrowRight className="h-3 w-3 text-theme-tertiary shrink-0" />
                    <span className="text-theme-primary truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
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
                onSaved={() => { setEditMode(false); handleSaveAndApprove() }}
                onCancel={() => setEditMode(false)}
              />
            ) : (
              <p className="text-sm text-theme-tertiary text-center py-4">Could not load opportunity details.</p>
            )
          )}

          {/* Edit Company panel (inline) */}
          {editMode && isCompanyApproval && (
            compLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : company ? (
              <EditCompanyPanel
                company={company}
                onSaved={() => { setEditMode(false); handleSaveAndApprove() }}
                onCancel={() => setEditMode(false)}
              />
            ) : (
              <p className="text-sm text-theme-tertiary text-center py-4">Could not load company details.</p>
            )
          )}

          {/* Deal Lifecycle Controls (for approved/active opportunities) */}
          {isOpportunityApproval && opportunity && ['approved', 'active', 'funding'].includes((opportunity.status ?? '').toLowerCase()) && !editMode && (
            <LifecycleControls opportunity={opportunity} />
          )}

          {/* Toast notification */}
          {toast && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/40'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {toast.message}
            </div>
          )}

          {/* Action buttons */}
          {canAct && !editMode && !toast && (
            <div className="flex gap-3 pt-1">
              {isEditable && (
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
        <Icon className="h-3.5 w-3.5 text-theme-tertiary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary">{label}</span>
      </div>
      {valueClass ? (
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${valueClass}`}>{value}</span>
      ) : (
        <p className="text-sm font-medium text-theme-primary">{value}</p>
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
            className={`shrink-0 w-72 rounded-xl border ${colColor.border} bg-[var(--bg-card)] backdrop-blur-xl flex flex-col max-h-[calc(100vh-260px)]`}
          >
            {/* Column header */}
            <div className={`px-4 py-3 rounded-t-xl ${colColor.bg} border-b ${colColor.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${colColor.dot}`} />
                  <h3 className={`text-sm font-bold ${colColor.text}`}>{col.label}</h3>
                </div>
                <span className={`text-xs font-bold ${colColor.text} bg-[var(--bg-card)] px-2 py-0.5 rounded-full`}>
                  {cards.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {cards.length === 0 ? (
                <p className="text-xs text-theme-tertiary text-center py-6">No items</p>
              ) : (
                cards.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectApproval(a)}
                    className="w-full text-left bg-[var(--bg-card)] rounded-xl border border-theme/60 p-3 hover:shadow-md hover:border-theme/60 transition-all cursor-pointer group"
                  >
                    {/* Title */}
                    <p className="text-sm font-semibold text-theme-primary truncate group-hover:text-primary transition-colors">
                      {a.title}
                    </p>

                    {/* Category badge */}
                    <span className="inline-block text-[10px] font-medium text-theme-secondary bg-theme-surface-hover px-1.5 py-0.5 rounded mt-1.5">
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
                        <span className="text-[11px] text-theme-tertiary truncate max-w-[100px]">
                          {a.requester?.fullName ?? 'Unknown'}
                        </span>
                      </div>
                      <Badge variant={a.priority === 'urgent' ? 'danger' : a.priority === 'high' ? 'warning' : 'neutral'} size="sm">
                        {a.priority}
                      </Badge>
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
      <div className="min-h-screen bg-theme-surface flex flex-col">
        {/* Shared Navbar */}
        <Navbar />

        {/* Hero */}
        <section className="page-hero bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="page-hero-content">
            <span className="page-hero-badge">Workflow</span>
            <h1 className="page-hero-title">Approvals</h1>
            <p className="page-hero-subtitle">Review, approve, and track all pending requests across the platform.</p>
          </div>
        </section>

        {/* Sub-header with view toggle */}
        <div className="sticky top-16 z-40 bg-[var(--bg-card)] backdrop-blur-md border-b border-theme">
          <div className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12 flex h-12 items-center justify-between">
            <span className="text-sm font-semibold text-theme-secondary">Approvals</span>
            <div className="flex items-center rounded-lg border border-theme bg-[var(--bg-surface)] p-0.5">
              <button
                onClick={() => setView('board')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'board' ? 'bg-primary text-white' : 'text-theme-secondary hover:text-theme-primary'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5 inline mr-1" />
                Board
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'table' ? 'bg-primary text-white' : 'text-theme-secondary hover:text-theme-primary'}`}
              >
                <List className="h-3.5 w-3.5 inline mr-1" />
                Table
              </button>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12 py-8">
          {/* === BOARD VIEW === */}
          {view === 'board' && (
            <>
              {/* Category filter for board */}
              <div className="mb-6">
                <Select
                  value={boardCategory}
                  options={CATEGORIES}
                  onChange={(v) => setBoardCategory(v)}
                  size="sm"
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
                <Select value={filters.category} options={CATEGORIES} onChange={(v) => setFilter('category', v)} size="sm" />
                <Select value={filters.status} options={STATUSES} onChange={(v) => setFilter('status', v)} size="sm" />
                <Select value={filters.priority} options={PRIORITIES} onChange={(v) => setFilter('priority', v)} size="sm" />
              </div>

              {/* Table */}
              <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-theme/60 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-theme-surface border-b border-theme">
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
                            className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider cursor-pointer hover:text-theme-primary select-none"
                            onClick={() => toggleSort(col.key)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              <ArrowUpDown className="h-3 w-3" />
                            </span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-semibold text-theme-secondary uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                          </td>
                        </tr>
                      ) : approvals.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12">
                            <EmptyState icon={Clock} title="No Approvals" message="No approval requests found." />
                          </td>
                        </tr>
                      ) : (
                        approvals.map((a) => (
                          <tr
                            key={a.id}
                            className="hover:bg-theme-surface/50 transition-colors cursor-pointer"
                            onClick={() => setDetailApproval(a)}
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-theme-primary truncate max-w-[200px]">{a.title}</p>
                              {a.description && (
                                <p className="text-xs text-theme-tertiary truncate max-w-[200px]">{a.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-theme-secondary bg-theme-surface-hover px-2 py-0.5 rounded">
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
                                <span className="text-sm text-theme-primary">{a.requester?.fullName ?? 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={a.priority === 'urgent' ? 'danger' : a.priority === 'high' ? 'warning' : 'neutral'} size="sm">
                                {a.priority}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={a.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-theme-tertiary whitespace-nowrap">
                              {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              {(a.status === 'pending' || a.status === 'inReview') && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setReviewAction({ approval: a, action: 'approve' })}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 hover:bg-emerald-100 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setReviewAction({ approval: a, action: 'reject' })}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/40 hover:bg-red-100 transition-colors"
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
                  <div className="flex items-center justify-between border-t border-theme px-4 py-3">
                    <p className="text-xs text-theme-tertiary">
                      Page {filters.page} of {totalPages} · {data?.total ?? 0} total
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={filters.page <= 1}
                        onClick={() => setFilter('page', filters.page - 1)}
                        className="p-1.5 rounded-lg border border-theme hover:bg-theme-surface disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        disabled={filters.page >= totalPages}
                        onClick={() => setFilter('page', filters.page + 1)}
                        className="p-1.5 rounded-lg border border-theme hover:bg-theme-surface disabled:opacity-30"
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
        <Footer />
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
/*  SelectFilter replaced by imported Select from @/components/ui      */
/* ------------------------------------------------------------------ */
