import { useState } from 'react'
import { Plus, Pencil, Power, Loader2 } from 'lucide-react'
import { useCommEvents, useCreateCommEvent, useUpdateCommEvent } from '@/hooks/useCommEvents'
import type { CommEvent } from '@/hooks/useCommEvents'

function EventRow({
  event,
  onEdit,
}: {
  event: CommEvent
  onEdit: (e: CommEvent) => void
}) {
  return (
    <tr className="border-b border-theme hover:bg-theme-surface/50">
      <td className="py-3 px-4">
        <span className="font-mono text-sm text-theme-primary">{event.event_name}</span>
        <span className="ml-2 text-xs text-theme-tertiary">v{event.version}</span>
      </td>
      <td className="py-3 px-4 text-sm text-theme-secondary">{event.category}</td>
      <td className="py-3 px-4">
        <div className="flex gap-1">
          {event.is_transactional && (
            <span className="text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded px-1.5 py-0.5">
              transactional
            </span>
          )}
          {event.is_promotional && (
            <span className="text-xs bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded px-1.5 py-0.5">
              promotional
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            event.enabled
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {event.enabled ? 'active' : 'disabled'}
        </span>
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => onEdit(event)}
          className="text-theme-tertiary hover:text-primary transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

export default function EventRegistry() {
  const { data: events, isLoading } = useCommEvents()
  const createEvent = useCreateCommEvent()
  const updateEvent = useUpdateCommEvent()

  const [editing, setEditing] = useState<CommEvent | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('general')

  function handleCreate() {
    if (!newName.trim()) return
    createEvent.mutate(
      { event_name: newName.trim(), category: newCategory },
      { onSuccess: () => { setShowCreate(false); setNewName(''); setNewCategory('general') } },
    )
  }

  function handleToggleEnabled(event: CommEvent) {
    updateEvent.mutate({ id: event.id, enabled: !event.enabled })
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
        <h2 className="text-lg font-semibold text-theme-primary">Event Registry</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-theme bg-[var(--bg-surface)] p-4 space-y-3">
          <p className="text-sm font-medium text-theme-primary">Register New Event</p>
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary"
              placeholder="event.name (e.g. user.welcome)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="w-36 rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary"
              placeholder="category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              onClick={handleCreate}
              disabled={createEvent.isPending}
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {createEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-theme overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-theme-surface border-b border-theme">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Event</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Category</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Type</th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Status</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {events?.map((event) => (
              <EventRow key={event.id} event={event} onEdit={setEditing} />
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="rounded-lg border border-theme bg-[var(--bg-surface)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-theme-primary">Edit: {editing.event_name}</p>
            <button onClick={() => setEditing(null)} className="text-theme-tertiary text-xs hover:text-theme-primary">
              Close
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { handleToggleEnabled(editing); setEditing(null) }}
              className="flex items-center gap-1.5 text-sm border border-theme rounded-lg px-3 py-2 hover:bg-theme-surface transition-colors"
            >
              <Power className="h-4 w-4" />
              {editing.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
