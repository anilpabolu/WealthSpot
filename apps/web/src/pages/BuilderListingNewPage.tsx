import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PortalLayout } from '@/components/layout'
import { Select } from '@/components/ui'
import { Building2, Rocket, Users, Loader2, ArrowLeft, Wallet, Handshake } from 'lucide-react'
import { useCreateOpportunity, type OpportunityCreatePayload } from '@/hooks/useOpportunities'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone from '@/components/MediaUploadZone'
import AddressDialog, { type AddressFields } from '@/components/AddressDialog'
import CompanySelector from '@/components/CompanySelector'
import CompanyOnboardingModal from '@/components/CompanyOnboardingModal'
import { type CommunitySubtypeValue } from '@/components/CommunitySubtypeModal'

const VAULT_OPTIONS = [
  { value: 'wealth', label: 'Wealth Vault', sublabel: 'Real estate that prints money 🏗️', icon: Building2, color: 'border-primary text-primary bg-primary/5' },
  { value: 'opportunity', label: 'Opportunity Vault', sublabel: 'Startups that go BRRR 🚀', icon: Rocket, color: 'border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30' },
  { value: 'community', label: 'Community Vault', sublabel: 'Build together, win together 🐝', icon: Users, color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
] as const

const COMMUNITY_SUBTYPES = [
  {
    value: 'co_investor' as const,
    label: 'Co-Investor',
    badge: 'Capital Only',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: Wallet,
    iconBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-700/40 hover:border-amber-400 hover:shadow-amber-100',
    description: 'Contribute capital to fund a community project and earn returns.',
  },
  {
    value: 'co_partner' as const,
    label: 'Co-Partner',
    badge: 'Capital + Active Role',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    icon: Handshake,
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-700/40 hover:border-emerald-400 hover:shadow-emerald-100',
    description: 'Partner up by contributing capital plus your time, skills, and network.',
  },
]

const STARTUP_STAGES = ['Idea', 'MVP', 'Seed', 'Pre-Series A', 'Series A', 'Growth']
const COMMUNITY_TYPES = ['Sports Complex', 'Co-working Space', 'Local Business', 'Education Centre', 'Healthcare', 'Agriculture', 'Other']
const COLLABORATION_TYPES = ['Capital + Time', 'Capital Only', 'Time + Network', 'Full Collaboration']
const INVESTMENT_TENURES = ['6 Months', '1 Year', '2 Years', '3 Years', '5 Years', '7 Years']
const REVENUE_MODELS = ['Rental Income', 'Profit Sharing', 'Membership Fees', 'Revenue Share', 'Equity Appreciation', 'Other']
const LEGAL_STRUCTURES = ['LLP', 'Private Limited', 'Trust', 'Partnership Firm', 'HUF', 'Sole Proprietorship', 'Other']
const RISK_LEVELS = ['Low', 'Low–Moderate', 'Moderate', 'Moderate–High', 'High']
const TIMELINE_OPTIONS = ['3 Months', '6 Months', '1 Year', '18 Months', '2 Years', '3 Years', '5 Years']
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

const EMPTY_ADDRESS: AddressFields = {
  addressLine1: '', addressLine2: '', landmark: '', locality: '',
  city: '', state: '', pincode: '', district: '', country: 'India',
}

const inputCls = 'w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none'

export default function BuilderListingNewPage() {
  const navigate = useNavigate()
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
  const { isVaultEnabled } = useVaultConfig()

  const handleChange = (key: keyof OpportunityCreatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleCommunityDetailChange = (key: string, value: string | number | string[]) => {
    setCommunityDetails((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSkill = (skill: string) => {
    const current = (communityDetails.requiredSkills as string[]) ?? []
    setCommunityDetails((prev) => ({
      ...prev,
      requiredSkills: current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill],
    }))
  }

  const handleVaultSelect = (v: string) => {
    setVaultType(v)
    setForm((prev) => ({ ...prev, vaultType: v }))
    if (v === 'community') {
      setStep('community-subtype')
    } else {
      setStep('form')
    }
  }

  const handleSubtypeSelect = (v: CommunitySubtypeValue) => {
    setCommunitySubtype(v)
    setForm((prev) => ({ ...prev, communitySubtype: v }))
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: OpportunityCreatePayload = {
      ...form,
      ...(vaultType === 'wealth' || vaultType === 'community'
        ? {
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            locality: address.locality,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            district: address.district,
            country: address.country,
            address: [address.addressLine1, address.locality, address.city].filter(Boolean).join(', '),
          }
        : {}),
      ...(vaultType === 'community'
        ? {
            communityType: form.communityType,
            collaborationType: form.collaborationType,
            communitySubtype,
            communityDetails,
          }
        : {}),
    }
    try {
      const created = await createMutation.mutateAsync(payload)

      if (mediaItems.length > 0) {
        setStep('uploading')
        const images = mediaItems.filter((m) => m.type === 'image').map((m) => m.file)
        const videos = mediaItems.filter((m) => m.type === 'video').map((m) => m.file)
        if (images.length > 0) {
          setUploadProgress(`Uploading ${images.length} image(s)…`)
          await uploadMutation.mutateAsync({ opportunityId: created.id, files: images, isCover: true })
        }
        if (videos.length > 0) {
          setUploadProgress(`Uploading ${videos.length} video(s)…`)
          await uploadMutation.mutateAsync({ opportunityId: created.id, files: videos })
        }
      }
      setStep('success')
    } catch {
      // mutation error handled by UI
    }
  }

  return (
    <PortalLayout variant="builder">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/portal/builder/listings')} className="text-theme-secondary hover:text-theme-primary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="section-title text-2xl">Add New Property</h1>
            <p className="text-theme-secondary text-sm mt-1">Create a new listing in one of our vaults</p>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6">
          {/* Step 1: Vault Selection */}
          {step === 'vault' && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-theme-primary">Choose a Vault</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {VAULT_OPTIONS.filter((v) => isVaultEnabled(v.value)).map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => handleVaultSelect(v.value)}
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all hover:shadow-md ${v.color}`}
                  >
                    <v.icon className="h-8 w-8" />
                    <span className="font-semibold text-sm">{v.label}</span>
                    <span className="text-xs opacity-70">{v.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1b: Community subtype */}
          {step === 'community-subtype' && (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep('vault')} className="text-sm text-theme-secondary hover:text-theme-primary flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-display text-lg font-bold text-theme-primary">Choose Community Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COMMUNITY_SUBTYPES.map((cs) => (
                  <button
                    key={cs.value}
                    type="button"
                    onClick={() => handleSubtypeSelect(cs.value)}
                    className={`flex flex-col gap-3 p-5 rounded-xl border-2 transition-all text-left ${cs.border}`}
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${cs.iconBg}`}>
                      <cs.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{cs.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cs.badgeColor}`}>{cs.badge}</span>
                      </div>
                      <p className="text-xs text-theme-secondary mt-1">{cs.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <button type="button" onClick={() => vaultType === 'community' ? setStep('community-subtype') : setStep('vault')} className="text-sm text-theme-secondary hover:text-theme-primary flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <CompanySelector
                value={form.companyId}
                onChange={(id) => handleChange('companyId', id ?? '')}
                onRequestOnboard={() => setShowOnboarding(true)}
                vaultType={vaultType}
              />

              {/* Common fields */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => handleChange('title', e.target.value)} className={inputCls} placeholder="Give your opportunity a compelling title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Tagline</label>
                <input value={form.tagline ?? ''} onChange={(e) => handleChange('tagline', e.target.value)} className={inputCls} placeholder="A short catchy line — make it irresistible" />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
                <textarea rows={3} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} className={`${inputCls} resize-none`} placeholder="Tell the story — what makes this opportunity a no-brainer?" />
              </div>

              {/* Wealth Vault Fields */}
              {vaultType === 'wealth' && (
                <>
                  <AddressDialog value={address} onChange={setAddress} />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Target Amount (₹)</label>
                      <input type="number" min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Min Investment (₹)</label>
                      <input type="number" min={0} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Target IRR (%)</label>
                      <input type="number" step="0.1" min={0} value={form.targetIrr ?? ''} onChange={(e) => handleChange('targetIrr', Number(e.target.value))} className={inputCls} />
                    </div>
                  </div>
                </>
              )}

              {/* Opportunity Vault Fields */}
              {vaultType === 'opportunity' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Industry *</label>
                      <input required value={form.industry ?? ''} onChange={(e) => handleChange('industry', e.target.value)} className={inputCls} placeholder="e.g. FinTech, HealthTech" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Stage *</label>
                      <Select value={form.stage ?? ''} onChange={(v) => handleChange('stage', v)} placeholder="Select stage" options={STARTUP_STAGES.map((s) => ({ value: s, label: s }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Founder Name</label>
                      <input value={form.founderName ?? ''} onChange={(e) => handleChange('founderName', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Pitch Deck URL</label>
                      <input type="url" value={form.pitchDeckUrl ?? ''} onChange={(e) => handleChange('pitchDeckUrl', e.target.value)} className={inputCls} placeholder="https://..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Target Amount (₹)</label>
                      <input type="number" min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">City</label>
                      <Select value={form.city ?? ''} onChange={(v) => handleChange('city', v)} placeholder="Select city" options={INDIAN_CITIES.map((c) => ({ value: c, label: c }))} searchable />
                    </div>
                  </div>
                </>
              )}

              {/* Community Vault Fields */}
              {vaultType === 'community' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Community Type *</label>
                      <Select value={form.communityType ?? ''} onChange={(v) => handleChange('communityType', v)} placeholder="Select type" options={COMMUNITY_TYPES.map((t) => ({ value: t, label: t }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Collaboration *</label>
                      <Select value={form.collaborationType ?? ''} onChange={(v) => handleChange('collaborationType', v)} placeholder="Select collaboration" options={COLLABORATION_TYPES.map((t) => ({ value: t, label: t }))} />
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${communitySubtype === 'co_investor' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 border border-amber-200 dark:border-amber-700/40' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 border border-emerald-200 dark:border-emerald-700/40'}`}>
                    {communitySubtype === 'co_investor' ? '💰 Co-Investor Opportunity' : '🤝 Co-Partner Opportunity'}
                    <button type="button" onClick={() => setStep('community-subtype')} className="ml-auto text-xs underline opacity-70 hover:opacity-100">Change</button>
                  </div>

                  <AddressDialog value={address} onChange={setAddress} />

                  {/* Co-Investor Fields */}
                  {communitySubtype === 'co_investor' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Target Amount (₹) *</label>
                          <input type="number" required min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} className={inputCls} placeholder="Total capital needed" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Min Investment per Co-Investor (₹) *</label>
                          <input type="number" required min={0} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Max Co-Investors</label>
                          <input type="number" min={1} value={(communityDetails.maxInvestors as number) ?? ''} onChange={(e) => handleCommunityDetailChange('maxInvestors', Number(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Expected Returns (%)</label>
                          <input type="number" step="0.1" min={0} value={(communityDetails.expectedReturns as number) ?? ''} onChange={(e) => handleCommunityDetailChange('expectedReturns', Number(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Investment Tenure *</label>
                          <Select value={(communityDetails.investmentTenure as string) ?? ''} onChange={(v) => handleCommunityDetailChange('investmentTenure', v)} placeholder="Select" options={INVESTMENT_TENURES.map((t) => ({ value: t, label: t }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Revenue Model *</label>
                          <Select value={(communityDetails.revenueModel as string) ?? ''} onChange={(v) => handleCommunityDetailChange('revenueModel', v)} placeholder="Select" options={REVENUE_MODELS.map((m) => ({ value: m, label: m }))} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Legal Structure *</label>
                          <Select value={(communityDetails.legalStructure as string) ?? ''} onChange={(v) => handleCommunityDetailChange('legalStructure', v)} placeholder="Select" options={LEGAL_STRUCTURES.map((l) => ({ value: l, label: l }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Risk Level *</label>
                          <Select value={(communityDetails.riskLevel as string) ?? ''} onChange={(v) => handleCommunityDetailChange('riskLevel', v)} placeholder="Select" options={RISK_LEVELS.map((r) => ({ value: r, label: r }))} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Projected Timeline *</label>
                          <Select value={(communityDetails.projectedTimeline as string) ?? ''} onChange={(v) => handleCommunityDetailChange('projectedTimeline', v)} placeholder="Select" options={TIMELINE_OPTIONS.map((t) => ({ value: t, label: t }))} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">Exit Strategy</label>
                        <textarea rows={2} value={(communityDetails.exitStrategy as string) ?? ''} onChange={(e) => handleCommunityDetailChange('exitStrategy', e.target.value)} className={`${inputCls} resize-none`} placeholder="How and when can investors exit?" />
                      </div>
                    </>
                  )}

                  {/* Co-Partner Fields */}
                  {communitySubtype === 'co_partner' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Total Project Cost (₹) *</label>
                          <input type="number" required min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Capital from Partner (₹)</label>
                          <input type="number" min={0} value={(communityDetails.capitalFromPartner as number) ?? ''} onChange={(e) => handleCommunityDetailChange('capitalFromPartner', Number(e.target.value))} className={inputCls} placeholder="Can be ₹0 if skill-only" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Equity / Profit Share (%) *</label>
                          <input type="number" required step="0.1" min={0} max={100} value={(communityDetails.equityShare as number) ?? ''} onChange={(e) => handleCommunityDetailChange('equityShare', Number(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Time Commitment *</label>
                          <Select value={(communityDetails.timeCommitment as string) ?? ''} onChange={(v) => handleCommunityDetailChange('timeCommitment', v)} placeholder="Select" options={TIME_COMMITMENTS.map((t) => ({ value: t, label: t }))} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Partnership Duration *</label>
                          <Select value={(communityDetails.partnershipDuration as string) ?? ''} onChange={(v) => handleCommunityDetailChange('partnershipDuration', v)} placeholder="Select" options={PARTNERSHIP_DURATIONS.map((d) => ({ value: d, label: d }))} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">Required Skills *</label>
                        <div className="flex flex-wrap gap-2">
                          {PARTNER_SKILLS.map((skill) => {
                            const selected = ((communityDetails.requiredSkills as string[]) ?? []).includes(skill)
                            return (
                              <button type="button" key={skill} onClick={() => toggleSkill(skill)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selected ? 'bg-emerald-600 text-white' : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'}`}>
                                {skill}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Partner Role / Title *</label>
                          <input required value={(communityDetails.partnerRole as string) ?? ''} onChange={(e) => handleCommunityDetailChange('partnerRole', e.target.value)} className={inputCls} placeholder="e.g. Co-Founder, Operations Head" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Decision Authority *</label>
                          <Select value={(communityDetails.decisionAuthority as string) ?? ''} onChange={(v) => handleCommunityDetailChange('decisionAuthority', v)} placeholder="Select" options={DECISION_AUTHORITIES.map((d) => ({ value: d, label: d }))} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">Key Responsibilities *</label>
                        <textarea required rows={2} value={(communityDetails.keyResponsibilities as string) ?? ''} onChange={(e) => handleCommunityDetailChange('keyResponsibilities', e.target.value)} className={`${inputCls} resize-none`} placeholder="What will the partner be responsible for day-to-day?" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">What the Partner Gets</label>
                        <textarea rows={2} value={(communityDetails.partnerBenefits as string) ?? ''} onChange={(e) => handleCommunityDetailChange('partnerBenefits', e.target.value)} className={`${inputCls} resize-none`} placeholder="e.g. 20% equity, monthly stipend, co-branding rights" />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Media Upload */}
              <MediaUploadZone images={mediaItems} onChange={setMediaItems} />

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => navigate('/portal/builder/listings')} className="px-4 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {createMutation.isPending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>) : '🚀 Submit for Approval'}
                </button>
              </div>
              {createMutation.isError && <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">Failed to submit. Please try again.</p>}
            </form>
          )}

          {/* Uploading */}
          {step === 'uploading' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin mb-4" />
              <p className="text-sm text-theme-secondary font-medium">{uploadProgress}</p>
              <p className="text-xs text-theme-tertiary mt-1">Hang tight — your opportunity is taking shape...</p>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-theme-primary mb-2">Listing Created!</h3>
              <p className="text-sm text-theme-secondary max-w-sm mx-auto mb-6">
                Your listing has been submitted for approval. You'll be notified once it goes live.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => navigate('/portal/builder/listings')} className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors">
                  View My Listings
                </button>
                <button onClick={() => { setStep('vault'); setVaultType(''); setForm({ vaultType: '', title: '' }); setMediaItems([]); setAddress(EMPTY_ADDRESS); setCommunityDetails({}); setCommunitySubtype('') }} className="px-5 py-2.5 rounded-lg border border-theme text-sm font-medium text-theme-secondary hover:text-theme-primary transition-colors">
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CompanyOnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </PortalLayout>
  )
}
