import { useState } from 'react'
import { Building2, Plus, Search, BadgeCheck } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'

interface Props {
  value: string | undefined
  onChange: (companyId: string | undefined) => void
  onRequestOnboard: () => void
  vaultType?: string
  variant?: 'dark' | 'light'
}

export default function CompanySelector({ value, onChange, onRequestOnboard, vaultType: _vaultType, variant = 'dark' }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const { data } = useCompanies(search || undefined)
  const companies = data?.items ?? []

  const selected = companies.find((c) => c.id === value)
  const isLight = variant === 'light'

  return (
    <div className="relative">
      <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-[#3d5757]' : 'text-white/65'}`}>Company / Builder</label>

      {/* Selected display */}
      {selected ? (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${isLight ? 'border-[#c9d0ce] bg-[#f8faf9]' : 'border-white/20 bg-white/5'}`}>
          {selected.logoUrl ? (
            <img src={selected.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-[#e8eeec]' : 'bg-white/5'}`}>
              <Building2 className={`h-4 w-4 ${isLight ? 'text-[#688080]' : 'text-white/40'}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate flex items-center gap-1 ${isLight ? 'text-[#2f4a4a]' : 'text-white'}`}>
              {selected.companyName}
              {selected.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#D4AF37]" />}
            </p>
            <p className={`text-xs ${isLight ? 'text-[#748484]' : 'text-white/60'}`}>{selected.city || 'No location'}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(undefined)
              setOpen(true)
            }}
            className={`text-xs transition-colors ${isLight ? 'text-[#5f7474] hover:text-[#2f4a4a]' : 'text-white/50 hover:text-[#D4AF37]'}`}
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed text-left transition-all ${isLight ? 'border-[#c9d0ce] hover:border-[#8ba0a0] bg-[#f8faf9]' : 'border-theme hover:border-gray-400'}`}
        >
          <Building2 className={`h-5 w-5 ${isLight ? 'text-[#688080]' : 'text-theme-tertiary'}`} />
          <span className={`text-sm ${isLight ? 'text-[#5f7474]' : 'text-theme-secondary'}`}>Select or onboard a company</span>
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className={`absolute z-50 mt-1 w-full rounded-xl shadow-xl max-h-72 overflow-hidden ${isLight ? 'bg-[#f7f9f8] border border-[#d5dddb]' : 'bg-[#0d1324] border border-white/[0.08]'}`}>
          <div className={`p-2 ${isLight ? 'border-b border-[#d5dddb]' : 'border-b border-white/[0.08]'}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isLight ? 'text-[#7a8b8b]' : 'text-white/40'}`} />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border outline-none ${isLight ? 'text-[#2f4a4a] bg-[#f8faf9] placeholder-[#7a8b8b] border-[#c9d0ce] focus:border-[#2f4a4a]/45 focus:ring-1 focus:ring-[#2f4a4a]/20' : 'text-white bg-[#080d18] placeholder-white/30 border-white/15 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/30'}`}
                placeholder="Search companies..."
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {companies.length === 0 && (
              <p className={`text-sm text-center py-4 ${isLight ? 'text-[#7a8b8b]' : 'text-white/40'}`}>No companies found</p>
            )}
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id)
                  setOpen(false)
                  setSearch('')
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isLight ? 'hover:bg-[#ecf2f0]' : 'hover:bg-white/[0.06]'}`}
              >
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-[#e8eeec]' : 'bg-white/5'}`}>
                    <Building2 className={`h-4 w-4 ${isLight ? 'text-[#688080]' : 'text-white/40'}`} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate flex items-center gap-1 ${isLight ? 'text-[#2f4a4a]' : 'text-white'}`}>
                    {c.companyName}
                    {c.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#D4AF37]" />}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-[#748484]' : 'text-white/50'}`}>
                    {c.city || 'N/A'} · {c.projectsCompleted} projects
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Onboard new */}
          <div className={`p-2 ${isLight ? 'border-t border-[#d5dddb]' : 'border-t border-white/[0.08]'}`}>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onRequestOnboard()
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLight ? 'text-[#2f4a4a] hover:bg-[#eaf1ef]' : 'text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}
            >
              <Plus className="h-4 w-4" />
              Onboard New Company
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
