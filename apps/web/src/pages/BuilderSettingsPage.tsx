import { useState, useEffect } from 'react'
import { PortalLayout } from '@/components/layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch } from '@/lib/api'
import { INDIAN_CITIES } from '@/lib/constants'
import { Select, Input, Textarea } from '@/components/ui'
import { Loader2, Save, Building2, Shield, Phone, Globe } from 'lucide-react'

interface BuilderProfile {
  id: string
  companyName: string
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


export default function BuilderSettingsPage() {
  const { data: profile, isLoading } = useBuilderProfile()
  const updateMutation = useUpdateBuilderProfile()
  const [form, setForm] = useState({
    companyName: '',
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
    <PortalLayout 
      variant="builder"
      hero={
        <div id="hero" className="page-hero pt-[8.25rem] pb-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
          </div>
          <div className="page-hero-content flex items-center justify-between px-6 lg:px-8">
            <div className="animate-fade-up">
              <span className="page-hero-badge">Builder Portal</span>
              <h1 className="page-hero-title">Settings</h1>
              <p className="page-hero-subtitle">Manage your builder profile and company information.</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 content-section-bg min-h-full">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <section className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-theme-primary">Company Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Company Name *" required value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} />
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">City</label>
                <Select value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} placeholder="Select city" options={INDIAN_CITIES.map((c) => ({ value: c, label: c }))} searchable />
              </div>
            </div>
            <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of your company" />
            <Textarea label="About" rows={3} value={form.about} onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))} placeholder="Detailed about section shown on your profile" />
          </section>

          {/* Regulatory */}
          <section className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-theme-primary">Regulatory & Compliance</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="CIN" value={form.cin} onChange={(e) => setForm((p) => ({ ...p, cin: e.target.value }))} placeholder="Corporate Identity Number" />
              <Input label="GSTIN" value={form.gstin} onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))} placeholder="GST Number" />
            </div>
          </section>

          {/* Contact */}
          <section className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-theme-primary">Contact Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Website" type="url" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
              <Input label="Office Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
          </section>

          {/* Experience */}
          <section className="bg-[var(--bg-surface)] rounded-xl border border-theme p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-violet-600" />
              <h2 className="text-sm font-semibold text-theme-primary">Experience & Track Record</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Years of Experience" type="number" min={0} value={form.experienceYears} onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))} />
              <Input label="Projects Completed" type="number" min={0} value={form.projectsCompleted} onChange={(e) => setForm((p) => ({ ...p, projectsCompleted: e.target.value }))} />
              <Input label="Total Sq.ft Delivered" type="number" min={0} value={form.totalSqftDelivered} onChange={(e) => setForm((p) => ({ ...p, totalSqftDelivered: e.target.value }))} />
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
