import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PortalLayout } from '@/components/layout'
import { Select, Input, Textarea } from '@/components/ui'
import { Building2, Users, Loader2, ArrowLeft, Wallet, Handshake, ShieldCheck } from 'lucide-react'
import { useCreateOpportunity, type OpportunityCreatePayload } from '@/hooks/useOpportunities'
import { AMENITIES, AMENITY_CATEGORIES, PropertyType } from '@wealthspot/types'
import type { AmenityCategory } from '@wealthspot/types'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { useOpportunityFormFlags } from '@/hooks/useControlCentre'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone from '@/components/MediaUploadZone'
import AddressDialog, { type AddressFields } from '@/components/AddressDialog'
import CompanySelector from '@/components/CompanySelector'
import CompanyOnboardingModal from '@/components/CompanyOnboardingModal'
import { type CommunitySubtypeValue } from '@/components/CommunitySubtypeModal'
import {
  BuilderShieldStep,
  type BuilderAnswer,
} from '@/components/shield/BuilderShieldStep'
import {
  useSaveAssessmentBulk,
  useUploadAssessmentDocument,
} from '@/hooks/useShield'
import { formatApiError } from '@/lib/apiError'

const VAULT_OPTIONS = [
  { value: 'wealth', label: 'Wealth Vault', sublabel: 'Real estate that prints money 🏗️', icon: Building2, color: 'border-primary text-primary bg-primary/5' },
  { value: 'safe', label: 'Safe Vault', sublabel: 'Fixed returns · Mortgage-backed 🔒', icon: ShieldCheck, color: 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30' },
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

/* ── Property spec constants ──────────────────────────────────────── */
const PROPERTY_TYPE_OPTIONS = [
  { value: PropertyType.FLAT, label: 'Flat / Apartment', icon: '🏢' },
  { value: PropertyType.VILLA, label: 'Villa / Row House', icon: '🏡' },
  { value: PropertyType.PLOT, label: 'Plot / Land', icon: '🏞️' },
  { value: PropertyType.COMMERCIAL, label: 'Commercial', icon: '🏪' },
  { value: PropertyType.WAREHOUSE, label: 'Warehouse', icon: '🏭' },
  { value: PropertyType.MIXED_USE, label: 'Mixed Use', icon: '🏙️' },
]
const BHK_TYPES = ['Studio', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', 'Penthouse', 'Duplex']
const PLOT_TYPE_OPTIONS = ['Residential Plot', 'Commercial Plot', 'Industrial Plot', 'Agricultural Land', 'NA Plot']
function generatePossessionQuarters(): string[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentQ = Math.ceil((now.getMonth() + 1) / 3)
  const quarters: string[] = ['Ready to Move']
  for (let y = currentYear; y <= currentYear + 5; y++) {
    const startQ = y === currentYear ? currentQ : 1
    for (let q = startQ; q <= 4; q++) {
      quarters.push(`Q${q} ${y}`)
    }
  }
  return quarters
}
const POSSESSION_QUARTERS = generatePossessionQuarters()
const LAND_UNITS = [
  { value: 'sqft',  label: 'Sq.Ft',   factor: 1 },
  { value: 'sqyd',  label: 'Sq.Yd',   factor: 9 },
  { value: 'guntha',label: 'Guntha',  factor: 1089 },
  { value: 'acres', label: 'Acres',   factor: 43560 },
  { value: 'bigha', label: 'Bigha',   factor: 27225 },
] as const
type LandUnit = typeof LAND_UNITS[number]['value']

function sqftConversions(sqft: number) {
  return {
    sqft: sqft.toLocaleString('en-IN'),
    sqyd: (sqft / 9).toFixed(1),
    guntha: (sqft / 1089).toFixed(3),
    acre: (sqft / 43560).toFixed(4),
    bigha: (sqft / 27225).toFixed(4),
  }
}
interface UnitConfigRow {
  id: string; bhkType: string; carpetAreaSqft: string; superBuiltUpSqft: string
  bathrooms: string; balconies: string; totalUnits: string; pricePerSqft: string
}
interface PlotConfigRow { id: string; plotType: string; areaSqft: string; totalPlots: string; pricePerSqft: string }
interface ProjectOverview { totalTowers: string; totalFloors: string; possessionQuarter: string; landParcelSqft: string }
const DEFAULT_UNIT_CONFIG: UnitConfigRow = { id: '1', bhkType: '', carpetAreaSqft: '', superBuiltUpSqft: '', bathrooms: '', balconies: '', totalUnits: '', pricePerSqft: '' }
const DEFAULT_PLOT_CONFIG: PlotConfigRow = { id: '1', plotType: '', areaSqft: '', totalPlots: '', pricePerSqft: '' }
const DEFAULT_PROJECT_OVERVIEW: ProjectOverview = { totalTowers: '', totalFloors: '', possessionQuarter: '', landParcelSqft: '' }

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

export default function BuilderListingNewPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'vault' | 'community-subtype' | 'form' | 'shield' | 'uploading' | 'success'>('vault')
  const [shieldAnswers, setShieldAnswers] = useState<Record<string, BuilderAnswer>>({})
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
    buyback_guarantee: { enabled: false, details: '' },
    capital_protection: false,
    collateral_details: '',
    land_registration: { enabled: false, details: '' },
  })
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [address, setAddress] = useState<AddressFields>(EMPTY_ADDRESS)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  // ── Property specs state ───────────────────────────────────────────────
  const [propertyType, setPropertyType] = useState<string>('')
  const [unitConfigs, setUnitConfigs] = useState<UnitConfigRow[]>([{ ...DEFAULT_UNIT_CONFIG }])
  const [plotConfigs, setPlotConfigs] = useState<PlotConfigRow[]>([{ ...DEFAULT_PLOT_CONFIG }])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [pricePerSqftField, setPricePerSqftField] = useState<string>('')
  const [totalProjectAreaSqftField, setTotalProjectAreaSqftField] = useState<string>('')
  const [projectOverview, setProjectOverview] = useState<ProjectOverview>({ ...DEFAULT_PROJECT_OVERVIEW })
  const [investmentMode, setInvestmentMode] = useState<'lumpsum' | 'unit_config' | ''>('')
  const [landParcelUnit, setLandParcelUnit] = useState<LandUnit>('sqft')
  const [landParcelRawValue, setLandParcelRawValue] = useState<string>('')
  const createMutation = useCreateOpportunity()
  const uploadMutation = useUploadOpportunityMedia()
  const saveShield = useSaveAssessmentBulk()
  const uploadShieldDoc = useUploadAssessmentDocument()
  const { isVaultEnabled } = useVaultConfig()
  const { showInvestmentConfig, showInvestmentDetails, showAmenities } = useOpportunityFormFlags()

  const handleChange = (key: keyof OpportunityCreatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Auto-compute lumpsum target from price/sqft × total area
  useEffect(() => {
    if (investmentMode === 'lumpsum' && pricePerSqftField && totalProjectAreaSqftField) {
      const computed = Number(pricePerSqftField) * Number(totalProjectAreaSqftField)
      if (computed > 0) setForm((prev) => ({ ...prev, targetAmount: computed }))
    }
  }, [pricePerSqftField, totalProjectAreaSqftField, investmentMode])

  // When Investment Config section is hidden, auto-default to lumpsum
  useEffect(() => {
    if (!showInvestmentConfig && propertyType && investmentMode === '') {
      setInvestmentMode('lumpsum')
    }
  }, [showInvestmentConfig, propertyType, investmentMode])

  // When Investment Details is hidden, sync targetAmount = minInvestment
  useEffect(() => {
    if (!showInvestmentDetails && form.minInvestment && Number(form.minInvestment) > 0) {
      setForm((prev) => ({ ...prev, targetAmount: Number(prev.minInvestment) }))
    }
  }, [showInvestmentDetails, form.minInvestment])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('shield')
  }

  const finalSubmit = async () => {
    // Build property specs payload
    let propertySpecsPayload: Record<string, unknown> | undefined
    if (propertyType) {
      const base: Record<string, unknown> = {
        property_type: propertyType,
        ...(projectOverview.possessionQuarter && { possession_date: projectOverview.possessionQuarter }),
        ...(projectOverview.totalTowers && { total_towers: Number(projectOverview.totalTowers) }),
        ...(projectOverview.totalFloors && { total_floors: Number(projectOverview.totalFloors) }),
        ...(projectOverview.landParcelSqft && { land_parcel_sqft: Number(projectOverview.landParcelSqft) }),
      }
      if (propertyType === PropertyType.PLOT) {
        base.plot_configurations = plotConfigs
          .filter((p) => p.plotType)
          .map((p) => ({
            type: p.plotType,
            ...(p.areaSqft && { area_sqft: Number(p.areaSqft) }),
            ...(p.totalPlots && { total_plots: Number(p.totalPlots) }),
            ...(p.pricePerSqft && { price_per_sqft: Number(p.pricePerSqft) }),
          }))
      } else {
        base.unit_configurations = unitConfigs
          .filter((u) => u.bhkType)
          .map((u) => ({
            bhk_type: u.bhkType,
            ...(u.carpetAreaSqft && { carpet_area_sqft: Number(u.carpetAreaSqft) }),
            ...(u.superBuiltUpSqft && { super_built_up_sqft: Number(u.superBuiltUpSqft) }),
            ...(u.bathrooms && { bathrooms: Number(u.bathrooms) }),
            ...(u.balconies && { balconies: Number(u.balconies) }),
            ...(u.totalUnits && { total_units: Number(u.totalUnits) }),
            ...(u.pricePerSqft && { price_per_sqft: Number(u.pricePerSqft) }),
          }))
      }
      propertySpecsPayload = base
    }

    // For unit_config mode, derive targetAmount from configs; clear minInvestment
    let unitConfigTargetAmount: number | undefined
    if (vaultType === 'wealth' && investmentMode === 'unit_config' && propertyType) {
      if (propertyType === PropertyType.PLOT) {
        unitConfigTargetAmount = plotConfigs
          .filter((p) => p.plotType && p.areaSqft && p.totalPlots)
          .reduce((sum, p) => sum + Number(p.totalPlots) * Number(p.areaSqft) * Number(p.pricePerSqft || 0), 0)
      } else {
        unitConfigTargetAmount = unitConfigs
          .filter((u) => u.bhkType && u.carpetAreaSqft && u.totalUnits)
          .reduce((sum, u) => sum + Number(u.totalUnits) * Number(u.carpetAreaSqft) * Number(u.pricePerSqft || 0), 0)
      }
    }

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
      ...(vaultType === 'safe' ? { safeVaultData } : {}),
      ...(propertyType && {
        property_type: propertyType,
        ...(pricePerSqftField && { price_per_sqft: Number(pricePerSqftField) }),
        ...(totalProjectAreaSqftField && { total_project_area_sqft: Number(totalProjectAreaSqftField) }),
        property_specs: propertySpecsPayload,
        ...(selectedAmenities.length > 0 && { property_amenities: selectedAmenities }),
      }),
      // Investment mode
      ...(vaultType === 'wealth' && investmentMode && { investmentMode: investmentMode as 'lumpsum' | 'unit_config' }),
      // For unit_config: override target with computed value, clear minInvestment
      ...(unitConfigTargetAmount !== undefined && { targetAmount: unitConfigTargetAmount, minInvestment: undefined }),
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

      // Shield — save any filled answers and upload any queued evidence.
      const answeredItems = Object.values(shieldAnswers).filter(
        (a) => a.value !== '' || a.files.length > 0,
      )
      if (answeredItems.length > 0) {
        setStep('uploading')
        setUploadProgress('Saving Shield answers…')
        await saveShield.mutateAsync({
          opportunityId: created.id,
          items: answeredItems.map((a) => ({
            categoryCode: a.categoryCode,
            subcategoryCode: a.subcategoryCode,
            builderAnswer: a.value ? { text: a.value } : null,
            isPublic: a.isPublic,
          })),
        })
        const withFiles = answeredItems.filter((a) => a.files.length > 0)
        for (const a of withFiles) {
          setUploadProgress(`Uploading Shield evidence for ${a.subcategoryCode}…`)
          await uploadShieldDoc.mutateAsync({
            opportunityId: created.id,
            category: a.categoryCode,
            subcategory: a.subcategoryCode,
            files: a.files,
          })
        }
      }
      setStep('success')
      // Per-mutation success/error toasts are emitted by the global handler in
      // main.tsx (see useCreateOpportunity / useSaveAssessmentBulk meta).
    } catch {
      // Roll back to the form step so the user can retry; the global mutation
      // handler has already surfaced the formatted error toast.
      setStep('shield')
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
              <Input label="Title *" required value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Give your opportunity a compelling title" />
              <Input label="Tagline" value={form.tagline ?? ''} onChange={(e) => handleChange('tagline', e.target.value)} placeholder="A short catchy line — make it irresistible" />
              <Textarea label="Description" rows={3} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} placeholder="Tell the story — what makes this opportunity a no-brainer?" />

              {/* Wealth Vault Fields */}
              {vaultType === 'wealth' && (
                <>
                  <AddressDialog value={address} onChange={setAddress} />
                  {/* Target / min inputs rendered inside the property specs section, mode-dependent */}
                </>
              )}

              {/* Safe Vault Fields */}
              {vaultType === 'safe' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="Target Amount" type="number" min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} prefix="₹" />
                    <Input label="Min Investment" type="number" min={0} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} prefix="₹" />
                    <Input label="Interest Rate (p.a.)" type="number" step="0.1" min={0} value={(safeVaultData.interest_rate as number) ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, interest_rate: Number(e.target.value) }))} suffix="%" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Payout Frequency</label>
                      <Select value={(safeVaultData.payout_frequency as string) ?? 'monthly'} onChange={(v) => setSafeVaultData((p) => ({ ...p, payout_frequency: v }))} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]} />
                    </div>
                    <Input label="Tenure" type="number" min={1} value={(safeVaultData.tenure_months as number) ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, tenure_months: e.target.value ? Number(e.target.value) : null }))} suffix=" mo." placeholder="e.g. 24" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">City</label>
                      <Select value={form.city ?? ''} onChange={(v) => handleChange('city', v)} placeholder="Select city" options={INDIAN_CITIES.map((c) => ({ value: c, label: c }))} searchable />
                    </div>
                    <Input label="State" value={form.state ?? ''} onChange={(e) => handleChange('state', e.target.value)} placeholder="e.g. Maharashtra" />
                  </div>

                  {/* Security Features */}
                  <div className="border border-theme rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-theme-primary flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-500" /> Security Features</h4>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(safeVaultData.mortgage_agreement as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, mortgage_agreement: { ...(p.mortgage_agreement as object), enabled: e.target.checked } }))} className="rounded" />
                      <span className="text-sm text-theme-primary">Mortgage Agreement</span>
                    </label>
                    {(safeVaultData.mortgage_agreement as { enabled: boolean }).enabled && (
                      <div className="grid grid-cols-2 gap-2 ml-6">
                        <Input value={(safeVaultData.mortgage_agreement as { details: string }).details ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, mortgage_agreement: { ...(p.mortgage_agreement as object), details: e.target.value } }))} placeholder="Property details" />
                        <Input value={(safeVaultData.mortgage_agreement as { period_description: string }).period_description ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, mortgage_agreement: { ...(p.mortgage_agreement as object), period_description: e.target.value } }))} placeholder="Period (e.g. 24 months)" />
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={safeVaultData.legal_notarised_doc as boolean} onChange={(e) => setSafeVaultData((p) => ({ ...p, legal_notarised_doc: e.target.checked }))} className="rounded" />
                      <span className="text-sm text-theme-primary">Legal / Notarised Document</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(safeVaultData.buyback_guarantee as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, buyback_guarantee: { ...(p.buyback_guarantee as object), enabled: e.target.checked } }))} className="rounded" />
                      <span className="text-sm text-theme-primary">Buyback Guarantee</span>
                    </label>
                    {(safeVaultData.buyback_guarantee as { enabled: boolean }).enabled && (
                      <Input className="ml-6" value={(safeVaultData.buyback_guarantee as { details: string }).details ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, buyback_guarantee: { ...(p.buyback_guarantee as object), details: e.target.value } }))} placeholder="Buyback terms" />
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={safeVaultData.capital_protection as boolean} onChange={(e) => setSafeVaultData((p) => ({ ...p, capital_protection: e.target.checked }))} className="rounded" />
                      <span className="text-sm text-theme-primary">Capital Protection</span>
                    </label>

                    <Input label="Collateral Details (optional)" value={(safeVaultData.collateral_details as string) ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, collateral_details: e.target.value }))} placeholder="Describe collateral assets" />

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(safeVaultData.land_registration as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, land_registration: { ...(p.land_registration as object), enabled: e.target.checked } }))} className="rounded" />
                      <span className="text-sm text-theme-primary">Land Registration</span>
                    </label>
                    {(safeVaultData.land_registration as { enabled: boolean }).enabled && (
                      <Input className="ml-6" value={(safeVaultData.land_registration as { details: string }).details ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, land_registration: { ...(p.land_registration as object), details: e.target.value } }))} placeholder="Registration details" />
                    )}
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
                        <Input label="Target Amount *" type="number" required min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} prefix="₹" placeholder="Total capital needed" />
                        <Input label="Min Investment per Co-Investor *" type="number" required min={0} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} prefix="₹" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Input label="Max Co-Investors" type="number" min={1} value={(communityDetails.maxInvestors as number) ?? ''} onChange={(e) => handleCommunityDetailChange('maxInvestors', Number(e.target.value))} />
                        <Input label="Expected Returns" type="number" step="0.1" min={0} value={(communityDetails.expectedReturns as number) ?? ''} onChange={(e) => handleCommunityDetailChange('expectedReturns', Number(e.target.value))} suffix="%" />
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
                      <Textarea label="Exit Strategy" rows={2} value={(communityDetails.exitStrategy as string) ?? ''} onChange={(e) => handleCommunityDetailChange('exitStrategy', e.target.value)} placeholder="How and when can investors exit?" />
                    </>
                  )}

                  {/* Co-Partner Fields */}
                  {communitySubtype === 'co_partner' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Total Project Cost *" type="number" required min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} prefix="₹" />
                        <Input label="Capital from Partner" type="number" min={0} value={(communityDetails.capitalFromPartner as number) ?? ''} onChange={(e) => handleCommunityDetailChange('capitalFromPartner', Number(e.target.value))} prefix="₹" placeholder="Can be ₹0 if skill-only" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Input label="Equity / Profit Share *" type="number" required step="0.1" min={0} max={100} value={(communityDetails.equityShare as number) ?? ''} onChange={(e) => handleCommunityDetailChange('equityShare', Number(e.target.value))} suffix="%" />
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
                        <Input label="Partner Role / Title *" required value={(communityDetails.partnerRole as string) ?? ''} onChange={(e) => handleCommunityDetailChange('partnerRole', e.target.value)} placeholder="e.g. Co-Founder, Operations Head" />
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Decision Authority *</label>
                          <Select value={(communityDetails.decisionAuthority as string) ?? ''} onChange={(v) => handleCommunityDetailChange('decisionAuthority', v)} placeholder="Select" options={DECISION_AUTHORITIES.map((d) => ({ value: d, label: d }))} />
                        </div>
                      </div>
                      <Textarea label="Key Responsibilities *" required rows={2} value={(communityDetails.keyResponsibilities as string) ?? ''} onChange={(e) => handleCommunityDetailChange('keyResponsibilities', e.target.value)} placeholder="What will the partner be responsible for day-to-day?" />
                      <Textarea label="What the Partner Gets" rows={2} value={(communityDetails.partnerBenefits as string) ?? ''} onChange={(e) => handleCommunityDetailChange('partnerBenefits', e.target.value)} placeholder="e.g. 20% equity, monthly stipend, co-branding rights" />
                    </>
                  )}
                </>
              )}

              {/* Property Specs (Wealth & Safe) */}
              {(vaultType === 'wealth' || vaultType === 'safe') && (
                <>
                  {/* Property Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">Property Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-2">
                      {PROPERTY_TYPE_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => {
                            const next = propertyType === opt.value ? '' : opt.value
                            setPropertyType(next)
                            if (next !== propertyType) {
                              setInvestmentMode('')
                              setLandParcelUnit('sqft')
                              setLandParcelRawValue('')
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            propertyType === opt.value
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-theme bg-theme-surface text-theme-secondary hover:border-primary/40'
                          }`}
                        >
                          <span>{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 🏗️ Project Overview — visible as soon as property type is set */}
                  {propertyType && (() => {
                    const PFCFG: Record<string, { showPossessionQuarter: boolean; showTotalTowers: boolean; showTotalFloors: boolean }> = {
                      flat:       { showPossessionQuarter: true,  showTotalTowers: true,  showTotalFloors: true  },
                      villa:      { showPossessionQuarter: true,  showTotalTowers: false, showTotalFloors: true  },
                      plot:       { showPossessionQuarter: false, showTotalTowers: false, showTotalFloors: false },
                      commercial: { showPossessionQuarter: true,  showTotalTowers: true,  showTotalFloors: true  },
                      warehouse:  { showPossessionQuarter: true,  showTotalTowers: false, showTotalFloors: true  },
                      mixed_use:  { showPossessionQuarter: true,  showTotalTowers: true,  showTotalFloors: true  },
                    }
                    const DEFAULT_FC = { showPossessionQuarter: true, showTotalTowers: true, showTotalFloors: true }
                    const fc = PFCFG[propertyType] ?? DEFAULT_FC
                    return (
                      <div className="rounded-xl border border-theme p-4 space-y-4">
                        <h4 className="text-sm font-semibold text-theme-primary">🏗️ Project Overview</h4>

                        {fc.showPossessionQuarter && (
                          <div className="grid gap-4 grid-cols-1">
                            <div>
                              <label className="block text-sm font-medium text-theme-primary mb-1">Possession Quarter</label>
                              <Select value={projectOverview.possessionQuarter} onChange={(v) => setProjectOverview((p) => ({ ...p, possessionQuarter: v }))} placeholder="Select quarter" options={POSSESSION_QUARTERS.map((q) => ({ value: q, label: q }))} />
                            </div>
                          </div>
                        )}

                        {(fc.showTotalTowers || fc.showTotalFloors) && (
                          <div className={`grid gap-4 ${fc.showTotalTowers ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {fc.showTotalTowers && (
                              <Input label="Total Towers" type="number" min={1} value={projectOverview.totalTowers} onChange={(e) => setProjectOverview((p) => ({ ...p, totalTowers: e.target.value }))} placeholder="e.g. 4" />
                            )}
                            {fc.showTotalFloors && (
                              <Input label="Total Floors" type="number" min={1} value={projectOverview.totalFloors} onChange={(e) => setProjectOverview((p) => ({ ...p, totalFloors: e.target.value }))} placeholder="e.g. 18" />
                            )}
                          </div>
                        )}

                        {/* Land Parcel with unit dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Land Parcel</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={0}
                              value={landParcelRawValue}
                              onChange={(e) => {
                                setLandParcelRawValue(e.target.value)
                                const unit = LAND_UNITS.find((u) => u.value === landParcelUnit)!
                                const sqft = e.target.value ? String(Number(e.target.value) * unit.factor) : ''
                                setProjectOverview((p) => ({ ...p, landParcelSqft: sqft }))
                              }}
                              placeholder="e.g. 1.5"
                              className="flex-1 rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-[var(--bg-surface)]"
                            />
                            <Select
                              value={landParcelUnit}
                              onChange={(v) => {
                                const newUnit = v as LandUnit
                                setLandParcelUnit(newUnit)
                                const unit = LAND_UNITS.find((u) => u.value === newUnit)!
                                const sqft = landParcelRawValue ? String(Number(landParcelRawValue) * unit.factor) : ''
                                setProjectOverview((p) => ({ ...p, landParcelSqft: sqft }))
                              }}
                              options={LAND_UNITS.map((u) => ({ value: u.value, label: u.label }))}
                            />
                          </div>
                          {projectOverview.landParcelSqft && Number(projectOverview.landParcelSqft) > 0 && landParcelUnit !== 'sqft' && (
                            <p className="text-[11px] text-theme-tertiary mt-1">≈ {Number(projectOverview.landParcelSqft).toLocaleString('en-IN')} sq.ft</p>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Investment Mode selector — Wealth Vault only, shown after property type chosen */}
                  {showInvestmentConfig && vaultType === 'wealth' && propertyType && (
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-2">
                        Investment Configuration <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setInvestmentMode('lumpsum')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            investmentMode === 'lumpsum'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-theme bg-[var(--bg-surface)] hover:border-primary/40'
                          }`}
                        >
                          <div className="text-xl mb-1">🏷️</div>
                          <div className="font-semibold text-sm text-theme-primary">Lumpsum</div>
                          <div className="text-xs text-theme-secondary mt-0.5 leading-snug">
                            Set a fixed total target &amp; minimum ticket size for investors
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvestmentMode('unit_config')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            investmentMode === 'unit_config'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-theme bg-[var(--bg-surface)] hover:border-primary/40'
                          }`}
                        >
                          <div className="text-xl mb-1">📐</div>
                          <div className="font-semibold text-sm text-theme-primary">Unit Configuration</div>
                          <div className="text-xs text-theme-secondary mt-0.5 leading-snug">
                            Add unit / plot rows — total investment auto-computed
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 💰 Investment Details — visible once investmentMode (or safe vault) */}
                  {showInvestmentDetails && propertyType && (vaultType === 'safe' || !!investmentMode) && (
                    <div className="rounded-xl border border-theme p-4 space-y-4">
                      <h4 className="text-sm font-semibold text-theme-primary">💰 Investment Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Price per Sq.Ft (₹)" type="number" min={0} value={pricePerSqftField} onChange={(e) => setPricePerSqftField(e.target.value)} placeholder="e.g. 8500" prefix="₹" />
                        <Input label="Total Project Area (Sq.Ft)" type="number" min={0} value={totalProjectAreaSqftField} onChange={(e) => setTotalProjectAreaSqftField(e.target.value)} placeholder="e.g. 120000" />
                      </div>
                      {/* Lumpsum computed cost banner + editable target + min (Wealth vault only) */}
                      {vaultType === 'wealth' && investmentMode === 'lumpsum' && (() => {
                        const computed = pricePerSqftField && totalProjectAreaSqftField
                          ? Number(pricePerSqftField) * Number(totalProjectAreaSqftField) : 0
                        const crore = computed / 1e7
                        const lakh = computed / 1e5
                        const display = computed > 0 ? (crore >= 1 ? `₹${crore.toFixed(2)} Cr` : `₹${lakh.toFixed(2)} L`) : null
                        return (
                          <>
                            {display && (
                              <div className="px-3 py-2.5 bg-primary/5 rounded-lg flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Computed Project Cost</p>
                                  <p className="text-xs text-theme-secondary">Price/sqft × Total Area</p>
                                </div>
                                <div className="text-lg font-bold text-primary">{display}</div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Input label="Target Amount (₹) *" type="number" min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} prefix="₹" />
                              <Input label="Min Investment per Investor (₹) *" type="number" min={0} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} prefix="₹" />
                            </div>
                          </>
                        )
                      })()}

                      {/* Unit Configurations — Safe always, Wealth in unit_config mode only */}
                      {propertyType !== PropertyType.PLOT && (vaultType === 'safe' || investmentMode === 'unit_config') && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-theme-primary">
                              {propertyType === PropertyType.WAREHOUSE ? 'Unit / Bay Configurations' : 'BHK / Unit Configurations'}
                            </label>
                            <button type="button" onClick={() => setUnitConfigs((p) => [...p, { id: String(Date.now()), bhkType: '', carpetAreaSqft: '', superBuiltUpSqft: '', bathrooms: '', balconies: '', totalUnits: '', pricePerSqft: '' }])} className="text-xs text-primary hover:underline">+ Add Config</button>
                          </div>
                          <div className="space-y-2">
                            {unitConfigs.map((row, idx) => (
                              <div key={row.id} className={`grid ${investmentMode === 'unit_config' ? 'grid-cols-8' : 'grid-cols-7'} gap-1.5 items-end p-2.5 bg-theme-surface-hover rounded-lg relative`}>
                                <div className="col-span-2">
                                  <p className="text-[10px] text-theme-tertiary mb-1">Type</p>
                                  <Select value={row.bhkType} onChange={(v) => setUnitConfigs((p) => p.map((r, i) => (i === idx ? { ...r, bhkType: v } : r)))} placeholder="BHK type" options={BHK_TYPES.map((t) => ({ value: t, label: t }))} />
                                </div>
                                {(['carpetAreaSqft', 'superBuiltUpSqft', 'bathrooms', 'balconies', 'totalUnits'] as const).map((field, fi) => (
                                  <div key={field}>
                                    <p className="text-[10px] text-theme-tertiary mb-1">{['Carpet sqft', 'SBA sqft', 'Baths', 'Balc.', 'Units'][fi]}</p>
                                    <input type="number" min={0} value={row[field]} onChange={(e) => setUnitConfigs((p) => p.map((r, i) => (i === idx ? { ...r, [field]: e.target.value } : r)))} className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]" />
                                  </div>
                                ))}
                                {/* ₹/sqft — unit_config mode only */}
                                {investmentMode === 'unit_config' && (
                                  <div>
                                    <p className="text-[10px] text-theme-tertiary mb-1">₹/sqft</p>
                                    <input type="number" min={0} value={row.pricePerSqft} onChange={(e) => setUnitConfigs((p) => p.map((r, i) => (i === idx ? { ...r, pricePerSqft: e.target.value } : r)))} className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]" placeholder="e.g. 8500" />
                                  </div>
                                )}
                                {unitConfigs.length > 1 && (
                                  <button type="button" onClick={() => setUnitConfigs((p) => p.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 hover:bg-red-200 text-xs font-bold">×</button>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Computed total strip — unit_config mode only */}
                          {investmentMode === 'unit_config' && (() => {
                            const total = unitConfigs
                              .filter((u) => u.bhkType && u.carpetAreaSqft && u.totalUnits)
                              .reduce((sum, u) => sum + Number(u.totalUnits) * Number(u.carpetAreaSqft) * Number(u.pricePerSqft || 0), 0)
                            if (total === 0) return null
                            const crore = total / 1e7
                            const lakh = total / 1e5
                            const display = crore >= 1 ? `₹${crore.toFixed(2)} Cr` : `₹${lakh.toFixed(2)} L`
                            return (
                              <div className="mt-3 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Total Investment (auto-computed)</p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Σ units × carpet area × ₹/sqft</p>
                                </div>
                                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{display}</div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* Plot Configurations — Safe always, Wealth in unit_config mode only */}
                      {propertyType === PropertyType.PLOT && (vaultType === 'safe' || investmentMode === 'unit_config') && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-theme-primary">Plot Configurations</label>
                            <button type="button" onClick={() => setPlotConfigs((p) => [...p, { id: String(Date.now()), plotType: '', areaSqft: '', totalPlots: '', pricePerSqft: '' }])} className="text-xs text-primary hover:underline">+ Add Plot Type</button>
                          </div>
                          <div className="space-y-2">
                            {plotConfigs.map((row, idx) => (
                              <div key={row.id} className="grid grid-cols-4 gap-1.5 items-start p-2.5 bg-theme-surface-hover rounded-lg relative">
                                <div>
                                  <p className="text-[10px] text-theme-tertiary mb-1">Plot Type</p>
                                  <Select value={row.plotType} onChange={(v) => setPlotConfigs((p) => p.map((r, i) => (i === idx ? { ...r, plotType: v } : r)))} placeholder="Select" options={PLOT_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))} />
                                </div>
                                <div>
                                  <p className="text-[10px] text-theme-tertiary mb-1">Area (Sq.Ft)</p>
                                  <input type="number" min={0} value={row.areaSqft} onChange={(e) => setPlotConfigs((p) => p.map((r, i) => (i === idx ? { ...r, areaSqft: e.target.value } : r)))} className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]" placeholder="e.g. 2178" />
                                  {row.areaSqft && Number(row.areaSqft) > 0 && <p className="text-[10px] text-theme-tertiary mt-0.5">{sqftConversions(Number(row.areaSqft)).sqyd} sqyd · {sqftConversions(Number(row.areaSqft)).guntha} guntha</p>}
                                </div>
                                <div>
                                  <p className="text-[10px] text-theme-tertiary mb-1">Total Plots</p>
                                  <input type="number" min={0} value={row.totalPlots} onChange={(e) => setPlotConfigs((p) => p.map((r, i) => (i === idx ? { ...r, totalPlots: e.target.value } : r)))} className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]" placeholder="e.g. 50" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-theme-tertiary mb-1">₹/Sqft</p>
                                  <input type="number" min={0} value={row.pricePerSqft} onChange={(e) => setPlotConfigs((p) => p.map((r, i) => (i === idx ? { ...r, pricePerSqft: e.target.value } : r)))} className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]" placeholder="e.g. 3500" />
                                </div>
                                {plotConfigs.length > 1 && (
                                  <button type="button" onClick={() => setPlotConfigs((p) => p.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 hover:bg-red-200 text-xs font-bold">×</button>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Computed total strip — unit_config mode only */}
                          {investmentMode === 'unit_config' && (() => {
                            const total = plotConfigs
                              .filter((p) => p.plotType && p.areaSqft && p.totalPlots)
                              .reduce((sum, p) => sum + Number(p.totalPlots) * Number(p.areaSqft) * Number(p.pricePerSqft || 0), 0)
                            if (total === 0) return null
                            const crore = total / 1e7
                            const lakh = total / 1e5
                            const display = crore >= 1 ? `₹${crore.toFixed(2)} Cr` : `₹${lakh.toFixed(2)} L`
                            return (
                              <div className="mt-3 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Total Investment (auto-computed)</p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Σ plots × area × ₹/sqft</p>
                                </div>
                                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{display}</div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* Amenities is now in its own section below */}
                    </div>
                  )}

                  {/* 📅 Funding Schedule */}
                  {propertyType && (vaultType === 'safe' || !!investmentMode) && (
                    <div className="rounded-xl border border-theme p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-theme-primary">📅 Funding Schedule</h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wide">⚠️ Important</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">
                            Funding Opens <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={form.fundingOpenAt ?? ''}
                            onChange={(e) => handleChange('fundingOpenAt', e.target.value)}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-[var(--bg-surface)]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Funding Deadline <span className="text-xs text-theme-tertiary">(optional)</span></label>
                          <input
                            type="date"
                            value={form.closingDate ?? ''}
                            onChange={(e) => handleChange('closingDate', e.target.value)}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-[var(--bg-surface)]"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-theme-tertiary">ℹ️ Status auto-transitions to <strong>Active</strong> once approvals complete &amp; Funding Opens date is reached.</p>
                    </div>
                  )}

                  {/* 💰 Min Investment — shown when Investment Details section is off */}
                  {!showInvestmentDetails && propertyType && (vaultType === 'wealth' || vaultType === 'safe') && (vaultType === 'safe' || !!investmentMode) && (
                    <div className="rounded-xl border border-theme p-4">
                      <h4 className="text-sm font-semibold text-theme-primary mb-3">💰 Investment Amount</h4>
                      <Input
                        label="Minimum Investment per Investor (₹) *"
                        type="number"
                        min={0}
                        value={form.minInvestment ?? ''}
                        onChange={(e) => handleChange('minInvestment', Number(e.target.value))}
                        prefix="₹"
                        placeholder="e.g. 500000"
                      />
                    </div>
                  )}

                  {/* ✨ Amenities */}
                  {showAmenities && propertyType && (vaultType === 'safe' || !!investmentMode) && (
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-3">✨ Amenities</label>
                      <div className="space-y-3">
                        {(Object.entries(AMENITY_CATEGORIES) as [AmenityCategory, string][]).map(([catKey, catLabel]) => {
                          const catAmenities = AMENITIES.filter((a) => a.category === catKey)
                          return (
                            <div key={catKey}>
                              <p className="text-[11px] font-semibold text-theme-tertiary uppercase tracking-wider mb-1.5">{catLabel}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {catAmenities.map((a) => {
                                  const isSel = selectedAmenities.includes(a.key)
                                  return (
                                    <button type="button" key={a.key} onClick={() => setSelectedAmenities((p) => (isSel ? p.filter((k) => k !== a.key) : [...p, a.key]))} className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${isSel ? 'border-primary bg-primary/10 text-primary' : 'border-theme text-theme-secondary hover:border-primary/50 hover:text-theme-primary'}`}>
                                      {a.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {selectedAmenities.length > 0 && <p className="text-xs text-primary mt-2 font-medium">✓ {selectedAmenities.length} amenities selected</p>}
                    </div>
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
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
                  Continue → Shield
                </button>
              </div>
            </form>
          )}

          {/* Shield (optional) */}
          {step === 'shield' && (
            <div className="space-y-5">
              <button type="button" onClick={() => setStep('form')} className="text-sm text-theme-secondary hover:text-theme-primary flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Back to form
              </button>
              <div>
                <h2 className="font-display text-xl font-bold text-theme-primary">
                  WealthSpot Shield · optional
                </h2>
                <p className="text-sm text-theme-secondary">
                  Everything on this step is optional — fill what you have, our review team will follow up for the rest.
                </p>
              </div>
              <BuilderShieldStep
                answers={shieldAnswers}
                onChange={(key, answer) =>
                  setShieldAnswers((prev) => ({ ...prev, [key]: answer }))
                }
              />
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={finalSubmit}
                  disabled={createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-theme text-sm font-semibold text-theme-secondary hover:text-theme-primary"
                >
                  Skip Shield &amp; submit
                </button>
                <button
                  type="button"
                  onClick={finalSubmit}
                  disabled={createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>) : '🚀 Submit listing'}
                </button>
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">
                  {formatApiError(createMutation.error).message}
                </p>
              )}
            </div>
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
                Submitted — our Shield review starts now. We'll reach out for any missing evidence.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => navigate('/portal/builder/listings')} className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors">
                  View My Listings
                </button>
                <button onClick={() => { setStep('vault'); setVaultType(''); setForm({ vaultType: '', title: '' }); setMediaItems([]); setAddress(EMPTY_ADDRESS); setCommunityDetails({}); setCommunitySubtype(''); setShieldAnswers({}) }} className="px-5 py-2.5 rounded-lg border border-theme text-sm font-medium text-theme-secondary hover:text-theme-primary transition-colors">
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
