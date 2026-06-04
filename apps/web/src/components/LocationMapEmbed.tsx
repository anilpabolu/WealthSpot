import { useState, useCallback } from 'react'
import { Compass, Copy, ExternalLink, Expand, MapPin, Navigation, X } from 'lucide-react'

interface LocationMapEmbedProps {
  latitude: number | null | undefined
  longitude: number | null | undefined
  mapsUrl: string | null | undefined
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
}

type MapType = 'road' | 'satellite'

function buildEmbedSrc(lat: number, lng: number, type: MapType, zoom = 15) {
  const t = type === 'satellite' ? 'h' : 'm'
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&t=${t}`
}

function buildDirectionsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export default function LocationMapEmbed({
  latitude,
  longitude,
  mapsUrl,
  address,
  city,
  state,
  pincode,
}: LocationMapEmbedProps) {
  const [mapType, setMapType] = useState<MapType>('road')
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const hasCoords = latitude != null && longitude != null

  const embedSrc = hasCoords ? buildEmbedSrc(latitude, longitude, mapType) : null
  const fullscreenEmbedSrc = hasCoords ? buildEmbedSrc(latitude, longitude, mapType, 16) : null

  const openHref = (() => {
    if (mapsUrl) return mapsUrl
    if (hasCoords) return `https://www.google.com/maps?q=${latitude},${longitude}`
    const query = [address, city, state].filter(Boolean).join(', ')
    return query ? `https://www.google.com/maps/search/${encodeURIComponent(query)}` : null
  })()

  const directionsHref = hasCoords ? buildDirectionsHref(latitude, longitude) : openHref

  const addressLine = [address, city, state, pincode].filter(Boolean).join(', ')
  const coordsLabel = hasCoords ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : null

  const copyCoords = useCallback(() => {
    if (!coordsLabel) return
    navigator.clipboard.writeText(coordsLabel).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [coordsLabel])

  if (!embedSrc && !openHref) return null

  return (
    <>
      <div className="card relative overflow-hidden">
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10 z-10" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-theme">
          <h2 className="font-display text-base font-bold text-theme-primary flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            Location
          </h2>
          <div className="flex items-center gap-2">
            {/* Map / Satellite toggle */}
            {hasCoords && (
              <div className="flex items-center rounded-lg border border-theme overflow-hidden text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setMapType('road')}
                  className={`px-2.5 py-1 transition-colors ${mapType === 'road' ? 'bg-primary text-white' : 'text-theme-secondary hover:bg-theme-surface'}`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('satellite')}
                  className={`px-2.5 py-1 transition-colors ${mapType === 'satellite' ? 'bg-primary text-white' : 'text-theme-secondary hover:bg-theme-surface'}`}
                >
                  Satellite
                </button>
              </div>
            )}
            {/* Expand */}
            {hasCoords && (
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                title="Expand map"
                className="p-1.5 rounded-lg border border-theme text-theme-secondary hover:text-theme-primary hover:bg-theme-surface transition-colors"
              >
                <Expand className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Map */}
        {embedSrc ? (
          <div className="relative w-full" style={{ height: '320px' }}>
            <iframe
              key={embedSrc}
              title="Property location"
              src={embedSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block"
            />
          </div>
        ) : (
          <a
            href={openHref!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-3 bg-theme-surface hover:bg-theme-surface-hover transition-colors"
            style={{ height: '320px' }}
          >
            <MapPin className="h-10 w-10 text-emerald-500/60" />
            <span className="text-sm font-medium text-theme-secondary">Tap to view on Google Maps</span>
          </a>
        )}

        {/* Footer action bar */}
        <div className="border-t border-theme px-4 py-3 flex flex-wrap items-center gap-2">
          {/* Address / coords */}
          <div className="flex-1 min-w-0">
            {addressLine && (
              <p className="text-[11px] text-theme-secondary truncate" title={addressLine}>
                <MapPin className="inline h-3 w-3 mr-0.5 text-theme-tertiary" />
                {addressLine}
              </p>
            )}
            {coordsLabel && (
              <button
                type="button"
                onClick={copyCoords}
                className="inline-flex items-center gap-1 text-[10px] text-theme-tertiary hover:text-theme-primary mt-0.5 transition-colors"
                title="Copy coordinates"
              >
                <Compass className="h-3 w-3" />
                {copied ? 'Copied!' : coordsLabel}
                <Copy className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {directionsHref && (
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                Get Directions
              </a>
            )}
            {openHref && (
              <a
                href={openHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme text-theme-secondary text-xs font-semibold hover:text-theme-primary hover:bg-theme-surface transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Maps
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen map modal */}
      {fullscreen && fullscreenEmbedSrc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-3 bg-theme-card border-b border-theme shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold text-theme-primary">
                {addressLine || 'Property Location'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Map / Satellite toggle in full-screen */}
              <div className="flex items-center rounded-lg border border-theme overflow-hidden text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setMapType('road')}
                  className={`px-3 py-1.5 transition-colors ${mapType === 'road' ? 'bg-primary text-white' : 'text-theme-secondary hover:bg-theme-surface'}`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('satellite')}
                  className={`px-3 py-1.5 transition-colors ${mapType === 'satellite' ? 'bg-primary text-white' : 'text-theme-secondary hover:bg-theme-surface'}`}
                >
                  Satellite
                </button>
              </div>
              {directionsHref && (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Directions
                </a>
              )}
              {openHref && (
                <a
                  href={openHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme text-theme-secondary text-xs font-semibold hover:text-theme-primary transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Maps
                </a>
              )}
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="p-1.5 rounded-lg border border-theme text-theme-secondary hover:text-theme-primary hover:bg-theme-surface transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Full-size iframe */}
          <div className="flex-1">
            <iframe
              key={fullscreenEmbedSrc}
              title="Property location fullscreen"
              src={fullscreenEmbedSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-full w-full"
            />
          </div>
        </div>
      )}
    </>
  )
}
