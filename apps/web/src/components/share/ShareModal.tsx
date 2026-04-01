import { useState, useRef, useCallback } from 'react'
import { X, Copy, Check, MessageCircle, Linkedin, Facebook, Instagram, Download } from 'lucide-react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  opportunity: {
    id: string
    title: string
    tagline?: string | null
    city?: string | null
    coverImage?: string | null
    slug: string
    targetIrr?: number | null
    minInvestment?: number | null
    vaultType: string
    media?: Array<{ url: string }>
  }
  referralCode: string
}

const PLATFORM_URL = 'https://wealthspot.in'

export default function ShareModal({ open, onClose, opportunity, referralCode }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const shareUrl = `${PLATFORM_URL}/opportunity/${opportunity.slug}?pref=${referralCode}`
  const shareText = `Check out "${opportunity.title}" on WealthSpot${opportunity.city ? ` in ${opportunity.city}` : ''}${opportunity.targetIrr ? ` — Target IRR ${opportunity.targetIrr}%` : ''}. Invest smart, grow wealth! 🏠\n\nInterested? Sign up here: ${shareUrl}`

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl])

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')
  }

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank', 'noopener')
  }

  const shareInstagram = () => {
    // Instagram doesn't support direct URL sharing, generate postcard for download
    generatePostcard()
  }

  const generatePostcard = useCallback(async () => {
    setGenerating(true)
    const canvas = canvasRef.current
    if (!canvas) { setGenerating(false); return }

    const ctx = canvas.getContext('2d')
    if (!ctx) { setGenerating(false); return }

    const W = 1080
    const H = 1350
    canvas.width = W
    canvas.height = H

    // ── Colour palette ───────────────────────────────────────────
    const vaultPalettes: Record<string, { accent: string; accentDark: string; gradStart: string; gradEnd: string }> = {
      wealth:      { accent: '#22c55e', accentDark: '#16a34a', gradStart: '#0b1120', gradEnd: '#132218' },
      opportunity: { accent: '#8b5cf6', accentDark: '#7c3aed', gradStart: '#0b1120', gradEnd: '#1a1028' },
      community:   { accent: '#06b6d4', accentDark: '#0891b2', gradStart: '#0b1120', gradEnd: '#081820' },
    }
    const pal = vaultPalettes[opportunity.vaultType] ?? { accent: '#22c55e', accentDark: '#16a34a', gradStart: '#0b1120', gradEnd: '#132218' }

    // ── Background ───────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, pal.gradStart)
    bgGrad.addColorStop(1, pal.gradEnd)
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Subtle dot grid pattern
    ctx.fillStyle = 'rgba(255,255,255,0.015)'
    for (let x = 0; x < W; x += 40) {
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath()
        ctx.arc(x, y, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ── Outer decorative frame ───────────────────────────────────
    const pad = 32
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 20)
    ctx.stroke()

    // Inner accent border (top)
    const accentGrad = ctx.createLinearGradient(60, 0, W - 60, 0)
    accentGrad.addColorStop(0, 'transparent')
    accentGrad.addColorStop(0.2, pal.accent)
    accentGrad.addColorStop(0.8, pal.accent)
    accentGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = accentGrad
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(60, pad + 1)
    ctx.lineTo(W - 60, pad + 1)
    ctx.stroke()

    // ── Top branding bar ─────────────────────────────────────────
    ctx.fillStyle = pal.accent
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('W', 68, 82)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('ealthSpot', 68 + ctx.measureText('W').width, 82)

    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '13px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('INVESTMENT OPPORTUNITY', W - 68, 82)

    // ── Cover image ──────────────────────────────────────────────
    const imgX = 60
    const imgY = 110
    const imgW = W - 120
    const imgH = 480
    const imgR = 16

    const imgUrl = opportunity.media?.[0]?.url || opportunity.coverImage
    if (imgUrl) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject()
          img.src = imgUrl
        })
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(imgX, imgY, imgW, imgH, imgR)
        ctx.clip()
        const scale = Math.max(imgW / img.width, imgH / img.height)
        const dw = img.width * scale
        const dh = img.height * scale
        ctx.drawImage(img, imgX + (imgW - dw) / 2, imgY + (imgH - dh) / 2, dw, dh)

        // Dark gradient overlay at bottom of image for text readability
        const imgOverlay = ctx.createLinearGradient(0, imgY + imgH * 0.5, 0, imgY + imgH)
        imgOverlay.addColorStop(0, 'rgba(0,0,0,0)')
        imgOverlay.addColorStop(1, 'rgba(0,0,0,0.65)')
        ctx.fillStyle = imgOverlay
        ctx.fillRect(imgX, imgY, imgW, imgH)
        ctx.restore()
      } catch {
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.roundRect(imgX, imgY, imgW, imgH, imgR)
        ctx.fill()
        ctx.fillStyle = '#334155'
        ctx.font = 'bold 60px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('🏠', W / 2, imgY + imgH / 2 + 20)
      }
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.roundRect(imgX, imgY, imgW, imgH, imgR)
      ctx.fill()
    }

    // Vault badge (overlaid on bottom-left of image)
    const badgeText = `${opportunity.vaultType.toUpperCase()} VAULT`
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
    const badgeW = ctx.measureText(badgeText).width + 30
    const badgeH = 32
    const badgeX = imgX + 20
    const badgeY = imgY + imgH - badgeH - 16
    ctx.fillStyle = pal.accent
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 21)

    // ── Property title section ───────────────────────────────────
    let y = imgY + imgH + 42
    ctx.fillStyle = '#f1f5f9'
    ctx.font = 'bold 38px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    const titleLines = wrapText(ctx, opportunity.title, imgW - 20)
    for (const line of titleLines.slice(0, 2)) {
      ctx.fillText(line, 72, y)
      y += 48
    }

    // Tagline
    if (opportunity.tagline) {
      y += 4
      ctx.fillStyle = '#94a3b8'
      ctx.font = '22px system-ui, -apple-system, sans-serif'
      const tagLines = wrapText(ctx, opportunity.tagline.slice(0, 100), imgW - 20)
      for (const line of tagLines.slice(0, 2)) {
        ctx.fillText(line, 72, y)
        y += 30
      }
    }

    // City with pin icon
    if (opportunity.city) {
      y += 8
      ctx.fillStyle = '#64748b'
      ctx.font = '20px system-ui, -apple-system, sans-serif'
      ctx.fillText(`📍 ${opportunity.city}`, 72, y)
      y += 36
    }

    // ── Accent divider ───────────────────────────────────────────
    y += 8
    const divGrad = ctx.createLinearGradient(72, 0, W - 72, 0)
    divGrad.addColorStop(0, pal.accent)
    divGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = divGrad
    ctx.fillRect(72, y, imgW - 20, 2)
    y += 28

    // ── Key metrics row ──────────────────────────────────────────
    const metrics: { label: string; value: string }[] = []
    if (opportunity.targetIrr) metrics.push({ label: 'Target IRR', value: `${opportunity.targetIrr}%` })
    if (opportunity.minInvestment) {
      const val = opportunity.minInvestment >= 100000
        ? `₹${(opportunity.minInvestment / 100000).toFixed(1)}L`
        : `₹${(opportunity.minInvestment / 1000).toFixed(0)}K`
      metrics.push({ label: 'Min. Investment', value: val })
    }
    metrics.push({ label: 'Vault', value: opportunity.vaultType.charAt(0).toUpperCase() + opportunity.vaultType.slice(1) })

    if (metrics.length > 0) {
      const metricW = (imgW - 20) / metrics.length
      for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i]!
        const mx = 72 + i * metricW + metricW / 2
        // Label
        ctx.fillStyle = '#64748b'
        ctx.font = '14px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(m.label.toUpperCase(), mx, y)
        // Value
        ctx.fillStyle = '#f1f5f9'
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
        ctx.fillText(m.value, mx, y + 38)
        // Vertical separator
        if (i < metrics.length - 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.08)'
          ctx.fillRect(72 + (i + 1) * metricW, y - 8, 1, 54)
        }
      }
      y += 70
    }

    // ── CTA banner ───────────────────────────────────────────────
    y += 14
    const ctaH = 72
    const ctaR = 14

    // CTA gradient background
    const ctaGrad = ctx.createLinearGradient(60, y, W - 60, y)
    ctaGrad.addColorStop(0, pal.accent)
    ctaGrad.addColorStop(1, pal.accentDark)
    ctx.fillStyle = ctaGrad
    ctx.beginPath()
    ctx.roundRect(60, y, imgW, ctaH, ctaR)
    ctx.fill()

    // CTA text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Invest Smart. Grow Wealth. Start Today!', W / 2, y + ctaH / 2 + 8)

    y += ctaH + 24

    // ── Referral code badge ──────────────────────────────────────
    if (referralCode) {
      const refBoxW = 320
      const refBoxH = 44
      const refBoxX = (W - refBoxW) / 2
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(refBoxX, y, refBoxW, refBoxH, 22)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '13px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('YOUR REFERRAL CODE', W / 2, y - 8)

      ctx.fillStyle = pal.accent
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
      ctx.fillText(referralCode, W / 2, y + 29)
      y += refBoxH + 28
    }

    // ── Bottom branding bar ──────────────────────────────────────────
    // Horizontal rule
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(60, H - 100, imgW, 1)

    // Logo
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = pal.accent
    ctx.fillText('W', 72, H - 60)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('ealthSpot', 72 + ctx.measureText('W').width, H - 60)

    // Tagline
    ctx.fillStyle = '#475569'
    ctx.font = '13px system-ui, -apple-system, sans-serif'
    ctx.fillText('Institutional-grade real estate for everyone', 72, H - 40)

    // URL right side
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '15px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('wealthspot.in', W - 72, H - 60)
    ctx.fillStyle = '#475569'
    ctx.font = '12px system-ui, -apple-system, sans-serif'
    ctx.fillText('RERA Verified  ·  Secure Investments', W - 72, H - 40)

    setGenerating(false)

    // Download
    const link = document.createElement('a')
    link.download = `wealthspot-${opportunity.slug}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [opportunity, referralCode])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-lg font-bold text-gray-900">Share this Opportunity</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Property preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            {(opportunity.media?.[0]?.url || opportunity.coverImage) ? (
              <img
                src={opportunity.media?.[0]?.url || opportunity.coverImage || ''}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">🏠</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{opportunity.title}</p>
              {opportunity.city && <p className="text-xs text-gray-500">{opportunity.city}</p>}
            </div>
          </div>

          {/* Copy link */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Share Link (with your referral)</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono truncate"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 p-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                aria-label="Copy link"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-600 mt-1">Link copied!</p>}
          </div>

          {/* Your referral code */}
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Your Property Referral Code</p>
            <p className="font-mono font-bold text-lg text-primary tracking-widest">{referralCode}</p>
          </div>

          {/* Social share buttons */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Share on Social Media</p>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={shareWhatsApp}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="h-6 w-6 text-green-600" />
                <span className="text-[10px] font-medium text-green-700">WhatsApp</span>
              </button>
              <button
                onClick={shareLinkedIn}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Linkedin className="h-6 w-6 text-blue-600" />
                <span className="text-[10px] font-medium text-blue-700">LinkedIn</span>
              </button>
              <button
                onClick={shareFacebook}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <Facebook className="h-6 w-6 text-indigo-600" />
                <span className="text-[10px] font-medium text-indigo-700">Facebook</span>
              </button>
              <button
                onClick={shareInstagram}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors"
              >
                <Instagram className="h-6 w-6 text-pink-600" />
                <span className="text-[10px] font-medium text-pink-700">Instagram</span>
              </button>
            </div>
          </div>

          {/* Download postcard */}
          <button
            onClick={generatePostcard}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {generating ? 'Generating...' : 'Download Postcard for Sharing'}
          </button>

          <p className="text-center text-[11px] text-gray-400">
            When someone signs up using your referral code and makes their first investment, you earn a referral bonus!
          </p>
        </div>

        {/* Hidden canvas for postcard generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

/** Wrap text to fit a max width, return array of lines. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}
