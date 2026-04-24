import { useState } from 'react'
import { Select } from '@/components/ui'
import { X, Building2, Users, CheckCircle2, Loader2, Lock, Wallet, Handshake, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useCreateOpportunity, type OpportunityCreatePayload } from '@/hooks/useOpportunities'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone from './MediaUploadZone'
import AddressDialog, { type AddressFields } from './AddressDialog'
import CompanySelector from './CompanySelector'
import CompanyOnboardingModal from './CompanyOnboardingModal'
import { type CommunitySubtypeValue } from './CommunitySubtypeModal'
import { useToastStore } from '@/stores/toastStore'

const COMMUNITY_SUBTYPES = [
  {
    value: 'co_investor' as const,
    label: 'Co-Investor',
    badge: 'Capital Only',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: Wallet,
    iconBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-700/40 hover:border-amber-400 hover:shadow-amber-100',
    description:
      'Contribute capital to fund a community project and earn returns through profit-sharing, rental income, or equity appreciation \u2014 without active involvement.',
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
    description:
      'Partner up by contributing capital plus your time, skills, and network. Earn equity and profit share in exchange for hands-on involvement.',
    highlights: ['Equity & profit share', 'Active involvement', 'Leverage your skills & network'],
  },
]

const VAULT_OPTIONS = [
  { value: 'wealth', label: 'Wealth Vault', sublabel: 'Real estate that prints money 🏗️', icon: Building2, color: 'border-primary text-primary bg-primary/5' },
  { value: 'safe', label: 'Safe Vault', sublabel: 'Fixed returns · Mortgage-backed 🔒', icon: ShieldCheck, color: 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30' },
  { value: 'community', label: 'Community Vault', sublabel: 'Build together, win together 🐝', icon: Users, color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
] as const

const COMMUNITY_TYPES = ['Sports Complex', 'Co-working Space', 'Local Business', 'Education Centre', 'Healthcare', 'Agriculture', 'Other']
const COLLABORATION_TYPES = ['Capital + Time', 'Capital Only', 'Time + Network', 'Full Collaboration']

/* ── Co-Investor form options ─────────────────────────────────────── */
const INVESTMENT_TENURES = ['6 Months', '1 Year', '2 Years', '3 Years', '5 Years', '7 Years']
const REVENUE_MODELS = ['Rental Income', 'Profit Sharing', 'Membership Fees', 'Revenue Share', 'Equity Appreciation', 'Other']
const LEGAL_STRUCTURES = ['LLP', 'Private Limited', 'Trust', 'Partnership Firm', 'HUF', 'Sole Proprietorship', 'Other']
const RISK_LEVELS = ['Low', 'Low–Moderate', 'Moderate', 'Moderate–High', 'High']
const TIMELINE_OPTIONS = ['3 Months', '6 Months', '1 Year', '18 Months', '2 Years', '3 Years', '5 Years']

/* ── Co-Partner form options ──────────────────────────────────────── */
const TIME_COMMITMENTS = ['Part-time (< 10 hrs/week)', 'Half-time (10–20 hrs/week)', 'Full-time (20–40 hrs/week)', 'On-call / Flexible']
const PARTNERSHIP_DURATIONS = ['3 Months', '6 Months', '1 Year', '2 Years', '3 Years', '5 Years', 'Open-ended']
const DECISION_AUTHORITIES = ['Equal say', 'Majority vote', 'Lead partner decides', 'Advisory only']
const PARTNER_SKILLS = [
  'Project Management', 'Marketing & Sales', 'Finance & Accounting', 'Legal & Compliance',
  'Technology & IT', 'Operations', 'Design & Creative', 'Business Development',
  'HR & Talent', 'Domain Expertise', 'Other',
]

type CommunityDetailsState = Record<string, string | number | string[]>

interface MediaItem {
  file: File
  preview: string
  type: 'image' | 'video'
}

interface Props {
  open: boolean
  onClose: () => void
}

const EMPTY_ADDRESS: AddressFields = {
  addressLine1: '', addressLine2: '', landmark: '', locality: '',
  city: '', state: '', pincode: '', district: '', country: 'India',
}

export default function CreateOpportunityModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'vault' | 'community-subtype' | 'form' | 'uploading' | 'success'>('vault')
  const [vaultType, setVaultType] = useState('')
  const [communitySubtype, setCommunitySubtype] = useState<CommunitySubtypeValue | ''>('')
  const [communityDetails, setCommunityDetails] = useState<CommunityDetailsState>({})
  const [form, setForm] = useState<OpportunityCreatePayload>({ vaultType: '', title: '' })
  const [safeVaultData, setSafeVaultData] = useState<Record<string, unknown>>({
    interest_rate: 0,
    payout_frequency: 'monthly',
    tenure_months: null,
    mortgage_agreement: { enabled: false, details: '', period_description: '' },
    legal_notarised_doc: false,
    rera_registration: { enabled: false, rera_number: '' },
    buyback_guarantee: { enabled: false, details: '' },
    capital_protection: false,
    collateral_details: '',
    land_registration: { enabled: false, details: '' },
  })
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [address, setAddress] = useState<AddressFields>(EMPTY_ADDRESS)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const createMutation = useCreateOpportunity()
  const uploadMutation = useUploadOpportunityMedia()
  const { isVaultEnabled } = useVaultConfig()

  if (!open) return null

  const handleVaultSelect = (vault: string) => {
    setVaultType(vault)
    setForm({ ...form, vaultType: vault })
    if (vault === 'community') {
      setStep('community-subtype')
    } else {
      setStep('form')
    }
  }

  const handleCommunitySubtypeSelect = (subtype: CommunitySubtypeValue) => {
    setCommunitySubtype(subtype)
    setForm((prev) => ({ ...prev, communitySubtype: subtype }))
    setCommunityDetails({})
    setStep('form')
  }

  const handleCommunityDetailChange = (field: string, value: string | number | string[]) => {
    setCommunityDetails((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSkill = (skill: string) => {
    setCommunityDetails((prev) => {
      const current = (prev.requiredSkills as string[] | undefined) ?? []
      return {
        ...prev,
        requiredSkills: current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill],
      }
    })
  }

  const handleChange = (field: keyof OpportunityCreatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Merge address into form
    const payload: OpportunityCreatePayload = {
      ...form,
      ...address,
      ...(communitySubtype && {
        communitySubtype,
        communityDetails: communityDetails as Record<string, unknown>,
      }),
      ...(vaultType === 'safe' && { safeVaultData }),
    }

    try {
      setStep('uploading')
      setUploadProgress('Creating opportunity...')
      const opp = await createMutation.mutateAsync(payload)

      // Upload media files
      if (mediaItems.length > 0) {
        const imageFiles = mediaItems.filter((m) => m.type === 'image').map((m) => m.file)
        const videoFiles = mediaItems.filter((m) => m.type === 'video').map((m) => m.file)

        if (imageFiles.length > 0) {
          setUploadProgress(`Uploading ${imageFiles.length} images...`)
          await uploadMutation.mutateAsync({
            opportunityId: opp.id,
            files: imageFiles,
            isCover: true,
          })
        }
        if (videoFiles.length > 0) {
          setUploadProgress('Uploading video...')
          await uploadMutation.mutateAsync({
            opportunityId: opp.id,
            files: videoFiles,
          })
        }
      }

      setStep('success')
      useToastStore.getState().addToast({ type: 'success', title: 'Opportunity launched!', message: 'Your listing has been submitted for review.' })
    } catch {
      setStep('form')
      useToastStore.getState().addToast({ type: 'error', title: 'Launch failed', message: 'Something went wrong. Please try again.' })
    }
  }

  const handleClose = () => {
    setStep('vault')
    setVaultType('')
    setCommunitySubtype('')
    setCommunityDetails({})
    setForm({ vaultType: '', title: '' })
    setSafeVaultData({
      interest_rate: 0,
      payout_frequency: 'monthly',
      tenure_months: null,
      mortgage_agreement: { enabled: false, details: '', period_description: '' },
      legal_notarised_doc: false,
      rera_registration: { enabled: false, rera_number: '' },
      buyback_guarantee: { enabled: false, details: '' },
      capital_protection: false,
      collateral_details: '',
      land_registration: { enabled: false, details: '' },
    })
    setMediaItems([])
    setAddress(EMPTY_ADDRESS)
    createMutation.reset()
    uploadMutation.reset()
    onClose()
  }

  return (
    <div className="modal-overlay z-[9999]" onClick={handleClose}>
      <div
        className="modal-panel max-w-2xl mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-display text-lg font-bold text-theme-primary">
            {step === 'vault' && '✨ Launch Your Opportunity'}
            {step === 'community-subtype' && '🤝 Community Vault — Choose Type'}
            {step === 'form' && `${VAULT_OPTIONS.find((v) => v.value === vaultType)?.label} Details`}
            {step === 'uploading' && '🚀 Launching...'}
            {step === 'success' && '🎉 You Did It!'}
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-theme-secondary" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Vault Selection */}
          {step === 'vault' && (
            <div className="space-y-4">
              <p className="text-sm text-theme-secondary mb-4">
                Pick your arena. Each vault unlocks a tailored questionnaire.
              </p>
              {VAULT_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const comingSoon = !isVaultEnabled(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => !comingSoon && handleVaultSelect(opt.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 ${comingSoon ? 'border-theme bg-theme-surface opacity-70 cursor-not-allowed' : opt.color + ' hover:shadow-md cursor-pointer'} transition-all text-left relative`}
                    disabled={comingSoon}
                  >
                    <div className="h-12 w-12 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center shadow-sm shrink-0">
                      {comingSoon ? <Lock className="h-6 w-6 text-theme-tertiary" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-theme-primary flex items-center gap-2">
                        {opt.label}
                        {comingSoon && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">Coming Soon</span>
                        )}
                      </div>
                      <div className="text-xs text-theme-secondary">{opt.sublabel}</div>
                    </div>
                  </button>
                )
              })}

            </div>
          )}

          {/* Step 1.5: Community subtype selection */}
          {step === 'community-subtype' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep('vault')}
                  className="p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4 text-theme-secondary" />
                </button>
                <p className="text-sm text-theme-secondary">
                  Select the type of community opportunity you want to create.
                </p>
              </div>
              {COMMUNITY_SUBTYPES.map((st) => {
                const Icon = st.icon
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => handleCommunitySubtypeSelect(st.value)}
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
                        <div className="flex flex-wrap gap-2 mt-3">
                          {st.highlights.map((h) => (
                            <span key={h} className="text-[11px] text-theme-secondary bg-theme-surface-hover px-2 py-0.5 rounded-full">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Dynamic Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Company selector */}
              <CompanySelector
                value={form.companyId}
                onChange={(id) => handleChange('companyId', id ?? '')}
                onRequestOnboard={() => setShowOnboarding(true)}
                vaultType={vaultType}
              />

              {/* Common fields */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Give your opportunity a compelling title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Tagline</label>
                <input
                  value={form.tagline ?? ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="A short catchy line — make it irresistible"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Tell the story — what makes this opportunity a no-brainer?"
                />
              </div>

              {/* === Wealth Vault Fields === */}
              {vaultType === 'wealth' && (
                <>
                  {/* Address dialog with pincode auto-fill */}
                  <AddressDialog value={address} onChange={setAddress} />

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Target Amount (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.targetAmount ?? ''}
                        onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                        className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Min Investment (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.minInvestment ?? ''}
                        onChange={(e) => handleChange('minInvestment', Number(e.target.value))}
                        className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Target IRR (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={form.targetIrr ?? ''}
                        onChange={(e) => handleChange('targetIrr', Number(e.target.value))}
                        className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* === Safe Vault Fields === */}
              {vaultType === 'safe' && (
                <>
                  {/* Returns configuration */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Target Amount (₹)</label>
                      <input type="number" min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Min Investment (₹)</label>
                      <input type="number" min={0} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Interest Rate (% p.a.)</label>
                      <input type="number" step="0.1" min={0} value={(safeVaultData.interest_rate as number) ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, interest_rate: Number(e.target.value) }))} className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Payout Frequency</label>
                      <Select
                        value={(safeVaultData.payout_frequency as string) ?? 'monthly'}
                        onChange={(v) => setSafeVaultData((p) => ({ ...p, payout_frequency: v }))}
                        options={[
                          { value: 'monthly', label: 'Monthly' },
                          { value: 'quarterly', label: 'Quarterly' },
                          { value: 'yearly', label: 'Yearly' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Tenure (months)</label>
                      <input type="number" min={1} value={(safeVaultData.tenure_months as number) ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, tenure_months: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. 24" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">City</label>
                      <Select value={form.city ?? ''} onChange={(v) => handleChange('city', v)} placeholder="Select city" options={INDIAN_CITIES.map((c) => ({ value: c, label: c }))} searchable />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">State</label>
                      <input value={form.state ?? ''} onChange={(e) => handleChange('state', e.target.value)} className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Maharashtra" />
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="border border-theme rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-theme-primary flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-500" /> Security Features</h4>

                    {/* Mortgage Agreement */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={(safeVaultData.mortgage_agreement as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, mortgage_agreement: { ...(p.mortgage_agreement as object), enabled: e.target.checked } }))} className="rounded" />
                        <span className="text-sm text-theme-primary">Mortgage Agreement</span>
                      </label>
                      {(safeVaultData.mortgage_agreement as { enabled: boolean }).enabled && (
                        <div className="grid grid-cols-2 gap-2 ml-6">
                          <input value={(safeVaultData.mortgage_agreement as { details: string }).details ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, mortgage_agreement: { ...(p.mortgage_agreement as object), details: e.target.value } }))} className="rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none" placeholder="Property details" />
                          <input value={(safeVaultData.mortgage_agreement as { period_description: string }).period_description ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, mortgage_agreement: { ...(p.mortgage_agreement as object), period_description: e.target.value } }))} className="rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none" placeholder="Period (e.g. until RERA issued)" />
                        </div>
                      )}
                    </div>

                    {/* Legal Notarised Doc */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={safeVaultData.legal_notarised_doc as boolean} onChange={(e) => setSafeVaultData((p) => ({ ...p, legal_notarised_doc: e.target.checked }))} className="rounded" />
                      <span className="text-sm text-theme-primary">Legal / Notarised Document</span>
                    </label>

                    {/* RERA Registration */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={(safeVaultData.rera_registration as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, rera_registration: { ...(p.rera_registration as object), enabled: e.target.checked } }))} className="rounded" />
                        <span className="text-sm text-theme-primary">RERA Registration</span>
                      </label>
                      {(safeVaultData.rera_registration as { enabled: boolean }).enabled && (
                        <input value={(safeVaultData.rera_registration as { rera_number: string }).rera_number ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, rera_registration: { ...(p.rera_registration as object), rera_number: e.target.value } }))} className="ml-6 w-[calc(100%-1.5rem)] rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none" placeholder="RERA number" />
                      )}
                    </div>

                    {/* Buyback Guarantee */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={(safeVaultData.buyback_guarantee as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, buyback_guarantee: { ...(p.buyback_guarantee as object), enabled: e.target.checked } }))} className="rounded" />
                        <span className="text-sm text-theme-primary">Buyback Guarantee</span>
                      </label>
                      {(safeVaultData.buyback_guarantee as { enabled: boolean }).enabled && (
                        <input value={(safeVaultData.buyback_guarantee as { details: string }).details ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, buyback_guarantee: { ...(p.buyback_guarantee as object), details: e.target.value } }))} className="ml-6 w-[calc(100%-1.5rem)] rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none" placeholder="Buyback terms" />
                      )}
                    </div>

                    {/* Capital Protection */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={safeVaultData.capital_protection as boolean} onChange={(e) => setSafeVaultData((p) => ({ ...p, capital_protection: e.target.checked }))} className="rounded" />
                      <span className="text-sm text-theme-primary">Capital Protection</span>
                    </label>

                    {/* Collateral Details */}
                    <div className="space-y-1">
                      <label className="block text-sm text-theme-primary">Collateral Details (optional)</label>
                      <input value={(safeVaultData.collateral_details as string) ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, collateral_details: e.target.value }))} className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none" placeholder="Describe collateral assets" />
                    </div>

                    {/* Land Registration */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={(safeVaultData.land_registration as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, land_registration: { ...(p.land_registration as object), enabled: e.target.checked } }))} className="rounded" />
                        <span className="text-sm text-theme-primary">Land Registration</span>
                      </label>
                      {(safeVaultData.land_registration as { enabled: boolean }).enabled && (
                        <input value={(safeVaultData.land_registration as { details: string }).details ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, land_registration: { ...(p.land_registration as object), details: e.target.value } }))} className="ml-6 w-[calc(100%-1.5rem)] rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none" placeholder="Registration details" />
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* === Community Vault Fields === */}
              {vaultType === 'community' && (
                <>
                  {/* Common community fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Community Type *</label>
                      <Select
                        value={form.communityType ?? ''}
                        onChange={(v) => handleChange('communityType', v)}
                        placeholder="Select type"
                        options={COMMUNITY_TYPES.map((t) => ({ value: t, label: t }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Collaboration *</label>
                      <Select
                        value={form.collaborationType ?? ''}
                        onChange={(v) => handleChange('collaborationType', v)}
                        placeholder="Select collaboration"
                        options={COLLABORATION_TYPES.map((t) => ({ value: t, label: t }))}
                      />
                    </div>
                  </div>

                  {/* Subtype badge */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${communitySubtype === 'co_investor' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 border border-amber-200 dark:border-amber-700/40' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 border border-emerald-200 dark:border-emerald-700/40'}`}>
                    {communitySubtype === 'co_investor' ? '💰 Co-Investor Opportunity' : '🤝 Co-Partner Opportunity'}
                    <button type="button" onClick={() => setStep('community-subtype')} className="ml-auto text-xs underline opacity-70 hover:opacity-100">Change</button>
                  </div>

                  {/* Address */}
                  <AddressDialog value={address} onChange={setAddress} />

                  {/* === Co-Investor specific fields === */}
                  {communitySubtype === 'co_investor' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Target Amount (₹) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={form.targetAmount ?? ''}
                            onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Total capital needed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Min Investment per Co-Investor (₹) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={form.minInvestment ?? ''}
                            onChange={(e) => handleChange('minInvestment', Number(e.target.value))}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Max Co-Investors</label>
                          <input
                            type="number"
                            min={1}
                            value={(communityDetails.maxInvestors as number) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('maxInvestors', Number(e.target.value))}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Expected Returns (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            value={(communityDetails.expectedReturns as number) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('expectedReturns', Number(e.target.value))}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Investment Tenure *</label>
                          <Select
                            value={(communityDetails.investmentTenure as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('investmentTenure', v)}
                            placeholder="Select"
                            options={INVESTMENT_TENURES.map((t) => ({ value: t, label: t }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Revenue Model *</label>
                          <Select
                            value={(communityDetails.revenueModel as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('revenueModel', v)}
                            placeholder="Select"
                            options={REVENUE_MODELS.map((m) => ({ value: m, label: m }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Legal Structure *</label>
                          <Select
                            value={(communityDetails.legalStructure as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('legalStructure', v)}
                            placeholder="Select"
                            options={LEGAL_STRUCTURES.map((l) => ({ value: l, label: l }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Risk Level *</label>
                          <Select
                            value={(communityDetails.riskLevel as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('riskLevel', v)}
                            placeholder="Select"
                            options={RISK_LEVELS.map((r) => ({ value: r, label: r }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Projected Timeline *</label>
                          <Select
                            value={(communityDetails.projectedTimeline as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('projectedTimeline', v)}
                            placeholder="Select"
                            options={TIMELINE_OPTIONS.map((t) => ({ value: t, label: t }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">Exit Strategy</label>
                        <textarea
                          rows={2}
                          value={(communityDetails.exitStrategy as string) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('exitStrategy', e.target.value)}
                          className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          placeholder="How and when can investors exit? (e.g., buyback, secondary sale)"
                        />
                      </div>
                    </>
                  )}

                  {/* === Co-Partner specific fields === */}
                  {communitySubtype === 'co_partner' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Total Project Cost (₹) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={form.targetAmount ?? ''}
                            onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Capital from Partner (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={(communityDetails.capitalFromPartner as number) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('capitalFromPartner', Number(e.target.value))}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Can be ₹0 if skill-only"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Equity / Profit Share (%) *</label>
                          <input
                            type="number"
                            required
                            step="0.1"
                            min={0}
                            max={100}
                            value={(communityDetails.equityShare as number) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('equityShare', Number(e.target.value))}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Time Commitment *</label>
                          <Select
                            value={(communityDetails.timeCommitment as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('timeCommitment', v)}
                            placeholder="Select"
                            options={TIME_COMMITMENTS.map((t) => ({ value: t, label: t }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Partnership Duration *</label>
                          <Select
                            value={(communityDetails.partnershipDuration as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('partnershipDuration', v)}
                            placeholder="Select"
                            options={PARTNERSHIP_DURATIONS.map((d) => ({ value: d, label: d }))}
                          />
                        </div>
                      </div>

                      {/* Required skills multi-select */}
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">Required Skills *</label>
                        <div className="flex flex-wrap gap-2">
                          {PARTNER_SKILLS.map((skill) => {
                            const selected = ((communityDetails.requiredSkills as string[]) ?? []).includes(skill)
                            return (
                              <button
                                type="button"
                                key={skill}
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  selected ? 'bg-emerald-600 text-white' : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'
                                }`}
                              >
                                {skill}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Partner Role / Title *</label>
                          <input
                            required
                            value={(communityDetails.partnerRole as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('partnerRole', e.target.value)}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="e.g. Co-Founder, Operations Head"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Decision Making Authority *</label>
                          <Select
                            value={(communityDetails.decisionAuthority as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('decisionAuthority', v)}
                            placeholder="Select"
                            options={DECISION_AUTHORITIES.map((d) => ({ value: d, label: d }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">Key Responsibilities *</label>
                        <textarea
                          required
                          rows={2}
                          value={(communityDetails.keyResponsibilities as string) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('keyResponsibilities', e.target.value)}
                          className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          placeholder="What will the partner be responsible for day-to-day?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">What the Partner Gets</label>
                        <textarea
                          rows={2}
                          value={(communityDetails.partnerBenefits as string) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('partnerBenefits', e.target.value)}
                          className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          placeholder="e.g. 20% equity, monthly stipend, co-branding rights"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Media upload — replaces cover image URL */}
              <MediaUploadZone images={mediaItems} onChange={setMediaItems} />

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => vaultType === 'community' ? setStep('community-subtype') : setStep('vault')}
                  className="px-4 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    '🚀 Submit for Approval'
                  )}
                </button>
              </div>

              {createMutation.isError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">
                  Failed to submit. Please try again.
                </p>
              )}
            </form>
          )}

          {/* Step 2.5: Uploading media */}
          {step === 'uploading' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin mb-4" />
              <p className="text-sm text-theme-secondary font-medium">{uploadProgress}</p>
              <p className="text-xs text-theme-tertiary mt-1">Hang tight — your opportunity is taking shape...</p>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-theme-primary mb-2">Opportunity Launched! 🎯</h3>
              <p className="text-sm text-theme-secondary max-w-sm mx-auto mb-6">
                Your opportunity is live and breathing. An approval ticket has been created — you'll get a nudge once the gatekeepers give the green signal.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Company onboarding popup */}
      <CompanyOnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSuccess={(companyId) => {
          handleChange('companyId', companyId)
          setShowOnboarding(false)
        }}
      />
    </div>
  )
}
