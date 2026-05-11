import { useState } from 'react'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { useCommTemplates, useCreateCommTemplate, useAddTemplateVersion } from '@/hooks/useCommTemplates'
import type { CommTemplate } from '@/hooks/useCommTemplates'

const CHANNELS = ['email', 'sms', 'whatsapp', 'in_app']

function TemplateCard({
  template,
  onSelect,
  selected,
}: {
  template: CommTemplate
  onSelect: (t: CommTemplate) => void
  selected: boolean
}) {
  return (
    <button
      onClick={() => onSelect(template)}
      className={`w-full text-left rounded-lg border p-4 transition-colors ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-theme bg-[var(--bg-surface)] hover:border-primary/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <FileText className="h-4 w-4 mt-0.5 shrink-0 text-theme-tertiary" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-theme-primary truncate">{template.name}</p>
          <p className="text-xs text-theme-secondary capitalize">{template.channel}</p>
          <span
            className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded ${
              template.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            {template.status}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function TemplateLibrary() {
  const [filterChannel, setFilterChannel] = useState<string | undefined>(undefined)
  const { data: templates, isLoading } = useCommTemplates(filterChannel)
  const createTemplate = useCreateCommTemplate()

  const [selected, setSelected] = useState<CommTemplate | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newChannel, setNewChannel] = useState('email')

  // Version editor state
  const addVersion = useAddTemplateVersion(selected?.id ?? '')
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    createTemplate.mutate(
      { name: newName.trim(), channel: newChannel },
      { onSuccess: () => { setShowCreate(false); setNewName('') } },
    )
  }

  function handleAddVersion() {
    if (!selected) return
    addVersion.mutate(
      { subject: subject || null, body_text: bodyText || null },
      { onSuccess: () => { setSubject(''); setBodyText('') } },
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
        <h2 className="text-lg font-semibold text-theme-primary">Template Library</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Template
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
          <p className="text-sm font-medium text-theme-primary">New Template</p>
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary"
              placeholder="Template name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className="rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-sm text-theme-primary"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
            >
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              disabled={createTemplate.isPending}
              className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates?.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onSelect={setSelected}
            selected={selected?.id === t.id}
          />
        ))}
      </div>

      {selected && (
        <div className="rounded-xl border border-theme bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-theme-primary">{selected.name} — Add Version</p>
            <button onClick={() => setSelected(null)} className="text-xs text-theme-tertiary hover:text-theme-primary">
              Close
            </button>
          </div>
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary"
              placeholder="Subject (email only)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-theme bg-transparent px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary font-mono resize-y"
              placeholder="Body text (use {{ variable }} for Jinja2 vars)"
              rows={6}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
            <button
              onClick={handleAddVersion}
              disabled={addVersion.isPending}
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {addVersion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Version'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
