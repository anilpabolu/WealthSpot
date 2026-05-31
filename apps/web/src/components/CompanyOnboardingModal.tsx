import { useState, useEffect, useCallback } from 'react'
import { Select, Input, Textarea } from '@/components/ui'
import { Building2, Loader2, X, AlertTriangle, AlertCircle } from 'lucide-react'
import { useCreateCompany, type CompanyCreatePayload } from '@/hooks/useCompanies'
import { usePincodeLookup } from '@/hooks/usePincodes'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { useCompanyFormConfig } from '@/hooks/useControlCentre'
import { useToastStore } from '@/stores/toastStore'
import axios from 'axios'
import { ENTITY_TYPES } from '@/lib/constants'

const INITIAL: CompanyCreatePayload = {
  companyName: '',
  entityType: 'private_limited',
  country: 'India',
}

const VAULT_LABELS: Record<string, string> = {
  wealth: 'Wealth Vault',
  safe: 'Safe Vault',
  community: 'Community Vault',
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: (companyId: string) => void
  /** Pre-selects and locks the vault category for the originating opportunity */
  vaultType?: string
}

export default function CompanyOnboardingModal({ open, onClose, onSuccess, vaultType }: Props) {
  const [form, setForm] = useState<CompanyCreatePayload>(INITIAL)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [toast, setToast] = useState<{ type: 'warning' | 'error'; message: string } | null>(null)
  const createMutation = useCreateCompany()
  const { data: pincodeData } = usePincodeLookup(form.pincode ?? '')
  const { isVaultEnabled } = useVaultConfig()
  const { requiredFields } = useCompanyFormConfig()

  // Pre-fill vault type from parent context when modal opens
  useEffect(() => {
    if (open && vaultType) {
      setForm((prev) => ({ ...prev, vaultType }))
    }
  }, [open, vaultType])

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  /** Client-side form validation */
  const validateForm = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!form.companyName?.trim()) errors.companyName = 'Company name is required'
    if (!form.entityType) errors.entityType = 'Entity type is required'
    if (!form.vaultType) errors.vaultType = 'Vault category is required'

    const isRequired = (field: string) => requiredFields.includes(field)

    if (isRequired('contactName') && !form.contactName?.trim()) {
      errors.contactName = 'Contact name is required'
    }
    if (isRequired('contactEmail') || form.contactEmail?.trim()) {
      if (!form.contactEmail?.trim()) {
        if (isRequired('contactEmail')) errors.contactEmail = 'Contact email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
        errors.contactEmail = 'Enter a valid email address'
      }
    }
    if (isRequired('contactPhone') && !form.contactPhone?.trim()) {
      errors.contactPhone = 'Contact phone is required'
    } else if (form.contactPhone?.trim() && !/^[\d\s+\-()]{10,}$/.test(form.contactPhone.trim())) {
      errors.contactPhone = 'Enter a valid phone number'
    }
    if (isRequired('addressLine1') && !form.addressLine1?.trim()) {
      errors.addressLine1 = 'Address is required'
    }
    if (isRequired('city') && !form.city?.trim()) errors.city = 'City is required'
    if (isRequired('state') && !form.state?.trim()) errors.state = 'State is required'
    if (isRequired('pincode') && !form.pincode?.trim()) errors.pincode = 'Pincode is required'

    return errors
  }, [form, requiredFields])

  // Auto-fill city/state from pincode
  useEffect(() => {
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
  }, [pincodeData, form.pincode, form.city])

  /** Map snake_case API field names to our camelCase form keys */
  const snakeToCamelField: Record<string, string> = {
    company_name: 'companyName', brand_name: 'brandName', entity_type: 'entityType',
    contact_name: 'contactName', contact_email: 'contactEmail',
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePincodeChange = useCallback((val: string) => {
    setForm((prev) => ({ ...prev, pincode: val }))
    setFieldErrors((prev) => { const { pincode: _, ...rest } = prev; return rest })
  }, [])

  const handleChange = useCallback((field: keyof CompanyCreatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    setToast(null)

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setToast({ type: 'warning', message: 'Please fill in all required fields before submitting.' })
      return
    }

    setFieldErrors({})

    try {
      const company = await createMutation.mutateAsync(form)
      onSuccess?.(company.id)
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Company Submitted!',
        message: `Your company profile is now with our verification team. Once approved, you'll be ready to create and list opportunities on WealthSpot.`,
      })
      handleClose()
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
    setForm(INITIAL)
    setFieldErrors({})
    setSubmitAttempted(false)
    setToast(null)
    createMutation.reset()
    onClose()
  }

  if (!open) return null

  const labelClass = 'block text-[var(--text-tertiary)] text-[11px] font-bold uppercase tracking-wider mb-1.5'
  const sectionHeading = 'font-display text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider shrink-0'
  const errorMsg = (field: string) => (submitAttempted || fieldErrors[field]) && fieldErrors[field] ? (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3 shrink-0" />{fieldErrors[field]}
    </p>
  ) : null
  const isRequired = (field: string) => requiredFields.includes(field)
  const req = (field: string) => isRequired(field) ? ' *' : ''

  return (
    <div className="modal-overlay z-[10000]">
      <div
        className="modal-panel max-w-2xl mx-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — dark navy + gold, matching the wizard step headers */}
        <div className="sticky top-0 z-10 rounded-t-2xl overflow-hidden">
          <div className="bg-[#0A1A2F] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">Company Onboarding</h2>
                <p className="text-white/50 text-xs mt-0.5 font-medium">
                  {vaultType && VAULT_LABELS[vaultType]
                    ? <>Register for <span className="text-[#D4AF37] font-semibold">{VAULT_LABELS[vaultType]}</span> opportunities</>
                    : 'Register your company to list investment opportunities'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white/50 hover:text-white transition-colors" />
            </button>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-[#D4AF37]/60 via-[#D4AF37]/30 to-transparent" />
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={sectionHeading}>Basic Information</h3>
                <div className="flex-1 h-px bg-[rgba(209,196,157,0.25)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Company Name *"
                  required
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="WealthSpot Developers Pvt. Ltd."
                  error={fieldErrors.companyName}
                />
                <Input
                  label="Brand Name"
                  value={form.brandName ?? ''}
                  onChange={(e) => handleChange('brandName', e.target.value)}
                  placeholder="WS Homes"
                  error={fieldErrors.brandName}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Entity Type *</label>
                  <Select
                    value={form.entityType || 'private_limited'}
                    onChange={(v) => handleChange('entityType', v)}
                    options={ENTITY_TYPES}
                  />
                  {errorMsg('entityType')}
                </div>
                <div>
                  <label className={labelClass}>Vault Category *</label>
                  <Select
                    value={form.vaultType || ''}
                    onChange={(v) => handleChange('vaultType', v)}
                    placeholder="Select vault..."
                    options={[
                      { value: 'wealth', label: 'Wealth Vault' },
                      { value: 'safe', label: isVaultEnabled('safe') ? 'Safe Vault' : 'Safe Vault (Coming Soon)', disabled: !isVaultEnabled('safe') },
                      { value: 'community', label: isVaultEnabled('community') ? 'Community Vault' : 'Community Vault (Coming Soon)', disabled: !isVaultEnabled('community') },
                    ]}
                  />
                  {errorMsg('vaultType')}
                </div>
              </div>
              <Textarea
                label="Description"
                rows={2}
                value={form.description ?? ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Tell us about your company..."
                error={fieldErrors.description}
              />
              <Input
                label="Website"
                type="url"
                value={form.website ?? ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.yourcompany.com"
                error={fieldErrors.website}
              />
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={sectionHeading}>Legal & Compliance</h3>
                <div className="flex-1 h-px bg-[rgba(209,196,157,0.25)]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="CIN" value={form.cin ?? ''} onChange={(e) => handleChange('cin', e.target.value)} placeholder="U12345MH2020PTC123456" maxLength={21} error={fieldErrors.cin} />
                <Input label="GSTIN" value={form.gstin ?? ''} onChange={(e) => handleChange('gstin', e.target.value)} placeholder="29AABCT1234E1Z5" maxLength={15} error={fieldErrors.gstin} />
                <Input label="PAN" value={form.pan ?? ''} onChange={(e) => handleChange('pan', e.target.value.toUpperCase())} className="[&_input]:uppercase" placeholder="AAAAA1234A" maxLength={10} error={fieldErrors.pan} />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={sectionHeading}>Primary Contact</h3>
                <div className="flex-1 h-px bg-[rgba(209,196,157,0.25)]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label={`Contact Name${req('contactName')}`} value={form.contactName ?? ''} onChange={(e) => handleChange('contactName', e.target.value)} placeholder="Rahul Sharma" error={fieldErrors.contactName} />
                <Input label={`Email${req('contactEmail')}`} type="email" value={form.contactEmail ?? ''} onChange={(e) => handleChange('contactEmail', e.target.value)} placeholder="rahul@company.com" error={fieldErrors.contactEmail} />
                <Input label={`Phone${req('contactPhone')}`} type="tel" value={form.contactPhone ?? ''} onChange={(e) => handleChange('contactPhone', e.target.value)} placeholder="+91 98765 43210" error={fieldErrors.contactPhone} />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={sectionHeading}>Registered Address</h3>
                <div className="flex-1 h-px bg-[rgba(209,196,157,0.25)]" />
              </div>
              <Input
                label={`Address Line 1${req('addressLine1')}`}
                value={form.addressLine1 ?? ''}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                placeholder="123 Business Park, MG Road"
                error={fieldErrors.addressLine1}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label={`Pincode${req('pincode')}`}
                  value={form.pincode ?? ''}
                  onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="560001"
                  maxLength={6}
                  inputMode="numeric"
                  error={fieldErrors.pincode}
                  successText={!fieldErrors.pincode && pincodeData?.length && pincodeData[0] ? `✓ ${pincodeData[0].officeName}` : undefined}
                />
                <Input label={`City${req('city')}`} value={form.city ?? ''} onChange={(e) => handleChange('city', e.target.value)} placeholder="Bengaluru" error={fieldErrors.city} />
                <Input label={`State${req('state')}`} value={form.state ?? ''} onChange={(e) => handleChange('state', e.target.value)} placeholder="Karnataka" error={fieldErrors.state} />
              </div>
            </div>

            {/* Track Record */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={sectionHeading}>Track Record</h3>
                <div className="flex-1 h-px bg-[rgba(209,196,157,0.25)]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Years in Business" type="number" min={0} value={form.yearsInBusiness ?? ''} onChange={(e) => handleChange('yearsInBusiness', Number(e.target.value))} error={fieldErrors.yearsInBusiness} />
                <Input label="Projects Completed" type="number" min={0} value={form.projectsCompleted ?? ''} onChange={(e) => handleChange('projectsCompleted', Number(e.target.value))} error={fieldErrors.projectsCompleted} />
                <Input label="Total Area Developed" value={form.totalAreaDeveloped ?? ''} onChange={(e) => handleChange('totalAreaDeveloped', e.target.value)} placeholder="5 lakh sq ft" error={fieldErrors.totalAreaDeveloped} />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0A1A2F] text-[#D4AF37] font-bold text-sm border border-[#D4AF37]/30 hover:bg-[#0d2240] hover:border-[#D4AF37]/60 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Registering...</>
              ) : (
                'Register Company'
              )}
            </button>
          </form>
        </div>

        {/* Toast — validation / API errors */}
        {toast && (
          <div className={`absolute bottom-4 left-4 right-4 flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom-2 ${
            toast.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/40'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/40'
          }`}>
            {toast.type === 'warning'
              ? <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              : <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
            <p className={`text-sm font-medium flex-1 ${
              toast.type === 'warning' ? 'text-amber-800 dark:text-amber-200' : 'text-red-800 dark:text-red-200'
            }`}>{toast.message}</p>
            <button onClick={() => setToast(null)} className="shrink-0 p-0.5 hover:bg-black/5 rounded">
              <X className="h-4 w-4 text-theme-tertiary" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
