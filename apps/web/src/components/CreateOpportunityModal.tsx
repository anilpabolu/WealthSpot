import { useState } from 'react'
import { X, Rocket, Building2, Users, CheckCircle2, Loader2 } from 'lucide-react'
import { useCreateOpportunity, type OpportunityCreatePayload } from '@/hooks/useOpportunities'
import { useUploadOpportunityMedia } from '@/hooks/useUpload'
import { INDIAN_CITIES } from '@/lib/constants'
import MediaUploadZone from './MediaUploadZone'
import AddressDialog, { type AddressFields } from './AddressDialog'
import CompanySelector from './CompanySelector'
import CompanyOnboardingModal from './CompanyOnboardingModal'

const VAULT_OPTIONS = [
  { value: 'wealth', label: 'The Goldmine', sublabel: 'Real estate that prints money 🏗️', icon: Building2, color: 'border-primary text-primary bg-primary/5' },
  { value: 'opportunity', label: 'The Launchpad', sublabel: 'Startups that go BRRR 🚀', icon: Rocket, color: 'border-violet-500 text-violet-600 bg-violet-50' },
  { value: 'community', label: 'The Hive', sublabel: 'Build together, win together 🐝', icon: Users, color: 'border-emerald-500 text-emerald-600 bg-emerald-50' },
] as const

const STARTUP_STAGES = ['Idea', 'MVP', 'Seed', 'Pre-Series A', 'Series A', 'Growth']
const COMMUNITY_TYPES = ['Sports Complex', 'Co-working Space', 'Local Business', 'Education Centre', 'Healthcare', 'Agriculture', 'Other']
const COLLABORATION_TYPES = ['Capital + Time', 'Capital Only', 'Time + Network', 'Full Collaboration']

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
  const [step, setStep] = useState<'vault' | 'form' | 'uploading' | 'success'>('vault')
  const [vaultType, setVaultType] = useState('')
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
    setStep('form')
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
    setForm({ vaultType: '', title: '' })
    setMediaItems([])
    setAddress(EMPTY_ADDRESS)
    createMutation.reset()
    uploadMutation.reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={handleClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-display text-lg font-bold text-gray-900">
            {step === 'vault' && '✨ Launch Your Opportunity'}
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
                    onClick={() => handleVaultSelect(opt.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 ${opt.color} hover:shadow-md transition-all text-left`}
                  >
                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.sublabel}</div>
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
                onChange={(id) => handleChange('companyId', id ?? '' as any)}
                onRequestOnboard={() => setShowOnboarding(true)}
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
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </>
              )}

              {/* Media upload — replaces cover image URL */}
              <MediaUploadZone images={mediaItems} onChange={setMediaItems} />

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('vault')}
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
          handleChange('companyId', companyId as any)
          setShowOnboarding(false)
        }}
      />
    </div>
  )
}
