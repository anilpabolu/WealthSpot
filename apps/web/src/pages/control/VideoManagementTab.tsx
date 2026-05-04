import { useState, useMemo } from 'react'
import { Plus, Edit3, X, Loader2, Upload, Video, Play, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Select } from '@/components/ui'
import {
  useAdminVideos,
  useVideoPagesMeta,
  useCreateAppVideo,
  useUpdateAppVideo,
  useDeleteAppVideo,
  useUploadAppVideo,
  type AppVideo,
} from '@/hooks/useAppVideos'
import { CenteredLoader } from './shared'

export default function VideoManagementTab() {
  const { data: videos, isLoading } = useAdminVideos()
  const { data: pagesMeta } = useVideoPagesMeta()
  const createVideo = useCreateAppVideo()
  const updateVideo = useUpdateAppVideo()
  const deleteVideo = useDeleteAppVideo()
  const uploadVideo = useUploadAppVideo()

  const [filterPage, setFilterPage] = useState<string>('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const [addPage, setAddPage] = useState('')
  const [addSection, setAddSection] = useState('')
  const [addTitle, setAddTitle] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addUrl, setAddUrl] = useState('')

  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editActive, setEditActive] = useState(true)

  const pages = pagesMeta?.pages ?? []
  const sectionsByPage = pagesMeta?.sections ?? {}
  const filtered = useMemo(() => (videos ?? []).filter((v) => !filterPage || v.page === filterPage), [videos, filterPage])

  const grouped = useMemo(() => filtered.reduce<Record<string, AppVideo[]>>((acc, v) => {
    (acc[v.page] ??= []).push(v)
    return acc
  }, {}), [filtered])

  const pageLabel = (p: string) => pages.find((pg) => pg.value === p)?.label ?? p
  const sectionLabel = (page: string, tag: string) =>
    sectionsByPage[page]?.find((s) => s.value === tag)?.label ?? tag

  const handleAdd = async () => {
    if (!addPage || !addSection || !addTitle || !addUrl) return
    await createVideo.mutateAsync({
      page: addPage, sectionTag: addSection, title: addTitle,
      description: addDesc || undefined, videoUrl: addUrl,
    })
    setShowAdd(false)
    setAddPage(''); setAddSection(''); setAddTitle(''); setAddDesc(''); setAddUrl('')
  }

  const handleEdit = async (id: string) => {
    await updateVideo.mutateAsync({ id, title: editTitle || undefined, description: editDesc, isActive: editActive })
    setEditId(null)
  }

  const handleUpload = async (id: string, file: File) => {
    setUploadingId(id)
    await uploadVideo.mutateAsync({ id, file })
    setUploadingId(null)
  }

  if (isLoading) return <CenteredLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-theme-primary">Video Management</h2>
          <p className="text-sm text-theme-secondary mt-1">Manage videos across all application pages. Upload, tag, and replace videos from here.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Video Slot
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-theme-primary">Filter by Page:</label>
        <Select
          value={filterPage}
          onChange={setFilterPage}
          placeholder="All Pages"
          options={[{ value: '', label: 'All Pages' }, ...pages]}
          size="sm"
        />
        <span className="text-xs text-theme-tertiary">{filtered.length} video(s)</span>
      </div>

      {showAdd && (
        <div className="bg-[var(--bg-surface)] border border-theme rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-theme-primary">Add New Video Slot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Page</label>
              <Select value={addPage} onChange={(v) => { setAddPage(v); setAddSection('') }} placeholder="Select page..." options={pages} />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Section / Tag</label>
              <Select
                value={addSection}
                onChange={setAddSection}
                placeholder="Select section..."
                options={sectionsByPage[addPage] ?? []}
                disabled={!addPage}
              />
              <p className="text-[10px] text-theme-tertiary mt-1">Or type a custom tag below</p>
              <input
                type="text"
                value={addSection}
                onChange={(e) => setAddSection(e.target.value)}
                className="w-full text-sm border border-theme rounded-lg px-3 py-2 mt-1"
                placeholder="Custom section tag..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Title</label>
              <input
                type="text"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                className="w-full text-sm border border-theme rounded-lg px-3 py-2"
                placeholder="e.g. Wealth Vault Introduction"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Video URL</label>
              <input
                type="text"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="w-full text-sm border border-theme rounded-lg px-3 py-2"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
              <textarea
                value={addDesc}
                onChange={(e) => setAddDesc(e.target.value)}
                className="w-full text-sm border border-theme rounded-lg px-3 py-2"
                rows={2}
                placeholder="Optional description..."
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAdd}
              disabled={!addPage || !addSection || !addTitle || !addUrl || createVideo.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {createVideo.isPending ? 'Creating...' : 'Create Video Slot'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-theme text-sm text-theme-secondary hover:bg-theme-surface">
              Cancel
            </button>
          </div>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-theme rounded-xl p-8 text-center">
          <Video className="h-10 w-10 text-theme-tertiary mx-auto mb-3" />
          <p className="text-theme-secondary text-sm">No videos found. Add your first video slot above.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([page, vids]) => (
          <div key={page} className="space-y-3">
            <h3 className="font-display text-sm font-bold text-theme-primary uppercase tracking-wider flex items-center gap-2">
              <Video className="h-4 w-4" />
              {pageLabel(page)}
              <span className="text-theme-tertiary font-normal">({vids.length})</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {vids.map((v) => (
                <div key={v.id} className="bg-[var(--bg-surface)] border border-theme rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 p-4">
                    <button
                      onClick={() => setPreviewUrl(v.videoUrl)}
                      className="relative shrink-0 w-40 h-24 bg-gray-900 rounded-lg overflow-hidden group/thumb"
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/thumb:bg-black/60 transition-colors">
                        <Play className="h-8 w-8 text-white/80 group-hover/thumb:text-white" />
                      </div>
                      {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-theme-primary truncate">{v.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {sectionLabel(v.page, v.sectionTag)}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              v.isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-theme-surface-hover text-theme-secondary'
                            }`}>
                              {v.isActive ? <><Eye className="h-3 w-3" /> Active</> : <><EyeOff className="h-3 w-3" /> Inactive</>}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditId(v.id); setEditTitle(v.title); setEditDesc(v.description ?? ''); setEditActive(v.isActive) }}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-theme-secondary transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <label className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-blue-600 dark:text-blue-400 cursor-pointer transition-colors" title="Upload new video">
                            <Upload className="h-4 w-4" />
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleUpload(v.id, f)
                                e.target.value = ''
                              }}
                            />
                          </label>
                          <button
                            onClick={async () => { if (confirm(`Delete "${v.title}"?`)) await deleteVideo.mutateAsync(v.id) }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:bg-red-900/30 text-theme-tertiary hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {v.description && <p className="text-xs text-theme-secondary mt-1 line-clamp-2">{v.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-theme-tertiary">
                        {v.sizeBytes && <span>{(v.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>}
                        {v.contentType && <span>{v.contentType}</span>}
                        <span>Updated {new Date(v.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {uploadingId === v.id && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400">
                          <Loader2 className="h-3 w-3 animate-spin" />Uploading...
                        </div>
                      )}
                    </div>
                  </div>

                  {editId === v.id && (
                    <div className="border-t border-theme bg-theme-surface p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-theme-secondary mb-1">Title</label>
                          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2" />
                        </div>
                        <div className="flex items-end gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="rounded border-theme" />
                            Active
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
                          <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2" rows={2} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(v.id)}
                          disabled={updateVideo.isPending}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark disabled:opacity-50"
                        >
                          {updateVideo.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg border border-theme text-xs text-theme-secondary hover:bg-theme-surface">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)} />
          <div className="relative bg-black rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src={previewUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full aspect-video"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                const fallback = target.parentElement?.querySelector('.video-error-fallback') as HTMLElement | null
                if (fallback) fallback.style.display = 'flex'
              }}
            >
              Your browser does not support video playback.
            </video>
            <div className="video-error-fallback hidden aspect-video items-center justify-center flex-col gap-3">
              <Video className="h-10 w-10 text-white/30" />
              <p className="text-white/60 text-sm">Video could not be loaded</p>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open URL in new tab</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
