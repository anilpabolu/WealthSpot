import { useState, useEffect } from 'react'
import { PortalLayout } from '@/components/layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch } from '@/lib/api'
import { INDIAN_CITIES } from '@/lib/constants'
import { Select } from '@/components/ui'
import { Loader2, Save, Building2, Shield, Phone, Globe } from 'lucide-react'

interface BuilderProfile {
  id: string
  companyName: string
  reraNumber: string | null
  cin: string | null
  gstin: string | null
  website: string | null
  description: string | null
  verified: boolean
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  experienceYears: number | null
  projectsCompleted: number
  totalSqftDelivered: number
  about: string | null
  createdAt: string
}

function useBuilderProfile() {
  return useQuery({
    queryKey: ['builder-profile'],
    queryFn: () => apiGet<BuilderProfile>('/properties/builders/me'),
    staleTime: 60_000,
  })
}

function useUpdateBuilderProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, string | number | null>) =>
      apiPatch<BuilderProfile>('/properties/builders/me', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['builder-profile'] })
      qc.invalidateQueries({ queryKey: ['builder-dashboard'] })
    },
  })
}

const inputCls = 'w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none'

export default function BuilderSettingsPage() {
  const { data: profile, isLoading } = useBuilderProfile()
  const updateMutation = useUpdateBuilderProfile()
  const [form, setForm] = useState({
    companyName: '',
    reraNumber: '',
    cin: '',
    gstin: '',
    website: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    experienceYears: '' as string | number,
    projectsCompleted: '' as string | number,
    totalSqftDelivered: '' as string | number,
    about: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setForm({
      companyName: profile.companyName ?? '',
      reraNumber: profile.reraNumber ?? '',
      cin: profile.cin ?? '',
      gstin: profile.gstin ?? '',
      website: profile.website ?? '',
      description: profile.description ?? '',
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      address: profile.address ?? '',
      city: profile.city ?? '',
      experienceYears: profile.experienceYears ?? '',
      projectsCompleted: profile.projectsCompleted ?? '',
      totalSqftDelivered: profile.totalSqftDelivered ?? '',
      about: profile.about ?? '',
    })
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    await updateMutation.mutateAsync({
      company_name: form.companyName || null,
      rera_number: form.reraNumber || null,
      cin: form.cin || null,
      gstin: form.gstin || null,
      website: form.website || null,
      description: form.description || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      city: form.city || null,
      experience_years: form.experienceYears ? Number(form.experienceYears) : null,
      projects_completed: form.projectsCompleted ? Number(form.projectsCompleted) : null,
      total_sqft_delivered: form.totalSqftDelivered ? Number(form.totalSqftDelivered) : null,
      about: form.about || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (isLoading) {
    return (
      <PortalLayout variant="builder">
        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout variant="builder">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="section-title text-2xl">Settings</h1>
          <p className="text-theme-secondary mt-1">Manage your builder profile and company information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <section className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-theme-primary">Company Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Company Name *</label>
                <input required value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">City</label>
                <Select value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} placeholder="Select city" options={INDIAN_CITIES.map((c) => ({ value: c, label: c }))} searchable />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Brief description of your company" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">About</label>
              <textarea rows={3} value={form.about} onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Detailed about section shown on your profile" />
            </div>
          </section>

          {/* Regulatory */}
          <section className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-theme-primary">Regulatory & Compliance</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">RERA Number</label>
                <input value={form.reraNumber} onChange={(e) => setForm((p) => ({ ...p, reraNumber: e.target.value }))} className={inputCls} placeholder="e.g. P52100000001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">CIN</label>
                <input value={form.cin} onChange={(e) => setForm((p) => ({ ...p, cin: e.target.value }))} className={inputCls} placeholder="Corporate Identity Number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">GSTIN</label>
                <input value={form.gstin} onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))} className={inputCls} placeholder="GST Number" />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-theme-primary">Contact Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Office Address</label>
                <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Experience */}
          <section className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-violet-600" />
              <h2 className="text-sm font-semibold text-theme-primary">Experience & Track Record</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Years of Experience</label>
                <input type="number" min={0} value={form.experienceYears} onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Projects Completed</label>
                <input type="number" min={0} value={form.projectsCompleted} onChange={(e) => setForm((p) => ({ ...p, projectsCompleted: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">Total Sq.ft Delivered</label>
                <input type="number" min={0} value={form.totalSqftDelivered} onChange={(e) => setForm((p) => ({ ...p, totalSqftDelivered: e.target.value }))} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
              {updateMutation.isPending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : (<><Save className="h-4 w-4" /> Save Settings</>)}
            </button>
            {saved && <span className="text-sm text-emerald-600 font-medium">Settings saved!</span>}
            {updateMutation.isError && <span className="text-sm text-red-600">Failed to save. Please try again.</span>}
          </div>
        </form>
      </div>
    </PortalLayout>
  )
}
