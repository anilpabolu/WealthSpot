import { useState } from 'react'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { Select } from '@/components/ui'
import { useOpportunities } from '@/hooks/useOpportunities'
import {
  useCommMappings,
  useCreateCommMapping,
  useDeleteCommMapping,
  type CommMapping,
} from '@/hooks/useEOI'
import { useControlUsers } from '@/hooks/useControlCentre'
import { CenteredLoader } from './shared'

export default function CommMappingTab() {
  const [selectedOppId, setSelectedOppId] = useState('')
  const [vaultFilter, setVaultFilter] = useState('')
  const { data: oppsData } = useOpportunities(vaultFilter ? { vaultType: vaultFilter } : undefined)
  const opps = oppsData?.items ?? []
  const { data: mappings = [], isLoading } = useCommMappings(selectedOppId)
  const createMapping = useCreateCommMapping()
  const deleteMapping = useDeleteCommMapping()
  const { data: allUsers } = useControlUsers({})

  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('handler')

  const handleAdd = async () => {
    if (!selectedOppId || !userId) return
    await createMapping.mutateAsync({ opportunityId: selectedOppId, userId, role })
    setUserId('')
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-theme-primary">Communication Mapping</h2>
      <p className="text-sm text-theme-secondary">Assign users to receive notifications for each opportunity&rsquo;s Expression of Interest flow.</p>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Vault Type</label>
          <Select
            value={vaultFilter}
            onChange={(v) => { setVaultFilter(v); setSelectedOppId('') }}
            placeholder="All Vaults"
            options={[
              { value: '', label: 'All Vaults' },
              { value: 'wealth', label: 'Wealth Vault' },
              { value: 'safe', label: 'Safe Vault' },
              { value: 'community', label: 'Community Vault' },
            ]}
          />
        </div>
        <div className="flex-1 min-w-[250px]">
          <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Opportunity</label>
          <Select
            value={selectedOppId}
            onChange={setSelectedOppId}
            placeholder="Select an Opportunity"
            options={opps.map((o) => ({ value: o.id, label: `${o.title} (${o.vaultType})` }))}
            searchable
          />
        </div>
      </div>

      {selectedOppId && (
        <>
          <div className="bg-[var(--bg-card)] backdrop-blur-sm rounded-xl border border-theme/60 p-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">User</label>
              <Select value={userId} onChange={setUserId} placeholder="Select user…" searchable options={(allUsers ?? []).map((u) => ({ value: u.id, label: `${u.fullName} (${u.email})` }))} />
            </div>
            <div className="w-40">
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Role</label>
              <Select value={role} onChange={setRole} options={[
                { value: 'builder', label: 'Builder' },
                { value: 'handler', label: 'Handler' },
                { value: 'admin', label: 'Admin' },
                { value: 'platform_admin', label: 'Platform Admin' },
              ]} />
            </div>
            <button onClick={handleAdd} disabled={createMapping.isPending || !userId} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50">
              {createMapping.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-theme/60 overflow-hidden">
            {isLoading ? (
              <CenteredLoader />
            ) : mappings.length === 0 ? (
              <p className="text-sm text-theme-tertiary text-center py-8">No communication mappings yet.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-theme-surface border-b border-theme">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-theme-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {mappings.map((m: CommMapping) => (
                    <tr key={m.id} className="hover:bg-theme-surface/50">
                      <td className="px-4 py-3 text-theme-primary">{m.userId}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-surface-hover text-theme-primary capitalize">{m.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteMapping.mutate({ mappingId: m.id, opportunityId: selectedOppId })} className="text-theme-tertiary hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
