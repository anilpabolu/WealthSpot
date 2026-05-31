import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, Loader2, Lock, Wallet, Handshake, ShieldCheck,
  AlertCircle, CheckCircle2, ChevronRight, ArrowLeft,
  Scale, TrendingUp, MapPin, DoorOpen,
} from 'lucide-react'
import SEOHead from '@/components/SEOHead'
import MainLayout from '@/components/layout/MainLayout'
import { useCreateOpportunity, useOpportunityFormOptions, type OpportunityCreatePayload } from '@/hooks/useOpportunities'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone from '@/components/MediaUploadZone'
import AddressDialog, { type AddressFields } from '@/components/AddressDialog'
import CompanySelector from '@/components/CompanySelector'
import CompanyOnboardingModal from '@/components/CompanyOnboardingModal'
import { type CommunitySubtypeValue } from '@/components/CommunitySubtypeModal'
import { type BuilderAnswer } from '@/components/shield/BuilderShieldStep'
import { ASSESSMENT_CATEGORIES } from '@/lib/assessments'
import { useToastStore } from '@/stores/toastStore'
import { useUserStore } from '@/stores/user.store'
import { PropertyType } from '@wealthspot/types'

// ─── Constants (ported from CreateOpportunityModal) ───────────────────────────

const COMMUNITY_SUBTYPES = [
  {
    value: 'co_investor' as const,
    label: 'Co-Investor',
    badge: 'Capital Only',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    icon: Wallet,
    iconBg: 'bg-amber-500/10 text-amber-400',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    description:
      'Contribute capital to fund a community project and earn returns through profit-sharing, rental income, or equity appreciation — without active involvement.',
    highlights: ['Passive investment', 'Profit-sharing returns', 'No time commitment required'],
  },
  {
    value: 'co_partner' as const,
    label: 'Co-Partner',
    badge: 'Capital + Active Role',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    icon: Handshake,
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    description:
      'Partner up by contributing capital plus your time, skills, and network. Earn equity and profit share in exchange for hands-on involvement.',
    highlights: ['Equity & profit share', 'Active involvement', 'Leverage your skills & network'],
  },
]

const VAULT_OPTIONS = [
  {
    value: 'wealth',
    label: 'Wealth Vault',
    sublabel: 'Real estate that prints money 🏗️',
    bestFor: 'Growth seekers',
    ticket: 'Flexible ticket sizes',
    timeline: 'Mid to long horizon',
    unlocks: ['Property specifics', 'Funding design', 'Return mechanics'],
    icon: Building2,
    accent: '#D4AF37',
    accentBg: 'rgba(212,175,55,0.08)',
    accentBorder: 'rgba(212,175,55,0.35)',
    accentHover: 'rgba(212,175,55,0.5)',
  },
  {
    value: 'safe',
    label: 'Safe Vault',
    sublabel: 'Fixed returns · Mortgage-backed 🔒',
    bestFor: 'Capital protection',
    ticket: 'Predictable payouts',
    timeline: 'Defined tenure',
    unlocks: ['Security terms', 'Tenure & payout', 'Collateral profile'],
    icon: ShieldCheck,
    accent: '#20E3B2',
    accentBg: 'rgba(32,227,178,0.08)',
    accentBorder: 'rgba(32,227,178,0.35)',
    accentHover: 'rgba(32,227,178,0.5)',
  },
  {
    value: 'community',
    label: 'Community Vault',
    sublabel: 'Build together, win together 🐝',
    bestFor: 'Collaborative builders',
    ticket: 'Capital + contribution',
    timeline: 'Milestone driven',
    unlocks: ['Role model', 'Collaboration terms', 'Execution commitments'],
    icon: Users,
    accent: '#34d399',
    accentBg: 'rgba(52,211,153,0.08)',
    accentBorder: 'rgba(52,211,153,0.35)',
    accentHover: 'rgba(52,211,153,0.5)',
  },
] as const

type VaultOptionValue = (typeof VAULT_OPTIONS)[number]['value']

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

const PROPERTY_TYPE_OPTIONS = [
  { value: PropertyType.FLAT, label: 'Flat / Apartment', icon: '🏢' },
  { value: PropertyType.VILLA, label: 'Villa / Row House', icon: '🏡' },
  { value: PropertyType.PLOT, label: 'Plot / Land / Farm Land', icon: '🏞️' },
  { value: PropertyType.COMMERCIAL, label: 'Commercial', icon: '🏪' },
  { value: PropertyType.WAREHOUSE, label: 'Warehouse', icon: '🏭' },
  { value: PropertyType.MIXED_USE, label: 'Mixed Use', icon: '🏙️' },
]

