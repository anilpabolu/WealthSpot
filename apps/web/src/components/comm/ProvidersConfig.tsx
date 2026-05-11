import { useState } from 'react'
import { Plus, Loader2, Server } from 'lucide-react'
import { useCommProviders, useCreateCommProvider, useUpdateCommProvider } from '@/hooks/useCommProviders'
import type { CommProvider } from '@/hooks/useCommProviders'

const CHANNELS = ['email', 'sms', 'whatsapp']
const KINDS_BY_CHANNEL: Record<string, string[]> = {
  email: ['stub', 'smtp', 'sendgrid', 'ses'],
  sms: ['stub', 'twilio', 'kaleyra'],
  whatsapp: ['stub', 'twilio', 'gupshup'],
}

export default function ProvidersConfig() {
  const { data: providers, isLoading } = useCommProviders()
  const createProvider = useCreateCommProvider()
  const updateProvider = useUpdateCommProvider()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ channel: 'email', kind: 'stub', name: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPriority, setEditPriority] = useState(100)

  function handleCreate() {
    if (!form.name.trim()) return
    createProvider.mutate(
      { ...form, name: form.name.trim() },
      { onSuccess: () => { setShowCreate(false); setForm({ channel: 'email', kind: 'stub', name: '' }) } },
    )
  }

  function handleSavePriority(provider: CommProvider) {
    updateProvider.mutate({ id: provider.id, priority: editPriority })
    setEditingId(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-theme-primary">Providers</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-theme bg-[var(--bg-surface)] p-4 space-y-3">
          <p className="text-sm font-medium text-theme-primary">Add Provider</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Channel</label>
              <select
                className="w-full rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-sm text-theme-primary"
                value={form.channel}
                onChange={(e) =>
                  setForm({ ...form, channel: e.target.value, kind: KINDS_BY_CHANNEL[e.target.value]?.[0] ?? 'stub' })
                }
              >
                {CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Kind</label>
              <select
                className="w-full rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-sm text-theme-primary"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                {(KINDS_BY_CHANNEL[form.channel] ?? ['stub']).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Name</label>
              <input
                className="w-full rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary"
                placeholder="Display name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={createProvider.isPending || !form.name.trim()}
            className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {createProvider.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {providers?.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-theme bg-[var(--bg-surface)] p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Server className="h-4 w-4 mt-0.5 shrink-0 text-theme-tertiary" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-theme-primary truncate">{p.name}</p>
                <p className="text-xs text-theme-secondary capitalize">
                  {p.channel} · {p.kind}
                </p>
              </div>
              <button
                onClick={() =>
                  updateProvider.mutate({ id: p.id, is_active: !p.is_active })
                }
                className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  p.is_active
                    ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                }`}
              >
                {p.is_active ? 'active' : 'inactive'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {editingId === p.id ? (
                <>
                  <input
                    type="number"
                    className="w-20 rounded border border-theme bg-transparent px-2 py-1 text-xs text-theme-primary"
                    value={editPriority}
                    onChange={(e) => setEditPriority(Number(e.target.value))}
                  />
                  <button
                    onClick={() => handleSavePriority(p)}
                    className="text-xs text-primary hover:underline"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-theme-tertiary hover:underline">
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setEditingId(p.id); setEditPriority(p.priority) }}
                  className="text-xs text-theme-secondary hover:text-primary transition-colors"
                >
                  Priority: {p.priority}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
