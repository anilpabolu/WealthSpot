import { useState } from 'react'
import { Building2, Plus, Search, BadgeCheck } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'

interface Props {
  value: string | undefined
  onChange: (companyId: string | undefined) => void
  onRequestOnboard: () => void
  vaultType?: string
}

export default function CompanySelector({ value, onChange, onRequestOnboard, vaultType }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const { data } = useCompanies(search || undefined, vaultType)
  const companies = data?.items ?? []

  const selected = companies.find((c) => c.id === value)

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Company / Builder</label>

      {/* Selected display */}
      {selected ? (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5">
          {selected.logoUrl ? (
            <img src={selected.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
              {selected.companyName}
              {selected.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
            </p>
            <p className="text-xs text-gray-500">{selected.city || 'No location'}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(undefined)
              setOpen(true)
            }}
            className="text-xs text-gray-500 hover:text-primary"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 text-left transition-all"
        >
          <Building2 className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">Select or onboard a company</span>
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-200 max-h-72 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Search companies..."
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {companies.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No companies found</p>
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
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
              >
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                    {c.companyName}
                    {c.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.city || 'N/A'} · {c.projectsCompleted} projects
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Onboard new */}
          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onRequestOnboard()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
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
