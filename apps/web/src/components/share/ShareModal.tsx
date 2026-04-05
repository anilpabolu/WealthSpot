import { useState, useRef, useCallback } from 'react'
import { X, Copy, Check, MessageCircle, Linkedin, Facebook, Instagram, Download } from 'lucide-react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  opportunity: {
    id: string
    title: string
    tagline?: string | null
    description?: string | null
    city?: string | null
    coverImage?: string | null
    slug: string
    targetIrr?: number | null
    minInvestment?: number | null
    targetAmount?: number | null
    raisedAmount?: number | null
    closingDate?: string | null
    investorCount?: number | null
    vaultType: string
    media?: Array<{ url: string }>
    company?: {
      companyName: string
      reraNumber?: string | null
      logoUrl?: string | null
    } | null
  }
  referralCode: string
}

type PostcardFormat = 'portrait' | 'landscape'

const PLATFORM_URL = 'https://wealthspot.in'

export default function ShareModal({ open, onClose, opportunity, referralCode }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [format, setFormat] = useState<PostcardFormat>('portrait')
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
    generatePostcard('portrait')
  }

  // ── Shared helpers ─────────────────────────────────────────────
  const GOLD = '#D4AF37'
  const GOLD_DARK = '#8B6914'
  const OBSIDIAN = '#0A0B0F'

  const vaultGlow: Record<string, string> = {
    wealth: '#1B2A4A',
    opportunity: '#FF6B6B',
    community: '#D97706',
  }

  function formatINR(n: number): string {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }

  async function loadCoverImage(): Promise<HTMLImageElement | null> {
    const imgUrl = opportunity.media?.[0]?.url || opportunity.coverImage
    if (!imgUrl) return null
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
        img.src = imgUrl
      })
      return img
    } catch {
      return null
    }
  }

  function drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number, y: number, w: number, h: number, r: number
  ) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.clip()
    const scale = Math.max(w / img.width, h / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
    ctx.restore()
  }

  function drawPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
    ctx.fillStyle = '#334155'
    ctx.font = 'bold 60px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏠', x + w / 2, y + h / 2)
    ctx.textBaseline = 'alphabetic'
  }

  function drawWealthSpotLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.font = `bold ${size}px system-ui, -apple-system, sans-serif`
    ctx.textAlign = 'left'
    ctx.fillStyle = GOLD
    ctx.fillText('W', x, y)
    const wW = ctx.measureText('W').width
    ctx.fillStyle = '#ffffff'
    ctx.fillText('ealthSpot', x + wW, y)
    return wW + ctx.measureText('ealthSpot').width
  }

  // ── Portrait Postcard (1080×1350) ─────────────────────────────
  const generatePortraitPostcard = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1080
    const H = 1350
    canvas.width = W
    canvas.height = H

    const glowColor = vaultGlow[opportunity.vaultType] ?? '#1B2A4A'

    // ── Background ───────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.3, H)
    bgGrad.addColorStop(0, OBSIDIAN)
    bgGrad.addColorStop(1, '#0d1117')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Radial vault-color glow at top center
    const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 600)
    glow.addColorStop(0, glowColor + '25')
    glow.addColorStop(0.5, glowColor + '08')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, 600)

    // Subtle diagonal line pattern
    ctx.strokeStyle = 'rgba(212,175,55,0.03)'
    ctx.lineWidth = 1
    for (let i = -H; i < W + H; i += 60) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + H, H)
      ctx.stroke()
    }

    // ── Outer frame ──────────────────────────────────────────────
    const pad = 36
    ctx.strokeStyle = GOLD + '18'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 24)
    ctx.stroke()

    // Gold accent line at top
    const topGrad = ctx.createLinearGradient(pad, 0, W - pad, 0)
    topGrad.addColorStop(0, 'transparent')
    topGrad.addColorStop(0.15, GOLD)
    topGrad.addColorStop(0.85, GOLD)
    topGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = topGrad
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(pad + 20, pad)
    ctx.lineTo(W - pad - 20, pad)
    ctx.stroke()

    // ── Top branding bar ─────────────────────────────────────────
    drawWealthSpotLogo(ctx, 72, 86, 22)

    ctx.fillStyle = GOLD + 'aa'
    ctx.font = '600 13px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('EXCLUSIVE OPPORTUNITY', W - 72, 86)

    // ── Cover image ──────────────────────────────────────────────
    const imgX = 60
    const imgY = 116
    const imgW = W - 120
    const imgH = 460
    const imgR = 16

    const coverImg = await loadCoverImage()

    // Gold border around image
    ctx.strokeStyle = GOLD + '50'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(imgX - 1.5, imgY - 1.5, imgW + 3, imgH + 3, imgR + 1)
    ctx.stroke()

    if (coverImg) {
      drawImageCover(ctx, coverImg, imgX, imgY, imgW, imgH, imgR)
      // Bottom gradient overlay
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(imgX, imgY, imgW, imgH, imgR)
      ctx.clip()
      const imgOverlay = ctx.createLinearGradient(0, imgY + imgH * 0.45, 0, imgY + imgH)
      imgOverlay.addColorStop(0, 'rgba(0,0,0,0)')
      imgOverlay.addColorStop(1, 'rgba(0,0,0,0.7)')
      ctx.fillStyle = imgOverlay
      ctx.fillRect(imgX, imgY, imgW, imgH)
      ctx.restore()
    } else {
      drawPlaceholder(ctx, imgX, imgY, imgW, imgH, imgR)
    }

    // Vault badge on image
    const badgeText = `${opportunity.vaultType.toUpperCase()} VAULT`
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
    const badgeW = ctx.measureText(badgeText).width + 32
    const badgeH = 32
    const badgeX = imgX + 20
    const badgeY = imgY + imgH - badgeH - 16
    ctx.fillStyle = GOLD
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16)
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 22)

    // ── Title ────────────────────────────────────────────────────
    let y = imgY + imgH + 44
    ctx.fillStyle = '#f1f5f9'
    ctx.font = 'bold 40px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    const titleLines = wrapText(ctx, opportunity.title, imgW - 20)
    for (const line of titleLines.slice(0, 2)) {
      ctx.fillText(line, 72, y)
      y += 50
    }

    // ── Location + Company row ───────────────────────────────────
    y += 4
    const infoParts: string[] = []
    if (opportunity.city) infoParts.push(`📍 ${opportunity.city}`)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '20px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    if (infoParts.length > 0) {
      ctx.fillText(infoParts.join(''), 72, y)
    }

    // Company + RERA on right
    if (opportunity.company?.companyName) {
      ctx.textAlign = 'right'
      ctx.fillStyle = GOLD + 'cc'
      ctx.font = '18px system-ui, -apple-system, sans-serif'
      let companyText = `🏗 ${opportunity.company.companyName}`
      if (opportunity.company.reraNumber) {
        companyText += ` · RERA: ${opportunity.company.reraNumber}`
      }
      // Truncate if too long
      const maxCompanyW = imgW - 300
      if (ctx.measureText(companyText).width > maxCompanyW) {
        companyText = `🏗 ${opportunity.company.companyName}`
      }
      ctx.fillText(companyText, W - 72, y)
    }
    y += 32

    // ── Description snippet ──────────────────────────────────────
    if (opportunity.description) {
      ctx.fillStyle = '#64748b'
      ctx.font = '18px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'left'
      const descLines = wrapText(ctx, opportunity.description.slice(0, 200), imgW - 20)
      for (const line of descLines.slice(0, 2)) {
        ctx.fillText(line, 72, y)
        y += 26
      }
      y += 8
    }

    // ── Gold divider ─────────────────────────────────────────────
    y += 4
    const divGrad = ctx.createLinearGradient(72, 0, W - 72, 0)
    divGrad.addColorStop(0, GOLD)
    divGrad.addColorStop(0.5, GOLD + '80')
    divGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = divGrad
    ctx.fillRect(72, y, imgW - 20, 2)
    y += 28

    // ── Key metrics grid (2×2) ───────────────────────────────────
    const metricBoxW = (imgW - 40) / 2
    const metricBoxH = 78
    const metricGap = 16
    const metricStartX = 72
    const metricStartY = y

    interface MetricItem { label: string; value: string; highlight?: boolean }
    const metricItems: MetricItem[] = []

    if (opportunity.targetIrr) {
      metricItems.push({ label: 'TARGET IRR', value: `${opportunity.targetIrr}%`, highlight: true })
    }
    if (opportunity.minInvestment) {
      metricItems.push({ label: 'MIN. INVESTMENT', value: formatINR(opportunity.minInvestment) })
    }
    if (opportunity.targetAmount) {
      metricItems.push({ label: 'TARGET AMOUNT', value: formatINR(opportunity.targetAmount) })
    }
    if (opportunity.raisedAmount != null && opportunity.targetAmount) {
      const pct = Math.min(100, Math.round((opportunity.raisedAmount / opportunity.targetAmount) * 100))
      metricItems.push({ label: 'RAISED', value: `${pct}% Funded`, highlight: true })
    } else if (opportunity.raisedAmount != null) {
      metricItems.push({ label: 'RAISED', value: formatINR(opportunity.raisedAmount) })
    }

    // Draw up to 4 metrics in 2×2 grid
    const drawMetrics = metricItems.slice(0, 4)
    for (let i = 0; i < drawMetrics.length; i++) {
      const m = drawMetrics[i]!
      const col = i % 2
      const row = Math.floor(i / 2)
      const mx = metricStartX + col * (metricBoxW + metricGap)
      const my = metricStartY + row * (metricBoxH + metricGap)

      // Glass card background
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.beginPath()
      ctx.roundRect(mx, my, metricBoxW, metricBoxH, 12)
      ctx.fill()
      ctx.strokeStyle = 'rgba(212,175,55,0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(mx, my, metricBoxW, metricBoxH, 12)
      ctx.stroke()

      // Label
      ctx.fillStyle = '#64748b'
      ctx.font = '13px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(m.label, mx + 18, my + 26)

      // Value
      ctx.fillStyle = m.highlight ? GOLD : '#f1f5f9'
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
      ctx.fillText(m.value, mx + 18, my + 60)
    }

    const metricRows = Math.ceil(drawMetrics.length / 2)
    y = metricStartY + metricRows * (metricBoxH + metricGap)

    // ── Raised progress bar (if both amounts available) ──────────
    if (opportunity.raisedAmount != null && opportunity.targetAmount) {
      const pct = Math.min(100, (opportunity.raisedAmount / opportunity.targetAmount) * 100)
      const barX = 72
      const barW = imgW - 20
      const barH = 8
      y += 4

      // Track
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.beginPath()
      ctx.roundRect(barX, y, barW, barH, 4)
      ctx.fill()

      // Fill
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0)
      barGrad.addColorStop(0, GOLD)
      barGrad.addColorStop(1, GOLD_DARK)
      ctx.fillStyle = barGrad
      ctx.beginPath()
      ctx.roundRect(barX, y, barW * (pct / 100), barH, 4)
      ctx.fill()

      y += barH + 16
    }

    // ── Closing date ─────────────────────────────────────────────
    if (opportunity.closingDate) {
      const dateStr = new Date(opportunity.closingDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
      ctx.fillStyle = '#94a3b8'
      ctx.font = '18px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`📅 Closes ${dateStr}`, W / 2, y + 4)
      y += 32
    }

    // ── CTA banner ───────────────────────────────────────────────
    y += 8
    const ctaH = 68
    const ctaGrad = ctx.createLinearGradient(60, y, W - 60, y)
    ctaGrad.addColorStop(0, GOLD)
    ctaGrad.addColorStop(1, GOLD_DARK)
    ctx.fillStyle = ctaGrad
    ctx.beginPath()
    ctx.roundRect(60, y, imgW, ctaH, 14)
    ctx.fill()

    ctx.fillStyle = '#000000'
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Begin Your Investment Journey', W / 2, y + ctaH / 2 + 9)
    y += ctaH + 22

    // ── Referral code badge ──────────────────────────────────────
    if (referralCode) {
      ctx.fillStyle = GOLD + 'aa'
      ctx.font = '13px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('YOUR REFERRAL CODE', W / 2, y)
      y += 18

      const refBoxW = 320
      const refBoxH = 46
      const refBoxX = (W - refBoxW) / 2
      ctx.strokeStyle = GOLD + '40'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(refBoxX, y, refBoxW, refBoxH, 23)
      ctx.stroke()

      ctx.fillStyle = GOLD
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
      ctx.fillText(referralCode, W / 2, y + 31)
      y += refBoxH + 20
    }

    // ── Bottom branding bar ──────────────────────────────────────
    const bottomY = H - 90

    // Gold rule
    const ruleGrad = ctx.createLinearGradient(60, 0, W - 60, 0)
    ruleGrad.addColorStop(0, 'transparent')
    ruleGrad.addColorStop(0.2, GOLD + '40')
    ruleGrad.addColorStop(0.8, GOLD + '40')
    ruleGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = ruleGrad
    ctx.fillRect(60, bottomY, imgW, 1)

    // Logo
    drawWealthSpotLogo(ctx, 72, bottomY + 36, 22)

    // Tagline
    ctx.fillStyle = '#475569'
    ctx.font = '13px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Institutional-grade real estate for everyone', 72, bottomY + 56)

    // URL + fine print right
    ctx.fillStyle = GOLD + '88'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('wealthspot.in', W - 72, bottomY + 36)
    ctx.fillStyle = '#475569'
    ctx.font = '12px system-ui, -apple-system, sans-serif'
    ctx.fillText('RERA Verified  ·  Secure Investments', W - 72, bottomY + 56)

    return canvas
  }, [opportunity, referralCode])

  // ── Landscape Postcard (1200×630) ─────────────────────────────
  const generateLandscapePostcard = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1200
    const H = 630
    canvas.width = W
    canvas.height = H

    const glowColor = vaultGlow[opportunity.vaultType] ?? '#1B2A4A'
    const imgPanelW = 480
    const rightX = imgPanelW + 24

    // ── Background ───────────────────────────────────────────────
    ctx.fillStyle = OBSIDIAN
    ctx.fillRect(0, 0, W, H)

    // Subtle vault glow top-right
    const glow = ctx.createRadialGradient(W, 0, 0, W, 0, 500)
    glow.addColorStop(0, glowColor + '18')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(imgPanelW, 0, W - imgPanelW, H)

    // Subtle line pattern on right panel
    ctx.strokeStyle = 'rgba(212,175,55,0.02)'
    ctx.lineWidth = 1
    for (let i = -H; i < W; i += 50) {
      ctx.beginPath()
      ctx.moveTo(imgPanelW + i, 0)
      ctx.lineTo(imgPanelW + i + H, H)
      ctx.stroke()
    }

    // ── Left panel — property image ──────────────────────────────
    const coverImg = await loadCoverImage()
    if (coverImg) {
      drawImageCover(ctx, coverImg, 0, 0, imgPanelW, H, 0)
      // Right edge gradient blend
      const blendGrad = ctx.createLinearGradient(imgPanelW - 80, 0, imgPanelW, 0)
      blendGrad.addColorStop(0, 'rgba(10,11,15,0)')
      blendGrad.addColorStop(1, OBSIDIAN)
      ctx.fillStyle = blendGrad
      ctx.fillRect(imgPanelW - 80, 0, 80, H)
      // Bottom gradient
      const btmGrad = ctx.createLinearGradient(0, H - 120, 0, H)
      btmGrad.addColorStop(0, 'rgba(10,11,15,0)')
      btmGrad.addColorStop(1, OBSIDIAN + 'cc')
      ctx.fillStyle = btmGrad
      ctx.fillRect(0, H - 120, imgPanelW, 120)
    } else {
      drawPlaceholder(ctx, 0, 0, imgPanelW, H, 0)
    }

    // Vault badge on image
    const badgeText = `${opportunity.vaultType.toUpperCase()} VAULT`
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
    const badgeW = ctx.measureText(badgeText).width + 28
    const badgeH = 28
    ctx.fillStyle = GOLD
    ctx.beginPath()
    ctx.roundRect(20, H - 48, badgeW, badgeH, 14)
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.fillText(badgeText, 20 + badgeW / 2, H - 48 + 19)

    // ── Right panel content ──────────────────────────────────────
    const rPad = 36
    const rX = rightX + rPad
    const rW = W - rX - rPad - 12
    let ry = 44

    // Logo
    drawWealthSpotLogo(ctx, rX, ry, 18)

    ctx.fillStyle = GOLD + 'aa'
    ctx.font = '600 11px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('EXCLUSIVE OPPORTUNITY', W - rPad - 12, ry)
    ry += 30

    // Title
    ctx.fillStyle = '#f1f5f9'
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    const lTitleLines = wrapText(ctx, opportunity.title, rW)
    for (const line of lTitleLines.slice(0, 2)) {
      ctx.fillText(line, rX, ry)
      ry += 36
    }

    // City + Company + RERA
    ry += 2
    const infoLine: string[] = []
    if (opportunity.city) infoLine.push(`📍 ${opportunity.city}`)
    if (opportunity.company?.companyName) infoLine.push(`🏗 ${opportunity.company.companyName}`)
    if (opportunity.company?.reraNumber) infoLine.push(`RERA: ${opportunity.company.reraNumber}`)

    if (infoLine.length > 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '15px system-ui, -apple-system, sans-serif'
      const text = infoLine.join('  ·  ')
      // Truncate if needed
      const truncated = ctx.measureText(text).width > rW
        ? infoLine.slice(0, 2).join('  ·  ')
        : text
      ctx.fillText(truncated, rX, ry)
      ry += 24
    }

    // Description snippet (1 line)
    if (opportunity.description) {
      ctx.fillStyle = '#64748b'
      ctx.font = '14px system-ui, -apple-system, sans-serif'
      const descLines = wrapText(ctx, opportunity.description.slice(0, 150), rW)
      if (descLines[0]) {
        const line = descLines.length > 1 ? descLines[0] + '...' : descLines[0]
        ctx.fillText(line, rX, ry)
      }
      ry += 24
    }

    // Gold divider
    ry += 4
    const rdGrad = ctx.createLinearGradient(rX, 0, rX + rW, 0)
    rdGrad.addColorStop(0, GOLD)
    rdGrad.addColorStop(0.6, GOLD + '60')
    rdGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = rdGrad
    ctx.fillRect(rX, ry, rW, 1.5)
    ry += 20

    // Metrics row (up to 3 in a horizontal strip)
    interface LMItem { label: string; value: string; highlight?: boolean }
    const lMetrics: LMItem[] = []
    if (opportunity.targetIrr) lMetrics.push({ label: 'TARGET IRR', value: `${opportunity.targetIrr}%`, highlight: true })
    if (opportunity.minInvestment) lMetrics.push({ label: 'MIN. INVEST', value: formatINR(opportunity.minInvestment) })
    if (opportunity.targetAmount) lMetrics.push({ label: 'TARGET', value: formatINR(opportunity.targetAmount) })

    const mCount = Math.min(lMetrics.length, 3)
    if (mCount > 0) {
      const mW = rW / mCount
      for (let i = 0; i < mCount; i++) {
        const m = lMetrics[i]!
        const mx = rX + i * mW

        // Glass card
        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        ctx.beginPath()
        ctx.roundRect(mx, ry, mW - 10, 64, 10)
        ctx.fill()

        ctx.fillStyle = '#64748b'
        ctx.font = '11px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(m.label, mx + 12, ry + 22)

        ctx.fillStyle = m.highlight ? GOLD : '#f1f5f9'
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
        ctx.fillText(m.value, mx + 12, ry + 50)
      }
      ry += 76
    }

    // Raised progress bar
    if (opportunity.raisedAmount != null && opportunity.targetAmount) {
      const pct = Math.min(100, (opportunity.raisedAmount / opportunity.targetAmount) * 100)
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.beginPath()
      ctx.roundRect(rX, ry, rW, 6, 3)
      ctx.fill()
      const barGrad = ctx.createLinearGradient(rX, 0, rX + rW, 0)
      barGrad.addColorStop(0, GOLD)
      barGrad.addColorStop(1, GOLD_DARK)
      ctx.fillStyle = barGrad
      ctx.beginPath()
      ctx.roundRect(rX, ry, rW * (pct / 100), 6, 3)
      ctx.fill()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.round(pct)}% Funded`, rX + rW, ry + 22)
      ry += 32
    }

    // Referral code
    if (referralCode) {
      ctx.fillStyle = GOLD + 'aa'
      ctx.font = '11px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('YOUR REFERRAL CODE', rX, ry + 6)

      const refCodeW = ctx.measureText(referralCode).width + 28
      ctx.strokeStyle = GOLD + '40'
      ctx.lineWidth = 1
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
      const rcX = rX + 140
      ctx.beginPath()
      ctx.roundRect(rcX, ry - 8, refCodeW, 30, 15)
      ctx.stroke()
      ctx.fillStyle = GOLD
      ctx.textAlign = 'center'
      ctx.fillText(referralCode, rcX + refCodeW / 2, ry + 14)
      ry += 36
    }

    // Bottom branding
    const bY = H - 32
    ctx.fillStyle = GOLD + '30'
    ctx.fillRect(rX, bY - 16, rW, 1)

    ctx.fillStyle = '#475569'
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('wealthspot.in  ·  RERA Verified  ·  Secure Investments', rX, bY)

    return canvas
  }, [opportunity, referralCode])

  // ── Download dispatcher ────────────────────────────────────────
  const generatePostcard = useCallback(async (fmt?: PostcardFormat) => {
    setGenerating(true)
    try {
      const chosen = fmt ?? format
      const canvas = chosen === 'landscape'
        ? await generateLandscapePostcard()
        : await generatePortraitPostcard()
      if (canvas) {
        const link = document.createElement('a')
        link.download = `wealthspot-${opportunity.slug}-${chosen}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    } finally {
      setGenerating(false)
    }
  }, [format, generatePortraitPostcard, generateLandscapePostcard, opportunity.slug])

  if (!open) return null

  return (
    <div className="modal-overlay p-4" onClick={onClose}>
      <div
        className="modal-panel max-w-md overflow-hidden"
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
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Download Postcard</p>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setFormat('portrait')}
                className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                  format === 'portrait'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                Portrait
                <span className="block text-[10px] font-normal opacity-70 mt-0.5">Instagram / Stories</span>
              </button>
              <button
                onClick={() => setFormat('landscape')}
                className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                  format === 'landscape'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                Landscape
                <span className="block text-[10px] font-normal opacity-70 mt-0.5">LinkedIn / Facebook</span>
              </button>
            </div>
            <button
              onClick={() => generatePostcard()}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {generating ? 'Generating...' : 'Download Postcard'}
            </button>
          </div>

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
