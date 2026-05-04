import { useState, useEffect, useRef } from 'react'
import { Plus, Loader2, Edit3, Trash2, X, Upload, FileText } from 'lucide-react'
import { useOpportunities } from '@/hooks/useOpportunities'
import {
  useBuilderUpdates, useCreateBuilderUpdate, useDeleteBuilderUpdate,
  usePatchBuilderUpdate, useUploadBuilderAttachment, useDeleteBuilderAttachment,
  type BuilderUpdate,
} from '@/hooks/useBuilderUpdates'
import { CenteredLoader } from './shared'

export default function BuilderUpdatesTab() {
  const { data: oppsData, isLoading: oppsLoading } = useOpportunities({})
  const [selectedOppId, setSelectedOppId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const first = oppsData?.items?.[0]
    if (first && !selectedOppId) {
      setSelectedOppId(first.id)
    }
  }, [oppsData?.items, selectedOppId])

  const { data: updatesData, isLoading: updatesLoading } = useBuilderUpdates(selectedOppId || undefined)
  const createUpdate = useCreateBuilderUpdate(selectedOppId)
  const deleteUpdate = useDeleteBuilderUpdate(selectedOppId)
  const patchUpdate = usePatchBuilderUpdate(selectedOppId)
  const uploadAtt = useUploadBuilderAttachment(selectedOppId)
  const deleteAtt = useDeleteBuilderAttachment(selectedOppId)

  const updates: BuilderUpdate[] = updatesData ?? []

  const resetForm = () => {
    setTitle(''); setDesc(''); setEditId(null); setShowForm(false)
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    if (editId) {
      patchUpdate.mutate({ id: editId, title, description: desc }, { onSuccess: resetForm })
    } else {
      createUpdate.mutate({ title, description: desc }, { onSuccess: resetForm })
    }
  }

  const handleEdit = (u: BuilderUpdate) => {
    setEditId(u.id); setTitle(u.title); setDesc(u.description ?? ''); setShowForm(true)
  }

  const handleFileUpload = async (updateId: string, files: FileList | null) => {
    if (!files) return
    for (const f of Array.from(files)) {
      await uploadAtt.mutateAsync({ updateId, file: f })
    }
  }

  if (oppsLoading) return <CenteredLoader />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Builder Updates</h2>
        <p className="text-sm text-theme-secondary mt-1">Post and manage construction or progress updates for opportunities.</p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <select
          value={selectedOppId}
          onChange={(e) => { setSelectedOppId(e.target.value); resetForm() }}
          className="rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary min-w-[240px]"
        >
          {(oppsData?.items ?? []).map((opp) => (
            <option key={opp.id} value={opp.id}>{opp.title}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditId(null); setTitle(''); setDesc(''); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="h-4 w-4" /> New Update
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-primary">{editId ? 'Edit Update' : 'New Update'}</h3>
            <button onClick={resetForm} className="p-1 rounded hover:bg-theme-surface">
              <X className="h-4 w-4 text-theme-tertiary" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Roofing completed — Block A"
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder="Detailed update description..."
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-theme text-sm text-theme-secondary hover:bg-theme-surface">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || createUpdate.isPending || patchUpdate.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
              >
                {(createUpdate.isPending || patchUpdate.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Save Changes' : 'Post Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedOppId ? (
        <p className="text-sm text-theme-tertiary py-8 text-center">Select an opportunity to view updates.</p>
      ) : updatesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-theme-tertiary" />
        </div>
      ) : updates.length === 0 ? (
        <div className="card p-8 text-center">
          <FileText className="h-8 w-8 text-theme-tertiary mx-auto mb-2" />
          <p className="text-sm text-theme-tertiary">No updates posted yet for this opportunity.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((u) => (
            <div key={u.id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="font-semibold text-theme-primary">{u.title}</h4>
                  <p className="text-xs text-theme-tertiary mt-0.5">
                    {new Date(u.createdAt).toLocaleDateString()} • {u.creator?.fullName ?? 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(u)}
                    className="p-1.5 rounded-lg hover:bg-theme-surface text-theme-tertiary hover:text-theme-primary transition-colors"
                    title="Edit update"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteUpdate.mutate(u.id)}
                    disabled={deleteUpdate.isPending}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-theme-tertiary hover:text-red-600 transition-colors"
                    title="Delete update"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {u.description && (
                <p className="text-sm text-theme-secondary whitespace-pre-wrap leading-relaxed mb-3">{u.description}</p>
              )}

              {u.attachments && u.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {u.attachments.map((a) => (
                    <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-theme-surface rounded-md border border-theme text-xs text-theme-secondary">
                      <FileText className="h-3.5 w-3.5 text-theme-tertiary" />
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                        {a.filename}
                      </a>
                      <button
                        onClick={() => deleteAtt.mutate(a.id)}
                        className="ml-1 text-theme-tertiary hover:text-red-500 transition-colors"
                        title="Remove attachment"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <input
                  type="file"
                  multiple
                  ref={fileRef}
                  className="hidden"
                  id={`file-upload-${u.id}`}
                  onChange={(e) => handleFileUpload(u.id, e.target.files)}
                />
                <label
                  htmlFor={`file-upload-${u.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-theme text-xs text-theme-tertiary hover:text-theme-secondary hover:border-theme-secondary cursor-pointer transition-colors"
                >
                  {uploadAtt.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Attach files
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
