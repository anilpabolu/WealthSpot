import { useState, useEffect } from 'react'
import { Select, Input, Textarea } from '@/components/ui'
import {
  X, Building2, Users, Loader2, Lock, Wallet, Handshake, ArrowLeft, ShieldCheck,
  Waves, Dumbbell, Footprints, Bike, Target, Wind, CircleDot, Crosshair,
  Star, Gamepad2, Heart, Sparkles, Flower2, Trees, Music, Film, PartyPopper, Flag, PawPrint,
  Camera, Phone, Shield, Monitor, Flame, KeyRound, TriangleAlert, UserCheck,
  Zap, ArrowUp, Car, ParkingSquare, BatteryCharging, Sun, Droplets, Wifi, Shirt, Bell, Package,
  Home, ScanEye,
  Building2 as Building2Icon, Layout, BookOpen, Briefcase, Sprout,
  Cross, Baby, HeartPulse, Pill, Stethoscope,
  Recycle, Lightbulb, Leaf, Award,
  ShoppingCart, CreditCard, Coffee, Utensils, Scissors,
  Train, Bus, GraduationCap, Plane, Route, Store,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { useCreateOpportunity, useOpportunityFormOptions, type OpportunityCreatePayload } from '@/hooks/useOpportunities'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone from './MediaUploadZone'
import AddressDialog, { type AddressFields } from './AddressDialog'
import CompanySelector from './CompanySelector'
import CompanyOnboardingModal from './CompanyOnboardingModal'
import { type CommunitySubtypeValue } from './CommunitySubtypeModal'
import { useToastStore } from '@/stores/toastStore'
import { AMENITIES, AMENITY_CATEGORIES, PropertyType } from '@wealthspot/types'
import type { AmenityCategory } from '@wealthspot/types'

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

/* ── Property spec constants ──────────────────────────────────────── */
const PROPERTY_TYPE_OPTIONS = [
  { value: PropertyType.FLAT, label: 'Flat / Apartment', icon: '🏢' },
  { value: PropertyType.VILLA, label: 'Villa / Row House', icon: '🏡' },
  { value: PropertyType.PLOT, label: 'Plot / Land', icon: '🏞️' },
  { value: PropertyType.COMMERCIAL, label: 'Commercial', icon: '🏪' },
  { value: PropertyType.WAREHOUSE, label: 'Warehouse', icon: '🏭' },
  { value: PropertyType.MIXED_USE, label: 'Mixed Use', icon: '🏙️' },
]

// BHK type options per property type
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

// Which spec fields to show per property type
interface PropertyFieldConfig {
  showPossessionQuarter: boolean
  showRera: boolean
  showTotalTowers: boolean
  showTotalFloors: boolean
  showUnitConfig: boolean
  showPlotConfig: boolean
  unitConfigLabel: string
}
const PROPERTY_FIELD_CONFIG: Record<string, PropertyFieldConfig> = {
  [PropertyType.FLAT]:       { showPossessionQuarter: true,  showRera: true,  showTotalTowers: true,  showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'BHK / Unit Configurations' },
  [PropertyType.VILLA]:      { showPossessionQuarter: true,  showRera: true,  showTotalTowers: false, showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'Villa / Row House Configurations' },
  [PropertyType.PLOT]:       { showPossessionQuarter: false, showRera: false, showTotalTowers: false, showTotalFloors: false, showUnitConfig: false, showPlotConfig: true,  unitConfigLabel: '' },
  [PropertyType.COMMERCIAL]: { showPossessionQuarter: true,  showRera: true,  showTotalTowers: true,  showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'Unit Configurations' },
  [PropertyType.WAREHOUSE]:  { showPossessionQuarter: true,  showRera: false, showTotalTowers: false, showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'Bay / Unit Configurations' },
  [PropertyType.MIXED_USE]:  { showPossessionQuarter: true,  showRera: true,  showTotalTowers: true,  showTotalFloors: true,  showUnitConfig: true,  showPlotConfig: false, unitConfigLabel: 'Unit Configurations' },
}

// Amenity categories allowed per property type
const PROPERTY_AMENITY_CATEGORIES: Record<string, AmenityCategory[]> = {
  [PropertyType.FLAT]:       ['lifestyle', 'security', 'convenience', 'community', 'healthcare', 'green', 'retail', 'connectivity'],
  [PropertyType.VILLA]:      ['lifestyle', 'security', 'convenience', 'community', 'healthcare', 'green', 'retail', 'connectivity'],
  [PropertyType.PLOT]:       ['security', 'green', 'connectivity'],
  [PropertyType.COMMERCIAL]: ['security', 'convenience', 'community', 'retail', 'connectivity'],
  [PropertyType.WAREHOUSE]:  ['security', 'convenience', 'connectivity'],
  [PropertyType.MIXED_USE]:  ['lifestyle', 'security', 'convenience', 'community', 'healthcare', 'green', 'retail', 'connectivity'],
}

// Amenity keys to exclude for specific property types (granular overrides)
const AMENITY_EXCLUDE_BY_TYPE: Record<string, string[]> = {
  [PropertyType.COMMERCIAL]: ['kids_play_area', 'kids_pool', 'pet_park', 'yoga_deck', 'servant_quarters', 'senior_citizen_zone', 'creche_daycare'],
  [PropertyType.WAREHOUSE]:  ['kids_play_area', 'kids_pool', 'pet_park', 'yoga_deck', 'servant_quarters', 'high_speed_lifts', 'concierge'],
  [PropertyType.VILLA]:      ['high_speed_lifts'],
  [PropertyType.PLOT]:       [],
}

// Static icon map — maps amenity icon names to Lucide components
const AMENITY_ICON_MAP: Record<string, LucideIcon> = {
  Waves, Dumbbell, Footprints, Bike, Target, Wind, CircleDot, Crosshair,
  Star, Gamepad2, Heart, Sparkles, Flower2, Trees, Music, Film, PartyPopper, Flag, PawPrint,
  Camera, Phone, Shield, Monitor, Flame, KeyRound, TriangleAlert, UserCheck,
  Zap, ArrowUp, Car, ParkingSquare, BatteryCharging, Sun, Droplets, Wifi, Shirt, Bell, Package,
  Home, ScanEye, AlertCircle,
  Layout, BookOpen, Briefcase, Sprout,
  Cross, Baby, HeartPulse, Pill, Stethoscope,
  Recycle, Lightbulb, Leaf, Award,
  ShoppingCart, CreditCard, Coffee, Utensils, Scissors,
  Train, Bus, GraduationCap, Plane, Route, Store,
  // aliased names used in amenities.ts
  Lock,
  Building2: Building2Icon,
  Activity: AlertCircle,
}
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
interface PlotConfigRow {
  id: string; plotType: string; areaSqft: string; totalPlots: string; pricePerSqft: string
}
interface ProjectOverview {
  totalTowers: string; totalFloors: string; possessionQuarter: string; reraNumber: string; landParcelSqft: string
}

const DEFAULT_UNIT_CONFIG: UnitConfigRow = { id: '1', bhkType: '', carpetAreaSqft: '', superBuiltUpSqft: '', bathrooms: '', balconies: '', totalUnits: '', pricePerSqft: '' }
const DEFAULT_PLOT_CONFIG: PlotConfigRow = { id: '1', plotType: '', areaSqft: '', totalPlots: '', pricePerSqft: '' }
const DEFAULT_PROJECT_OVERVIEW: ProjectOverview = { totalTowers: '', totalFloors: '', possessionQuarter: '', reraNumber: '', landParcelSqft: '' }

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
  const [step, setStep] = useState<'vault' | 'community-subtype' | 'form' | 'uploading'>('vault')
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
  // ── Property specs state ────────────────────────────────────────────────
  const [propertyType, setPropertyType] = useState<string>('')
  const [unitConfigs, setUnitConfigs] = useState<UnitConfigRow[]>([{ ...DEFAULT_UNIT_CONFIG }])
  const [plotConfigs, setPlotConfigs] = useState<PlotConfigRow[]>([{ ...DEFAULT_PLOT_CONFIG }])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [pricePerSqftField, setPricePerSqftField] = useState<string>('')
  const [totalProjectAreaSqft, setTotalProjectAreaSqft] = useState<string>('')
  const [projectOverview, setProjectOverview] = useState<ProjectOverview>({ ...DEFAULT_PROJECT_OVERVIEW })
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [investmentMode, setInvestmentMode] = useState<'lumpsum' | 'unit_config' | ''>('')
  const [landParcelUnit, setLandParcelUnit] = useState<LandUnit>('sqft')
  const [landParcelRawValue, setLandParcelRawValue] = useState<string>('')
  const createMutation = useCreateOpportunity()
  const uploadMutation = useUploadOpportunityMedia()
  const { isVaultEnabled } = useVaultConfig()
  const { data: oppFormOptions } = useOpportunityFormOptions()

  // Reset amenities and unit/plot configs when property type changes
  useEffect(() => {
    setSelectedAmenities([])
    setUnitConfigs([{ ...DEFAULT_UNIT_CONFIG }])
    setPlotConfigs([{ ...DEFAULT_PLOT_CONFIG }])
    setProjectOverview({ ...DEFAULT_PROJECT_OVERVIEW })
    setInvestmentMode('')
    setLandParcelUnit('sqft')
    setLandParcelRawValue('')
  }, [propertyType])

  // Auto-compute lumpsum target from price/sqft × total area
  useEffect(() => {
    if (investmentMode === 'lumpsum' && pricePerSqftField && totalProjectAreaSqft) {
      const computed = Number(pricePerSqftField) * Number(totalProjectAreaSqft)
      if (computed > 0) setForm((prev) => ({ ...prev, targetAmount: computed }))
    }
  }, [pricePerSqftField, totalProjectAreaSqft, investmentMode])

  if (!open) return null

  // Helper: returns true when submitAttempted and that field has an error
  const fe = (key: string) => submitAttempted && !!formErrors[key]

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

  const handleChange = (field: keyof OpportunityCreatePayload, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!form.title?.trim()) errors.title = 'Required'
    if (!form.tagline?.trim()) errors.tagline = 'Required'
    if (!form.description?.trim()) errors.description = 'Required'

    if (vaultType === 'wealth' || vaultType === 'safe') {
      if (!propertyType) errors.propertyType = 'Required'
      if (!pricePerSqftField) errors.pricePerSqft = 'Required'
      if (!totalProjectAreaSqft) errors.totalProjectArea = 'Required'

      if (propertyType) {
        const fc = PROPERTY_FIELD_CONFIG[propertyType]
        if (fc) {
          if (fc.showPossessionQuarter && !projectOverview.possessionQuarter) errors.possessionQuarter = 'Required'
          if (fc.showTotalFloors && !projectOverview.totalFloors) errors.totalFloors = 'Required'
          if (!projectOverview.landParcelSqft) errors.landParcelSqft = 'Required'

          // Unit/plot config validation only applies when configs are shown
          const showConfigs = vaultType === 'safe' || investmentMode === 'unit_config'
          if (showConfigs) {
            if (fc.showUnitConfig) {
              const hasValidUnit = unitConfigs.some((u) => u.bhkType && u.carpetAreaSqft && u.totalUnits)
              if (!hasValidUnit) errors.unitConfig = 'At least one complete unit config required'
              // In unit_config mode each row also needs a price
              if (investmentMode === 'unit_config') {
                const hasPrice = unitConfigs.some((u) => u.bhkType && u.carpetAreaSqft && u.totalUnits && u.pricePerSqft)
                if (!hasPrice) errors.unitConfig = 'At least one complete unit config with ₹/sqft pricing required'
              }
            }
            if (fc.showPlotConfig) {
              const hasValidPlot = plotConfigs.some((p) => p.plotType && p.areaSqft && p.totalPlots)
              if (!hasValidPlot) errors.plotConfig = 'At least one complete plot config required'
              if (investmentMode === 'unit_config') {
                const hasPrice = plotConfigs.some((p) => p.plotType && p.areaSqft && p.totalPlots && p.pricePerSqft)
                if (!hasPrice) errors.plotConfig = 'At least one complete plot config with ₹/sqft pricing required'
              }
            }
          }

          const allowedCats = PROPERTY_AMENITY_CATEGORIES[propertyType] ?? []
          const excludeKeys = AMENITY_EXCLUDE_BY_TYPE[propertyType] ?? []
          const availableAmenities = AMENITIES.filter(
            (a) => allowedCats.includes(a.category) && !excludeKeys.includes(a.key)
          )
          if (availableAmenities.length > 0 && selectedAmenities.length === 0) {
            errors.amenities = 'Select at least one amenity'
          }
        }
      }

      if (!form.fundingOpenAt) errors.fundingOpenAt = 'Required'

      if (vaultType === 'wealth') {
        if (!investmentMode) {
          errors.investmentMode = 'Select an investment configuration mode'
        } else if (investmentMode === 'lumpsum') {
          if (!form.targetAmount) errors.targetAmount = 'Required'
          if (!form.minInvestment) errors.minInvestment = 'Required'
        }
        // unit_config: target is auto-computed; no min required
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    const errors = validateForm()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Required fields missing',
        message: 'Please fill all required information before submitting.',
      })
      return
    }

    // Build property specs
    let propertySpecsPayload: Record<string, unknown> | undefined
    if (propertyType) {
      const base: Record<string, unknown> = {
        property_type: propertyType,
        ...(projectOverview.reraNumber && { rera_registration_number: projectOverview.reraNumber }),
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

    // Merge address into form
    const payload: OpportunityCreatePayload = {
      ...form,
      ...address,
      ...(communitySubtype && {
        communitySubtype,
        communityDetails: communityDetails as Record<string, unknown>,
      }),
      ...(vaultType === 'safe' && { safeVaultData }),
      ...(propertyType && {
        property_type: propertyType,
        ...(pricePerSqftField && { price_per_sqft: Number(pricePerSqftField) }),
        ...(totalProjectAreaSqft && { total_project_area_sqft: Number(totalProjectAreaSqft) }),
        property_specs: propertySpecsPayload,
        ...(selectedAmenities.length > 0 && { property_amenities: selectedAmenities }),
      }),
      // Investment mode
      ...(vaultType === 'wealth' && investmentMode && { investmentMode: investmentMode as 'lumpsum' | 'unit_config' }),
      // For unit_config: override target with computed value, clear minInvestment
      ...(unitConfigTargetAmount !== undefined && { targetAmount: unitConfigTargetAmount, minInvestment: undefined }),
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

      const vaultLabel = VAULT_OPTIONS.find((v) => v.value === vaultType)?.label ?? 'Vault'
      const communityLabel = communitySubtype === 'co_investor' ? 'Co-Investor' : communitySubtype === 'co_partner' ? 'Co-Partner' : ''
      const displayLabel = communityLabel ? `${vaultLabel} (${communityLabel})` : vaultLabel
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Submitted for Approval 🚀',
        message: `Your ${displayLabel} listing is now in our review queue. We'll carefully evaluate every detail and notify you the moment it gets the green light. ✨`,
      })
      handleClose()
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
    setPropertyType('')
    setUnitConfigs([{ ...DEFAULT_UNIT_CONFIG }])
    setPlotConfigs([{ ...DEFAULT_PLOT_CONFIG }])
    setSelectedAmenities([])
    setPricePerSqftField('')
    setTotalProjectAreaSqft('')
    setProjectOverview({ ...DEFAULT_PROJECT_OVERVIEW })
    setSubmitAttempted(false)
    setFormErrors({})
    setInvestmentMode('')
    setLandParcelUnit('sqft')
    setLandParcelRawValue('')
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
              <Input
                label="Title *"
                required
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Give your opportunity a compelling title"
                errorText={fe('title') ? 'Title is required' : undefined}
              />
              <Input
                label="Tagline *"
                value={form.tagline ?? ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="A short catchy line — make it irresistible"
                errorText={fe('tagline') ? 'Tagline is required' : undefined}
              />
              <div className="relative">
                <Textarea
                  label="Description *"
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Tell the story — what makes this opportunity a no-brainer?"
                />
                {fe('description') && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Description is required
                  </p>
                )}
              </div>

              {/* === Wealth Vault Fields === */}
              {vaultType === 'wealth' && (
                <>
                  {/* Address dialog with pincode auto-fill */}
                  <AddressDialog value={address} onChange={setAddress} />
                  {/* Target / min inputs rendered inside the property specs section, mode-dependent */}
                </>
              )}

              {/* === Safe Vault Fields === */}
              {vaultType === 'safe' && (
                <>
                  {/* Returns configuration */}
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Target Amount (₹) *"
                      type="number"
                      min={0}
                      value={form.targetAmount ?? ''}
                      onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                      prefix="₹"
                      errorText={fe('targetAmount') ? 'Required' : undefined}
                    />
                    <Input
                      label="Min Investment (₹) *"
                      type="number"
                      min={0}
                      value={form.minInvestment ?? ''}
                      onChange={(e) => handleChange('minInvestment', Number(e.target.value))}
                      prefix="₹"
                      errorText={fe('minInvestment') ? 'Required' : undefined}
                    />
                    <Input
                      label="Interest Rate (% p.a.) *"
                      type="number"
                      step="0.1"
                      min={0}
                      value={(safeVaultData.interest_rate as number) ?? ''}
                      onChange={(e) => setSafeVaultData((p) => ({ ...p, interest_rate: Number(e.target.value) }))}
                      suffix="%"
                      errorText={fe('interestRate') ? 'Required' : undefined}
                    />
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
                    <Input
                      label="Tenure (months) *"
                      type="number"
                      min={1}
                      value={(safeVaultData.tenure_months as number) ?? ''}
                      onChange={(e) => setSafeVaultData((p) => ({ ...p, tenure_months: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="e.g. 24"
                      suffix=" mo."
                      errorText={fe('tenureMonths') ? 'Required' : undefined}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">City</label>
                      <Select value={form.city ?? ''} onChange={(v) => handleChange('city', v)} placeholder="Select city" options={INDIAN_CITIES.map((c) => ({ value: c, label: c }))} searchable />
                    </div>
                    <Input
                      label="State"
                      value={form.state ?? ''}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="e.g. Maharashtra"
                    />
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
                          <Input
                            value={(safeVaultData.mortgage_agreement as { details: string }).details ?? ''}
                            onChange={(e) => setSafeVaultData((p) => ({ ...p, mortgage_agreement: { ...(p.mortgage_agreement as object), details: e.target.value } }))}
                            placeholder="Property details"
                          />
                          <Input
                            value={(safeVaultData.mortgage_agreement as { period_description: string }).period_description ?? ''}
                            onChange={(e) => setSafeVaultData((p) => ({ ...p, mortgage_agreement: { ...(p.mortgage_agreement as object), period_description: e.target.value } }))}
                            placeholder="Period (e.g. 24 months)"
                          />
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
                        <Input
                          className="ml-6 w-[calc(100%-1.5rem)]"
                          value={(safeVaultData.rera_registration as { rera_number: string }).rera_number ?? ''}
                          onChange={(e) => setSafeVaultData((p) => ({ ...p, rera_registration: { ...(p.rera_registration as object), rera_number: e.target.value } }))}
                          placeholder="RERA number"
                        />
                      )}
                    </div>

                    {/* Buyback Guarantee */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={(safeVaultData.buyback_guarantee as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, buyback_guarantee: { ...(p.buyback_guarantee as object), enabled: e.target.checked } }))} className="rounded" />
                        <span className="text-sm text-theme-primary">Buyback Guarantee</span>
                      </label>
                      {(safeVaultData.buyback_guarantee as { enabled: boolean }).enabled && (
                        <Input
                          className="ml-6 w-[calc(100%-1.5rem)]"
                          value={(safeVaultData.buyback_guarantee as { details: string }).details ?? ''}
                          onChange={(e) => setSafeVaultData((p) => ({ ...p, buyback_guarantee: { ...(p.buyback_guarantee as object), details: e.target.value } }))}
                          placeholder="Buyback terms"
                        />
                      )}
                    </div>

                    {/* Capital Protection */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={safeVaultData.capital_protection as boolean} onChange={(e) => setSafeVaultData((p) => ({ ...p, capital_protection: e.target.checked }))} className="rounded" />
                      <span className="text-sm text-theme-primary">Capital Protection</span>
                    </label>

                    {/* Collateral Details */}
                    <Input
                      label="Collateral Details (optional)"
                      value={(safeVaultData.collateral_details as string) ?? ''}
                      onChange={(e) => setSafeVaultData((p) => ({ ...p, collateral_details: e.target.value }))}
                      placeholder="Describe collateral assets"
                    />

                    {/* Land Registration */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={(safeVaultData.land_registration as { enabled: boolean }).enabled} onChange={(e) => setSafeVaultData((p) => ({ ...p, land_registration: { ...(p.land_registration as object), enabled: e.target.checked } }))} className="rounded" />
                        <span className="text-sm text-theme-primary">Land Registration</span>
                      </label>
                      {(safeVaultData.land_registration as { enabled: boolean }).enabled && (
                        <Input
                          className="ml-6 w-[calc(100%-1.5rem)]"
                          value={(safeVaultData.land_registration as { details: string }).details ?? ''}
                          onChange={(e) => setSafeVaultData((p) => ({ ...p, land_registration: { ...(p.land_registration as object), details: e.target.value } }))}
                          placeholder="Registration details"
                        />
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
                        options={(oppFormOptions?.community_type.length ? oppFormOptions.community_type : COMMUNITY_TYPES.map((t) => ({ value: t, label: t, id: t, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                      />
                      {fe('communityType') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Collaboration *</label>
                      <Select
                        value={form.collaborationType ?? ''}
                        onChange={(v) => handleChange('collaborationType', v)}
                        placeholder="Select collaboration"
                        options={(oppFormOptions?.collaboration_type.length ? oppFormOptions.collaboration_type : COLLABORATION_TYPES.map((t) => ({ value: t, label: t, id: t, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                      />
                      {fe('collaborationType') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                      )}
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
                        <Input
                          label="Target Amount (₹) *"
                          type="number"
                          required
                          min={0}
                          value={form.targetAmount ?? ''}
                          onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                          placeholder="Total capital needed"
                          prefix="₹"
                          errorText={fe('targetAmount') ? 'Required' : undefined}
                        />
                        <Input
                          label="Min Investment per Co-Investor (₹) *"
                          type="number"
                          required
                          min={0}
                          value={form.minInvestment ?? ''}
                          onChange={(e) => handleChange('minInvestment', Number(e.target.value))}
                          prefix="₹"
                          errorText={fe('minInvestment') ? 'Required' : undefined}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          label="Max Co-Investors"
                          type="number"
                          min={1}
                          value={(communityDetails.maxInvestors as number) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('maxInvestors', Number(e.target.value))}
                        />
                        <Input
                          label="Expected Returns (%)"
                          type="number"
                          step="0.1"
                          min={0}
                          value={(communityDetails.expectedReturns as number) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('expectedReturns', Number(e.target.value))}
                          suffix="%"
                        />
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Investment Tenure *</label>
                          <Select
                            value={(communityDetails.investmentTenure as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('investmentTenure', v)}
                            placeholder="Select"
                            options={(oppFormOptions?.investment_tenure.length ? oppFormOptions.investment_tenure : INVESTMENT_TENURES.map((t) => ({ value: t, label: t, id: t, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                          />
                          {fe('investmentTenure') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Revenue Model *</label>
                          <Select
                            value={(communityDetails.revenueModel as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('revenueModel', v)}
                            placeholder="Select"
                            options={(oppFormOptions?.revenue_model.length ? oppFormOptions.revenue_model : REVENUE_MODELS.map((m) => ({ value: m, label: m, id: m, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                          />
                          {fe('revenueModel') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Legal Structure *</label>
                          <Select
                            value={(communityDetails.legalStructure as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('legalStructure', v)}
                            placeholder="Select"
                            options={(oppFormOptions?.legal_structure.length ? oppFormOptions.legal_structure : LEGAL_STRUCTURES.map((l) => ({ value: l, label: l, id: l, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                          />
                          {fe('legalStructure') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Risk Level *</label>
                          <Select
                            value={(communityDetails.riskLevel as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('riskLevel', v)}
                            placeholder="Select"
                            options={(oppFormOptions?.risk_level.length ? oppFormOptions.risk_level : RISK_LEVELS.map((r) => ({ value: r, label: r, id: r, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                          />
                          {fe('riskLevel') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Projected Timeline *</label>
                          <Select
                            value={(communityDetails.projectedTimeline as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('projectedTimeline', v)}
                            placeholder="Select"
                            options={(oppFormOptions?.projected_timeline.length ? oppFormOptions.projected_timeline : TIMELINE_OPTIONS.map((t) => ({ value: t, label: t, id: t, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                          />
                          {fe('projectedTimeline') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                          )}
                        </div>
                      </div>
                      <Textarea
                        label="Exit Strategy"
                        rows={2}
                        value={(communityDetails.exitStrategy as string) ?? ''}
                        onChange={(e) => handleCommunityDetailChange('exitStrategy', e.target.value)}
                        placeholder="How and when can investors exit? (e.g., buyback, secondary sale)"
                      />
                    </>
                  )}

                  {/* === Co-Partner specific fields === */}
                  {communitySubtype === 'co_partner' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Total Project Cost (₹) *"
                          type="number"
                          required
                          min={0}
                          value={form.targetAmount ?? ''}
                          onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                          prefix="₹"
                          errorText={fe('targetAmount') ? 'Required' : undefined}
                        />
                        <Input
                          label="Capital from Partner (₹)"
                          type="number"
                          min={0}
                          value={(communityDetails.capitalFromPartner as number) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('capitalFromPartner', Number(e.target.value))}
                          placeholder="Can be ₹0 if skill-only"
                          prefix="₹"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          label="Equity / Profit Share (%) *"
                          type="number"
                          required
                          step="0.1"
                          min={0}
                          max={100}
                          value={(communityDetails.equityShare as number) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('equityShare', Number(e.target.value))}
                          suffix="%"
                          errorText={fe('equityShare') ? 'Required' : undefined}
                        />
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Time Commitment *</label>
                          <Select
                            value={(communityDetails.timeCommitment as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('timeCommitment', v)}
                            placeholder="Select"
                            options={(oppFormOptions?.time_commitment.length ? oppFormOptions.time_commitment : TIME_COMMITMENTS.map((t) => ({ value: t, label: t, id: t, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                          />
                          {fe('timeCommitment') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Partnership Duration *</label>
                          <Select
                            value={(communityDetails.partnershipDuration as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('partnershipDuration', v)}
                            placeholder="Select"
                            options={(oppFormOptions?.partnership_duration.length ? oppFormOptions.partnership_duration : PARTNERSHIP_DURATIONS.map((d) => ({ value: d, label: d, id: d, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                          />
                          {fe('partnershipDuration') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                          )}
                        </div>
                      </div>

                      {/* Required skills multi-select */}
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">Required Skills *</label>
                        {fe('requiredSkills') && (
                          <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Select at least one skill</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {(oppFormOptions?.partner_skill.length ? oppFormOptions.partner_skill.map((o) => o.label) : PARTNER_SKILLS).map((skill) => {
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
                        <Input
                          label="Partner Role / Title *"
                          required
                          value={(communityDetails.partnerRole as string) ?? ''}
                          onChange={(e) => handleCommunityDetailChange('partnerRole', e.target.value)}
                          placeholder="e.g. Co-Founder, Operations Head"
                          errorText={fe('partnerRole') ? 'Required' : undefined}
                        />
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">Decision Making Authority *</label>
                          <Select
                            value={(communityDetails.decisionAuthority as string) ?? ''}
                            onChange={(v) => handleCommunityDetailChange('decisionAuthority', v)}
                            placeholder="Select"
                            options={(oppFormOptions?.decision_authority.length ? oppFormOptions.decision_authority : DECISION_AUTHORITIES.map((d) => ({ value: d, label: d, id: d, fieldName: '', isActive: true, sortOrder: 0 }))).map((o) => ({ value: o.value, label: o.label }))}
                          />
                          {fe('decisionAuthority') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Required</p>
                          )}
                        </div>
                      </div>
                      <Textarea
                        label="Key Responsibilities *"
                        required
                        rows={2}
                        value={(communityDetails.keyResponsibilities as string) ?? ''}
                        onChange={(e) => handleCommunityDetailChange('keyResponsibilities', e.target.value)}
                        placeholder="What will the partner be responsible for day-to-day?"
                        errorText={fe('keyResponsibilities') ? 'Required' : undefined}
                      />
                      <Textarea
                        label="What the Partner Gets"
                        rows={2}
                        value={(communityDetails.partnerBenefits as string) ?? ''}
                        onChange={(e) => handleCommunityDetailChange('partnerBenefits', e.target.value)}
                        placeholder="e.g. 20% equity, monthly stipend, co-branding rights"
                      />
                    </>
                  )}
                </>
              )}

              {/* === Property Specs (Wealth & Safe) === */}
              {(vaultType === 'wealth' || vaultType === 'safe') && (
                <>
                  {/* Property Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <div className={`grid grid-cols-3 gap-2 rounded-xl ${fe('propertyType') ? 'ring-2 ring-red-400 p-1' : ''}`}>
                      {PROPERTY_TYPE_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setPropertyType(propertyType === opt.value ? '' : opt.value)}
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
                    {fe('propertyType') && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Property type is required
                      </p>
                    )}
                  </div>

                  {/* 🏗️ Project Overview — visible as soon as property type is set */}
                  {propertyType && (() => {
                    const fc = (PROPERTY_FIELD_CONFIG[propertyType] ?? PROPERTY_FIELD_CONFIG[PropertyType.FLAT])!
                    return (
                      <div className="rounded-xl border border-theme p-4 space-y-4">
                        <h4 className="text-sm font-semibold text-theme-primary flex items-center gap-2">
                          🏗️ Project Overview
                        </h4>

                        {/* Possession Quarter + RERA */}
                        <div className={`grid gap-4 ${(fc.showPossessionQuarter && fc.showRera) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {fc.showPossessionQuarter && (
                            <div>
                              <label className="block text-sm font-medium text-theme-primary mb-1">
                                Possession Quarter <span className="text-red-500">*</span>
                              </label>
                              <Select
                                value={projectOverview.possessionQuarter}
                                onChange={(v) => setProjectOverview((p) => ({ ...p, possessionQuarter: v }))}
                                placeholder="Select quarter"
                                options={POSSESSION_QUARTERS.map((q) => ({ value: q, label: q }))}
                              />
                              {fe('possessionQuarter') && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Required
                                </p>
                              )}
                            </div>
                          )}
                          {fc.showRera && (
                            <Input
                              label="RERA Number (Optional)"
                              value={projectOverview.reraNumber}
                              onChange={(e) => setProjectOverview((p) => ({ ...p, reraNumber: e.target.value }))}
                              placeholder="e.g. MH/12345"
                            />
                          )}
                        </div>

                        {/* Towers + Floors */}
                        {(fc.showTotalTowers || fc.showTotalFloors) && (
                          <div className={`grid gap-4 ${fc.showTotalTowers ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {fc.showTotalTowers && (
                              <Input
                                label="Total Towers"
                                type="number"
                                min={1}
                                value={projectOverview.totalTowers}
                                onChange={(e) => setProjectOverview((p) => ({ ...p, totalTowers: e.target.value }))}
                                placeholder="e.g. 4"
                              />
                            )}
                            {fc.showTotalFloors && (
                              <Input
                                label="Total Floors *"
                                type="number"
                                min={1}
                                value={projectOverview.totalFloors}
                                onChange={(e) => setProjectOverview((p) => ({ ...p, totalFloors: e.target.value }))}
                                placeholder="e.g. 18"
                                errorText={fe('totalFloors') ? 'Required' : undefined}
                              />
                            )}
                          </div>
                        )}

                        {/* Land Parcel with unit dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">
                            Land Parcel <span className="text-red-500">*</span>
                          </label>
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
                              className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-[var(--bg-surface)] ${fe('landParcelSqft') ? 'border-red-400' : 'border-theme'}`}
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
                            <p className="text-[11px] text-theme-tertiary mt-1">
                              ≈ {Number(projectOverview.landParcelSqft).toLocaleString('en-IN')} sq.ft
                            </p>
                          )}
                          {fe('landParcelSqft') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Required
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Investment Mode selector — Wealth Vault only, shown after property type chosen */}
                  {vaultType === 'wealth' && propertyType && (
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
                      {fe('investmentMode') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Select an investment configuration mode
                        </p>
                      )}
                    </div>
                  )}

                  {/* 💰 Investment Details — visible once investmentMode (or safe vault) */}
                  {propertyType && (vaultType === 'safe' || !!investmentMode) && (() => {
                    const fc = (PROPERTY_FIELD_CONFIG[propertyType] ?? PROPERTY_FIELD_CONFIG[PropertyType.FLAT])!
                    return (
                      <div className="rounded-xl border border-theme p-4 space-y-4">
                        <h4 className="text-sm font-semibold text-theme-primary">💰 Investment Details</h4>

                        {/* Price per sqft + total area */}
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Price per Sq.Ft (₹) *"
                            type="number"
                            min={0}
                            value={pricePerSqftField}
                            onChange={(e) => setPricePerSqftField(e.target.value)}
                            placeholder="e.g. 8500"
                            prefix="₹"
                            errorText={fe('pricePerSqft') ? 'Required' : undefined}
                          />
                          <Input
                            label="Total Project Area (Sq.Ft) *"
                            type="number"
                            min={0}
                            value={totalProjectAreaSqft}
                            onChange={(e) => setTotalProjectAreaSqft(e.target.value)}
                            placeholder="e.g. 120000"
                            errorText={fe('totalProjectArea') ? 'Required' : undefined}
                          />
                        </div>

                        {/* Lumpsum: computed cost banner + editable target + min */}
                        {vaultType === 'wealth' && investmentMode === 'lumpsum' && (() => {
                          const computed = pricePerSqftField && totalProjectAreaSqft
                            ? Number(pricePerSqftField) * Number(totalProjectAreaSqft)
                            : 0
                          const crore = computed / 1e7
                          const lakh = computed / 1e5
                          const display = computed > 0
                            ? crore >= 1 ? `₹${crore.toFixed(2)} Cr` : `₹${lakh.toFixed(2)} L`
                            : null
                          return (
                            <>
                              {display && (
                                <div className="px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                                  <div>
                                    <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Estimated Project Cost</p>
                                    <p className="text-xs text-theme-secondary">Price/sqft × Total area</p>
                                  </div>
                                  <div className="text-lg font-bold text-primary">{display}</div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <Input
                                  label="Target Amount (₹) *"
                                  type="number"
                                  min={0}
                                  value={form.targetAmount ?? ''}
                                  onChange={(e) => handleChange('targetAmount', Number(e.target.value))}
                                  prefix="₹"
                                  errorText={fe('targetAmount') ? 'Required' : undefined}
                                />
                                <Input
                                  label="Min Investment per Investor (₹) *"
                                  type="number"
                                  min={0}
                                  value={form.minInvestment ?? ''}
                                  onChange={(e) => handleChange('minInvestment', Number(e.target.value))}
                                  prefix="₹"
                                  errorText={fe('minInvestment') ? 'Required' : undefined}
                                />
                              </div>
                            </>
                          )
                        })()}

                        {/* Unit Configurations — shown for Safe vault always, or Wealth in unit_config mode */}
                        {fc.showUnitConfig && (vaultType === 'safe' || investmentMode === 'unit_config') && (
                          <div>
                            <div className={`flex items-center justify-between mb-2 ${fe('unitConfig') ? 'ring-1 ring-red-400 rounded-lg p-2' : ''}`}>
                              <label className="text-sm font-medium text-theme-primary">
                                {fc.unitConfigLabel} <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setUnitConfigs((p) => [...p, { id: String(Date.now()), bhkType: '', carpetAreaSqft: '', superBuiltUpSqft: '', bathrooms: '', balconies: '', totalUnits: '', pricePerSqft: '' }])}
                                className="text-xs text-primary hover:underline"
                              >
                                + Add Config
                              </button>
                            </div>
                            {fe('unitConfig') && (
                              <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {investmentMode === 'unit_config'
                                  ? 'At least one complete config with ₹/sqft pricing required'
                                  : 'At least one complete config required (type, carpet area and units)'}
                              </p>
                            )}
                            <div className="space-y-2">
                              {unitConfigs.map((row, idx) => (
                                <div key={row.id} className={`grid ${investmentMode === 'unit_config' ? 'grid-cols-8' : 'grid-cols-7'} gap-1.5 items-end p-2.5 bg-theme-surface-hover rounded-lg relative`}>
                                  <div className="col-span-2">
                                    <p className="text-[10px] text-theme-tertiary mb-1">Type</p>
                                    <Select
                                      value={row.bhkType}
                                      onChange={(v) => setUnitConfigs((p) => p.map((r, i) => (i === idx ? { ...r, bhkType: v } : r)))}
                                      placeholder="Select type"
                                      options={getBhkTypes(propertyType).map((t) => ({ value: t, label: t }))}
                                    />
                                  </div>
                                  {(['carpetAreaSqft', 'superBuiltUpSqft', 'bathrooms', 'balconies', 'totalUnits'] as const).map((field, fi) => (
                                    <div key={field}>
                                      <p className="text-[10px] text-theme-tertiary mb-1">
                                        {['Carpet sqft', 'SBA sqft', 'Baths', 'Balc.', 'Units'][fi]}
                                      </p>
                                      <input
                                        type="number"
                                        min={0}
                                        value={row[field]}
                                        onChange={(e) => setUnitConfigs((p) => p.map((r, i) => (i === idx ? { ...r, [field]: e.target.value } : r)))}
                                        className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]"
                                      />
                                    </div>
                                  ))}
                                  {/* ₹/sqft — unit_config mode only */}
                                  {investmentMode === 'unit_config' && (
                                    <div>
                                      <p className="text-[10px] text-theme-tertiary mb-1">₹/sqft</p>
                                      <input
                                        type="number"
                                        min={0}
                                        value={row.pricePerSqft}
                                        onChange={(e) => setUnitConfigs((p) => p.map((r, i) => (i === idx ? { ...r, pricePerSqft: e.target.value } : r)))}
                                        className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]"
                                        placeholder="e.g. 8500"
                                      />
                                    </div>
                                  )}
                                  {unitConfigs.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setUnitConfigs((p) => p.filter((_, i) => i !== idx))}
                                      className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 hover:bg-red-200 text-xs font-bold"
                                    >
                                      ×
                                    </button>
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
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Σ units × carpet area × ₹/sqft across all rows</p>
                                  </div>
                                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{display}</div>
                                </div>
                              )
                            })()}
                          </div>
                        )}

                        {/* Plot Configurations — shown for Safe vault always, or Wealth in unit_config mode */}
                        {fc.showPlotConfig && (vaultType === 'safe' || investmentMode === 'unit_config') && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-theme-primary">
                                Plot Configurations <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setPlotConfigs((p) => [...p, { id: String(Date.now()), plotType: '', areaSqft: '', totalPlots: '', pricePerSqft: '' }])}
                                className="text-xs text-primary hover:underline"
                              >
                                + Add Plot Type
                              </button>
                            </div>
                            {fe('plotConfig') && (
                              <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> At least one complete plot config required
                              </p>
                            )}
                            <div className="space-y-2">
                              {plotConfigs.map((row, idx) => (
                                <div key={row.id} className="grid grid-cols-4 gap-1.5 items-start p-2.5 bg-theme-surface-hover rounded-lg relative">
                                  <div>
                                    <p className="text-[10px] text-theme-tertiary mb-1">Plot Type</p>
                                    <Select
                                      value={row.plotType}
                                      onChange={(v) => setPlotConfigs((p) => p.map((r, i) => (i === idx ? { ...r, plotType: v } : r)))}
                                      placeholder="Select"
                                      options={PLOT_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-theme-tertiary mb-1">Area (Sq.Ft)</p>
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.areaSqft}
                                      onChange={(e) => setPlotConfigs((p) => p.map((r, i) => (i === idx ? { ...r, areaSqft: e.target.value } : r)))}
                                      className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]"
                                      placeholder="e.g. 2178"
                                    />
                                    {row.areaSqft && Number(row.areaSqft) > 0 && (
                                      <p className="text-[10px] text-theme-tertiary mt-0.5">
                                        {sqftConversions(Number(row.areaSqft)).sqyd} sqyd · {sqftConversions(Number(row.areaSqft)).guntha} guntha
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-theme-tertiary mb-1">Total Plots</p>
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.totalPlots}
                                      onChange={(e) => setPlotConfigs((p) => p.map((r, i) => (i === idx ? { ...r, totalPlots: e.target.value } : r)))}
                                      className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]"
                                      placeholder="e.g. 50"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-theme-tertiary mb-1">₹/Sqft</p>
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.pricePerSqft}
                                      onChange={(e) => setPlotConfigs((p) => p.map((r, i) => (i === idx ? { ...r, pricePerSqft: e.target.value } : r)))}
                                      className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]"
                                      placeholder="e.g. 3500"
                                    />
                                  </div>
                                  {plotConfigs.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setPlotConfigs((p) => p.filter((_, i) => i !== idx))}
                                      className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 hover:bg-red-200 text-xs font-bold"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* Computed total strip for plots — unit_config mode only */}
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
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Σ plots × area × ₹/sqft across all plot types</p>
                                  </div>
                                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{display}</div>
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* 📅 Funding Schedule — visible when investmentMode set (or safe vault) */}
                  {propertyType && (vaultType === 'safe' || !!investmentMode) && (
                    <div className="rounded-xl border border-theme p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-theme-primary">📅 Funding Schedule</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">Important</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">
                            Funding Opens <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={form.fundingOpenAt ? form.fundingOpenAt.slice(0, 10) : ''}
                            onChange={(e) => handleChange('fundingOpenAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none ${fe('fundingOpenAt') ? 'border-red-400' : 'border-theme'}`}
                          />
                          {fe('fundingOpenAt') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Required
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-primary mb-1">
                            Funding Deadline
                            <span className="ml-1 text-xs font-normal text-theme-secondary">(optional)</span>
                          </label>
                          <input
                            type="date"
                            value={form.closingDate ? form.closingDate.slice(0, 10) : ''}
                            onChange={(e) => handleChange('closingDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                            className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-theme-tertiary flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        Status auto-transitions to Active once approvals are complete &amp; Funding Opens date is reached.
                      </p>
                    </div>
                  )}

                  {/* ✨ Amenities */}
                  {propertyType && (vaultType === 'safe' || !!investmentMode) && (() => {
                    const allowedCats = PROPERTY_AMENITY_CATEGORIES[propertyType] ?? []
                    const excludeKeys = AMENITY_EXCLUDE_BY_TYPE[propertyType] ?? []
                    const visibleCategories = (Object.entries(AMENITY_CATEGORIES) as [AmenityCategory, string][])
                      .filter(([catKey]) => allowedCats.includes(catKey))
                    if (visibleCategories.length === 0) return null
                    return (
                      <div className={`rounded-xl border-2 p-4 ${fe('amenities') ? 'border-red-400' : 'border-theme'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-semibold text-theme-primary">
                            ✨ Amenities <span className="text-red-500">*</span>
                          </label>
                          {selectedAmenities.length > 0 && (
                            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                              ✓ {selectedAmenities.length} selected
                            </span>
                          )}
                        </div>
                        {fe('amenities') && (
                          <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Select at least one amenity
                          </p>
                        )}
                        <div className="space-y-4">
                          {visibleCategories.map(([catKey, catLabel]) => {
                            const catAmenities = AMENITIES.filter(
                              (a) => a.category === catKey && !excludeKeys.includes(a.key)
                            )
                            if (catAmenities.length === 0) return null
                            return (
                              <div key={catKey}>
                                <p className="text-[10px] font-bold text-theme-tertiary uppercase tracking-widest mb-2 pb-1 border-b border-theme">
                                  {catLabel}
                                </p>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {catAmenities.map((a) => {
                                    const isSel = selectedAmenities.includes(a.key)
                                    const IconComp = AMENITY_ICON_MAP[a.icon] ?? AlertCircle
                                    return (
                                      <button
                                        type="button"
                                        key={a.key}
                                        onClick={() => setSelectedAmenities((p) => (isSel ? p.filter((k) => k !== a.key) : [...p, a.key]))}
                                        className={`relative flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                                          isSel
                                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                            : 'border-theme text-theme-secondary hover:border-primary/50 hover:bg-theme-surface-hover hover:text-theme-primary'
                                        }`}
                                      >
                                        <IconComp className={`h-3.5 w-3.5 shrink-0 ${isSel ? 'text-primary' : 'text-theme-tertiary'}`} />
                                        <span className="truncate leading-tight">{a.label}</span>
                                        {isSel && (
                                          <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-primary text-white text-[8px] font-bold">✓</span>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
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

        </div>
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
  )
}
