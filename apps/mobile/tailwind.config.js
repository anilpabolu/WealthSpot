/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B4FCF',
          light: '#EDE9FE',
          dark: '#4338CA',
        },
        secondary: '#FF6B35',
        accent: '#22C55E',
        surface: '#F5F0FF',
        // ── Dark mode palette ───────────────────────────────────
        'dark-base': '#0c0a1f',
        'dark-surface': '#13102e',
        'dark-surface-hover': '#1c1842',
        'dark-card': '#13102e',
        'dark-text-primary': '#f1f5f9',
        'dark-text-secondary': 'rgba(255,255,255,0.6)',
        'dark-text-accent': '#D4AF37',
        'dark-border': 'rgba(255,255,255,0.08)',
        // ── Vault Theme Palettes (distinct identity per vault) ───
        vault: {
          wealth: {
            DEFAULT: '#1B2A4A',
            primary: '#1B2A4A',
            accent: '#D4AF37',
            light: '#F5F0E1',
            dark: '#0F1A2E',
            muted: '#2D3F5E',
          },
          opportunity: {
            DEFAULT: '#FF6B6B',
            primary: '#FF6B6B',
            accent: '#20E3B2',
            light: '#FFF0F0',
            dark: '#CC4848',
            muted: '#FF8E8E',
          },
          safe: {
            DEFAULT: '#0F766E',
            primary: '#0F766E',
            accent: '#5EEAD4',
            light: '#F0FDFA',
            dark: '#115E59',
            muted: '#99F6E4',
          },
          community: {
            DEFAULT: '#D97706',
            primary: '#D97706',
            accent: '#065F46',
            light: '#FFFBEB',
            dark: '#B45309',
            muted: '#F59E0B',
          },
        },
        // ── Vibrant accent palette ──────────────────────────────
        vibrant: {
          coral: '#FF6B6B',
          teal: '#20E3B2',
          amber: '#FBBF24',
          rose: '#F43F5E',
          ocean: '#3B82F6',
          mint: '#34D399',
          sunset: '#FB923C',
          lavender: '#A78BFA',
          peach: '#FDBA74',
        },
        navy: { DEFAULT: '#1B2A4A', light: '#2D3F5E', dark: '#0F1A2E' },
        gold: { DEFAULT: '#D4AF37', light: '#F0E6C8', dark: '#8B6914' },
        forest: { DEFAULT: '#065F46', light: '#ECFDF5', dark: '#064E3B' },
      },
      borderColor: {
        frame: 'rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        '3xl': 24,
      },
      fontFamily: {
        display: ['BricolageGrotesque'],
        hero: ['BricolageGrotesque'],
        body: ['PlusJakartaSans'],
        mono: ['FiraCode'],
        fun: ['PlusJakartaSans'],
      },
    },
  },
  plugins: [],
}
