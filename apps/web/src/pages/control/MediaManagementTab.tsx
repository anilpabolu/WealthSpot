import { useState, useRef } from 'react'
import { Upload, Loader2, Play, Image, CheckCircle2, Trash2 } from 'lucide-react'
import { Select } from '@/components/ui'
import { useOpportunities } from '@/hooks/useOpportunities'
import {
  useListOpportunityMedia,
  useAdminUploadMedia,
  useDeleteMedia,
  useUpdateMedia,
} from '@/hooks/useMediaAdmin'

export default function MediaManagementTab() {
  const { data: opps } = useOpportunities()
  const [selectedOpp, setSelectedOpp] = useState<string>('')
  const { data: mediaList, isLoading } = useListOpportunityMedia(selectedOpp || undefined)
  const uploadMut = useAdminUploadMedia()
  const deleteMut = useDeleteMedia()
  const updateMut = useUpdateMedia()
  const fileRef = useRef<HTMLInputElement>(null)

  const opportunities = opps?.items || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Media Manager</h2>
        <p className="text-sm text-theme-secondary mt-1">Upload, manage and delete images/videos for any opportunity.</p>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={selectedOpp}
          onChange={setSelectedOpp}
          placeholder="Select an opportunity…"
          options={(Array.isArray(opportunities) ? opportunities : []).map((o) => ({ value: o.id, label: o.title }))}
          searchable
          className="max-w-md"
        />
        {selectedOpp && (
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length) uploadMut.mutate({ opportunityId: selectedOpp, files })
                e.target.value = ''
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadMut.isPending}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Upload className="h-4 w-4" />
              {uploadMut.isPending ? 'Uploading…' : 'Upload Files'}
            </button>
          </>
        )}
      </div>

      {selectedOpp && (
        <div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-theme-tertiary py-8">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading media…
            </div>
          ) : !mediaList?.length ? (
            <div className="text-center py-12 text-theme-tertiary">
              <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No media uploaded yet for this opportunity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaList.map((m) => (
                <div key={m.id} className="relative group rounded-lg overflow-hidden border bg-[var(--bg-surface)] shadow-sm">
                  {m.media_type === 'video' ? (
                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white/70" />
                    </div>
                  ) : (
                    <img src={m.url} alt={m.filename} className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-2 text-xs text-theme-secondary truncate">{m.filename}</div>
                  {m.is_cover && (
                    <span className="absolute top-2 left-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">Cover</span>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!m.is_cover && (
                      <button
                        onClick={() => updateMut.mutate({ mediaId: m.id, isCover: true })}
                        className="p-1.5 bg-[var(--bg-card)] rounded shadow text-xs hover:bg-[var(--bg-surface)]"
                        title="Set as cover"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Delete this media?')) deleteMut.mutate(m.id) }}
                      className="p-1.5 bg-[var(--bg-card)] rounded shadow text-xs hover:bg-red-50 dark:bg-red-900/30"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
