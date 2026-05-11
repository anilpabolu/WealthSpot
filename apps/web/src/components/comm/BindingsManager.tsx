import { useState } from 'react'
import { Plus, Trash2, Loader2, Link } from 'lucide-react'
import { useCommBindings, useCreateCommBinding, useUpdateCommBinding, useDeleteCommBinding } from '@/hooks/useCommBindings'
import { useCommEvents } from '@/hooks/useCommEvents'
import { useCommTemplates } from '@/hooks/useCommTemplates'
import type { CommBinding } from '@/hooks/useCommBindings'

const CHANNELS = ['email', 'sms', 'whatsapp', 'in_app']

export default function BindingsManager() {
  const { data: bindings, isLoading } = useCommBindings()
  const { data: events } = useCommEvents()
  const { data: templates } = useCommTemplates()
  const createBinding = useCreateCommBinding()
  const updateBinding = useUpdateCommBinding()
  const deleteBinding = useDeleteCommBinding()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    event_name: '',
    channel: 'email',
    template_id: '',
    priority: 100,
    enabled: true,
  })

  function handleCreate() {
    if (!form.event_name || !form.template_id) return
    createBinding.mutate(form, { onSuccess: () => setShowCreate(false) })
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
        <h2 className="text-lg font-semibold text-theme-primary">Bindings Manager</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Binding
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-theme bg-[var(--bg-surface)] p-4 space-y-3">
          <p className="text-sm font-medium text-theme-primary">Create Binding</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Event</label>
              <select
                className="w-full rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-sm text-theme-primary"
                value={form.event_name}
                onChange={(e) => setForm({ ...form, event_name: e.target.value })}
              >
                <option value="">Select event…</option>
                {events?.map((ev) => (
                  <option key={ev.id} value={ev.event_name}>
                    {ev.event_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Channel</label>
              <select
                className="w-full rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-sm text-theme-primary"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                {CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Template</label>
              <select
                className="w-full rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-sm text-theme-primary"
                value={form.template_id}
                onChange={(e) => setForm({ ...form, template_id: e.target.value })}
              >
                <option value="">Select template…</option>
                {templates
                  ?.filter((t) => t.channel === form.channel)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-theme-secondary mb-1 block">Priority</label>
              <input
                type="number"
                className="w-full rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={createBinding.isPending || !form.event_name || !form.template_id}
            className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {createBinding.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Binding'}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-theme overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-theme-surface border-b border-theme">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Event</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Channel</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Priority</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Status</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {bindings?.map((b) => (
              <tr key={b.id} className="border-b border-theme hover:bg-theme-surface/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link className="h-3.5 w-3.5 text-theme-tertiary shrink-0" />
                    <span className="font-mono text-sm text-theme-primary">{b.event_name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm capitalize text-theme-secondary">{b.channel}</td>
                <td className="py-3 px-4 text-sm text-theme-secondary">{b.priority}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => updateBinding.mutate({ id: b.id, enabled: !b.enabled })}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                      b.enabled
                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                    }`}
                  >
                    {b.enabled ? 'active' : 'disabled'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => deleteBinding.mutate(b.id)}
                    className="text-theme-tertiary hover:text-red-500 transition-colors"
                    title="Delete binding"
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
