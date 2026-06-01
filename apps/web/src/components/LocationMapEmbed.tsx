import { ExternalLink, MapPin } from 'lucide-react'

interface LocationMapEmbedProps {
  latitude: number | null | undefined
  longitude: number | null | undefined
  mapsUrl: string | null | undefined
  address?: string | null
  city?: string | null
  state?: string | null
}

export default function LocationMapEmbed({
  latitude,
  longitude,
  mapsUrl,
  address,
  city,
  state,
}: LocationMapEmbedProps) {
  const hasCoords = latitude != null && longitude != null

  // Build the Google Maps embed src (works without API key)
  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : null

  // Build the "Open in Google Maps" href — prefer the stored share URL,
  // fall back to a coordinate-based URL, then an address-based search.
  const openHref = (() => {
    if (mapsUrl) return mapsUrl
    if (hasCoords) return `https://www.google.com/maps?q=${latitude},${longitude}`
    const query = [address, city, state].filter(Boolean).join(', ')
    return query ? `https://www.google.com/maps/search/${encodeURIComponent(query)}` : null
  })()

  if (!embedSrc && !openHref) return null

  return (
    <div className="card relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/70 via-emerald-400/50 to-emerald-500/10 z-10" />

      {/* Map title bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-theme">
        <h2 className="font-display text-base font-bold text-theme-primary flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          Location
        </h2>
        {openHref && (
          <a
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Google Maps
          </a>
        )}
      </div>

      {/* Map iframe */}
      {embedSrc ? (
        <div className="relative w-full" style={{ height: '260px' }}>
          <iframe
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
        /* No coords but we have a link — show a placeholder tap-to-open */
        <a
          href={openHref!}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-3 bg-theme-surface hover:bg-theme-surface-hover transition-colors"
          style={{ height: '260px' }}
        >
          <MapPin className="h-10 w-10 text-emerald-500/60" />
          <span className="text-sm font-medium text-theme-secondary">
            Tap to view on Google Maps
          </span>
        </a>
      )}
    </div>
  )
}