const BHK_TYPES_RESIDENTIAL = ['Studio', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', 'Penthouse', 'Duplex']
const BHK_TYPES_COMMERCIAL = ['Office Unit', 'Retail Unit', 'Showroom', 'Studio Office', 'Co-working Bay', 'Whole Floor', 'Other']
const BHK_TYPES_WAREHOUSE = ['Small Bay (< 5000 sqft)', 'Medium Bay (5–20k sqft)', 'Large Bay (> 20k sqft)', 'Cold Storage Unit', 'Mezzanine Unit', 'Other']
const BHK_TYPES_MIXED = [...BHK_TYPES_RESIDENTIAL, 'Office Unit', 'Retail Unit', 'Other']

function getBhkTypes(pt: string) {
  if (pt === PropertyType.COMMERCIAL) return BHK_TYPES_COMMERCIAL
  if (pt === PropertyType.WAREHOUSE) return BHK_TYPES_WAREHOUSE
  if (pt === PropertyType.MIXED_USE) return BHK_TYPES_MIXED
  return BHK_TYPES_RESIDENTIAL
}

const CURRENT_YEAR = new Date().getFullYear()
const POSSESSION_YEAR_MIN = CURRENT_YEAR + 1
const POSSESSION_YEAR_MAX = CURRENT_YEAR + 10

interface PropertyFieldConfig {
  showPossessionYear: boolean; showTotalTowers: boolean
  showTotalFloors: boolean; showUnitConfig: boolean; showPlotConfig: boolean; unitConfigLabel: string
}
const PROPERTY_FIELD_CONFIG: Record<string, PropertyFieldConfig> = {
  [PropertyType.FLAT]:       { showPossessionYear: true,  showTotalTowers: true,  showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'BHK / Unit Configurations' },
  [PropertyType.VILLA]:      { showPossessionYear: true,  showTotalTowers: false, showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'Villa / Row House Configurations' },
  [PropertyType.PLOT]:       { showPossessionYear: false, showTotalTowers: false, showTotalFloors: false, showUnitConfig: false, showPlotConfig: true,  unitConfigLabel: '' },
  [PropertyType.COMMERCIAL]: { showPossessionYear: true,  showTotalTowers: true,  showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'Unit Configurations' },
  [PropertyType.WAREHOUSE]:  { showPossessionYear: true,  showTotalTowers: false, showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'Bay / Unit Configurations' },
  [PropertyType.MIXED_USE]:  { showPossessionYear: true,  showTotalTowers: true,  showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'Unit Configurations' },
}

const USP_CATEGORIES = [
  { value: 'mall', label: 'Shopping Mall' },
  { value: 'commercial_complex', label: 'Commercial Complex' },
  { value: 'metro', label: 'Metro / Rail' },
  { value: 'transport', label: 'Transport Hub' },
  { value: 'it_park', label: 'IT Park / Tech Office' },
  { value: 'hospital', label: 'Hospital / Healthcare' },
  { value: 'school', label: 'School / Education' },
  { value: 'airport', label: 'Airport' },
  { value: 'highway', label: 'Highway / Expressway' },
  { value: 'park', label: 'Park / Lake' },
  { value: 'other', label: 'Other' },
]

interface LocationUsp { id: string; text: string; category: string }


const LAND_UNITS = [
  { value: 'sqft',   label: 'Sq.Ft',  factor: 1 },
  { value: 'sqyd',   label: 'Sq.Yd',  factor: 9 },
  { value: 'guntha', label: 'Guntha', factor: 1089 },
  { value: 'acres',  label: 'Acres',  factor: 43560 },
  { value: 'bigha',  label: 'Bigha',  factor: 27225 },
] as const
type LandUnit = typeof LAND_UNITS[number]['value']

function sqftConversions(sqft: number) {
  return {
    sqft: sqft.toLocaleString('en-IN'),
    sqyd: (sqft / 9).toFixed(1),
    guntha: (sqft / 1089).toFixed(3),
    acre: (sqft / 43560).toFixed(4),
  }
}

interface UnitConfigRow {
  id: string; bhkType: string; superBuiltUpSqft: string; pricePerSqft: string
}
interface PlotConfigRow {
  id: string; plotType: string; areaSqft: string; totalPlots: string; pricePerSqft: string
}
interface ProjectOverview {
  totalTowers: string; totalFloors: string; possessionYear: string; landParcelSqft: string
}

const DEFAULT_UNIT_CONFIG: UnitConfigRow = { id: '1', bhkType: '', superBuiltUpSqft: '', pricePerSqft: '' }
const DEFAULT_PLOT_CONFIG: PlotConfigRow = { id: '1', plotType: '', areaSqft: '', totalPlots: '', pricePerSqft: '' }
const DEFAULT_PROJECT_OVERVIEW: ProjectOverview = { totalTowers: '', totalFloors: '', possessionYear: '', landParcelSqft: '' }

type CommunityDetailsState = Record<string, string | number | string[]>

interface MediaItem { file: File; preview: string; type: 'image' | 'video' }

const EMPTY_ADDRESS: AddressFields = {
  addressLine1: '', addressLine2: '', landmark: '', locality: '',
  city: '', state: '', pincode: '', district: '', country: 'India',
}

const PAGE_ACCENT = '#D4AF37'

// ─── Shield validation helper ─────────────────────────────────────────────────
function getShieldValidationErrors(answers: Record<string, BuilderAnswer>, categoryIndex?: number): string[] {
  const errors: string[] = []
  const categories = categoryIndex !== undefined ? [ASSESSMENT_CATEGORIES[categoryIndex]] : ASSESSMENT_CATEGORIES
  for (const cat of categories) {
    if (!cat) continue
    for (const sub of cat.subItems) {
      if (sub.requiresDocument) continue
      const val = answers[sub.code]?.value
      if (!val || String(val).trim() === '') {
        errors.push(sub.label)
      }
    }
  }
  return errors
}

// ─── Shared CSS helpers ──────────────────────────────────────────────────────
const INPUT_CLS = 'w-full rounded-xl border border-[rgba(209,196,157,0.5)] bg-white text-[var(--text-primary)] font-body placeholder-[var(--text-muted)] px-3.5 py-2.5 text-sm focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/12 outline-none transition-colors'
const INPUT_ERR_CLS = 'w-full rounded-xl border border-red-400 bg-white text-[var(--text-primary)] font-body placeholder-[var(--text-muted)] px-3.5 py-2.5 text-sm outline-none transition-colors'
const SELECT_CLS = 'w-full rounded-xl border border-[rgba(209,196,157,0.5)] bg-white text-[var(--text-primary)] font-body px-3.5 py-2.5 text-sm outline-none appearance-none transition-colors focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/12'
const SELECT_ERR_CLS = 'w-full rounded-xl border border-red-400 bg-white text-[var(--text-primary)] font-body px-3.5 py-2.5 text-sm outline-none appearance-none transition-colors'
const LABEL_CLS = 'block text-[var(--text-tertiary)] text-[11px] font-bold uppercase tracking-wider mb-1.5'
const CARD_CLS = 'bg-white border border-[rgba(209,196,157,0.28)] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.04)]'
const SECTION_HEADING = 'font-display text-[var(--text-primary)] font-bold text-sm uppercase tracking-wider mb-4'
const ERR_MSG = 'text-red-500 text-xs mt-1.5 flex items-center gap-1'

// Step definitions
type WizardStep = 'vault' | 'community-subtype' | 'details' | 'shield' | 'uploading'




// ─── Shield section metadata ──────────────────────────────────────────────────

type ShieldMetaEntry = {
  gradient: string
  accentHex: string
  tagline: string
  bullets: [string, string, string, string]
  stats: [string, string, string]
  pattern: string
}

function getCatIcon(name: string, cls: string): React.ReactElement {
  const props = { className: cls }
  switch (name) {
    case 'ShieldCheck': return <ShieldCheck {...props} />
    case 'Scale':       return <Scale {...props} />
    case 'TrendingUp':  return <TrendingUp {...props} />
    case 'MapPin':      return <MapPin {...props} />
    case 'Building2':   return <Building2 {...props} />
    case 'Lock':        return <Lock {...props} />
    case 'DoorOpen':    return <DoorOpen {...props} />
    default:            return <ShieldCheck {...props} />
  }
}

const SHIELD_META: Record<string, ShieldMetaEntry> = {
  builder: {
    gradient: 'linear-gradient(160deg, #021a0e 0%, #062318 45%, #0b301f 100%)',
    accentHex: '#10b981',
    tagline: 'Know the team behind your investment',
    bullets: [
      'Delivery history and project track record',
      'Balance-sheet health and cashflow transparency',
      'Leadership profiles and team capability',
      'WealthSpot grade assigned after full review',
    ],
    stats: ['5-point grading', 'Balance sheet check', 'Team due-diligence'],
    pattern: "radial-gradient(circle, #10b98118 1px, transparent 1px)",
  },
  legal: {
    gradient: 'linear-gradient(160deg, #020f1e 0%, #041826 45%, #071f35 100%)',
    accentHex: '#38bdf8',
    tagline: 'Zero legal surprises — guaranteed',
    bullets: [
      'Chain-of-title deed review by empanelled firm',
      'Encumbrance Certificate last 13 years',
      'Buffer-zone, lake, SC/ST constraint checks',
      'Signed legal opinion letter before listing',
    ],
    stats: ['Empanelled law firms', 'EC 13-year review', 'Opinion letter required'],
    pattern: "repeating-linear-gradient(45deg, #38bdf810 0, #38bdf810 1px, transparent 0, transparent 18px)",
  },
  valuation: {
    gradient: 'linear-gradient(160deg, #160900 0%, #231100 45%, #311800 100%)',
    accentHex: '#f59e0b',
    tagline: 'Is the price right? We will tell you',
    bullets: [
      'Independent SME transaction comparison within 2 km',
      'Fair-market-value benchmarked against comparables',
      '3–5 year appreciation curve modeled',
      'No listing until price is independently validated',
    ],
    stats: ['Independent SMEs', '2km radius comps', '5-year outlook'],
    pattern: "radial-gradient(ellipse 55% 55% at 50% 50%, #f59e0b10 0%, transparent 70%)",
  },
  location: {
    gradient: 'linear-gradient(160deg, #0d0420 0%, #180637 45%, #200946 100%)',
    accentHex: '#c084fc',
    tagline: 'Location risk caught before you commit',
    bullets: [
      'Buffer-zone, dotted-land & SC/ST classification',
      'Government encroachment mapping',
      'Upcoming metro, IT park, highway proximity',
      'Future development potential scored',
    ],
    stats: ['Buffer-zone scan', 'Govt. land check', 'Infra uplift map'],
    pattern: "radial-gradient(circle at 30% 50%, transparent 19%, #c084fc0a 20%, transparent 21%), radial-gradient(circle at 70% 50%, transparent 29%, #c084fc08 30%, transparent 31%)",
  },
  property: {
    gradient: 'linear-gradient(160deg, #020d1e 0%, #051525 45%, #091e36 100%)',
    accentHex: '#60a5fa',
    tagline: 'Verified ground reality, not just promises',
    bullets: [
      'Construction phase physically inspected',
      'Parcel dimensions and land-area verified',
      'Premium / mid / affordable segment graded',
      'Possession timeline locked in writing',
    ],
    stats: ['Physical inspection', 'Parcel verification', 'Timeline committed'],
    pattern: "repeating-linear-gradient(0deg, #60a5fa0e 0, #60a5fa0e 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #60a5fa0e 0, #60a5fa0e 1px, transparent 1px, transparent 40px)",
  },
  security: {
    gradient: 'linear-gradient(160deg, #180204 0%, #230508 45%, #310a0e 100%)',
    accentHex: '#fb7185',
    tagline: 'Your capital protected by binding contracts',
    bullets: [
      'Executed sale agreement or sale deed on file',
      'Post-dated cheques covering principal + interest',
      'MoUs signed between investors and platform',
      'Dispute-handling clauses reviewed by counsel',
    ],
    stats: ['Sale agreement', 'PDC cover', 'MoU on file'],
    pattern: "radial-gradient(circle, #fb718518 1px, transparent 1px)",
  },
  exit: {
    gradient: 'linear-gradient(160deg, #080320 0%, #110537 45%, #180848 100%)',
    accentHex: '#a78bfa',
    tagline: 'Know exactly when and how you can exit',
    bullets: [
      'Lock-in window clearly stated in the deal docs',
      'Capital mobility between builder projects',
      'Emergency-exit waterfall and penalty terms',
      'WealthSpot-mediated dispute resolution path',
    ],
    stats: ['Lock-in documented', 'Flex-move option', 'Exit waterfall'],
    pattern: "repeating-linear-gradient(-45deg, #a78bfa0d 0, #a78bfa0d 1px, transparent 0, transparent 20px)",
  },
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CreateOpportunityPage() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)

  // Block non-admins
  useEffect(() => {
    if (user && !['admin', 'super_admin'].includes(user.primaryRole)) {
      navigate('/vaults')
    }
  }, [user, navigate])

  const [step, setStep] = useState<WizardStep>('vault')
  const [vaultType, setVaultType] = useState('')
  const [vaultPreview, setVaultPreview] = useState<VaultOptionValue>('wealth')
  const [communitySubtype, setCommunitySubtype] = useState<CommunitySubtypeValue | ''>('')
  const [communityDetails, setCommunityDetails] = useState<CommunityDetailsState>({})
  const [form, setForm] = useState<OpportunityCreatePayload>({ vaultType: '', title: '' })
  const [safeVaultData, setSafeVaultData] = useState<Record<string, unknown>>({
    interest_rate: 0, payout_frequency: 'monthly', tenure_months: null,
    mortgage_agreement: { enabled: false, details: '', period_description: '' },
    legal_notarised_doc: false,
    buyback_guarantee: { enabled: false, details: '' },
    capital_protection: false, collateral_details: '',
    land_registration: { enabled: false, details: '' },
  })
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [address, setAddress] = useState<AddressFields>(EMPTY_ADDRESS)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [propertyType, setPropertyType] = useState<string>('')
  const [unitConfigs, setUnitConfigs] = useState<UnitConfigRow[]>([{ ...DEFAULT_UNIT_CONFIG }])
  const [plotConfigs, setPlotConfigs] = useState<PlotConfigRow[]>([{ ...DEFAULT_PLOT_CONFIG }])
  const [pricePerSqftField, setPricePerSqftField] = useState<string>('')
  const [totalProjectAreaSqft, setTotalProjectAreaSqft] = useState<string>('')
  const [projectOverview, setProjectOverview] = useState<ProjectOverview>({ ...DEFAULT_PROJECT_OVERVIEW })
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [investmentMode, setInvestmentMode] = useState<'lumpsum' | 'unit_config' | ''>('')
  const [landParcelUnit, setLandParcelUnit] = useState<LandUnit>('sqft')
  const [landParcelRawValue, setLandParcelRawValue] = useState<string>('')
  const [shieldAnswers, setShieldAnswers] = useState<Record<string, BuilderAnswer>>({})
  const [detailsStepIndex, setDetailsStepIndex] = useState(0)
  const [shieldStepIndex, setShieldStepIndex] = useState(0)
  const [shieldStepAttempted, setShieldStepAttempted] = useState(false)
  // Geo / maps
  const [mapsLatitude, setMapsLatitude] = useState<string>('')
  const [mapsLongitude, setMapsLongitude] = useState<string>('')
  const [mapsUrl, setMapsUrl] = useState<string>('')
  // Location USPs
  const [locationUsps, setLocationUsps] = useState<LocationUsp[]>([{ id: '1', text: '', category: 'other' }])

  const createMutation = useCreateOpportunity()
  const uploadMutation = useUploadOpportunityMedia()
  const { isVaultEnabled } = useVaultConfig()
  useOpportunityFormOptions()

  // Reset configs when propertyType changes
  useEffect(() => {
    setUnitConfigs([{ ...DEFAULT_UNIT_CONFIG }])
    setPlotConfigs([{ ...DEFAULT_PLOT_CONFIG }])
    setProjectOverview({ ...DEFAULT_PROJECT_OVERVIEW })
    setInvestmentMode('')
    setLandParcelUnit('sqft')
    setLandParcelRawValue('')
  }, [propertyType])

  // Auto-compute lumpsum target
  useEffect(() => {
    if (investmentMode === 'lumpsum' && pricePerSqftField && totalProjectAreaSqft) {
      const computed = Number(pricePerSqftField) * Number(totalProjectAreaSqft)
      if (computed > 0) setForm((prev) => ({ ...prev, targetAmount: computed }))
    }
  }, [pricePerSqftField, totalProjectAreaSqft, investmentMode])

  const fe = (key: string) => submitAttempted && !!formErrors[key]

  const handleVaultSelect = (vault: string) => {
    setVaultType(vault)
    setForm({ ...form, vaultType: vault })
    if (vault === 'wealth' || vault === 'safe' || vault === 'community') {
      setVaultPreview(vault)
    }
    if (vault === 'community') setStep('community-subtype')
    else setStep('details')
  }

  const handleCommunitySubtypeSelect = (subtype: CommunitySubtypeValue) => {
    setCommunitySubtype(subtype)
    setForm((prev) => ({ ...prev, communitySubtype: subtype }))
    setCommunityDetails({})
    setStep('details')
  }

  const handleCommunityDetailChange = (field: string, value: string | number | string[]) => {
    setCommunityDetails((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSkill = (skill: string) => {
    setCommunityDetails((prev) => {
      const current = (prev.requiredSkills as string[] | undefined) ?? []
      return { ...prev, requiredSkills: current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill] }
    })
  }

  const handleChange = (field: keyof OpportunityCreatePayload, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!form.title?.trim()) errors.title = 'Required'
    if (!form.tagline?.trim()) errors.tagline = 'Required'
    // description is optional — no validation
    if (!address.city?.trim()) errors.city = 'Required'
    if (!address.state?.trim()) errors.state = 'Required'

    if (vaultType === 'wealth' || vaultType === 'safe') {
      if (!propertyType) errors.propertyType = 'Required'
      // price_per_sqft and total_project_area_sqft only required for lumpsum mode
      if (investmentMode === 'lumpsum' || vaultType === 'safe') {
        if (!pricePerSqftField) errors.pricePerSqft = 'Required'
        if (!totalProjectAreaSqft) errors.totalProjectArea = 'Required'
      }
      if (propertyType) {
        const fc = PROPERTY_FIELD_CONFIG[propertyType]
        if (fc) {
          if (fc.showPossessionYear) {
            const yr = parseInt(projectOverview.possessionYear)
            if (!projectOverview.possessionYear) {
              errors.possessionYear = 'Required'
            } else if (isNaN(yr) || yr < POSSESSION_YEAR_MIN || yr > POSSESSION_YEAR_MAX) {
              errors.possessionYear = `Enter a year between ${POSSESSION_YEAR_MIN} and ${POSSESSION_YEAR_MAX}`
            }
          }
          // totalFloors and totalTowers are optional — no required validation
          if (!projectOverview.landParcelSqft) errors.landParcelSqft = 'Required'
          if (vaultType === 'safe' || investmentMode === 'unit_config') {
            if (fc.showUnitConfig) {
              const hasValidUnit = unitConfigs.some((u) => u.bhkType && u.superBuiltUpSqft)
              if (!hasValidUnit) errors.unitConfig = 'At least one unit configuration with SBU and ₹/Sqft is required'
              else {
                const hasPrice = unitConfigs.some((u) => u.bhkType && u.superBuiltUpSqft && u.pricePerSqft)
                if (!hasPrice) errors.unitConfig = 'Each unit configuration needs ₹/Sqft pricing'
              }
            }
            if (fc.showPlotConfig) {
              const hasValidPlot = plotConfigs.some((p) => p.plotType && p.areaSqft && p.totalPlots)
              if (!hasValidPlot) errors.plotConfig = 'At least one plot configuration is required'
              if (investmentMode === 'unit_config') {
                const hasPrice = plotConfigs.some((p) => p.plotType && p.areaSqft && p.totalPlots && p.pricePerSqft)
                if (!hasPrice) errors.plotConfig = 'At least one complete plot config with ₹/sqft pricing required'
              }
            }
          }
        }
      }
      if (!form.fundingOpenAt) errors.fundingOpenAt = 'Required'
      if (vaultType === 'wealth') {
        if (!investmentMode) errors.investmentMode = 'Select an investment configuration mode'
        else if (investmentMode === 'lumpsum') {
          if (!form.targetAmount) errors.targetAmount = 'Required'
          if (!form.minInvestment) errors.minInvestment = 'Required'
        }
      }
      if (vaultType === 'safe') {
        if (!form.targetAmount) errors.targetAmount = 'Required'
        if (!form.minInvestment) errors.minInvestment = 'Required'
        if (!(safeVaultData.interest_rate as number)) errors.interestRate = 'Required'
        if (!safeVaultData.tenure_months) errors.tenureMonths = 'Required'
      }
    }

    if (vaultType === 'community') {
      if (!form.communityType) errors.communityType = 'Required'
      if (!form.collaborationType) errors.collaborationType = 'Required'
      if (communitySubtype === 'co_investor') {
        if (!form.targetAmount) errors.targetAmount = 'Required'
        if (!form.minInvestment) errors.minInvestment = 'Required'
        if (!communityDetails.investmentTenure) errors.investmentTenure = 'Required'
        if (!communityDetails.revenueModel) errors.revenueModel = 'Required'
        if (!communityDetails.legalStructure) errors.legalStructure = 'Required'
        if (!communityDetails.riskLevel) errors.riskLevel = 'Required'
        if (!communityDetails.projectedTimeline) errors.projectedTimeline = 'Required'
      }
      if (communitySubtype === 'co_partner') {
        if (!form.targetAmount) errors.targetAmount = 'Required'
        if (!communityDetails.equityShare) errors.equityShare = 'Required'
        if (!communityDetails.timeCommitment) errors.timeCommitment = 'Required'
        if (!communityDetails.partnershipDuration) errors.partnershipDuration = 'Required'
        if (!((communityDetails.requiredSkills as string[])?.length)) errors.requiredSkills = 'Required'
        if (!communityDetails.partnerRole) errors.partnerRole = 'Required'
        if (!communityDetails.decisionAuthority) errors.decisionAuthority = 'Required'
        if (!communityDetails.keyResponsibilities) errors.keyResponsibilities = 'Required'
      }
    }

    return errors
  }

  const handleDetailsNext = () => {
    setSubmitAttempted(true)
    const errors = validateForm()
    setFormErrors(errors)
    
    const step0Keys = ['title', 'tagline', 'description']
    let currentStepErrors: string[] = []
    
    if (detailsStepIndex === 0) {
      currentStepErrors = Object.keys(errors).filter(k => step0Keys.includes(k))
    } else if (detailsStepIndex === 1) {
      currentStepErrors = Object.keys(errors).filter(k => !step0Keys.includes(k))
    }

    if (currentStepErrors.length > 0) {
      const formatFieldName = (key: string) => {
        const result = key.replace(/([A-Z])/g, ' $1')
        return result.charAt(0).toUpperCase() + result.slice(1)
      }
      const fieldNames = currentStepErrors.map(formatFieldName).join(', ')
      useToastStore.getState().addToast({ type: 'error', title: 'Required fields missing', message: `Please complete the following fields: ${fieldNames}` })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (detailsStepIndex < 2) {
      setDetailsStepIndex(prev => prev + 1)
      setSubmitAttempted(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setStep('shield')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleDetailsBack = () => {
    if (detailsStepIndex > 0) {
      setDetailsStepIndex(prev => prev - 1)
      setSubmitAttempted(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      if (vaultType === 'community') setStep('community-subtype')
      else setStep('vault')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleShieldNext = async () => {
    setShieldStepAttempted(true)
    const errors = getShieldValidationErrors(shieldAnswers, shieldStepIndex)
    
    if (errors.length > 0) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Required fields missing',
        message: `Please complete the following fields: ${errors.join(', ')}`,
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (shieldStepIndex < ASSESSMENT_CATEGORIES.length - 1) {
      setShieldStepIndex((prev) => prev + 1)
      setShieldStepAttempted(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleSubmit()
    }
  }

  const handleShieldBack = () => {
    if (shieldStepIndex > 0) {
      setShieldStepIndex((prev) => prev - 1)
      setShieldStepAttempted(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setStep('details')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    const shieldErrors = getShieldValidationErrors(shieldAnswers)
    if (shieldErrors.length > 0) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Shield questionnaire incomplete',
        message: `Please answer all required question(s) before submitting.`,
      })
      return
    }

    // Build property specs
    let propertySpecsPayload: Record<string, unknown> | undefined
      if (propertyType) {
      const base: Record<string, unknown> = {
        property_type: propertyType,
        ...(projectOverview.possessionYear && { possession_year: Number(projectOverview.possessionYear) }),
        ...(projectOverview.totalTowers && { total_towers: Number(projectOverview.totalTowers) }),
        ...(projectOverview.totalFloors && { total_floors: Number(projectOverview.totalFloors) }),
        ...(projectOverview.landParcelSqft && { land_parcel_area_sqft: Number(projectOverview.landParcelSqft) }),
      }
      if (propertyType === PropertyType.PLOT) {
        base.plot_configurations = plotConfigs.filter((p) => p.plotType).map((p) => ({
          type: p.plotType,
          ...(p.areaSqft && { area_sqft: Number(p.areaSqft) }),
          ...(p.totalPlots && { total_plots: Number(p.totalPlots) }),
          ...(p.pricePerSqft && { price_per_sqft: Number(p.pricePerSqft) }),
        }))
      } else {
        base.configurations = unitConfigs.filter((u) => u.bhkType).map((u) => ({
          type: u.bhkType,
          ...(u.superBuiltUpSqft && { super_built_up_sqft: Number(u.superBuiltUpSqft) }),
          ...(u.pricePerSqft && { price_per_sqft: Number(u.pricePerSqft) }),
        }))
      }
      propertySpecsPayload = base
    }

    // For unit_config: sum of (sbu × price_per_sqft) per config type × assumed count of 1
    let unitConfigTargetAmount: number | undefined
    if (vaultType === 'wealth' && investmentMode === 'unit_config' && propertyType) {
      if (propertyType === PropertyType.PLOT) {
        unitConfigTargetAmount = plotConfigs.filter((p) => p.plotType && p.areaSqft && p.totalPlots).reduce((sum, p) => sum + Number(p.totalPlots) * Number(p.areaSqft) * Number(p.pricePerSqft || 0), 0)
      } else {
        unitConfigTargetAmount = unitConfigs.filter((u) => u.bhkType && u.superBuiltUpSqft).reduce((sum, u) => sum + Number(u.superBuiltUpSqft) * Number(u.pricePerSqft || 0), 0)
      }
    }

    // Build maps / location data
    const parsedLat = mapsLatitude ? parseFloat(mapsLatitude) : undefined
    const parsedLng = mapsLongitude ? parseFloat(mapsLongitude) : undefined
    const validUsps = locationUsps.filter((u) => u.text.trim()).map(({ text, category }) => ({ text: text.trim(), category }))

    const payload: OpportunityCreatePayload = {
      ...form,
      ...address,
      ...(communitySubtype && { communitySubtype, communityDetails: communityDetails as Record<string, unknown> }),
      ...(vaultType === 'safe' && { safeVaultData }),
      ...(propertyType && {
        property_type: propertyType,
        ...(pricePerSqftField && { price_per_sqft: Number(pricePerSqftField) }),
        ...(totalProjectAreaSqft && { total_project_area_sqft: Number(totalProjectAreaSqft) }),
        property_specs: propertySpecsPayload,
      }),
      ...(vaultType === 'wealth' && investmentMode && { investmentMode: investmentMode as 'lumpsum' | 'unit_config' }),
      ...(unitConfigTargetAmount !== undefined && { targetAmount: unitConfigTargetAmount, minInvestment: undefined }),
      ...(parsedLat !== undefined && !isNaN(parsedLat) && { latitude: parsedLat }),
      ...(parsedLng !== undefined && !isNaN(parsedLng) && { longitude: parsedLng }),
      ...(mapsUrl.trim() && { mapsUrl: mapsUrl.trim() }),
      ...(validUsps.length > 0 && { locationUsps: validUsps }),
      shield_answers: shieldAnswers,
    }

    try {
      setStep('uploading')
      setUploadProgress('Creating opportunity...')
      const opp = await createMutation.mutateAsync(payload)

      if (mediaItems.length > 0) {
        const imageFiles = mediaItems.filter((m) => m.type === 'image').map((m) => m.file)
        const videoFiles = mediaItems.filter((m) => m.type === 'video').map((m) => m.file)
        if (imageFiles.length > 0) {
          setUploadProgress(`Uploading ${imageFiles.length} images...`)
          await uploadMutation.mutateAsync({ opportunityId: opp.id, files: imageFiles, isCover: true })
        }
        if (videoFiles.length > 0) {
          setUploadProgress('Uploading video...')
          await uploadMutation.mutateAsync({ opportunityId: opp.id, files: videoFiles })
        }
      }

      const vaultLabel = VAULT_OPTIONS.find((v) => v.value === vaultType)?.label ?? 'Vault'
      const communityLabel = communitySubtype === 'co_investor' ? 'Co-Investor' : communitySubtype === 'co_partner' ? 'Co-Partner' : ''
      const displayLabel = communityLabel ? `${vaultLabel} (${communityLabel})` : vaultLabel
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Submitted for Approval 🚀',
        message: `Your ${displayLabel} listing is now in our review queue. We'll notify you the moment it gets the green light. ✨`,
      })
      navigate('/portal/builder/listings')
    } catch (err: any) {
      if (err?.response?.status === 422 && err?.response?.data?.detail) {
        const details = err.response.data.detail
        const mappedErrors: Record<string, string> = {}
        const fieldMap: Record<string, string> = {
          'target_amount': 'targetAmount',
          'min_investment': 'minInvestment',
          'funding_open_at': 'fundingOpenAt',
          'closing_date': 'closingDate',
          'target_irr': 'targetIrr',
          'project_phase': 'projectPhase',
        }
        
        details.forEach((d: any) => {
          const field = d.loc[d.loc.length - 1]
          const mappedField = fieldMap[field] || field
          mappedErrors[mappedField] = d.msg
        })

        setFormErrors(prev => ({ ...prev, ...mappedErrors }))
        setSubmitAttempted(true)
        
        const formatFieldName = (key: string) => {
          const result = key.replace(/([A-Z])/g, ' $1')
          return result.charAt(0).toUpperCase() + result.slice(1)
        }
        const fieldNames = Object.keys(mappedErrors).map(formatFieldName).join(', ')
        
        useToastStore.getState().addToast({ type: 'error', title: 'Check your input', message: `The following fields have invalid data: ${fieldNames}` })
        
        setStep('details')
        setDetailsStepIndex(0)
      } else {
        setStep('shield')
        useToastStore.getState().addToast({ type: 'error', title: 'Launch failed', message: 'Something went wrong. Please try again.' })
      }
    }
  }

  const activeVaultPreview = VAULT_OPTIONS.find((v) => v.value === vaultPreview) ?? VAULT_OPTIONS[0]

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (step === 'uploading') {
    return (
      <MainLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-[#080d18] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-14 w-14 text-[#D4AF37] mx-auto animate-spin mb-5" />
            <p className="text-white font-semibold text-lg">{uploadProgress}</p>
            <p className="text-white/50 text-sm mt-2">Hang tight — your opportunity is taking shape...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout showFooter={false}>
      <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
        <SEOHead noIndex />
        {/* Top Navigation Stepper */}
        {step !== 'vault' && step !== 'community-subtype' && (
          <div className="bg-white/95 backdrop-blur-sm border-b border-[rgba(209,196,157,0.3)] px-4 py-3 sticky top-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <button
                onClick={() => setStep('vault')}
                className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[#8B6914] transition-colors text-sm font-medium shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Exit</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-6 flex-1 justify-center">
                {([
                  { id: 'details', label: 'Details', icon: Building2, done: step === 'shield', active: step === 'details' },
                  { id: 'shield', label: 'Shield', icon: ShieldCheck, done: false, active: step === 'shield' },
                  { id: 'submit', label: 'Review', icon: CheckCircle2, done: false, active: false },
                ] as const).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1.5 sm:gap-2">
                    <div className={`flex items-center gap-1.5 sm:gap-2 transition-colors ${s.active ? 'text-[#8B6914]' : s.done ? 'text-[#D4AF37]' : 'text-[var(--text-muted)]'}`}>
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                        s.active ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : s.done ? 'border-[#D4AF37] bg-[#D4AF37] text-white'
                        : 'border-[rgba(209,196,157,0.4)] bg-[rgba(209,196,157,0.08)]'
                      }`}>
                        <s.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold hidden sm:block">{s.label}</span>
                    </div>
                    {i < 2 && <ChevronRight className="h-3.5 w-3.5 text-[rgba(209,196,157,0.5)] mx-0.5 sm:mx-1 shrink-0" />}
                  </div>
                ))}
              </div>

              {/* Sub-step counter */}
              <div className="shrink-0 text-right">
                {step === 'details' && (
                  <span className="text-[11px] font-semibold text-[var(--text-tertiary)] bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] px-2.5 py-1 rounded-full">
                    {detailsStepIndex + 1} / 3
                  </span>
                )}
                {step === 'shield' && (
                  <span className="text-[11px] font-semibold text-[var(--text-tertiary)] bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] px-2.5 py-1 rounded-full">
                    {shieldStepIndex + 1} / {ASSESSMENT_CATEGORIES.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Content */}
      <div className={step === 'vault' ? 'flex-1 flex flex-col lg:overflow-x-hidden' : step === 'details' ? 'w-full' : step === 'shield' ? '' : 'max-w-3xl mx-auto px-4 py-8 space-y-6'}>

        {step === 'vault' && (
          <section className="page-hero-navbar bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 -mt-16 relative overflow-hidden pt-[8.5rem] pb-10 lg:pb-12">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-violet-500/12 blur-3xl" />
            </div>
            <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
              <h1 className="font-hero text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight leading-[1.1]">
                Create Opportunity
              </h1>
              <p className="text-white/55 max-w-xl text-sm leading-relaxed">
                List your new investment class — real estate, fixed-income, or collaborative ventures.
              </p>
            </div>
          </section>
        )}

        {/* ─── Step: Vault Selection ─── */}
        {step === 'vault' && (
          <section className="w-full px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8 lg:pt-10 pb-0 flex items-start justify-center">
            <div className="relative overflow-hidden rounded-[20px] sm:rounded-[26px] border border-[#D4AF37]/35 h-auto min-h-[460px] w-full max-w-5xl mx-auto shrink-0"
              style={{ boxShadow: '0 8px 40px rgba(212,175,55,0.12), 0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(212,175,55,0.15)' }}
            >
              <img
                src="/images/vault-selector-abstract.svg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,13,28,0.74)_0%,rgba(11,19,38,0.62)_45%,rgba(15,24,44,0.32)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(60%_65%_at_84%_16%,rgba(232,182,74,0.24),transparent_74%)]" />
              <div className="absolute -top-12 -right-14 h-44 w-44 rounded-full bg-[#e8b64a]/25 blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-[#20E3B2]/20 blur-3xl" aria-hidden="true" />
              <div className="absolute top-[22%] right-[12%] h-20 w-20 rounded-[22px] border border-white/14 bg-white/[0.04] rotate-12" aria-hidden="true" />
              <div className="absolute bottom-[16%] right-[28%] h-px w-28 bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden="true" />
              <div className="absolute top-[34%] left-[8%] h-px w-24 bg-gradient-to-r from-transparent via-[#20E3B2]/45 to-transparent" aria-hidden="true" />

              <div className="relative h-full p-4 sm:p-5 lg:p-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-4 lg:gap-5 items-center">
                <div className="flex h-full flex-col">
                  <div className="mb-3.5">
                    <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                      Vault Composer
                    </p>
                    <h2 className="mt-2.5 font-hero text-white text-[33px] sm:text-[37px] lg:text-[44px] leading-[1.04] font-bold max-w-[16ch]">
                      Pick your vault.
                    </h2>
                    <p className="mt-2 text-[13px] sm:text-sm text-[#d8e2f1]/90 max-w-[52ch] leading-relaxed">
                      One unified launch frame for all vault types. Choose the path, unlock a tailored questionnaire, and continue with an aligned, high-clarity workflow.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {VAULT_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const comingSoon = !isVaultEnabled(opt.value)
                      return (
                        <button
                          key={opt.value}
                          onClick={() => !comingSoon && handleVaultSelect(opt.value)}
                          onFocus={() => setVaultPreview(opt.value)}
                          aria-disabled={comingSoon}
                          className={`w-full rounded-xl border px-3.5 sm:px-4 py-2.5 transition-all text-left group ${comingSoon ? 'cursor-not-allowed' : ''}`}
                          style={{
                            background: comingSoon ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)',
                            borderColor: comingSoon ? 'rgba(255,255,255,0.14)' : PAGE_ACCENT,
                            boxShadow: comingSoon ? 'none' : '0 10px 20px rgba(5,10,22,0.20)',
                          }}
                          onMouseEnter={(e) => {
                            setVaultPreview(opt.value)
                            if (!comingSoon) {
                              const button = e.currentTarget as HTMLButtonElement
                              button.style.borderColor = opt.accentHover
                              button.style.transform = 'translateY(-1px)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!comingSoon) {
                              const button = e.currentTarget as HTMLButtonElement
                              button.style.borderColor = opt.accentBorder
                              button.style.transform = 'translateY(0px)'
                            }
                          }}
                        >
                          <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3">
                            <div
                              className="h-[42px] w-[42px] rounded-lg flex items-center justify-center shrink-0 border"
                              style={{
                                background: comingSoon ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.14)',
                                borderColor: comingSoon ? 'rgba(255,255,255,0.12)' : PAGE_ACCENT,
                              }}
                            >
                              {comingSoon ? (
                                <Lock className="h-4 w-4 text-white/65" />
                              ) : (
                                <Icon className="h-4.5 w-4.5" style={{ color: PAGE_ACCENT }} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-white text-[14px] sm:text-[15px] leading-tight">{opt.label}</span>
                                {comingSoon && (
                                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200 bg-amber-500/20 border border-amber-300/25 px-2 py-0.5 rounded-full">
                                    Coming Soon
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#d0daea] mt-0.5 truncate sm:whitespace-normal">{opt.sublabel}</p>
                            </div>

                            {!comingSoon ? (
                              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: PAGE_ACCENT }} />
                            ) : (
                              <span className="text-xs text-white/50 font-medium">Locked</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <aside className="hidden lg:flex h-full flex-col justify-between rounded-2xl border border-[#D4AF37]/20 bg-[#07121f]/90 p-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 font-semibold">Selection Guide</p>
                    <h3 className="mt-2 text-white font-hero text-[28px] leading-[1.03] max-w-[12ch]">
                      {activeVaultPreview.label}
                    </h3>
                    <p className="mt-2 text-[12px] text-white/70 leading-relaxed">
                      {activeVaultPreview.sublabel}
                    </p>
                  </div>
                  <div className="space-y-2 text-[12px] text-white/85">
                    <p className="flex items-start gap-2"><span className="text-white/55 w-[66px] shrink-0">Best for</span><span>{activeVaultPreview.bestFor}</span></p>
                    <p className="flex items-start gap-2"><span className="text-white/55 w-[66px] shrink-0">Model</span><span>{activeVaultPreview.ticket}</span></p>
                    <p className="flex items-start gap-2"><span className="text-white/55 w-[66px] shrink-0">Horizon</span><span>{activeVaultPreview.timeline}</span></p>
                  </div>
                    <div className="rounded-xl border border-white/15 bg-black/15 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/60 mb-2">What unlocks next</p>
                      <div className="space-y-1.5 text-[11.5px] text-white">
                        {activeVaultPreview.unlocks.map((item, idx) => (
                          <p key={item} className="flex items-start gap-2 text-white">
                            <span style={{ color: PAGE_ACCENT }} className="font-bold">0{idx + 1}</span>
                            <span className="text-white">{item}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-2.5 py-2 text-[11px] text-[#f2ddb0] text-center">Growth</div>
                    <div className="rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-2.5 py-2 text-[11px] text-[#f2ddb0] text-center">Stability</div>
                    <div className="rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-2.5 py-2 text-[11px] text-[#f2ddb0] text-center">Community</div>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        )}

        {/* ─── Step: Community Subtype ─── */}
        {step === 'community-subtype' && (
          <div className="max-w-2xl mx-auto w-full px-4 py-10 space-y-4">
            <button
              onClick={() => setStep('vault')}
              className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[#8B6914] text-sm font-medium transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to vault selection
            </button>

            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-1">Community Vault Type</h2>
              <p className="text-sm text-[var(--text-secondary)]">Choose how participants engage with this community opportunity.</p>
            </div>

            {COMMUNITY_SUBTYPES.map((st) => {
              const Icon = st.icon
              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => handleCommunitySubtypeSelect(st.value)}
                  className="w-full text-left rounded-2xl border border-[rgba(209,196,157,0.28)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
                >
                  <div className="flex items-start gap-4 p-5">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${st.iconBg} ring-1 ring-white/10`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-bold text-[var(--text-primary)] text-base">{st.label}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${st.badgeColor}`}>{st.badge}</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{st.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {st.highlights.map((h) => (
                          <span key={h} className="text-[11px] text-[var(--text-tertiary)] bg-[rgba(209,196,157,0.15)] border border-[rgba(209,196,157,0.25)] px-2.5 py-0.5 rounded-full">{h}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[rgba(209,196,157,0.5)] group-hover:text-[#D4AF37] transition-colors shrink-0 mt-1" />
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-[#D4AF37]/40 via-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )
            })}
          </div>
        )}

        {/* ─── Step: Details Form ─── */}
        {step === 'details' && (
          <div className="pb-12 max-w-3xl mx-auto w-full px-4 pt-8">
            <div className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] border border-[rgba(209,196,157,0.28)]">

              {/* Header — dark navy + gold accent */}
              <div className="bg-[#0A1A2F] px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                    {detailsStepIndex === 0 && <Building2 className="h-5 w-5 text-[#D4AF37]" />}
                    {detailsStepIndex === 1 && <Wallet className="h-5 w-5 text-[#D4AF37]" />}
                    {detailsStepIndex === 2 && <MapPin className="h-5 w-5 text-[#D4AF37]" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-display text-white">
                      {detailsStepIndex === 0 && 'Company & Basics'}
                      {detailsStepIndex === 1 && 'Property & Financials'}
                      {detailsStepIndex === 2 && 'Location & Media'}
                    </h2>
                    <p className="text-white/50 text-xs mt-0.5 font-medium">
                      {detailsStepIndex === 0 && 'Tell us about the offering'}
                      {detailsStepIndex === 1 && 'Set the investment terms'}
                      {detailsStepIndex === 2 && 'Where is it and what does it look like?'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress dots */}
              <div className="bg-[#071222] px-6 py-2.5 flex items-center gap-2 border-b border-[rgba(212,175,55,0.15)]">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === detailsStepIndex ? 'bg-[#D4AF37]' : i < detailsStepIndex ? 'bg-[#D4AF37]/40' : 'bg-white/10'}`} />
                ))}
              </div>

              <div className="p-6 space-y-5 bg-white">
                {detailsStepIndex === 0 && (
                  <>

            {/* Company */}
            <div className={CARD_CLS}>
              <h3 className={SECTION_HEADING}>Company / Entity</h3>
              <CompanySelector
                value={form.companyId}
                onChange={(id) => handleChange('companyId', id ?? '')}
                onRequestOnboard={() => setShowOnboarding(true)}
                vaultType={vaultType}
                variant="light"
              />
            </div>

            {/* Basic Info */}
            <div className={CARD_CLS}>
              <h3 className={SECTION_HEADING}>Basic Information</h3>
              <div className="space-y-3.5">
                <div>
                  <label className={LABEL_CLS}>Title <span className="text-red-400">*</span></label>
                  <input
                    className={fe('title') ? INPUT_ERR_CLS : INPUT_CLS}
                    value={form.title ?? ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. Premium 2BHK Residences in Banjara Hills"
                  />
                  {fe('title') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.title}</p>}
                </div>
                <div>
                  <label className={LABEL_CLS}>Tagline <span className="text-red-400">*</span></label>
                  <input
                    className={fe('tagline') ? INPUT_ERR_CLS : INPUT_CLS}
                    value={form.tagline ?? ''}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    placeholder="e.g. Verified docs · Fixed 14% returns · 3-year tenure"
                  />
                  {fe('tagline') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.tagline}</p>}
                </div>
                <div>
                  <label className={LABEL_CLS}>Description <span className="text-[var(--text-muted)] text-[10px] font-normal normal-case">(optional)</span></label>
                  <textarea
                    rows={5}
                    className="w-full rounded-xl border border-[rgba(209,196,157,0.5)] bg-white text-[var(--text-primary)] font-body placeholder-[var(--text-muted)] px-3.5 py-2.5 text-sm focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/12 outline-none resize-none transition-colors"
                    value={form.description ?? ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe the investment opportunity in detail..."
                  />
                </div>
              </div>
            </div>

                              </>
                )}
                
                {detailsStepIndex === 1 && (
                  <>
                    {/* ─── Wealth Vault Fields ─── */}
            {vaultType === 'wealth' && (
              <>
                {/* Property Type */}
                <div className={CARD_CLS}>
                  <h3 className={SECTION_HEADING}>Property Type <span className="text-red-400">*</span></h3>
                  {fe('propertyType') && <p className={`${ERR_MSG} mb-3`}><AlertCircle className="h-3 w-3" /> {formErrors.propertyType}</p>}
                  <div className="grid grid-cols-3 gap-3">
                    {PROPERTY_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPropertyType(opt.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                          propertyType === opt.value
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#8B6914]'
                            : 'border-[rgba(209,196,157,0.4)] bg-white text-[var(--text-secondary)] hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className="text-center text-xs leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {propertyType && (
                  <>
                    {/* Project Overview */}
                    <div className={CARD_CLS}>
                      <h3 className={SECTION_HEADING}>Project Overview</h3>
                      <div className="grid grid-cols-2 gap-3.5">
                        {PROPERTY_FIELD_CONFIG[propertyType]?.showPossessionYear && (
                          <div>
                            <label className={LABEL_CLS}>Possession Year <span className="text-red-400">*</span></label>
                            <input
                              type="number"
                              min={POSSESSION_YEAR_MIN}
                              max={POSSESSION_YEAR_MAX}
                              className={fe('possessionYear') ? INPUT_ERR_CLS : INPUT_CLS}
                              value={projectOverview.possessionYear}
                              onChange={(e) => setProjectOverview((p) => ({ ...p, possessionYear: e.target.value }))}
                              placeholder={`e.g. ${POSSESSION_YEAR_MIN}`}
                            />
                            {fe('possessionYear') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.possessionYear}</p>}
                          </div>
                        )}
                        {(PROPERTY_FIELD_CONFIG[propertyType]?.showTotalTowers || PROPERTY_FIELD_CONFIG[propertyType]?.showTotalFloors) && (
                          <div className="col-span-2 grid grid-cols-2 gap-3">
                            {PROPERTY_FIELD_CONFIG[propertyType]?.showTotalTowers && (
                              <div>
                                <label className={LABEL_CLS}>Total Towers <span className="text-[var(--text-muted)] text-[10px] font-normal">(optional)</span></label>
                                <input type="number" min={0} max={100} className={INPUT_CLS} value={projectOverview.totalTowers} onChange={(e) => { const v = e.target.value; if (v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 100)) setProjectOverview((p) => ({ ...p, totalTowers: v })) }} placeholder="0–100" />
                              </div>
                            )}
                            {PROPERTY_FIELD_CONFIG[propertyType]?.showTotalFloors && (
                              <div>
                                <label className={LABEL_CLS}>Total Floors <span className="text-[var(--text-muted)] text-[10px] font-normal">(optional)</span></label>
                                <input type="number" min={0} max={100} className={INPUT_CLS} value={projectOverview.totalFloors} onChange={(e) => { const v = e.target.value; if (v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 100)) setProjectOverview((p) => ({ ...p, totalFloors: v })) }} placeholder="0–100" />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="col-span-2">
                          <label className={LABEL_CLS}>Land Parcel (decimal allowed) <span className="text-red-400">*</span></label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={0}
                              className={`flex-1 ${fe('landParcelSqft') ? INPUT_ERR_CLS : INPUT_CLS}`}
                              value={landParcelRawValue}
                              onChange={(e) => {
                                setLandParcelRawValue(e.target.value)
                                const factor = LAND_UNITS.find((u) => u.value === landParcelUnit)?.factor ?? 1
                                const sqft = Number(e.target.value) * factor
                                setProjectOverview((p) => ({ ...p, landParcelSqft: sqft > 0 ? String(sqft) : '' }))
                              }}
                              placeholder="Enter value"
                            />
                            <select
                              className="rounded-lg border border-[#c9d0ce] bg-[#f8faf9] text-[#2f4a4a] px-3 py-2.5 text-sm outline-none"
                              value={landParcelUnit}
                              onChange={(e) => {
                                const newUnit = e.target.value as LandUnit
                                setLandParcelUnit(newUnit)
                                if (landParcelRawValue) {
                                  const factor = LAND_UNITS.find((u) => u.value === newUnit)?.factor ?? 1
                                  const sqft = Number(landParcelRawValue) * factor
                                  setProjectOverview((p) => ({ ...p, landParcelSqft: sqft > 0 ? String(sqft) : '' }))
                                }
                              }}
                            >
                              {LAND_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                            </select>
                          </div>
                          {projectOverview.landParcelSqft && Number(projectOverview.landParcelSqft) > 0 && (
                            <p className="text-[#6f8181] text-xs mt-1">
                              {sqftConversions(Number(projectOverview.landParcelSqft)).sqft} sqft · {sqftConversions(Number(projectOverview.landParcelSqft)).sqyd} sqyd · {sqftConversions(Number(projectOverview.landParcelSqft)).guntha} guntha
                            </p>
                          )}
                          {fe('landParcelSqft') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.landParcelSqft}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Investment Mode */}
                    <div className={CARD_CLS}>
                      <h3 className={SECTION_HEADING}>Investment Configuration <span className="text-red-400">*</span></h3>
                      {fe('investmentMode') && <p className={`${ERR_MSG} mb-3`}><AlertCircle className="h-3 w-3" /> {formErrors.investmentMode}</p>}
                      <div className="grid grid-cols-2 gap-4">
                        {([
                          { value: 'lumpsum', label: 'Lumpsum', desc: 'Single investment target · Minimum ticket size', icon: '💰' },
                          { value: 'unit_config', label: 'Unit Config', desc: 'Per unit pricing · Auto-computes total', icon: '🏠' },
                        ] as const).map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setInvestmentMode(m.value)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${investmentMode === m.value ? 'border-[#D4AF37] bg-[#D4AF37]/8' : 'border-[rgba(209,196,157,0.4)] bg-white hover:border-[#D4AF37]/50'}`}
                          >
                            <div className="text-2xl mb-2">{m.icon}</div>
                            <div className={`font-semibold text-sm ${investmentMode === m.value ? 'text-[#8B6914]' : 'text-[var(--text-primary)]'}`}>{m.label}</div>
                            <div className="text-[var(--text-tertiary)] text-xs mt-0.5">{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price & Area — only shown for lumpsum mode */}
                    {investmentMode === 'lumpsum' && (
                    <div className={CARD_CLS}>
                      <h3 className={SECTION_HEADING}>Pricing</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLS}>Total Construction Area (Sq.Ft) <span className="text-red-400">*</span></label>
                          <input type="number" min={0} className={fe('totalProjectArea') ? INPUT_ERR_CLS : INPUT_CLS} value={totalProjectAreaSqft} onChange={(e) => setTotalProjectAreaSqft(e.target.value)} placeholder="e.g. 250000" />
                          {fe('totalProjectArea') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.totalProjectArea}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>₹ / Sq.Ft <span className="text-red-400">*</span></label>
                          <input type="number" min={0} className={fe('pricePerSqft') ? INPUT_ERR_CLS : INPUT_CLS} value={pricePerSqftField} onChange={(e) => setPricePerSqftField(e.target.value)} placeholder="e.g. 6500" />
                          {fe('pricePerSqft') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.pricePerSqft}</p>}
                        </div>
                        {/* Total project cost — auto calculated, read-only */}
                        {pricePerSqftField && totalProjectAreaSqft && (() => {
                          const computed = Number(pricePerSqftField) * Number(totalProjectAreaSqft)
                          if (computed <= 0) return null
                          const crore = computed / 1e7
                          const lakh = computed / 1e5
                          const display = crore >= 1 ? `₹${crore.toFixed(2)} Cr` : `₹${lakh.toFixed(2)} L`
                          return (
                            <div className="col-span-2">
                              <label className={LABEL_CLS}>Total Project Cost <span className="text-[var(--text-muted)] text-[10px]">(auto-calculated)</span></label>
                              <div className="w-full rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/6 px-3.5 py-2.5 text-sm font-bold text-[#8B6914] flex items-center justify-between">
                                <span>{display}</span>
                                <span className="text-[11px] font-normal text-[var(--text-tertiary)]">Total Area × ₹/Sqft</span>
                              </div>
                            </div>
                          )
                        })()}
                        <div>
                          <label className={LABEL_CLS}>Target Investment Amount (₹) <span className="text-red-400">*</span></label>
                          <input type="number" min={0} className={fe('targetAmount') ? INPUT_ERR_CLS : INPUT_CLS} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} placeholder="Auto-computed or override" />
                          {fe('targetAmount') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.targetAmount}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Min Investment (₹) <span className="text-red-400">*</span></label>
                          <input type="number" min={0} className={fe('minInvestment') ? INPUT_ERR_CLS : INPUT_CLS} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} placeholder="e.g. 500000" />
                          {fe('minInvestment') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.minInvestment}</p>}
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Unit Configs */}
                    {(investmentMode === 'unit_config') && PROPERTY_FIELD_CONFIG[propertyType]?.showUnitConfig && (
                      <div className={CARD_CLS}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={SECTION_HEADING.replace('mb-4', '')}>{PROPERTY_FIELD_CONFIG[propertyType]?.unitConfigLabel}</h3>
                          <button type="button" onClick={() => setUnitConfigs((p) => [...p, { ...DEFAULT_UNIT_CONFIG, id: String(Date.now()) }])} className="text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg">+ Add Config</button>
                        </div>
                        {fe('unitConfig') && <p className={`${ERR_MSG} mb-3`}><AlertCircle className="h-3 w-3" /> {formErrors.unitConfig}</p>}
                        <div className="space-y-3">
                          {unitConfigs.map((row, idx) => {
                            const sbu = parseFloat(row.superBuiltUpSqft) || 0
                            const price = parseFloat(row.pricePerSqft) || 0
                            const unitCost = sbu > 0 && price > 0 ? sbu * price : null
                            const unitCostDisplay = unitCost ? (unitCost >= 1e7 ? `₹${(unitCost / 1e7).toFixed(2)} Cr` : `₹${(unitCost / 1e5).toFixed(2)} L`) : '—'
                            return (
                              <div key={row.id} className="relative grid grid-cols-4 gap-2 p-3 rounded-xl bg-[rgba(209,196,157,0.06)] border border-[rgba(209,196,157,0.3)]">
                                <div>
                                  <p className="text-[var(--text-tertiary)] text-[10px] mb-1 font-semibold">Type</p>
                                  <select className={SELECT_CLS} value={row.bhkType} onChange={(e) => setUnitConfigs((p) => p.map((r, i) => i === idx ? { ...r, bhkType: e.target.value } : r))}>
                                    <option value="">Select…</option>
                                    {getBhkTypes(propertyType).map((t) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <p className="text-[var(--text-tertiary)] text-[10px] mb-1 font-semibold">SBU (Sqft) <span className="text-red-400">*</span></p>
                                  <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    className={INPUT_CLS}
                                    value={row.superBuiltUpSqft}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      if (v === '' || (Number.isInteger(Number(v)) && Number(v) > 0))
                                        setUnitConfigs((p) => p.map((r, i) => i === idx ? { ...r, superBuiltUpSqft: v } : r))
                                    }}
                                    placeholder="e.g. 1150"
                                  />
                                </div>
                                <div>
                                  <p className="text-[var(--text-tertiary)] text-[10px] mb-1 font-semibold">₹/Sqft <span className="text-red-400">*</span></p>
                                  <input
                                    type="number"
                                    min={1}
                                    className={INPUT_CLS}
                                    value={row.pricePerSqft}
                                    onChange={(e) => setUnitConfigs((p) => p.map((r, i) => i === idx ? { ...r, pricePerSqft: e.target.value } : r))}
                                    placeholder="e.g. 7000"
                                  />
                                </div>
                                <div>
                                  <p className="text-[var(--text-tertiary)] text-[10px] mb-1 font-semibold">Unit Cost</p>
                                  <div className={`rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/6 px-3 py-2.5 text-sm font-bold text-[#8B6914] text-center ${!unitCost ? 'text-[var(--text-muted)]' : ''}`}>
                                    {unitCostDisplay}
                                  </div>
                                </div>
                                {unitConfigs.length > 1 && (
                                  <button type="button" onClick={() => setUnitConfigs((p) => p.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-900/60 text-red-400 text-xs font-bold hover:bg-red-800/60">×</button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Funding Schedule */}
                    {!!investmentMode && (
                      <div className={CARD_CLS}>
                        <h3 className={SECTION_HEADING}>📅 Funding Schedule</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={LABEL_CLS}>Funding Opens <span className="text-red-400">*</span></label>
                            <input type="date" className={fe('fundingOpenAt') ? INPUT_ERR_CLS : INPUT_CLS} value={form.fundingOpenAt ? form.fundingOpenAt.slice(0, 10) : ''} onChange={(e) => handleChange('fundingOpenAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
                            {fe('fundingOpenAt') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.fundingOpenAt}</p>}
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Funding Deadline <span className="text-[#8a9a9a] text-xs">(optional)</span></label>
                            <input type="date" className={INPUT_CLS} value={form.closingDate ? form.closingDate.slice(0, 10) : ''} onChange={(e) => handleChange('closingDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
                          </div>
                        </div>
                      </div>
                    )}

                  </>
                )}
              </>
            )}

            {/* ─── Safe Vault Fields ─── */}
            {vaultType === 'safe' && (
              <>
                {/* Property type selector */}
                <div className={CARD_CLS}>
                  <h3 className={SECTION_HEADING}>Property Type <span className="text-red-400">*</span></h3>
                  {fe('propertyType') && <p className={`${ERR_MSG} mb-3`}><AlertCircle className="h-3 w-3" /> {formErrors.propertyType}</p>}
                  <div className="grid grid-cols-3 gap-3">
                    {PROPERTY_TYPE_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setPropertyType(opt.value)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-xs font-medium ${propertyType === opt.value ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#8B6914]' : 'border-[rgba(209,196,157,0.4)] bg-white text-[var(--text-secondary)] hover:border-[#D4AF37]/50'}`}>
                        <span className="text-2xl">{opt.icon}</span>
                        <span className="text-center leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Safe vault specific: interest rate, tenure, etc. */}
                <div className={CARD_CLS}>
                  <h3 className={SECTION_HEADING}>Investment Terms</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Interest Rate (% p.a.) <span className="text-red-400">*</span></label>
                      <input type="number" min={0} step={0.01} className={fe('interestRate') ? INPUT_ERR_CLS : INPUT_CLS} value={(safeVaultData.interest_rate as number) || ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, interest_rate: Number(e.target.value) }))} placeholder="e.g. 14" />
                      {fe('interestRate') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.interestRate}</p>}
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Payout Frequency</label>
                      <select className={SELECT_CLS} value={safeVaultData.payout_frequency as string} onChange={(e) => setSafeVaultData((p) => ({ ...p, payout_frequency: e.target.value }))}>
                        {['monthly', 'quarterly', 'half_yearly', 'yearly', 'on_maturity'].map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Tenure (months) <span className="text-red-400">*</span></label>
                      <input type="number" min={1} className={fe('tenureMonths') ? INPUT_ERR_CLS : INPUT_CLS} value={(safeVaultData.tenure_months as number) ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, tenure_months: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 36" />
                      {fe('tenureMonths') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.tenureMonths}</p>}
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Target Amount (₹) <span className="text-red-400">*</span></label>
                      <input type="number" min={0} className={fe('targetAmount') ? INPUT_ERR_CLS : INPUT_CLS} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} placeholder="e.g. 50000000" />
                      {fe('targetAmount') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.targetAmount}</p>}
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Min Investment (₹) <span className="text-red-400">*</span></label>
                      <input type="number" min={0} className={fe('minInvestment') ? INPUT_ERR_CLS : INPUT_CLS} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} placeholder="e.g. 500000" />
                      {fe('minInvestment') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.minInvestment}</p>}
                    </div>
                  </div>
                </div>
                {/* Safe toggles */}
                {[
                  { key: 'mortgage_agreement', label: 'Mortgage Agreement' },
                  { key: 'buyback_guarantee', label: 'Buyback Guarantee' },
                  { key: 'land_registration', label: 'Land Registration' },
                ].map(({ key, label }) => {
                  const obj = safeVaultData[key] as { enabled: boolean; details?: string; period_description?: string }
                  return (
                    <div key={key} className={CARD_CLS}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-[#2f4a4a] font-medium text-sm">{label}</h4>
                        <button
                          type="button"
                          onClick={() => setSafeVaultData((p) => ({ ...p, [key]: { ...obj, enabled: !obj.enabled } }))}
                          className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${obj.enabled ? 'bg-[#D4AF37]' : 'bg-[rgba(209,196,157,0.35)]'}`}
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${obj.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      {obj.enabled && (
                        <div className="mt-3">
                          {(
                            <textarea rows={2} className="w-full rounded-lg border border-[#c9d0ce] bg-[#f8faf9] text-[#2f4a4a] placeholder-[#768588] px-3 py-2.5 text-sm outline-none resize-none" value={obj.details ?? ''} onChange={(e) => setSafeVaultData((p) => ({ ...p, [key]: { ...obj, details: e.target.value } }))} placeholder="Details…" />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Capital protection + collateral */}
                <div className={CARD_CLS}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[#2f4a4a] font-medium text-sm">Capital Protection</h4>
                    <button type="button" onClick={() => setSafeVaultData((p) => ({ ...p, capital_protection: !p.capital_protection }))} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${safeVaultData.capital_protection ? 'bg-[#D4AF37]' : 'bg-[rgba(209,196,157,0.35)]'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${safeVaultData.capital_protection ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Collateral Details</label>
                    <textarea rows={2} className="w-full rounded-lg border border-[#c9d0ce] bg-[#f8faf9] text-[#2f4a4a] placeholder-[#768588] px-3 py-2.5 text-sm outline-none resize-none" value={safeVaultData.collateral_details as string} onChange={(e) => setSafeVaultData((p) => ({ ...p, collateral_details: e.target.value }))} placeholder="Describe collateral backing…" />
                  </div>
                </div>
              </>
            )}

            {/* ─── Community Vault Fields ─── */}
            {vaultType === 'community' && (
              <div className={CARD_CLS}>
                <h3 className={SECTION_HEADING}>Community Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className={LABEL_CLS}>Community Type <span className="text-red-400">*</span></label>
                    <select className={fe('communityType') ? SELECT_ERR_CLS : SELECT_CLS} value={form.communityType ?? ''} onChange={(e) => handleChange('communityType', e.target.value)}>
                      <option value="">Select…</option>
                      {COMMUNITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {fe('communityType') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.communityType}</p>}
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Collaboration Type <span className="text-red-400">*</span></label>
                    <select className={fe('collaborationType') ? SELECT_ERR_CLS : SELECT_CLS} value={form.collaborationType ?? ''} onChange={(e) => handleChange('collaborationType', e.target.value)}>
                      <option value="">Select…</option>
                      {COLLABORATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {fe('collaborationType') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.collaborationType}</p>}
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Target Amount (₹) <span className="text-red-400">*</span></label>
                    <input type="number" min={0} className={fe('targetAmount') ? INPUT_ERR_CLS : INPUT_CLS} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} placeholder="e.g. 10000000" />
                    {fe('targetAmount') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.targetAmount}</p>}
                  </div>

                  {/* Co-Investor specifics */}
                  {communitySubtype === 'co_investor' && (
                    <>
                      <div>
                        <label className={LABEL_CLS}>Min Investment (₹) <span className="text-red-400">*</span></label>
                        <input type="number" min={0} className={fe('minInvestment') ? INPUT_ERR_CLS : INPUT_CLS} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} placeholder="e.g. 100000" />
                        {fe('minInvestment') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.minInvestment}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLS}>Investment Tenure <span className="text-red-400">*</span></label>
                          <select className={fe('investmentTenure') ? SELECT_ERR_CLS : SELECT_CLS} value={(communityDetails.investmentTenure as string) ?? ''} onChange={(e) => handleCommunityDetailChange('investmentTenure', e.target.value)}>
                            <option value="">Select…</option>
                            {INVESTMENT_TENURES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {fe('investmentTenure') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.investmentTenure}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Revenue Model <span className="text-red-400">*</span></label>
                          <select className={fe('revenueModel') ? SELECT_ERR_CLS : SELECT_CLS} value={(communityDetails.revenueModel as string) ?? ''} onChange={(e) => handleCommunityDetailChange('revenueModel', e.target.value)}>
                            <option value="">Select…</option>
                            {REVENUE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          {fe('revenueModel') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.revenueModel}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Legal Structure <span className="text-red-400">*</span></label>
                          <select className={fe('legalStructure') ? SELECT_ERR_CLS : SELECT_CLS} value={(communityDetails.legalStructure as string) ?? ''} onChange={(e) => handleCommunityDetailChange('legalStructure', e.target.value)}>
                            <option value="">Select…</option>
                            {LEGAL_STRUCTURES.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                          {fe('legalStructure') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.legalStructure}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Risk Level <span className="text-red-400">*</span></label>
                          <select className={fe('riskLevel') ? SELECT_ERR_CLS : SELECT_CLS} value={(communityDetails.riskLevel as string) ?? ''} onChange={(e) => handleCommunityDetailChange('riskLevel', e.target.value)}>
                            <option value="">Select…</option>
                            {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          {fe('riskLevel') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.riskLevel}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Projected Timeline <span className="text-red-400">*</span></label>
                          <select className={fe('projectedTimeline') ? SELECT_ERR_CLS : SELECT_CLS} value={(communityDetails.projectedTimeline as string) ?? ''} onChange={(e) => handleCommunityDetailChange('projectedTimeline', e.target.value)}>
                            <option value="">Select…</option>
                            {TIMELINE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {fe('projectedTimeline') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.projectedTimeline}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Exit Strategy <span className="text-[#8a9a9a] text-xs">(optional)</span></label>
                          <input className={INPUT_CLS} value={(communityDetails.exitStrategy as string) ?? ''} onChange={(e) => handleCommunityDetailChange('exitStrategy', e.target.value)} placeholder="e.g. IPO, buyback, resale..." />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Co-Partner specifics */}
                  {communitySubtype === 'co_partner' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLS}>Equity Share (%) <span className="text-red-400">*</span></label>
                          <input type="number" min={0} max={100} className={fe('equityShare') ? INPUT_ERR_CLS : INPUT_CLS} value={(communityDetails.equityShare as string) ?? ''} onChange={(e) => handleCommunityDetailChange('equityShare', e.target.value)} placeholder="e.g. 25" />
                          {fe('equityShare') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.equityShare}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Time Commitment <span className="text-red-400">*</span></label>
                          <select className={fe('timeCommitment') ? SELECT_ERR_CLS : SELECT_CLS} value={(communityDetails.timeCommitment as string) ?? ''} onChange={(e) => handleCommunityDetailChange('timeCommitment', e.target.value)}>
                            <option value="">Select…</option>
                            {TIME_COMMITMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {fe('timeCommitment') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.timeCommitment}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Partnership Duration <span className="text-red-400">*</span></label>
                          <select className={fe('partnershipDuration') ? SELECT_ERR_CLS : SELECT_CLS} value={(communityDetails.partnershipDuration as string) ?? ''} onChange={(e) => handleCommunityDetailChange('partnershipDuration', e.target.value)}>
                            <option value="">Select…</option>
                            {PARTNERSHIP_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                          {fe('partnershipDuration') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.partnershipDuration}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Decision Authority <span className="text-red-400">*</span></label>
                          <select className={fe('decisionAuthority') ? SELECT_ERR_CLS : SELECT_CLS} value={(communityDetails.decisionAuthority as string) ?? ''} onChange={(e) => handleCommunityDetailChange('decisionAuthority', e.target.value)}>
                            <option value="">Select…</option>
                            {DECISION_AUTHORITIES.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                          {fe('decisionAuthority') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.decisionAuthority}</p>}
                        </div>
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Partner Role <span className="text-red-400">*</span></label>
                        <input className={fe('partnerRole') ? INPUT_ERR_CLS : INPUT_CLS} value={(communityDetails.partnerRole as string) ?? ''} onChange={(e) => handleCommunityDetailChange('partnerRole', e.target.value)} placeholder="e.g. Operations Lead" />
                        {fe('partnerRole') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.partnerRole}</p>}
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Key Responsibilities <span className="text-red-400">*</span></label>
                        <textarea rows={3} className={`${fe('keyResponsibilities') ? 'border-red-500/60' : 'border-[#c9d0ce]'} w-full rounded-lg border bg-[#f8faf9] text-[#2f4a4a] placeholder-[#768588] px-3 py-2.5 text-sm outline-none resize-none`} value={(communityDetails.keyResponsibilities as string) ?? ''} onChange={(e) => handleCommunityDetailChange('keyResponsibilities', e.target.value)} placeholder="Describe key responsibilities..." />
                        {fe('keyResponsibilities') && <p className={ERR_MSG}><AlertCircle className="h-3 w-3" /> {formErrors.keyResponsibilities}</p>}
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Partner Benefits <span className="text-[#8a9a9a] text-xs">(optional)</span></label>
                        <textarea rows={2} className="w-full rounded-lg border border-[#c9d0ce] bg-[#f8faf9] text-[#2f4a4a] placeholder-[#768588] px-3 py-2.5 text-sm outline-none resize-none" value={(communityDetails.partnerBenefits as string) ?? ''} onChange={(e) => handleCommunityDetailChange('partnerBenefits', e.target.value)} placeholder="What does the partner gain?" />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Required Skills <span className="text-red-400">*</span></label>
                        {fe('requiredSkills') && <p className={`${ERR_MSG} mb-2`}><AlertCircle className="h-3 w-3" /> {formErrors.requiredSkills}</p>}
                        <div className="flex flex-wrap gap-2">
                          {PARTNER_SKILLS.map((skill) => {
                            const selected = ((communityDetails.requiredSkills as string[]) ?? []).includes(skill)
                            return (
                              <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${selected ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#8B6914]' : 'border-[rgba(209,196,157,0.4)] text-[var(--text-secondary)] hover:border-[#D4AF37]/50'}`}>
                                {skill}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

                              </>
                )}
                
                {detailsStepIndex === 2 && (
                  <>
                    {/* Location */}
            <div className={CARD_CLS}>
              <h3 className={SECTION_HEADING}>Location</h3>
              <AddressDialog
                value={address}
                onChange={setAddress}
              />
              <div className="mt-4">
                <label className={LABEL_CLS}>City</label>
                <select className={SELECT_CLS} value={address.city} onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}>
                  <option value="">Select city…</option>
                  {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Google Maps Location */}
            <div className={CARD_CLS}>
              <h3 className={SECTION_HEADING}>Map Location <span className="text-[var(--text-muted)] text-[10px] font-normal normal-case">(optional)</span></h3>
              <p className="text-[var(--text-tertiary)] text-xs mb-4 leading-relaxed">
                Paste a Google Maps share link, or enter coordinates directly. To get your link: open Google Maps → find the property → tap Share → Copy link.
              </p>
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLS}>Google Maps Link</label>
                  <input
                    type="url"
                    className={INPUT_CLS}
                    value={mapsUrl}
                    onChange={(e) => {
                      const url = e.target.value
                      setMapsUrl(url)
                      // Auto-extract coordinates from standard Google Maps URLs
                      const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/) || url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
                      if (match && match[1] && match[2]) {
                        setMapsLatitude(match[1])
                        setMapsLongitude(match[2])
                      }
                    }}
                    placeholder="https://maps.google.com/... or https://goo.gl/maps/..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className={INPUT_CLS}
                      value={mapsLatitude}
                      onChange={(e) => setMapsLatitude(e.target.value)}
                      placeholder="e.g. 12.9716"
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className={INPUT_CLS}
                      value={mapsLongitude}
                      onChange={(e) => setMapsLongitude(e.target.value)}
                      placeholder="e.g. 77.5946"
                    />
                  </div>
                </div>
                {mapsLatitude && mapsLongitude && (
                  <a
                    href={`https://www.google.com/maps?q=${mapsLatitude},${mapsLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#8B6914] hover:text-[#D4AF37] transition-colors font-medium"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Verify on Google Maps ↗
                  </a>
                )}
              </div>
            </div>

            {/* Location USPs */}
            <div className={CARD_CLS}>
              <h3 className={SECTION_HEADING}>Location USPs <span className="text-[var(--text-muted)] text-[10px] font-normal normal-case">(optional)</span></h3>
              <p className="text-[var(--text-tertiary)] text-xs mb-4">Highlight what makes this location premium — nearby infrastructure, amenities, connectivity.</p>
              <div className="space-y-2">
                {locationUsps.map((usp, idx) => (
                  <div key={usp.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      className={`${INPUT_CLS} flex-1`}
                      value={usp.text}
                      onChange={(e) => setLocationUsps((p) => p.map((u, i) => i === idx ? { ...u, text: e.target.value } : u))}
                      placeholder={`e.g. 500m from Phoenix Mall`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (usp.text.trim()) setLocationUsps((p) => [...p, { id: String(Date.now()), text: '', category: 'other' }])
                        }
                      }}
                    />
                    <select
                      className="rounded-xl border border-[rgba(209,196,157,0.5)] bg-white text-[var(--text-primary)] px-2.5 py-2.5 text-xs outline-none appearance-none shrink-0"
                      value={usp.category}
                      onChange={(e) => setLocationUsps((p) => p.map((u, i) => i === idx ? { ...u, category: e.target.value } : u))}
                    >
                      {USP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {usp.text.trim() && (
                      <button
                        type="button"
                        onClick={() => setLocationUsps((p) => [...p, { id: String(Date.now()), text: '', category: 'other' }])}
                        className="h-9 w-9 flex items-center justify-center rounded-xl border border-[#D4AF37]/40 text-[#8B6914] hover:bg-[#D4AF37]/10 transition-colors text-lg font-bold shrink-0"
                        title="Add another USP"
                      >+</button>
                    )}
                    {locationUsps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLocationUsps((p) => p.filter((_, i) => i !== idx))}
                        className="h-9 w-9 flex items-center justify-center rounded-xl border border-red-300/40 text-red-400 hover:bg-red-50 transition-colors text-sm shrink-0"
                        title="Remove"
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Media */}
            <div className={CARD_CLS}>
              <h3 className={SECTION_HEADING}>Media</h3>
              <MediaUploadZone images={mediaItems} onChange={setMediaItems} />
            </div>

                  </>
                )}
              </div>

              {/* Bottom nav */}
              <div className="bg-[#fdfcf8] border-t border-[rgba(209,196,157,0.3)] px-6 py-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDetailsBack}
                  className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[#8B6914] text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-[rgba(212,175,55,0.08)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleDetailsNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#0A1A2F] text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#0d2240] hover:border-[#D4AF37]/60 transition-all shadow-sm hover:shadow-md"
                >
                  {detailsStepIndex < 2 ? 'Continue' : 'Proceed to Shield'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step: Shield ─── */}
        {step === 'shield' && (
          <div className="pb-12 max-w-4xl mx-auto w-full px-4 pt-8">
            <div className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[rgba(209,196,157,0.28)] mb-6">
              {/* Shield header — dark navy + gold */}
              <div className="bg-[#0A1A2F] px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-display text-white">WealthSpot Shield</h2>
                    <p className="text-white/50 text-xs mt-0.5 font-medium">7-Layer Trust & Due Diligence Framework</p>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-3 py-1.5 rounded-full">
                  {shieldStepIndex + 1} / {ASSESSMENT_CATEGORIES.length}
                </div>
              </div>
              {/* Progress bar */}
              <div className="bg-[#071222] px-6 py-2.5 flex items-center gap-1.5 border-b border-[rgba(212,175,55,0.15)]">
                {ASSESSMENT_CATEGORIES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === shieldStepIndex ? 'bg-[#D4AF37]' : i < shieldStepIndex ? 'bg-[#D4AF37]/40' : 'bg-white/10'}`}
                  />
                ))}
              </div>
            </div>

            {(() => {
              const cat = ASSESSMENT_CATEGORIES[shieldStepIndex]!
              const meta = SHIELD_META[cat.code]!
              const filledCount = cat.subItems.filter((sub) => {
                if (sub.requiresDocument) return true
                const val = shieldAnswers[sub.code]?.value
                return val && String(val).trim() !== ''
              }).length
              const total = cat.subItems.length
              const allFilled = filledCount === total
              const hasError = shieldStepAttempted && !allFilled

              return (
                <div className={CARD_CLS + " mb-6"}>
                  <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-[rgba(209,196,157,0.3)]">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{ backgroundColor: meta.accentHex + '1a', borderColor: meta.accentHex + '35' }}
                        >
                          {getCatIcon(cat.icon, 'h-6 w-6')}
                        </div>
                        <div>
                          <h3 className="font-hero text-[var(--text-primary)] font-bold text-xl">{cat.name}</h3>
                          <p className="text-sm font-semibold" style={{ color: meta.accentHex }}>{meta.tagline}</p>
                        </div>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">{cat.fullDescription}</p>
                      <ul className="space-y-2">
                        {meta.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                            <span
                              className="mt-1 h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 text-[8px] font-black"
                              style={{ backgroundColor: meta.accentHex + '28', color: meta.accentHex }}
                            >✓</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {hasError && (
                    <div className="mb-5 rounded-xl border border-red-500/40 bg-red-50 p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-600 text-sm font-semibold">Please answer all required questions below</p>
                        <p className="text-red-500/80 text-xs mt-0.5">We need this information to proceed to the next step.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-5">
                    {cat.subItems.map((sub) => {
                      const answer = shieldAnswers[sub.code]
                      const val = answer?.value ?? ''
                      const files = answer?.files ?? []
                      const isEmpty = !sub.requiresDocument && (!val || String(val).trim() === '')
                      const showErr = shieldStepAttempted && isEmpty

                      const setVal = (v: string) => {
                        setShieldAnswers((prev) => ({
                          ...prev,
                          [sub.code]: {
                            categoryCode: cat.code,
                            subcategoryCode: sub.code,
                            value: v,
                            files: prev[sub.code]?.files ?? [],
                            isPublic: prev[sub.code]?.isPublic ?? true,
                          },
                        }))
                      }
                      const setFiles = (f: File[]) => {
                        setShieldAnswers((prev) => ({
                          ...prev,
                          [sub.code]: {
                            categoryCode: cat.code,
                            subcategoryCode: sub.code,
                            value: prev[sub.code]?.value ?? '',
                            files: f,
                            isPublic: prev[sub.code]?.isPublic ?? true,
                          },
                        }))
                      }

                      return (
                        <div key={sub.code} className={`p-4 rounded-xl border transition-colors ${showErr ? 'border-red-300 bg-red-50/50' : 'border-[rgba(209,196,157,0.3)] bg-white hover:border-[rgba(212,175,55,0.4)]'}`}>
                          <label className={`block text-sm font-semibold mb-1 ${showErr ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>
                            {sub.label}
                            {!sub.requiresDocument && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <p className="text-[var(--text-tertiary)] text-[11px] mb-3 leading-relaxed">{sub.promptForBuilder}</p>

                          {sub.inputType === 'select' ? (
                            <select
                              className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white text-[#2f4a4a] outline-none appearance-none ${showErr ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-[#c9d0ce] focus:border-[#2f4a4a]/45 focus:ring-1 focus:ring-[#2f4a4a]/20'}`}
                              value={val}
                              onChange={(e) => setVal(e.target.value)}
                            >
                              <option value="">— Select —</option>
                              {sub.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : sub.inputType === 'boolean' ? (
                            <div className="flex items-center gap-6 text-sm mt-1">
                              {['yes', 'no'].map((v) => (
                                <label key={v} className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name={`shield-${sub.code}`} value={v} checked={val === v} onChange={() => setVal(v)} className="sr-only" />
                                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${val === v ? 'border-transparent' : 'border-[rgba(209,196,157,0.5)]'}`} style={val === v ? { backgroundColor: '#D4AF37', borderColor: '#D4AF37' } : {}}>
                                    {val === v && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className="text-[var(--text-secondary)] capitalize group-hover:text-[#8B6914] transition-colors">{v}</span>
                                </label>
                              ))}
                            </div>
                          ) : sub.inputType === 'number' ? (
                            <input
                              type="number"
                              className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white text-[#2f4a4a] outline-none ${showErr ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-[#c9d0ce] focus:border-[#2f4a4a]/45 focus:ring-1 focus:ring-[#2f4a4a]/20'}`}
                              value={val}
                              onChange={(e) => setVal(e.target.value)}
                              placeholder="Enter a number"
                            />
                          ) : (
                            <textarea
                              rows={3}
                              className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white text-[#2f4a4a] placeholder-[#768588] outline-none resize-none ${showErr ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-[#c9d0ce] focus:border-[#2f4a4a]/45 focus:ring-1 focus:ring-[#2f4a4a]/20'}`}
                              value={val}
                              onChange={(e) => setVal(e.target.value)}
                              placeholder="Your answer…"
                            />
                          )}

                          {sub.requiresDocument && (
                            <div className="mt-3 flex items-center gap-2">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors text-[#8B6914] border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)]">
                                <span>📎 Attach evidence</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  multiple
                                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                                />
                              </label>
                              {files.length > 0 && <span className="text-xs text-[var(--text-tertiary)] font-semibold">{files.length} file(s) queued</span>}
                            </div>
                          )}

                          {showErr && (
                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                              <AlertCircle className="h-3.5 w-3.5" /> This field is required
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div className="bg-white border border-[rgba(209,196,157,0.28)] rounded-2xl px-6 py-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.05)] mt-2">
              <button
                type="button"
                onClick={handleShieldBack}
                className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[#8B6914] text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-[rgba(212,175,55,0.08)]"
              >
                <ArrowLeft className="h-4 w-4" />
                {shieldStepIndex === 0 ? 'Back to Details' : 'Previous'}
              </button>
              <button
                type="button"
                onClick={handleShieldNext}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#0A1A2F] text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#0d2240] hover:border-[#D4AF37]/60 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {shieldStepIndex === ASSESSMENT_CATEGORIES.length - 1 ? (
                  createMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" /> Submit for Approval</>
                  )
                ) : (
                  <>Continue <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>

        )}

      </div>

        {/* Company onboarding popup */}
        <CompanyOnboardingModal
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          vaultType={vaultType}
          onSuccess={(companyId) => {
            handleChange('companyId', companyId)
            setShowOnboarding(false)
          }}
        />
      </div>
    </MainLayout>
  )
}
