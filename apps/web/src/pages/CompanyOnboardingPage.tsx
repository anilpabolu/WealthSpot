import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
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

export default function CompanyOnboardingPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CompanyCreatePayload>(INITIAL)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const createMutation = useCreateCompany()
  const { data: pincodeData } = usePincodeLookup(form.pincode ?? '')

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

  // Auto-fill from pincode
  const handlePincodeChange = (val: string) => {
    setForm((prev) => ({ ...prev, pincode: val }))
  }

  const handleChange = (field: keyof CompanyCreatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMutation.mutateAsync(form)
      setStep('success')
    } catch {
      // error
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <MainLayout>
      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">Onboarding</span>
          <h1 className="page-hero-title">Company Onboarding</h1>
          <p className="page-hero-subtitle">Get your company on the map — register once, create unlimited opportunities</p>
        </div>
      </section>

      <div className="page-section">
        <div className="page-section-container max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step === 'form' && (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section: Basic Info */}
              <div className="card p-6 space-y-4">
                <h3 className="section-title text-sm uppercase tracking-wider">Basic Information</h3>
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
                    {ENTITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Vault Category *</label>
                  <select required value={form.vaultType || ''} onChange={(e) => handleChange('vaultType', e.target.value)} className={inputClass}>
                    <option value="" disabled>Select vault…</option>
                    <option value="wealth">Wealth Vault</option>
                    <option value="opportunity">Opportunity Vault</option>
                    <option value="community">Community Vault</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea rows={3} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} className={inputClass + ' resize-none'} placeholder="Tell us about your company — what you build, where you operate..." />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={form.website ?? ''} onChange={(e) => handleChange('website', e.target.value)} className={inputClass} placeholder="https://www.yourcompany.com" />
                </div>
              </div>

              {/* Section: Legal */}
              <div className="card p-6 space-y-4">
                <h3 className="section-title text-sm uppercase tracking-wider">Legal & Compliance</h3>
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

              {/* Section: Contact */}
              <div className="card p-6 space-y-4">
                <h3 className="section-title text-sm uppercase tracking-wider">Primary Contact</h3>
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

              {/* Section: Address */}
              <div className="card p-6 space-y-4">
                <h3 className="section-title text-sm uppercase tracking-wider">Registered Address</h3>
                <div>
                  <label className={labelClass}>Address Line 1</label>
                  <input value={form.addressLine1 ?? ''} onChange={(e) => handleChange('addressLine1', e.target.value)} className={inputClass} placeholder="123 Business Park, MG Road" />
                </div>
                <div>
                  <label className={labelClass}>Address Line 2</label>
                  <input value={form.addressLine2 ?? ''} onChange={(e) => handleChange('addressLine2', e.target.value)} className={inputClass} placeholder="Floor 5, Tower B" />
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

              {/* Section: Track Record */}
              <div className="card p-6 space-y-4">
                <h3 className="section-title text-sm uppercase tracking-wider">Track Record</h3>
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

              {/* Submit */}
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
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-16">
            <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">You're In! 🎉</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
              Your company profile is with the gatekeepers now. Once they give the green signal, you can start launching opportunities like a pro.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/vaults')}
                className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
              >
                Go to Vaults
              </button>
              <button
                onClick={() => { setStep('form'); setForm(INITIAL) }}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-stone-50"
              >
                Register Another
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  )
}
