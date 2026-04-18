/**
 * Color derivation utilities for the admin-configurable theme system.
 * Converts a single base hex color into a full CSS variable palette
 * with proper visual hierarchy and complementary text tones.
 */

interface HSL {
  h: number // 0–360
  s: number // 0–100
  l: number // 0–100
}

export function hexToHSL(hex: string): HSL {
  const raw = hex.replace('#', '')
  const r = parseInt(raw.substring(0, 2), 16) / 255
  const g = parseInt(raw.substring(2, 4), 16) / 255
  const b = parseInt(raw.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const l = (max + min) / 2
  let s = 0

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60
        break
      case g:
        h = ((b - r) / d + 2) * 60
        break
      case b:
        h = ((r - g) / d + 4) * 60
        break
    }
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100
  const lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lN - c / 2

  let r = 0,
    g = 0,
    b = 0
  if (h < 60) {
    r = c; g = x; b = 0
  } else if (h < 120) {
    r = x; g = c; b = 0
  } else if (h < 180) {
    r = 0; g = c; b = x
  } else if (h < 240) {
    r = 0; g = x; b = c
  } else if (h < 300) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Is this hue "warm"? (reds, oranges, yellows, magentas) */
function isWarmHue(h: number): boolean {
  return h <= 60 || h >= 300
}

/** Clamp a number between min and max */
function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

/**
 * From a single base hex color, derive a complete light-mode CSS variable palette.
 * Returns a Record<cssVarName, value> that can be applied to documentElement.style.
 */
export function deriveThemePalette(baseHex: string): Record<string, string> {
  const { h, s, l } = hexToHSL(baseHex)
  const warm = isWarmHue(h)

  // ── Background hierarchy: base → surface → card (progressively lighter) ──
  const surfaceL = clamp(l + 2, 0, 99)
  const surfaceHoverL = clamp(l - 4, 0, 99)
  const cardL = clamp(l + 4, 0, 99)
  const sidebarL = clamp(l - 1, 0, 99)
  const inputBorderL = clamp(l - 18, 10, 80)

  const surface = hslToHex(h, s, surfaceL)
  const surfaceHover = hslToHex(h, s, surfaceHoverL)
  const cardSolid = hslToHex(h, s, cardL)
  const sidebar = hslToHex(h, s, sidebarL)
  const inputBorder = hslToHex(h, clamp(s - 5, 0, 100), inputBorderL)

  // ── Text: warm bases → warm darks, cool bases → cool darks ──
  const textPrimary = warm ? '#1C1310' : '#111827'
  const textSecondary = warm ? 'rgba(60, 40, 20, 0.65)' : 'rgba(17, 24, 39, 0.6)'
  const textTertiary = warm ? 'rgba(60, 40, 20, 0.45)' : 'rgba(17, 24, 39, 0.4)'
  const textMuted = warm ? 'rgba(60, 40, 20, 0.25)' : 'rgba(17, 24, 39, 0.22)'
  const textAccent = warm ? '#8B6914' : '#4F46E5'

  // ── Borders & card treatment ──
  const borderAlpha = warm ? '0.18' : '0.12'
  const frameBorder = `rgba(0, 0, 0, ${borderAlpha})`
  const frameBorderHover = `rgba(0, 0, 0, ${Number(borderAlpha) + 0.1})`

  // ── Skeleton / loading ──
  const skeletonFrom = hslToHex(h, clamp(s - 5, 0, 100), clamp(l - 6, 0, 100))
  const skeletonVia = hslToHex(h, clamp(s - 3, 0, 100), clamp(l - 1, 0, 100))

  // ── Pill / chip ──
  const pillBg = hslToHex(h, clamp(s + 2, 0, 100), clamp(l - 8, 0, 100))

  // ── Modal ──
  const cardBorderAlpha = warm ? '0.22' : '0.15'

  // ── Scrollbar ──
  const scrollThumb = hslToHex(h, clamp(s + 10, 0, 100), clamp(l - 22, 20, 70))

  return {
    '--bg-base': baseHex,
    '--bg-surface': surface,
    '--bg-surface-hover': surfaceHover,
    '--bg-card': `rgba(${hexToRGB(cardSolid)}, 0.92)`,
    '--bg-card-border': `rgba(${hexToRGB(inputBorder)}, ${cardBorderAlpha})`,
    '--bg-card-shadow': '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.04)',
    '--bg-card-shadow-hover': '0 1px 3px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.08)',
    '--bg-sidebar': `rgba(${hexToRGB(sidebar)}, 0.7)`,
    '--bg-sidebar-border': `rgba(${hexToRGB(inputBorder)}, 0.35)`,
    '--bg-input': surface,
    '--bg-input-border': inputBorder,
    '--bg-input-focus-ring': warm ? 'rgba(139, 105, 20, 0.4)' : 'rgba(79, 70, 229, 0.4)',
    '--text-primary': textPrimary,
    '--text-secondary': textSecondary,
    '--text-tertiary': textTertiary,
    '--text-muted': textMuted,
    '--text-accent': textAccent,
    '--text-on-accent': '#ffffff',
    '--border-default': `rgba(${hexToRGB(inputBorder)}, 0.35)`,
    '--border-subtle': `rgba(${hexToRGB(inputBorder)}, 0.18)`,
    '--pill-bg': pillBg,
    '--pill-text': warm ? '#3B2712' : '#374151',
    '--skeleton-from': skeletonFrom,
    '--skeleton-via': skeletonVia,
    '--skeleton-to': skeletonFrom,
    '--modal-bg': `rgba(${hexToRGB(cardSolid)}, 0.96)`,
    '--modal-border': `rgba(${hexToRGB(inputBorder)}, 0.3)`,
    '--scrollbar-thumb': scrollThumb,
    '--frame-border': frameBorder,
    '--frame-border-hover': frameBorderHover,
    '--card-glow': '0 0 8px rgba(0, 0, 0, 0.06), 0 0 2px rgba(0, 0, 0, 0.04)',
  }
}

/** Convert hex → "r, g, b" string for use in rgba() */
function hexToRGB(hex: string): string {
  const raw = hex.replace('#', '')
  const r = parseInt(raw.substring(0, 2), 16)
  const g = parseInt(raw.substring(2, 4), 16)
  const b = parseInt(raw.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/** All CSS custom property names managed by the theme palette */
export const THEME_PALETTE_PROPS = [
  '--bg-base', '--bg-surface', '--bg-surface-hover', '--bg-card',
  '--bg-card-border', '--bg-card-shadow', '--bg-card-shadow-hover',
  '--bg-sidebar', '--bg-sidebar-border', '--bg-input', '--bg-input-border',
  '--bg-input-focus-ring', '--text-primary', '--text-secondary',
  '--text-tertiary', '--text-muted', '--text-accent', '--text-on-accent',
  '--border-default', '--border-subtle', '--pill-bg', '--pill-text',
  '--skeleton-from', '--skeleton-via', '--skeleton-to', '--modal-bg',
  '--modal-border', '--scrollbar-thumb', '--frame-border', '--frame-border-hover',
  '--card-glow',
]

/** Apply a full derived palette to the document root */
export function applyThemePalette(baseHex: string): void {
  const palette = deriveThemePalette(baseHex)
  const root = document.documentElement
  for (const [prop, val] of Object.entries(palette)) {
    root.style.setProperty(prop, val)
  }
}

/** Remove all inline palette overrides so CSS class variables take effect */
export function clearThemePalette(): void {
  const root = document.documentElement
  for (const prop of THEME_PALETTE_PROPS) {
    root.style.removeProperty(prop)
  }
}
