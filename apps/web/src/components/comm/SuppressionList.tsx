import { useState } from 'react'
import { Plus, Trash2, Loader2, ShieldOff } from 'lucide-react'
import { useCommSuppression, useCreateCommSuppression, useDeleteCommSuppression } from '@/hooks/useCommSuppression'

const CHANNELS = ['email', 'sms', 'whatsapp']
const REASONS = ['unsubscribe', 'bounce', 'spam', 'admin', 'user_request']

export default function SuppressionList() {
  const [filterChannel, setFilterChannel] = useState<string | undefined>(undefined)
  const { data: entries, isLoading } = useCommSuppression(filterChannel)
  const createSuppression = useCreateCommSuppression()
  const deleteSuppression = useDeleteCommSuppression()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ channel: 'email', identifier: '', reason: 'admin', note: '' })

  function handleCreate() {
    if (!form.identifier.trim()) return
    createSuppression.mutate(
      { ...form, identifier: form.identifier.trim(), note: form.note || null },
      { onSuccess: () => { setShowCreate(false); setForm({ channel: 'email', identifier: '', reason: 'admin', note: '' }) } },
    )
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
        <h2 className="text-lg font-semibold text-theme-primary">Suppression List</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Suppression
        </button>
      </div>

      {/* Channel filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterChannel(undefined)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            !filterChannel ? 'border-primary text-primary bg-primary/5' : 'border-theme text-theme-secondary'
          }`}
        >
          All
        </button>
        {CHANNELS.map((ch) => (
          <button
            key={ch}
            onClick={() => setFilterChannel(ch)}
            className={`text-xs px-3 py-1 rounded-full border capitalize transition-colors ${
              filterChannel === ch ? 'border-primary text-primary bg-primary/5' : 'border-theme text-theme-secondary'
            }`}
          >
            {ch}
          </button>
        ))}
      </div>

      {showCreate && (
        <div className="rounded-lg border border-theme bg-[var(--bg-surface)] p-4 space-y-3">
          <p className="text-sm font-medium text-theme-primary">Add to Suppression List</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Channel</label>
              <select
                className="w-full rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-sm text-theme-primary"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                {CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Reason</label>
              <select
                className="w-full rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-sm text-theme-primary"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              >
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-theme-secondary mb-1 block">Identifier (email or phone)</label>
              <input
                className="w-full rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary"
                placeholder="user@example.com or +91XXXXXXXXXX"
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-theme-secondary mb-1 block">Note (optional)</label>
              <input
                className="w-full rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary"
                placeholder="Internal note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={createSuppression.isPending || !form.identifier.trim()}
            className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {createSuppression.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-theme overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-theme-surface border-b border-theme">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Identifier</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Channel</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Reason</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Added</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {entries?.map((e) => (
              <tr key={`${e.channel}-${e.identifier}`} className="border-b border-theme hover:bg-theme-surface/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <ShieldOff className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="text-sm text-theme-primary">{e.identifier}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm capitalize text-theme-secondary">{e.channel}</td>
                <td className="py-3 px-4">
                  <span className="text-xs bg-red-500/10 text-red-500 rounded px-1.5 py-0.5">{e.reason}</span>
                </td>
                <td className="py-3 px-4 text-xs text-theme-tertiary">
                  {new Date(e.added_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => deleteSuppression.mutate({ channel: e.channel, identifier: e.identifier })}
                    className="text-theme-tertiary hover:text-red-500 transition-colors"
                    title="Remove suppression"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
