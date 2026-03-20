import { useCallback, useState } from 'react'
import { ImagePlus, Video, X, GripVertical } from 'lucide-react'

interface MediaItem {
  file: File
  preview: string
  type: 'image' | 'video'
}

interface Props {
  images: MediaItem[]
  onChange: (items: MediaItem[]) => void
  maxImages?: number
  maxVideos?: number
}

export default function MediaUploadZone({ images, onChange, maxImages = 10, maxVideos = 1 }: Props) {
  const [dragOver, setDragOver] = useState(false)

  const imageCount = images.filter((m) => m.type === 'image').length
  const videoCount = images.filter((m) => m.type === 'video').length

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      const newItems: MediaItem[] = []

      for (const file of files) {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (isImage && imageCount + newItems.filter((m) => m.type === 'image').length >= maxImages) continue
        if (isVideo && videoCount + newItems.filter((m) => m.type === 'video').length >= maxVideos) continue
        if (!isImage && !isVideo) continue

        newItems.push({
          file,
          preview: URL.createObjectURL(file),
          type: isImage ? 'image' : 'video',
        })
      }

      if (newItems.length) onChange([...images, ...newItems])
    },
    [images, onChange, imageCount, videoCount, maxImages, maxVideos],
  )

  const remove = (idx: number) => {
    const next = [...images]
    const item = next[idx]
    if (item) URL.revokeObjectURL(item.preview)
    next.splice(idx, 1)
    onChange(next)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Media Gallery{' '}
        <span className="text-gray-400 font-normal">
          ({imageCount}/{maxImages} images, {videoCount}/{maxVideos} video)
        </span>
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer
          ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-300 hover:border-gray-400'}
        `}
        onClick={() => document.getElementById('media-file-input')?.click()}
      >
        <div className="flex items-center justify-center gap-4 text-gray-400">
          <ImagePlus className="h-8 w-8" />
          <Video className="h-8 w-8" />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Drag & drop images or video here, or <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF, MP4, WebM • Max 10 MB per image, 100 MB per video</p>
        <input
          id="media-file-input"
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((item, idx) => (
            <div
              key={idx}
              className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50"
            >
              {item.type === 'image' ? (
                <img src={item.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={item.preview} className="w-full h-full object-cover" muted />
              )}

              {/* Cover badge for first image */}
              {idx === 0 && item.type === 'image' && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-white rounded">
                  COVER
                </span>
              )}

              {/* Type badge */}
              {item.type === 'video' && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-violet-600 text-white rounded flex items-center gap-0.5">
                  <Video className="h-2.5 w-2.5" /> VIDEO
                </span>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Drag handle */}
              <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/30 text-white opacity-0 group-hover:opacity-70 transition-opacity">
                <GripVertical className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
