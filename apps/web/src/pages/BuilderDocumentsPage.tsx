import { useState, useMemo, useRef } from 'react'
import { PortalLayout } from '@/components/layout'
import { EmptyState, Select } from '@/components/ui'
import { useBuilderListings } from '@/hooks/useBuilderListings'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, api } from '@/lib/api'
import { formatDate } from '@/lib/formatters'
import { FileText, Image, Upload, Loader2, Search, Film } from 'lucide-react'

interface MediaItem {
  id: string
  mediaType: string
  s3Key: string
  url: string
  filename: string | null
  sizeBytes: number | null
  contentType: string | null
  sortOrder: number
  isCover: boolean
  createdAt: string
}

function useOpportunityMedia(opportunityId: string) {
  return useQuery({
    queryKey: ['opportunity-media', opportunityId],
    queryFn: () => apiGet<MediaItem[]>(`/uploads/opportunity/${opportunityId}/media`),
    enabled: !!opportunityId,
    staleTime: 30_000,
  })
}

function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ opportunityId, file }: { opportunityId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await api.post<MediaItem>(
        `/uploads/opportunity/${opportunityId}/document`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return resp.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['opportunity-media', vars.opportunityId] })
    },
  })
}

export default function BuilderDocumentsPage() {
  const { listings } = useBuilderListings()
  const [selectedOpp, setSelectedOpp] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadDoc = useUploadDocument()

  // Pick the first listing by default
  const activeOppId = selectedOpp || listings[0]?.id || ''
  const { data: media, isLoading } = useOpportunityMedia(activeOppId)
  const allMedia = media ?? []

  const oppOptions = useMemo(
    () => listings.map((l) => ({ value: l.id, label: l.title })),
    [listings],
  )

  const filtered = allMedia.filter((m) => {
    if (typeFilter && m.mediaType !== typeFilter) return false
    if (search && !(m.filename ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const images = filtered.filter((m) => m.mediaType === 'image')
  const videos = filtered.filter((m) => m.mediaType === 'video')
  const documents = filtered.filter((m) => m.mediaType === 'document')

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeOppId) return
    uploadDoc.mutate({ opportunityId: activeOppId, file })
    e.target.value = ''
  }

  return (
    <PortalLayout variant="builder">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title text-2xl">Documents & Media</h1>
            <p className="text-theme-secondary mt-1">Manage files for your listings</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={handleDocUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!activeOppId || uploadDoc.isPending}
              className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {uploadDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Document
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {oppOptions.length > 0 && (
            <Select
              value={activeOppId}
              onChange={setSelectedOpp}
              placeholder="Select Listing"
              options={oppOptions}
            />
          )}
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
            options={[
              { value: '', label: 'All Types' },
              { value: 'image', label: 'Images' },
              { value: 'video', label: 'Videos' },
              { value: 'document', label: 'Documents' },
            ]}
          />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
            <input type="search" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--bg-surface)] border border-theme rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>

        {!activeOppId ? (
          <EmptyState icon={FileText} title="No listings" message="Create a listing first to manage its documents." />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No files yet" message="Upload documents or add media to your listing." />
        ) : (
          <div className="space-y-6">
            {/* Images */}
            {images.length > 0 && (
              <Section title={`Images (${images.length})`} icon={Image}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="group relative">
                      <img src={img.url} alt={img.filename ?? 'Image'} className="h-32 w-full object-cover rounded-lg border border-theme group-hover:ring-2 group-hover:ring-primary/30 transition" />
                      {img.isCover && <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">Cover</span>}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <Section title={`Videos (${videos.length})`} icon={Film}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map((vid) => (
                    <a key={vid.id} href={vid.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg border border-theme hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <Film className="h-4 w-4 text-theme-tertiary" />
                      <span className="text-sm text-theme-primary flex-1 truncate">{vid.filename ?? 'Video'}</span>
                      {vid.sizeBytes && <span className="text-xs text-theme-tertiary">{(vid.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <Section title={`Documents (${documents.length})`} icon={FileText}>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg border border-theme hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <FileText className="h-4 w-4 text-theme-tertiary" />
                      <span className="text-sm text-theme-primary flex-1 truncate">{doc.filename ?? 'Document'}</span>
                      <span className="text-xs text-theme-tertiary">{doc.createdAt ? formatDate(doc.createdAt) : ''}</span>
                      {doc.sizeBytes && <span className="text-xs text-theme-tertiary">{(doc.sizeBytes / 1024).toFixed(0)} KB</span>}
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {uploadDoc.isError && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center">Upload failed. Check file type (PDF, DOC, DOCX, XLS, XLSX) and size (max 25 MB).</p>
        )}
      </div>
    </PortalLayout>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-5">
      <h2 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2"><Icon className="h-4 w-4" />{title}</h2>
      {children}
    </div>
  )
}
