/** Theme color utilities for mobile — mirrors web CSS variables */

export interface ThemeColors {
  bgBase: string
  bgSurface: string
  bgCard: string
  bgInput: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  textAccent: string
  borderDefault: string
  borderSubtle: string
  cardBorder: string
  gold: string
}

const light: ThemeColors = {
  bgBase: '#FDFBF5',
  bgSurface: '#FFFEF9',
  bgCard: '#FFFEF8',
  bgInput: '#FFFEF9',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textAccent: '#4F46E5',
  borderDefault: 'rgba(209,196,157,0.35)',
  borderSubtle: 'rgba(229,221,196,0.5)',
  cardBorder: 'rgba(209,196,157,0.3)',
  gold: '#D4AF37',
}

const dark: ThemeColors = {
  bgBase: '#0c0a1f',
  bgSurface: '#13102e',
  bgCard: '#13102e',
  bgInput: '#13102e',
  textPrimary: '#f1f5f9',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.4)',
  textAccent: '#D4AF37',
  borderDefault: 'rgba(255,255,255,0.08)',
  borderSubtle: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(212,175,55,0.12)',
  gold: '#D4AF37',
}

export function getThemeColors(isDark: boolean): ThemeColors {
  return isDark ? dark : light
}
