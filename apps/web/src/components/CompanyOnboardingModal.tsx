import { useState } from 'react'
import { Building2, CheckCircle2, Loader2, X } from 'lucide-react'
import { useCreateCompany, type CompanyCreatePayload } from '@/hooks/useCompanies'
import { usePincodeLookup } from '@/hooks/usePincodes'

const ENTITY_TYPES = [
  { value: 'private_limited', label: 'Private Limited' },
  { value: 'public_limited', label: 'Public Limited' },
  { value: 'llp', label: 'LLP' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'proprietorship', label: 'Sole Proprietorship' },
  { value: 'trust', label: 'Trust' },
  { value: 'society', label: 'Society' },
  { value: 'individual', label: 'Individual' },
]

const INITIAL: CompanyCreatePayload = {
  companyName: '',
  entityType: 'private_limited',
  country: 'India',
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: (companyId: string) => void
}

export default function CompanyOnboardingModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<CompanyCreatePayload>(INITIAL)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const createMutation = useCreateCompany()
  const { data: pincodeData } = usePincodeLookup(form.pincode ?? '')

  if (!open) return null

  const handlePincodeChange = (val: string) => {
    setForm((prev) => ({ ...prev, pincode: val }))
  }

  if (pincodeData && pincodeData.length > 0 && form.pincode?.length === 6) {
    const p = pincodeData[0]!
    if (p.district && !form.city) {
      setForm((prev) => ({
        ...prev,
        city: p.district || prev.city,
        state: p.state || prev.state,
      }))
    }
  }

  const handleChange = (field: keyof CompanyCreatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const company = await createMutation.mutateAsync(form)
      setStep('success')
      onSuccess?.(company.id)
    } catch {
      // error handled by mutation state
    }
  }

  const handleClose = () => {
    setStep('form')
    setForm(INITIAL)
    createMutation.reset()
    onClose()
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60" onClick={handleClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">Builder Launchpad 🏗️</h2>
              <p className="text-xs text-gray-500">Register your company to create opportunities</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Company Name *</label>
                    <input required value={form.companyName} onChange={(e) => handleChange('companyName', e.target.value)} className={inputClass} placeholder="WealthSpot Developers Pvt. Ltd." />
                  </div>
                  <div>
                    <label className={labelClass}>Brand Name</label>
                    <input value={form.brandName ?? ''} onChange={(e) => handleChange('brandName', e.target.value)} className={inputClass} placeholder="WS Homes" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Entity Type *</label>
                  <select required value={form.entityType || 'private_limited'} onChange={(e) => handleChange('entityType', e.target.value)} className={inputClass}>
                    {ENTITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea rows={2} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} className={inputClass + ' resize-none'} placeholder="Tell us about your company…" />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={form.website ?? ''} onChange={(e) => handleChange('website', e.target.value)} className={inputClass} placeholder="https://www.yourcompany.com" />
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Legal & Compliance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>CIN</label>
                    <input value={form.cin ?? ''} onChange={(e) => handleChange('cin', e.target.value)} className={inputClass} placeholder="U12345MH2020PTC123456" maxLength={21} />
                  </div>
                  <div>
                    <label className={labelClass}>GSTIN</label>
                    <input value={form.gstin ?? ''} onChange={(e) => handleChange('gstin', e.target.value)} className={inputClass} placeholder="29AABCT1234E1Z5" maxLength={15} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>PAN</label>
                    <input value={form.pan ?? ''} onChange={(e) => handleChange('pan', e.target.value.toUpperCase())} className={inputClass} placeholder="AAAAA1234A" maxLength={10} />
                  </div>
                  <div>
                    <label className={labelClass}>RERA Number</label>
                    <input value={form.reraNumber ?? ''} onChange={(e) => handleChange('reraNumber', e.target.value)} className={inputClass} placeholder="P52000012345" />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Primary Contact</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input value={form.contactName ?? ''} onChange={(e) => handleChange('contactName', e.target.value)} className={inputClass} placeholder="Rahul Sharma" />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" value={form.contactEmail ?? ''} onChange={(e) => handleChange('contactEmail', e.target.value)} className={inputClass} placeholder="rahul@company.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input value={form.contactPhone ?? ''} onChange={(e) => handleChange('contactPhone', e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Registered Address</h3>
                <div>
                  <label className={labelClass}>Address Line 1</label>
                  <input value={form.addressLine1 ?? ''} onChange={(e) => handleChange('addressLine1', e.target.value)} className={inputClass} placeholder="123 Business Park, MG Road" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input
                      value={form.pincode ?? ''}
                      onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={inputClass}
                      placeholder="560001"
                      maxLength={6}
                      inputMode="numeric"
                    />
                    {pincodeData && pincodeData.length > 0 && pincodeData[0] && (
                      <p className="text-xs text-emerald-600 mt-0.5">✓ {pincodeData[0].officeName}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>City</label>
                    <input value={form.city ?? ''} onChange={(e) => handleChange('city', e.target.value)} className={inputClass} placeholder="Bengaluru" />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input value={form.state ?? ''} onChange={(e) => handleChange('state', e.target.value)} className={inputClass} placeholder="Karnataka" />
                  </div>
                </div>
              </div>

              {/* Track Record */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Track Record</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Years in Business</label>
                    <input type="number" min={0} value={form.yearsInBusiness ?? ''} onChange={(e) => handleChange('yearsInBusiness', Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Projects Completed</label>
                    <input type="number" min={0} value={form.projectsCompleted ?? ''} onChange={(e) => handleChange('projectsCompleted', Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Total Area Developed</label>
                    <input value={form.totalAreaDeveloped ?? ''} onChange={(e) => handleChange('totalAreaDeveloped', e.target.value)} className={inputClass} placeholder="5 lakh sq ft" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Registering...</>
                ) : (
                  '🏢 Register Company'
                )}
              </button>

              {createMutation.isError && (
                <p className="text-sm text-red-600 text-center">Registration failed. Please check your details and try again.</p>
              )}
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-gray-900 mb-2">You're In! 🎉</h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                Your company is registered. You can now select it when creating opportunities.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
