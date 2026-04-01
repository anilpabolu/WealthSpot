import { useState, useEffect, useCallback } from 'react'
import { Building2, CheckCircle2, Loader2, X, AlertTriangle, AlertCircle } from 'lucide-react'
import { useCreateCompany, type CompanyCreatePayload } from '@/hooks/useCompanies'
import { usePincodeLookup } from '@/hooks/usePincodes'
import axios from 'axios'

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null)
  const createMutation = useCreateCompany()
  const { data: pincodeData } = usePincodeLookup(form.pincode ?? '')

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  if (!open) return null

  const handlePincodeChange = (val: string) => {
    setForm((prev) => ({ ...prev, pincode: val }))
    if (fieldErrors.pincode) setFieldErrors((prev) => { const { pincode: _, ...rest } = prev; return rest })
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
    // Clear field error when user edits
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  /** Map snake_case API field names to our camelCase form keys */
  const snakeToCamelField: Record<string, string> = {
    company_name: 'companyName', brand_name: 'brandName', entity_type: 'entityType',
    rera_number: 'reraNumber', contact_name: 'contactName', contact_email: 'contactEmail',
    contact_phone: 'contactPhone', address_line1: 'addressLine1', address_line2: 'addressLine2',
    years_in_business: 'yearsInBusiness', projects_completed: 'projectsCompleted',
    total_area_developed: 'totalAreaDeveloped',
  }

  /** Parse API error response into field-level errors */
  const parseApiErrors = useCallback((error: unknown): Record<string, string> => {
    if (!axios.isAxiosError(error) || !error.response?.data) return {}
    const data = error.response.data as Record<string, unknown>

    // FastAPI validation errors: { detail: [{ loc: [..., "field"], msg: "..." }] }
    if (Array.isArray(data.detail)) {
      const errors: Record<string, string> = {}
      for (const err of data.detail as Array<{ loc?: string[]; msg?: string }>) {
        if (err.loc && err.msg) {
          const apiField = err.loc[err.loc.length - 1] ?? ''
          const formField = snakeToCamelField[apiField] ?? apiField
          errors[formField] = err.msg
        }
      }
      return errors
    }

    // Simple string error: { detail: "some message" }
    if (typeof data.detail === 'string') {
      return { _general: data.detail }
    }

    return {}
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setToast(null)

    try {
      const company = await createMutation.mutateAsync(form)
      setToast({ type: 'success', message: 'Company registered successfully! Pending admin verification.' })
      setStep('success')
      onSuccess?.(company.id)
    } catch (error) {
      const errors = parseApiErrors(error)
      if (Object.keys(errors).length > 0 && !errors._general) {
        setFieldErrors(errors)
        setToast({ type: 'warning', message: 'Please fix the highlighted fields and try again.' })
      } else {
        const message = errors._general || 'Registration failed. Please check your details and try again.'
        setToast({ type: 'error', message })
      }
    }
  }

  const handleClose = () => {
    setStep('form')
    setForm(INITIAL)
    setFieldErrors({})
    setToast(null)
    createMutation.reset()
    onClose()
  }

  const inputClass = (field?: string) => {
    const hasError = field && fieldErrors[field]
    return `w-full rounded-lg border ${hasError ? 'border-red-400 ring-1 ring-red-300 bg-red-50/30' : 'border-gray-300'} px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none`
  }
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
  const errorMsg = (field: string) => fieldErrors[field] ? (
    <p className="text-xs text-red-500 mt-0.5">{fieldErrors[field]}</p>
  ) : null

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
              <h2 className="font-display text-lg font-bold text-gray-900">Company Onboarding 🏗️</h2>
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
                    <input required value={form.companyName} onChange={(e) => handleChange('companyName', e.target.value)} className={inputClass('companyName')} placeholder="WealthSpot Developers Pvt. Ltd." />
                    {errorMsg('companyName')}
                  </div>
                  <div>
                    <label className={labelClass}>Brand Name</label>
                    <input value={form.brandName ?? ''} onChange={(e) => handleChange('brandName', e.target.value)} className={inputClass('brandName')} placeholder="WS Homes" />
                    {errorMsg('brandName')}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Entity Type *</label>
                  <select required value={form.entityType || 'private_limited'} onChange={(e) => handleChange('entityType', e.target.value)} className={inputClass('entityType')}>
                    {ENTITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {errorMsg('entityType')}
                </div>
                <div>
                  <label className={labelClass}>Vault Category *</label>
                  <select required value={form.vaultType || ''} onChange={(e) => handleChange('vaultType', e.target.value)} className={inputClass('vaultType')}>
                    <option value="" disabled>Select vault…</option>
                    <option value="wealth">Wealth Vault</option>
                    <option value="opportunity">Opportunity Vault</option>
                    <option value="community">Community Vault</option>
                  </select>
                  {errorMsg('vaultType')}
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea rows={2} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} className={inputClass('description') + ' resize-none'} placeholder="Tell us about your company…" />
                  {errorMsg('description')}
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={form.website ?? ''} onChange={(e) => handleChange('website', e.target.value)} className={inputClass('website')} placeholder="https://www.yourcompany.com" />
                  {errorMsg('website')}
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Legal & Compliance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>CIN</label>
                    <input value={form.cin ?? ''} onChange={(e) => handleChange('cin', e.target.value)} className={inputClass('cin')} placeholder="U12345MH2020PTC123456" maxLength={21} />
                    {errorMsg('cin')}
                  </div>
                  <div>
                    <label className={labelClass}>GSTIN</label>
                    <input value={form.gstin ?? ''} onChange={(e) => handleChange('gstin', e.target.value)} className={inputClass('gstin')} placeholder="29AABCT1234E1Z5" maxLength={15} />
                    {errorMsg('gstin')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>PAN</label>
                    <input value={form.pan ?? ''} onChange={(e) => handleChange('pan', e.target.value.toUpperCase())} className={inputClass('pan')} placeholder="AAAAA1234A" maxLength={10} />
                    {errorMsg('pan')}
                  </div>
                  <div>
                    <label className={labelClass}>RERA Number</label>
                    <input value={form.reraNumber ?? ''} onChange={(e) => handleChange('reraNumber', e.target.value)} className={inputClass('reraNumber')} placeholder="P52000012345" />
                    {errorMsg('reraNumber')}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Primary Contact</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input value={form.contactName ?? ''} onChange={(e) => handleChange('contactName', e.target.value)} className={inputClass('contactName')} placeholder="Rahul Sharma" />
                    {errorMsg('contactName')}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" value={form.contactEmail ?? ''} onChange={(e) => handleChange('contactEmail', e.target.value)} className={inputClass('contactEmail')} placeholder="rahul@company.com" />
                    {errorMsg('contactEmail')}
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input value={form.contactPhone ?? ''} onChange={(e) => handleChange('contactPhone', e.target.value)} className={inputClass('contactPhone')} placeholder="+91 98765 43210" />
                    {errorMsg('contactPhone')}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Registered Address</h3>
                <div>
                  <label className={labelClass}>Address Line 1</label>
                  <input value={form.addressLine1 ?? ''} onChange={(e) => handleChange('addressLine1', e.target.value)} className={inputClass('addressLine1')} placeholder="123 Business Park, MG Road" />
                  {errorMsg('addressLine1')}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input
                      value={form.pincode ?? ''}
                      onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={inputClass('pincode')}
                      placeholder="560001"
                      maxLength={6}
                      inputMode="numeric"
                    />
                    {fieldErrors.pincode ? errorMsg('pincode') : (
                      pincodeData && pincodeData.length > 0 && pincodeData[0] && (
                        <p className="text-xs text-emerald-600 mt-0.5">✓ {pincodeData[0].officeName}</p>
                      )
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>City</label>
                    <input value={form.city ?? ''} onChange={(e) => handleChange('city', e.target.value)} className={inputClass('city')} placeholder="Bengaluru" />
                    {errorMsg('city')}
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input value={form.state ?? ''} onChange={(e) => handleChange('state', e.target.value)} className={inputClass('state')} placeholder="Karnataka" />
                    {errorMsg('state')}
                  </div>
                </div>
              </div>

              {/* Track Record */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Track Record</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Years in Business</label>
                    <input type="number" min={0} value={form.yearsInBusiness ?? ''} onChange={(e) => handleChange('yearsInBusiness', Number(e.target.value))} className={inputClass('yearsInBusiness')} />
                    {errorMsg('yearsInBusiness')}
                  </div>
                  <div>
                    <label className={labelClass}>Projects Completed</label>
                    <input type="number" min={0} value={form.projectsCompleted ?? ''} onChange={(e) => handleChange('projectsCompleted', Number(e.target.value))} className={inputClass('projectsCompleted')} />
                    {errorMsg('projectsCompleted')}
                  </div>
                  <div>
                    <label className={labelClass}>Total Area Developed</label>
                    <input value={form.totalAreaDeveloped ?? ''} onChange={(e) => handleChange('totalAreaDeveloped', e.target.value)} className={inputClass('totalAreaDeveloped')} placeholder="5 lakh sq ft" />
                    {errorMsg('totalAreaDeveloped')}
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
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-gray-900 mb-2">You're In! 🎉</h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                Your company is registered and pending verification. You can now select it when creating opportunities.
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

        {/* Toast notification */}
        {toast && (
          <div className={`absolute bottom-4 left-4 right-4 flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom-2 ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
            toast.type === 'warning' ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> :
             toast.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" /> :
             <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
            <p className={`text-sm font-medium flex-1 ${
              toast.type === 'success' ? 'text-emerald-800' :
              toast.type === 'warning' ? 'text-amber-800' :
              'text-red-800'
            }`}>{toast.message}</p>
            <button onClick={() => setToast(null)} className="shrink-0 p-0.5 hover:bg-black/5 rounded">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
