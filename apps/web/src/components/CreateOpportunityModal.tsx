import { useState } from 'react'
import { X, Rocket, Building2, Users, CheckCircle2, Loader2, Lock, Wallet, Handshake, ArrowLeft } from 'lucide-react'
import { useCreateOpportunity, type OpportunityCreatePayload } from '@/hooks/useOpportunities'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone from './MediaUploadZone'
import AddressDialog, { type AddressFields } from './AddressDialog'
import CompanySelector from './CompanySelector'
import CompanyOnboardingModal from './CompanyOnboardingModal'
import { type CommunitySubtypeValue } from './CommunitySubtypeModal'

const COMMUNITY_SUBTYPES = [
  {
    value: 'co_investor' as const,
    label: 'Co-Investor',
    badge: 'Capital Only',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: Wallet,
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'border-amber-200 hover:border-amber-400 hover:shadow-amber-100',
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
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100',
    description:
      'Partner up by contributing capital plus your time, skills, and network. Earn equity and profit share in exchange for hands-on involvement.',
    highlights: ['Equity & profit share', 'Active involvement', 'Leverage your skills & network'],
  },
]

const VAULT_OPTIONS = [
  { value: 'wealth', label: 'Wealth Vault', sublabel: 'Real estate that prints money 🏗️', icon: Building2, color: 'border-primary text-primary bg-primary/5', comingSoon: false },
  { value: 'opportunity', label: 'Opportunity Vault', sublabel: 'Startups that go BRRR 🚀', icon: Rocket, color: 'border-violet-500 text-violet-600 bg-violet-50', comingSoon: true },
  { value: 'community', label: 'Community Vault', sublabel: 'Build together, win together 🐝', icon: Users, color: 'border-emerald-500 text-emerald-600 bg-emerald-50', comingSoon: false },
] as const

