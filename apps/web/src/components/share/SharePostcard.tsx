import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface SharePostcardProps {
  title: string;
  tenure?: string;
  minEntry?: string;
  coverImage?: string;
  city?: string;
  url: string;
}

/**
 * SharePostcard — generates a 1200×630 postcard image for sharing.
 *
 * IMPORTANT: This component is rendered into a **detached off-screen DOM node**
 * and snapshotted by html-to-image. CSS container-query units (cqi) and
 * Tailwind utility classes are unreliable in that context. All sizing is
 * therefore done with inline styles using fixed pixel values.
 *
 * Layout (top → bottom):
 *   ┌──────────────────────────────────────────────┐
 *   │  STATIC: Gold border + brand logo + tagline  │
 *   │                                              │
 *   │        (property cover image fills bg)       │
 *   │                                              │
 *   │  DYNAMIC: title · city · tenure · minEntry   │
 *   │                              QR code ──────► │
 *   └──────────────────────────────────────────────┘
 */
export const SharePostcard = forwardRef<HTMLDivElement, SharePostcardProps>(({
  title, tenure, minEntry, coverImage, city, url
}, ref) => {
  // Resolve image URL — use wsrv.nl proxy only for absolute http(s) URLs
  const imgSrc = coverImage
    ? coverImage.startsWith('http')
      ? `https://wsrv.nl/?url=${encodeURIComponent(coverImage)}&w=1200&h=630&fit=cover&output=jpg`
      : coverImage
    : null;

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: 1200,
        height: 630,
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
        color: '#ffffff',
      }}
    >
      {/* ── Background Image ─────────────────────────────────────────── */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            inset: 0,
            width: 1200,
            height: 630,
            objectFit: 'cover',
          }}
        />
      )}

      {/* ── Dark gradient overlays to ensure text legibility ────────── */}
      {/* Top-down gradient for branding area */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        background: 'linear-gradient(to bottom, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 60%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Bottom-up gradient for content area */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 420,
        background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.8) 50%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Subtle overall dark wash */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(15,23,42,0.25)',
        pointerEvents: 'none',
      }} />

      {/* ── Gold Border (decorative) ─────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 8, left: 8, right: 8, bottom: 8,
        border: '2px solid rgba(212,175,55,0.7)',
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 60,
      }} />

      {/* ── STATIC: Top Branding Bar ──────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 28,
        left: 40,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        {/* Brand logo */}
        <img
          src="/wealthspot-logo-light.png"
          alt="WealthSpot"
          crossOrigin="anonymous"
          style={{ width: 56, height: 56, objectFit: 'contain' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '0.02em',
            color: '#ffffff',
          }}>
            Wealth<span style={{ color: '#D4AF37' }}>Spot</span>
          </div>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.65)',
            marginTop: 4,
            textTransform: 'uppercase',
          }}>
            Research · Evaluate · Invest
          </div>
          <div style={{
            width: 48,
            height: 1,
            backgroundColor: 'rgba(212,175,55,0.5)',
            marginTop: 6,
          }} />
        </div>
      </div>

      {/* ── STATIC: Shield Certified Badge ────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 38,
        right: 40,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(15,23,42,0.7)',
        border: '1px solid rgba(212,175,55,0.4)',
        borderRadius: 999,
        padding: '6px 16px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          backgroundColor: '#D4AF37',
          boxShadow: '0 0 6px rgba(212,175,55,0.8)',
        }} />
        <span style={{
          color: '#D4AF37',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
        }}>
          Shield Certified
        </span>
      </div>

      {/* ── DYNAMIC: Bottom Content Overlay ──────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 32,
        left: 32,
        right: 32,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 32,
        backgroundColor: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Left side: city, title, metrics */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
          {/* City badge */}
          {city && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}>
              <div style={{ width: 28, height: 1, backgroundColor: '#D4AF37' }} />
              <span style={{
                color: '#D4AF37',
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}>
                {city}
              </span>
            </div>
          )}

          {/* Title */}
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.2,
            color: '#ffffff',
            marginBottom: 20,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}>
            {title}
          </div>

          {/* Metrics row */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 28,
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '14px 24px',
          }}>
            {/* Tenure */}
            <div>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#D4AF37',
                marginBottom: 2,
              }}>Tenure</div>
              <div style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#ffffff',
              }}>{tenure ?? 'TBD'}</div>
            </div>

            {/* Divider */}
            <div style={{
              width: 1,
              height: 40,
              background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.3), transparent)',
            }} />

            {/* Min Entry */}
            <div>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#D4AF37',
                marginBottom: 2,
              }}>Min. Entry</div>
              <div style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#ffffff',
              }}>{minEntry ?? 'TBD'}</div>
            </div>
          </div>
        </div>

        {/* Right side: QR Code */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 10,
          padding: 14,
          border: '3px solid #D4AF37',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          flexShrink: 0,
        }}>
          <div style={{ width: 110, height: 110 }}>
            <QRCodeSVG
              value={url}
              style={{ width: '100%', height: '100%' }}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
          </div>
          <div style={{
            width: '100%',
            height: 1,
            backgroundColor: '#e2e8f0',
            marginTop: 10,
            marginBottom: 6,
          }} />
          <div style={{
            color: '#0f172a',
            fontSize: 8,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Scan to View<br />Investment
          </div>
        </div>
      </div>
    </div>
  );
});

SharePostcard.displayName = 'SharePostcard';
