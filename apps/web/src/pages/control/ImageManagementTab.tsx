import { useMemo, useState } from 'react'
import { Edit3, Eye, EyeOff, Image as ImageIcon, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { Select } from '@/components/ui'
import {
  useAdminImages,
  useCreateAppImage,
  useDeleteAppImage,
  useImagePagesMeta,
  useUpdateAppImage,
  useUploadAppImage,
  type AppImage,
} from '@/hooks/useAppImages'
import { CenteredLoader } from './shared'

const HOME_HERO_PAGE = 'home'
const HOME_HERO_TAG = 'hero_image'
const DEFAULT_HOME_HERO_IMAGE = '/wealthspot-investment-journey.png'

function formatBytes(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageManagementTab() {
  const { data: images, isLoading } = useAdminImages()
  const { data: pagesMeta } = useImagePagesMeta()
  const createImage = useCreateAppImage()
  const updateImage = useUpdateAppImage()
  const deleteImage = useDeleteAppImage()
  const uploadImage = useUploadAppImage()

  const [filterPage, setFilterPage] = useState<string>('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const [addPage, setAddPage] = useState(HOME_HERO_PAGE)
  const [addSection, setAddSection] = useState(HOME_HERO_TAG)
  const [addTitle, setAddTitle] = useState('Homepage Investment Journey Hero')
  const [addDesc, setAddDesc] = useState('Primary pre-login homepage hero image.')
  const [addAlt, setAddAlt] = useState('WealthSpot investment journey from opportunity discovery to deal closure')
  const [addUrl, setAddUrl] = useState(DEFAULT_HOME_HERO_IMAGE)

  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editActive, setEditActive] = useState(true)

  const pages = pagesMeta?.pages ?? []
  const sectionsByPage = pagesMeta?.sections ?? {}
  const filtered = useMemo(() => (images ?? []).filter((img) => !filterPage || img.page === filterPage), [images, filterPage])

  const grouped = useMemo(() => filtered.reduce<Record<string, AppImage[]>>((acc, img) => {
    (acc[img.page] ??= []).push(img)
    return acc
  }, {}), [filtered])

  const homeHero = images?.find((img) => img.page === HOME_HERO_PAGE && img.sectionTag === HOME_HERO_TAG)
  const pageLabel = (page: string) => pages.find((pg) => pg.value === page)?.label ?? page
  const sectionLabel = (page: string, tag: string) => sectionsByPage[page]?.find((s) => s.value === tag)?.label ?? tag

  const resetAddForm = () => {
    setAddPage(HOME_HERO_PAGE)
    setAddSection(HOME_HERO_TAG)
    setAddTitle('Homepage Investment Journey Hero')
    setAddDesc('Primary pre-login homepage hero image.')
    setAddAlt('WealthSpot investment journey from opportunity discovery to deal closure')
    setAddUrl(DEFAULT_HOME_HERO_IMAGE)
  }

  const handleEnsureHomeHero = async () => {
    if (homeHero) return
    await createImage.mutateAsync({
      page: HOME_HERO_PAGE,
      sectionTag: HOME_HERO_TAG,
      title: 'Homepage Investment Journey Hero',
      description: 'Primary pre-login homepage hero image. Replace this from Command & Control without changing code.',
      imageUrl: DEFAULT_HOME_HERO_IMAGE,
      altText: 'WealthSpot investment journey from opportunity discovery to deal closure',
      isActive: true,
      sortOrder: 1,
    })
  }

  const handleAdd = async () => {
    if (!addPage || !addSection || !addTitle || !addUrl) return
    await createImage.mutateAsync({
      page: addPage,
      sectionTag: addSection,
      title: addTitle,
      description: addDesc || undefined,
      imageUrl: addUrl,
      altText: addAlt || undefined,
    })
    setShowAdd(false)
    resetAddForm()
  }

  const handleEdit = async (id: string) => {
    await updateImage.mutateAsync({
      id,
      title: editTitle || undefined,
      description: editDesc,
      altText: editAlt,
      isActive: editActive,
    })
    setEditId(null)
  }

  const handleUpload = async (id: string, file: File) => {
    setUploadingId(id)
    try {
      await uploadImage.mutateAsync({ id, file })
    } finally {
      setUploadingId(null)
    }
  }

  if (isLoading) return <CenteredLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-theme-primary">Image Management</h2>
          <p className="text-sm text-theme-secondary mt-1">
            Replace the home page hero image and manage app-wide image slots without code changes.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Image Slot
        </button>
      </div>

      <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Home Page Hero</p>
            <h3 className="mt-2 font-display text-lg font-bold text-white">Investment journey image</h3>
            <p className="mt-1 text-sm text-white/60 max-w-2xl">
              This controls the large image shown on the public pre-login home page. Upload a wide, high-resolution image for best readability.
            </p>
          </div>
          {!homeHero && (
            <button
              onClick={handleEnsureHomeHero}
              disabled={createImage.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-[#F5D76E] disabled:opacity-60"
            >
              {createImage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Home Hero Slot
            </button>
          )}
        </div>

        {homeHero ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] items-start">
            <button
              onClick={() => setPreviewUrl(homeHero.imageUrl)}
              className="group relative overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-white shadow-2xl"
            >
              <img src={homeHero.imageUrl} alt={homeHero.altText ?? homeHero.title} className="aspect-[16/9] w-full object-contain" />
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/30 group-hover:opacity-100">
                Preview image
              </span>
            </button>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/45 text-xs uppercase tracking-wider">Current slot</p>
                <p className="text-white font-semibold">{homeHero.title}</p>
                <p className="text-white/55 mt-1">{homeHero.altText}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold uppercase tracking-wider ${homeHero.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/55'}`}>
                  {homeHero.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {homeHero.isActive ? 'Active' : 'Inactive'}
                </span>
                {homeHero.contentType && <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/65">{homeHero.contentType}</span>}
                {formatBytes(homeHero.sizeBytes) && <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/65">{formatBytes(homeHero.sizeBytes)}</span>}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-[#F5D76E]">
                {uploadingId === homeHero.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Replace Home Hero Image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(homeHero.id, file)
                    e.target.value = ''
                  }}
                />
              </label>
              <p className="text-xs text-white/45">Allowed: PNG, JPG, WebP, SVG up to 15 MB.</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-white/15 p-6 text-sm text-white/55">
            Home hero slot is not created yet. Create it to allow admin uploads.
          </div>
        )}
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
        <span className="text-xs text-theme-tertiary">{filtered.length} image(s)</span>
      </div>

      {showAdd && (
        <div className="bg-[var(--bg-surface)] border border-theme rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-theme-primary">Add New Image Slot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Page</label>
              <Select value={addPage} onChange={(v) => { setAddPage(v); setAddSection('') }} placeholder="Select page..." options={pages} />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Section / Tag</label>
              <Select value={addSection} onChange={setAddSection} placeholder="Select section..." options={sectionsByPage[addPage] ?? []} disabled={!addPage} />
              <input type="text" value={addSection} onChange={(e) => setAddSection(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2 mt-1" placeholder="Custom section tag..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Title</label>
              <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Image URL</label>
              <input type="text" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2" placeholder="https://... or /image.png" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-theme-secondary mb-1">Alt Text</label>
              <input type="text" value={addAlt} onChange={(e) => setAddAlt(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
              <textarea value={addDesc} onChange={(e) => setAddDesc(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2" rows={2} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAdd}
              disabled={!addPage || !addSection || !addTitle || !addUrl || createImage.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {createImage.isPending ? 'Creating...' : 'Create Image Slot'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-theme text-sm text-theme-secondary hover:bg-theme-surface">
              Cancel
            </button>
          </div>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-theme rounded-xl p-8 text-center">
          <ImageIcon className="h-10 w-10 text-theme-tertiary mx-auto mb-3" />
          <p className="text-theme-secondary text-sm">No images found. Add your first image slot above.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([page, imgs]) => (
          <div key={page} className="space-y-3">
            <h3 className="font-display text-sm font-bold text-theme-primary uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {pageLabel(page)}
              <span className="text-theme-tertiary font-normal">({imgs.length})</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {imgs.map((img) => (
                <div key={img.id} className="bg-[var(--bg-surface)] border border-theme rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 p-4">
                    <button onClick={() => setPreviewUrl(img.imageUrl)} className="relative shrink-0 w-44 h-28 bg-white rounded-lg overflow-hidden border border-theme group/thumb">
                      <img src={img.imageUrl} alt={img.altText ?? img.title} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 hidden items-center justify-center bg-black/35 text-xs text-white group-hover/thumb:flex">Preview</div>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-theme-primary truncate">{img.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {sectionLabel(img.page, img.sectionTag)}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${img.isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-theme-surface-hover text-theme-secondary'}`}>
                              {img.isActive ? <><Eye className="h-3 w-3" /> Active</> : <><EyeOff className="h-3 w-3" /> Inactive</>}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditId(img.id); setEditTitle(img.title); setEditDesc(img.description ?? ''); setEditAlt(img.altText ?? ''); setEditActive(img.isActive) }}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-theme-secondary transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <label className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-blue-600 cursor-pointer transition-colors" title="Upload new image">
                            <Upload className="h-4 w-4" />
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUpload(img.id, file)
                                e.target.value = ''
                              }}
                            />
                          </label>
                          {!(img.page === HOME_HERO_PAGE && img.sectionTag === HOME_HERO_TAG) && (
                            <button
                              onClick={async () => { if (confirm(`Delete "${img.title}"?`)) await deleteImage.mutateAsync(img.id) }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-theme-tertiary hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {img.description && <p className="text-xs text-theme-secondary mt-1 line-clamp-2">{img.description}</p>}
                      {img.altText && <p className="text-[11px] text-theme-tertiary mt-1 truncate">Alt: {img.altText}</p>}
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-theme-tertiary flex-wrap">
                        {formatBytes(img.sizeBytes) && <span>{formatBytes(img.sizeBytes)}</span>}
                        {img.contentType && <span>{img.contentType}</span>}
                        <span>Updated {new Date(img.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {uploadingId === img.id && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400">
                          <Loader2 className="h-3 w-3 animate-spin" />Uploading...
                        </div>
                      )}
                    </div>
                  </div>

                  {editId === img.id && (
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
                          <label className="block text-xs font-medium text-theme-secondary mb-1">Alt Text</label>
                          <input type="text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
                          <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full text-sm border border-theme rounded-lg px-3 py-2" rows={2} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(img.id)} disabled={updateImage.isPending} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark disabled:opacity-50">
                          {updateImage.isPending ? 'Saving...' : 'Save'}
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden">
            <button onClick={() => setPreviewUrl(null)} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
            <img src={previewUrl} alt="Preview" className="w-full max-h-[82vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