const STARTUP_STAGES = ['Idea', 'MVP', 'Seed', 'Pre-Series A', 'Series A', 'Growth']
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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [address, setAddress] = useState<AddressFields>(EMPTY_ADDRESS)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const createMutation = useCreateOpportunity()
  const uploadMutation = useUploadOpportunityMedia()

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
    } catch {
      setStep('form')
    }
  }

  const handleClose = () => {
    setStep('vault')
    setVaultType('')
    setCommunitySubtype('')
    setCommunityDetails({})
    setForm({ vaultType: '', title: '' })
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
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-display text-lg font-bold text-gray-900">
            {step === 'vault' && '✨ Launch Your Opportunity'}
            {step === 'community-subtype' && '🤝 Community Vault — Choose Type'}
            {step === 'form' && `${VAULT_OPTIONS.find((v) => v.value === vaultType)?.label} Details`}
            {step === 'uploading' && '🚀 Launching...'}
            {step === 'success' && '🎉 You Did It!'}
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Vault Selection */}
          {step === 'vault' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Pick your arena. Each vault unlocks a tailored questionnaire.
              </p>
              {VAULT_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => !opt.comingSoon && handleVaultSelect(opt.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 ${opt.comingSoon ? 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed' : opt.color + ' hover:shadow-md cursor-pointer'} transition-all text-left relative`}
                    disabled={opt.comingSoon}
                  >
                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                      {opt.comingSoon ? <Lock className="h-6 w-6 text-gray-400" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {opt.label}
                        {opt.comingSoon && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Coming Soon</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{opt.sublabel}</div>
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
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-500" />
                </button>
                <p className="text-sm text-gray-500">
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
                          <span className="font-semibold text-gray-900">{st.label}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${st.badgeColor}`}>
                            {st.badge}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{st.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {st.highlights.map((h) => (
                            <span key={h} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Give your opportunity a compelling title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  value={form.tagline ?? ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="A short catchy line — make it irresistible"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.targetAmount ?? ''}
                        onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Investment (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.minInvestment ?? ''}
                        onChange={(e) => handleChange('minInvestment', Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target IRR (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={form.targetIrr ?? ''}
                        onChange={(e) => handleChange('targetIrr', Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* === Opportunity (Startup) Vault Fields === */}
              {vaultType === 'opportunity' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                      <input
                        required
                        value={form.industry ?? ''}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        placeholder="e.g. FinTech, HealthTech"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stage *</label>
                      <select
                        required
                        value={form.stage ?? ''}
                        onChange={(e) => handleChange('stage', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select stage</option>
                        {STARTUP_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Founder Name</label>
                      <input
                        value={form.founderName ?? ''}
                        onChange={(e) => handleChange('founderName', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Deck URL</label>
                      <input
                        type="url"
                        value={form.pitchDeckUrl ?? ''}
                        onChange={(e) => handleChange('pitchDeckUrl', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.targetAmount ?? ''}
                        onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <select
                        value={form.city ?? ''}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select city</option>
                        {INDIAN_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Community Type *</label>
                      <select
                        required
                        value={form.communityType ?? ''}
                        onChange={(e) => handleChange('communityType', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select type</option>
                        {COMMUNITY_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collaboration *</label>
                      <select
                        required
                        value={form.collaborationType ?? ''}
                        onChange={(e) => handleChange('collaborationType', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select collaboration</option>
                        {COLLABORATION_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subtype badge */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${communitySubtype === 'co_investor' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={form.targetAmount ?? ''}
                            onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Total capital needed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Min Investment per Co-Investor (₹) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={form.minInvestment ?? ''}
                            onChange={(e) => handleChange('minInvestment', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Co-Investors</label>
                          <input
                            type="number"
                            min={1}
                            value={(communityDetails.maxInvestors as number) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('maxInvestors', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Returns (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            value={(communityDetails.expectedReturns as number) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('expectedReturns', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Investment Tenure *</label>
                          <select
                            required
                            value={(communityDetails.investmentTenure as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('investmentTenure', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Select</option>
                            {INVESTMENT_TENURES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Model *</label>
                          <select
                            required
                            value={(communityDetails.revenueModel as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('revenueModel', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Select</option>
                            {REVENUE_MODELS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Legal Structure *</label>
                          <select
                            required
                            value={(communityDetails.legalStructure as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('legalStructure', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Select</option>
                            {LEGAL_STRUCTURES.map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level *</label>
                          <select
                            required
                            value={(communityDetails.riskLevel as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('riskLevel', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Select</option>
                            {RISK_LEVELS.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Projected Timeline *</label>
                          <select
                            required
                            value={(communityDetails.projectedTimeline as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('projectedTimeline', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Select</option>
                            {TIMELINE_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exit Strategy</label>
                        <textarea
                          rows={2}
                          value={(communityDetails.exitStrategy as string) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('exitStrategy', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Project Cost (₹) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={form.targetAmount ?? ''}
                            onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Capital from Partner (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={(communityDetails.capitalFromPartner as number) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('capitalFromPartner', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Can be ₹0 if skill-only"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Equity / Profit Share (%) *</label>
                          <input
                            type="number"
                            required
                            step="0.1"
                            min={0}
                            max={100}
                            value={(communityDetails.equityShare as number) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('equityShare', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time Commitment *</label>
                          <select
                            required
                            value={(communityDetails.timeCommitment as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('timeCommitment', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Select</option>
                            {TIME_COMMITMENTS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Partnership Duration *</label>
                          <select
                            required
                            value={(communityDetails.partnershipDuration as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('partnershipDuration', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Select</option>
                            {PARTNERSHIP_DURATIONS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Required skills multi-select */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills *</label>
                        <div className="flex flex-wrap gap-2">
                          {PARTNER_SKILLS.map((skill) => {
                            const selected = ((communityDetails.requiredSkills as string[]) ?? []).includes(skill)
                            return (
                              <button
                                type="button"
                                key={skill}
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  selected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Partner Role / Title *</label>
                          <input
                            required
                            value={(communityDetails.partnerRole as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('partnerRole', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="e.g. Co-Founder, Operations Head"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Decision Making Authority *</label>
                          <select
                            required
                            value={(communityDetails.decisionAuthority as string) ?? ''}
                            onChange={(e) => handleCommunityDetailChange('decisionAuthority', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Select</option>
                            {DECISION_AUTHORITIES.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Key Responsibilities *</label>
                        <textarea
                          required
                          rows={2}
                          value={(communityDetails.keyResponsibilities as string) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('keyResponsibilities', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          placeholder="What will the partner be responsible for day-to-day?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">What the Partner Gets</label>
                        <textarea
                          rows={2}
                          value={(communityDetails.partnerBenefits as string) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('partnerBenefits', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
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
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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
                <p className="text-sm text-red-600 text-center mt-2">
                  Failed to submit. Please try again.
                </p>
              )}
            </form>
          )}

          {/* Step 2.5: Uploading media */}
          {step === 'uploading' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin mb-4" />
              <p className="text-sm text-gray-600 font-medium">{uploadProgress}</p>
              <p className="text-xs text-gray-400 mt-1">Hang tight — your opportunity is taking shape...</p>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Opportunity Launched! 🎯</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
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
