import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PortalLayout } from '@/components/layout'
import { Select, Input, Textarea } from '@/components/ui'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useOpportunity, useUpdateOpportunity, type OpportunityUpdatePayload } from '@/hooks/useOpportunities'
import { AMENITIES, AMENITY_CATEGORIES, PropertyType } from '@wealthspot/types'
import type { AmenityCategory } from '@wealthspot/types'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone, { type MediaItem } from '@/components/MediaUploadZone'
import AddressDialog, { type AddressFields } from '@/components/AddressDialog'
import CompanySelector from '@/components/CompanySelector'
import CompanyOnboardingModal from '@/components/CompanyOnboardingModal'
import { EmptyState } from '@/components/ui'

const STARTUP_STAGES = ['Idea', 'MVP', 'Seed', 'Pre-Series A', 'Series A', 'Growth']
const COMMUNITY_TYPES = ['Sports Complex', 'Co-working Space', 'Local Business', 'Education Centre', 'Healthcare', 'Agriculture', 'Other']
const COLLABORATION_TYPES = ['Capital + Time', 'Capital Only', 'Time + Network', 'Full Collaboration']

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
const POSSESSION_QUARTERS = [
  'Ready to Move', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025',
  'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026',
  'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027', 'Q4 2028+',
]
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

export default function BuilderListingEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: opp, isLoading } = useOpportunity(id ?? '')
  const updateMutation = useUpdateOpportunity()
  const uploadMutation = useUploadOpportunityMedia()
  const [form, setForm] = useState<OpportunityUpdatePayload>({})
  const [address, setAddress] = useState<AddressFields>({ addressLine1: '', addressLine2: '', landmark: '', locality: '', city: '', state: '', pincode: '', district: '', country: 'India' })
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Prepare hero section with matching styling
  const hero = (
    <section id="hero" className="page-hero-navbar relative overflow-hidden pt-[8.5rem] pb-14 lg:pb-16 -mt-16" style={{
      backgroundImage: "linear-gradient(135deg, rgba(7,16,31,0.85) 0%, rgba(15,27,58,0.75) 50%, rgba(7,16,31,0.85) 100%), url('/images/page-hero-bg-2.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Blur orbs — matching VaultsPage & BuilderListingsPage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="animate-fade-up">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(`/portal/builder/listings/${id}`)} className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
                Edit Listing
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-2xl">{opp?.title || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
  // ── Property specs state ───────────────────────────────────────────────
  const [propertyType, setPropertyType] = useState<string>('')
  const [unitConfigs, setUnitConfigs] = useState<UnitConfigRow[]>([{ ...DEFAULT_UNIT_CONFIG }])
  const [plotConfigs, setPlotConfigs] = useState<PlotConfigRow[]>([{ ...DEFAULT_PLOT_CONFIG }])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [pricePerSqftField, setPricePerSqftField] = useState<string>('')
  const [totalProjectAreaSqftField, setTotalProjectAreaSqftField] = useState<string>('')
  const [projectOverview, setProjectOverview] = useState<ProjectOverview>({ totalTowers: '', totalFloors: '', possessionQuarter: '', landParcelSqft: '' })
  // Loading state is driven entirely by the mutations — no manual `saving` flag.
  const isSaving = updateMutation.isPending || uploadMutation.isPending

  // Populate form when data loads
  useEffect(() => {
    if (!opp) return
    setForm({
      title: opp.title,
      tagline: opp.tagline ?? '',
      description: opp.description ?? '',
      companyId: opp.companyId ?? '',
      targetAmount: opp.targetAmount ?? undefined,
      minInvestment: opp.minInvestment ?? undefined,
      industry: opp.industry ?? '',
      stage: opp.stage ?? '',
      founderName: opp.founderName ?? '',
      pitchDeckUrl: opp.pitchDeckUrl ?? '',
      city: opp.city ?? '',
      communityType: opp.communityType ?? '',
      collaborationType: opp.collaborationType ?? '',
      fundingOpenAt: opp.fundingOpenAt ?? undefined,
      closingDate: opp.closingDate ?? undefined,
    })
    setAddress({
      addressLine1: opp.addressLine1 ?? '',
      addressLine2: opp.addressLine2 ?? '',
      landmark: opp.landmark ?? '',
      locality: opp.locality ?? '',
      city: opp.city ?? '',
      state: opp.state ?? '',
      pincode: opp.pincode ?? '',
      district: opp.district ?? '',
      country: opp.country ?? 'India',
    })
    // Pre-populate property specs
    if (opp.property_type) {
      setPropertyType(opp.property_type)
      if (opp.price_per_sqft != null) setPricePerSqftField(String(opp.price_per_sqft))
      if (opp.total_project_area_sqft != null) setTotalProjectAreaSqftField(String(opp.total_project_area_sqft))
      if (opp.property_amenities) setSelectedAmenities(opp.property_amenities)
      const specs = opp.property_specs as Record<string, unknown> | null
      if (specs) {
        setProjectOverview({
          totalTowers: String(specs.total_towers ?? ''),
          totalFloors: String(specs.total_floors ?? ''),
          possessionQuarter: (specs.possession_date as string) ?? '',
          landParcelSqft: String(specs.land_parcel_sqft ?? ''),
        })
        type RawUnitCfg = { bhk_type?: string; carpet_area_sqft?: number; super_built_up_sqft?: number; bathrooms?: number; balconies?: number; total_units?: number; price_per_sqft?: number }
        const rawUnits = specs.unit_configurations as RawUnitCfg[] | undefined
        if (rawUnits?.length) {
          setUnitConfigs(rawUnits.map((u, i) => ({
            id: String(i + 1),
            bhkType: u.bhk_type ?? '',
            carpetAreaSqft: u.carpet_area_sqft != null ? String(u.carpet_area_sqft) : '',
            superBuiltUpSqft: u.super_built_up_sqft != null ? String(u.super_built_up_sqft) : '',
            bathrooms: u.bathrooms != null ? String(u.bathrooms) : '',
            balconies: u.balconies != null ? String(u.balconies) : '',
            totalUnits: u.total_units != null ? String(u.total_units) : '',
            pricePerSqft: u.price_per_sqft != null ? String(u.price_per_sqft) : '',
          })))
        }
        type RawPlotCfg = { type?: string; area_sqft?: number; total_plots?: number; price_per_sqft?: number }
        const rawPlots = specs.plot_configurations as RawPlotCfg[] | undefined
        if (rawPlots?.length) {
          setPlotConfigs(rawPlots.map((p, i) => ({
            id: String(i + 1),
            plotType: p.type ?? '',
            areaSqft: p.area_sqft != null ? String(p.area_sqft) : '',
            totalPlots: p.total_plots != null ? String(p.total_plots) : '',
            pricePerSqft: p.price_per_sqft != null ? String(p.price_per_sqft) : '',
          })))
        }
      }
    }
  }, [opp])

  const handleChange = (key: keyof OpportunityUpdatePayload, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
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

      // For unit_config investment mode, auto-compute target from configurations
      const computedTarget = opp?.investment_mode === 'unit_config'
        ? (propertyType === PropertyType.PLOT
            ? plotConfigs.reduce((sum, p) => sum + (Number(p.totalPlots) || 0) * (Number(p.areaSqft) || 0) * (Number(p.pricePerSqft) || 0), 0)
            : unitConfigs.reduce((sum, u) => sum + (Number(u.totalUnits) || 0) * (Number(u.carpetAreaSqft) || 0) * (Number(u.pricePerSqft) || 0), 0))
        : undefined

      const payload: OpportunityUpdatePayload = {
        ...form,
        ...(computedTarget && computedTarget > 0 && { targetAmount: computedTarget }),
        ...(opp?.vaultType === 'wealth' || opp?.vaultType === 'community'
          ? { addressLine1: address.addressLine1, addressLine2: address.addressLine2, landmark: address.landmark, locality: address.locality, city: address.city, state: address.state, pincode: address.pincode, district: address.district, country: address.country, address: [address.addressLine1, address.locality, address.city].filter(Boolean).join(', ') }
          : {}),
        ...(propertyType && {
          property_type: propertyType,
          ...(pricePerSqftField && { price_per_sqft: Number(pricePerSqftField) }),
          ...(totalProjectAreaSqftField && { total_project_area_sqft: Number(totalProjectAreaSqftField) }),
          property_specs: propertySpecsPayload,
          property_amenities: selectedAmenities,
        }),
      }
      await updateMutation.mutateAsync({ id, data: payload })
      if (mediaItems.length > 0) {
        const images = mediaItems.filter((m) => m.type === 'image').map((m) => m.file)
        const videos = mediaItems.filter((m) => m.type === 'video').map((m) => m.file)
        if (images.length > 0) await uploadMutation.mutateAsync({ opportunityId: id, files: images, isCover: true })
        if (videos.length > 0) await uploadMutation.mutateAsync({ opportunityId: id, files: videos })
      }
      navigate(`/portal/builder/listings/${id}`)
      // Success/error toasts come from the global mutation handler in main.tsx.
    } catch {
      // Stay on the page so the user can retry; toast already shown by the
      // global handler.
    }
  }

  if (isLoading) {
    return (
      <PortalLayout variant="builder">
        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
      </PortalLayout>
    )
  }

  if (!opp) {
    return (
      <PortalLayout variant="builder">
        <EmptyState title="Listing not found" message="Can't find this listing." actionLabel="Back to Listings" onAction={() => navigate('/portal/builder/listings')} />
      </PortalLayout>
    )
  }

  return (
    <PortalLayout variant="builder" hero={hero}>
      <div className="max-w-3xl mx-auto space-y-6 mt-8">


        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <CompanySelector value={form.companyId} onChange={(cid) => handleChange('companyId', cid ?? '')} onRequestOnboard={() => setShowOnboarding(true)} />

            {/* Common fields */}
            <Input label="Title *" required value={form.title ?? ''} onChange={(e) => handleChange('title', e.target.value)} />
            <Input label="Tagline" value={form.tagline ?? ''} onChange={(e) => handleChange('tagline', e.target.value)} />
            <Textarea label="Description" rows={4} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} />

            {/* Wealth fields */}
            {opp.vaultType === 'wealth' && (
              <>
                <AddressDialog value={address} onChange={setAddress} />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-theme-secondary">Investment Mode:</span>
                  {opp.investment_mode === 'unit_config' ? (
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                      📐 Unit Configuration — target auto-computed
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                      🏷️ Lumpsum
                    </span>
                  )}
                </div>
                {opp.investment_mode !== 'unit_config' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Target Amount" type="number" min={0} prefix="₹" value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} />
                    <Input label="Min Investment" type="number" min={0} prefix="₹" value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} />
                  </div>
                )}
              </>
            )}

            {/* Safe Vault fields */}
            {opp.vaultType === 'safe' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Industry" value={form.industry ?? ''} onChange={(e) => handleChange('industry', e.target.value)} />
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">Stage</label>
                    <Select value={form.stage ?? ''} onChange={(v) => handleChange('stage', v)} placeholder="Select stage" options={STARTUP_STAGES.map((s) => ({ value: s, label: s }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Founder Name" value={form.founderName ?? ''} onChange={(e) => handleChange('founderName', e.target.value)} />
                  <Input label="Pitch Deck URL" type="url" value={form.pitchDeckUrl ?? ''} onChange={(e) => handleChange('pitchDeckUrl', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Target Amount (₹) *" type="number" min={0} prefix="₹" value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} />
                  <Input label="Min Investment (₹) *" type="number" min={0} prefix="₹" value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} />
                  <Input label="Interest Rate (% p.a.) *" type="number" step="0.1" min={0} value={String((opp.safeVaultData as any)?.interest_rate ?? '')} onChange={(e) => setForm(p => ({ ...p, safeVaultData: { ...(p.safeVaultData || opp.safeVaultData || {}), interest_rate: Number(e.target.value) } }))} suffix="%" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">Payout Frequency</label>
                    <Select value={String((opp.safeVaultData as any)?.payout_frequency ?? 'monthly')} onChange={(v) => setForm(p => ({ ...p, safeVaultData: { ...(p.safeVaultData || opp.safeVaultData || {}), payout_frequency: v } }))} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]} />
                  </div>
                  <Input label="Tenure (months) *" type="number" min={1} value={String((opp.safeVaultData as any)?.tenure_months ?? '')} onChange={(e) => setForm(p => ({ ...p, safeVaultData: { ...(p.safeVaultData || opp.safeVaultData || {}), tenure_months: Number(e.target.value) } }))} suffix=" mo." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">City</label>
                  <Select value={form.city ?? ''} onChange={(v) => handleChange('city', v)} placeholder="Select city" options={INDIAN_CITIES.map((c) => ({ value: c, label: c }))} searchable />
                </div>
              </>
            )}

            {/* Community fields */}
            {opp.vaultType === 'community' && (
              <>
                <AddressDialog value={address} onChange={setAddress} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">Community Type</label>
                    <Select value={form.communityType ?? ''} onChange={(v) => handleChange('communityType', v)} placeholder="Select type" options={COMMUNITY_TYPES.map((t) => ({ value: t, label: t }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">Collaboration</label>
                    <Select value={form.collaborationType ?? ''} onChange={(v) => handleChange('collaborationType', v)} placeholder="Select collaboration" options={COLLABORATION_TYPES.map((t) => ({ value: t, label: t }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Target Amount (₹) *" type="number" min={0} prefix="₹" value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} />
                  <Input label="Min Investment (₹) *" type="number" min={0} prefix="₹" value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} />
                </div>
                {opp.communitySubtype === 'co_investor' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Investment Tenure</label>
                      <Select value={String((opp.communityDetails as any)?.investmentTenure ?? '')} onChange={(v) => setForm(p => ({ ...p, communityDetails: { ...(p.communityDetails || opp.communityDetails || {}), investmentTenure: v } }))} placeholder="Select tenure" options={['6 Months', '1 Year', '2 Years', '3 Years', '5 Years', '7 Years'].map(o => ({ value: o, label: o }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Revenue Model</label>
                      <Select value={String((opp.communityDetails as any)?.revenueModel ?? '')} onChange={(v) => setForm(p => ({ ...p, communityDetails: { ...(p.communityDetails || opp.communityDetails || {}), revenueModel: v } }))} placeholder="Select model" options={['Rental Income', 'Profit Sharing', 'Membership Fees', 'Revenue Share', 'Equity Appreciation', 'Other'].map(o => ({ value: o, label: o }))} />
                    </div>
                  </div>
                )}
                {opp.communitySubtype === 'co_partner' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Equity Share Offered (%) *" type="number" min={0} max={100} step="0.1" value={String((opp.communityDetails as any)?.equityShare ?? '')} onChange={(e) => setForm(p => ({ ...p, communityDetails: { ...(p.communityDetails || opp.communityDetails || {}), equityShare: Number(e.target.value) } }))} suffix="%" />
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-1">Time Commitment</label>
                      <Select value={String((opp.communityDetails as any)?.timeCommitment ?? '')} onChange={(v) => setForm(p => ({ ...p, communityDetails: { ...(p.communityDetails || opp.communityDetails || {}), timeCommitment: v } }))} placeholder="Select commitment" options={['Part-time (< 10 hrs/week)', 'Half-time (10–20 hrs/week)', 'Full-time (20–40 hrs/week)', 'On-call / Flexible'].map(o => ({ value: o, label: o }))} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Funding schedule */}
            {(opp.vaultType === 'wealth' || opp.vaultType === 'safe') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">
                    Funding Opens
                    <span className="ml-1 text-xs font-normal text-theme-secondary">(leave blank for immediately on approval)</span>
                  </label>
                  <input
                    type="date"
                    value={form.fundingOpenAt ? String(form.fundingOpenAt).slice(0, 10) : ''}
                    onChange={(e) => handleChange('fundingOpenAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">
                    Funding Deadline
                    <span className="ml-1 text-xs font-normal text-theme-secondary">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.closingDate ? String(form.closingDate).slice(0, 10) : ''}
                    onChange={(e) => handleChange('closingDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            )}

            {/* Property Specs (Wealth & Safe) */}
            {(opp.vaultType === 'wealth' || opp.vaultType === 'safe') && (
              <>
                {/* Property Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">Property Type</label>
                  <div className="grid grid-cols-3 gap-2">
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
                </div>

                {propertyType && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Price per Sq.Ft (₹)" type="number" min={0} value={pricePerSqftField} onChange={(e) => setPricePerSqftField(e.target.value)} placeholder="e.g. 8500" prefix="₹" />
                      <Input label="Total Project Area (Sq.Ft)" type="number" min={0} value={totalProjectAreaSqftField} onChange={(e) => setTotalProjectAreaSqftField(e.target.value)} placeholder="e.g. 120000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">Possession Quarter</label>
                        <Select value={projectOverview.possessionQuarter} onChange={(v) => setProjectOverview((p) => ({ ...p, possessionQuarter: v }))} placeholder="Select quarter" options={POSSESSION_QUARTERS.map((q) => ({ value: q, label: q }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Input label="Total Towers" type="number" min={1} value={projectOverview.totalTowers} onChange={(e) => setProjectOverview((p) => ({ ...p, totalTowers: e.target.value }))} placeholder="e.g. 4" />
                      <Input label="Total Floors" type="number" min={1} value={projectOverview.totalFloors} onChange={(e) => setProjectOverview((p) => ({ ...p, totalFloors: e.target.value }))} placeholder="e.g. 18" />
                      <Input label="Land Parcel (Sq.Ft)" type="number" min={0} value={projectOverview.landParcelSqft} onChange={(e) => setProjectOverview((p) => ({ ...p, landParcelSqft: e.target.value }))} placeholder="e.g. 10890" />
                    </div>
                    {projectOverview.landParcelSqft && Number(projectOverview.landParcelSqft) > 0 && (
                      <div className="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-1.5 uppercase tracking-wide">Area Conversions</p>
                        {(() => {
                          const c = sqftConversions(Number(projectOverview.landParcelSqft))
                          return (
                            <div className="grid grid-cols-5 gap-x-3">
                              {([['sqft', c.sqft], ['sq.yd', c.sqyd], ['guntha', c.guntha], ['acre', c.acre], ['bigha', c.bigha]] as [string, string][]).map(([unit, val]) => (
                                <div key={unit} className="text-xs">
                                  <span className="font-medium text-blue-800 dark:text-blue-200">{val}</span>
                                  <span className="text-blue-500 dark:text-blue-400 ml-1">{unit}</span>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Unit Configurations */}
                    {propertyType !== PropertyType.PLOT && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-theme-primary">
                            {propertyType === PropertyType.WAREHOUSE ? 'Unit / Bay Configurations' : 'BHK / Unit Configurations'}
                          </label>
                          <button type="button" onClick={() => setUnitConfigs((p) => [...p, { id: String(Date.now()), bhkType: '', carpetAreaSqft: '', superBuiltUpSqft: '', bathrooms: '', balconies: '', totalUnits: '', pricePerSqft: '' }])} className="text-xs text-primary hover:underline">+ Add Config</button>
                        </div>
                        <div className="space-y-2">
                          {unitConfigs.map((row, idx) => (
                            <div key={row.id} className={`grid gap-1.5 items-end p-2.5 bg-theme-surface-hover rounded-lg relative ${opp.investment_mode === 'unit_config' ? 'grid-cols-8' : 'grid-cols-7'}`}>
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
                              {opp.investment_mode === 'unit_config' && (
                                <div>
                                  <p className="text-[10px] text-theme-tertiary mb-1">₹/Sqft</p>
                                  <input type="number" min={0} value={row.pricePerSqft} onChange={(e) => setUnitConfigs((p) => p.map((r, i) => (i === idx ? { ...r, pricePerSqft: e.target.value } : r)))} className="w-full rounded border border-theme px-1.5 py-1.5 text-xs focus:border-primary outline-none bg-[var(--bg-surface)]" placeholder="e.g. 8500" />
                                </div>
                              )}
                              {unitConfigs.length > 1 && (
                                <button type="button" onClick={() => setUnitConfigs((p) => p.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 hover:bg-red-200 text-xs font-bold">×</button>
                              )}
                            </div>
                          ))}
                        </div>
                        {opp.investment_mode === 'unit_config' && (() => {
                          const total = unitConfigs.reduce((sum, u) => sum + (Number(u.totalUnits) || 0) * (Number(u.carpetAreaSqft) || 0) * (Number(u.pricePerSqft) || 0), 0)
                          if (total <= 0) return null
                          return (
                            <div className="mt-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-lg">
                              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                <span className="font-semibold">Computed Target: </span>
                                ₹{(total / 1e7).toFixed(2)} Cr
                              </p>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Plot Configurations */}
                    {propertyType === PropertyType.PLOT && (
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
                        {opp.investment_mode === 'unit_config' && (() => {
                          const total = plotConfigs.reduce((sum, p) => sum + (Number(p.totalPlots) || 0) * (Number(p.areaSqft) || 0) * (Number(p.pricePerSqft) || 0), 0)
                          if (total <= 0) return null
                          return (
                            <div className="mt-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-lg">
                              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                <span className="font-semibold">Computed Target: </span>
                                ₹{(total / 1e7).toFixed(2)} Cr
                              </p>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Amenities */}
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-3">Amenities</label>
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
                  </>
                )}
              </>
            )}

            {/* Additional media */}
            <div>
              <h3 className="text-sm font-medium text-theme-primary mb-2">Add More Media</h3>
              <MediaUploadZone images={mediaItems} onChange={setMediaItems} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => navigate(`/portal/builder/listings/${id}`)} className="px-4 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
                {isSaving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : (<><Save className="h-4 w-4" /> Save Changes</>)}
              </button>
            </div>
            {updateMutation.isError && <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">Failed to save. Please try again.</p>}
          </form>
        </div>
      </div>

      <CompanyOnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </PortalLayout>
  )
}
