import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PortalLayout } from '@/components/layout'
import { Select } from '@/components/ui'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useOpportunity, useUpdateOpportunity, type OpportunityUpdatePayload } from '@/hooks/useOpportunities'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone from '@/components/MediaUploadZone'
import AddressDialog, { type AddressFields } from '@/components/AddressDialog'
import CompanySelector from '@/components/CompanySelector'
import CompanyOnboardingModal from '@/components/CompanyOnboardingModal'
import { EmptyState } from '@/components/ui'

const STARTUP_STAGES = ['Idea', 'MVP', 'Seed', 'Pre-Series A', 'Series A', 'Growth']
const COMMUNITY_TYPES = ['Sports Complex', 'Co-working Space', 'Local Business', 'Education Centre', 'Healthcare', 'Agriculture', 'Other']
const COLLABORATION_TYPES = ['Capital + Time', 'Capital Only', 'Time + Network', 'Full Collaboration']

const inputCls = 'w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none'

interface MediaItem { file: File; preview: string; type: 'image' | 'video' }

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
  const [saving, setSaving] = useState(false)

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
      targetIrr: opp.targetIrr ?? undefined,
      industry: opp.industry ?? '',
      stage: opp.stage ?? '',
      founderName: opp.founderName ?? '',
      pitchDeckUrl: opp.pitchDeckUrl ?? '',
      city: opp.city ?? '',
      communityType: opp.communityType ?? '',
      collaborationType: opp.collaborationType ?? '',
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
  }, [opp])

  const handleChange = (key: keyof OpportunityUpdatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      const payload: OpportunityUpdatePayload = {
        ...form,
        ...(opp?.vaultType === 'wealth' || opp?.vaultType === 'community'
          ? { addressLine1: address.addressLine1, addressLine2: address.addressLine2, landmark: address.landmark, locality: address.locality, city: address.city, state: address.state, pincode: address.pincode, district: address.district, country: address.country, address: [address.addressLine1, address.locality, address.city].filter(Boolean).join(', ') }
          : {}),
      }
      await updateMutation.mutateAsync({ id, data: payload })
      if (mediaItems.length > 0) {
        const images = mediaItems.filter((m) => m.type === 'image').map((m) => m.file)
        const videos = mediaItems.filter((m) => m.type === 'video').map((m) => m.file)
        if (images.length > 0) await uploadMutation.mutateAsync({ opportunityId: id, files: images, isCover: true })
        if (videos.length > 0) await uploadMutation.mutateAsync({ opportunityId: id, files: videos })
      }
      navigate(`/portal/builder/listings/${id}`)
    } catch {
      // error shown in UI
    } finally {
      setSaving(false)
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
    <PortalLayout variant="builder">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/portal/builder/listings/${id}`)} className="text-theme-secondary hover:text-theme-primary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="section-title text-2xl">Edit Listing</h1>
            <p className="text-theme-secondary text-sm mt-1">{opp.title}</p>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <CompanySelector value={form.companyId} onChange={(cid) => handleChange('companyId', cid ?? '')} onRequestOnboard={() => setShowOnboarding(true)} vaultType={opp.vaultType} />

            {/* Common fields */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">Title *</label>
              <input required value={form.title ?? ''} onChange={(e) => handleChange('title', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">Tagline</label>
              <input value={form.tagline ?? ''} onChange={(e) => handleChange('tagline', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
              <textarea rows={4} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} className={`${inputCls} resize-none`} />
            </div>

            {/* Wealth fields */}
            {opp.vaultType === 'wealth' && (
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

            {/* Opportunity (Startup) fields */}
            {opp.vaultType === 'opportunity' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">Industry</label>
                    <input value={form.industry ?? ''} onChange={(e) => handleChange('industry', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">Stage</label>
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
                    <input type="url" value={form.pitchDeckUrl ?? ''} onChange={(e) => handleChange('pitchDeckUrl', e.target.value)} className={inputCls} />
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
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">Target Amount (₹)</label>
                    <input type="number" min={0} value={form.targetAmount ?? ''} onChange={(e) => handleChange('targetAmount', Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">Min Investment (₹)</label>
                    <input type="number" min={0} value={form.minInvestment ?? ''} onChange={(e) => handleChange('minInvestment', Number(e.target.value))} className={inputCls} />
                  </div>
                </div>
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
              <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
                {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : (<><Save className="h-4 w-4" /> Save Changes</>)}
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
