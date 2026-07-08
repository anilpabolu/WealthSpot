import { useEffect } from 'react'
import { Calendar, FolderKanban, Ruler, Building2, BadgeCheck, MapPin, Globe, X } from 'lucide-react'

export interface CompanyData {
  companyName: string
  brandName?: string | null
  logoUrl?: string | null
  verified?: boolean
  entityType?: string | null
  website?: string | null
  description?: string | null
  city?: string | null
  state?: string | null
  yearsInBusiness?: number | null
  projectsCompleted?: number
  totalAreaDeveloped?: string | null
}

export function CompanyInfoModal({ company, onClose }: { company: CompanyData; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const stats = [
    company.yearsInBusiness != null && { label: 'Years in Industry', value: `${company.yearsInBusiness}+`, icon: Calendar },
    company.projectsCompleted != null && company.projectsCompleted > 0 && { label: 'Projects Completed', value: String(company.projectsCompleted), icon: FolderKanban },
    company.totalAreaDeveloped && { label: 'Area Developed', value: company.totalAreaDeveloped, icon: Ruler },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: typeof Calendar }>

  const entityLabel = company.entityType
    ? company.entityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null

  return (
    <div className="modal-overlay p-4">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-panel max-w-lg relative">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="font-display text-lg font-bold text-theme-primary">Developer / Company</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Company identity */}
          <div className="flex items-center gap-4">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.companyName} className="h-16 w-16 rounded-xl object-contain border border-theme" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-theme-surface-hover flex items-center justify-center">
                <Building2 className="h-8 w-8 text-theme-tertiary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-theme-primary truncate">{company.companyName}</h3>
                {company.verified && <BadgeCheck className="h-5 w-5 text-primary shrink-0" />}
              </div>
              {company.brandName && <p className="text-sm text-theme-secondary">{company.brandName}</p>}
              {entityLabel && <p className="text-xs text-theme-tertiary mt-0.5">{entityLabel}</p>}
            </div>
          </div>

          {/* Stats grid */}
          {stats.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-primary/5 rounded-xl p-4 text-center">
                    <Icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
                    <p className="font-mono text-lg font-bold text-theme-primary">{s.value}</p>
                    <p className="text-[11px] text-theme-secondary font-medium mt-0.5">{s.label}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Description */}
          {company.description && (
            <div>
              <h4 className="text-xs font-semibold text-theme-secondary uppercase mb-2">About</h4>
              <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-line">{company.description}</p>
            </div>
          )}

          {/* Details list */}
          <div className="space-y-3">
            {(company.city || company.state) && (
              <div className="flex items-center gap-3 p-3 bg-theme-surface rounded-lg">
                <MapPin className="h-5 w-5 text-theme-tertiary shrink-0" />
                <div>
                  <p className="text-xs text-theme-secondary">Headquartered In</p>
                  <p className="text-sm font-semibold text-theme-primary">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-3 p-3 bg-theme-surface rounded-lg">
                <Globe className="h-5 w-5 text-theme-tertiary shrink-0" />
                <div>
                  <p className="text-xs text-theme-secondary">Website</p>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">{company.website.replace(/^https?:\/\//, '')}</a>
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          <button onClick={onClose} className="btn-secondary w-full py-2.5">Close</button>
        </div>
      </div>
    </div>
  )
}
