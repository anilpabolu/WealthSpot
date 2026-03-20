import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#5B4FCF', dark: '#4338CA', light: '#EDE9FE' },
        surface: '#F9FAFB',
        status: {
          live: '#10B981',
          upcoming: '#3B82F6',
          funded: '#8B5CF6',
          closed: '#6B7280',
          active: '#10B981',
          pending: '#F59E0B',
          failed: '#EF4444',
        },
        risk: { low: '#10B981', medium: '#F59E0B', high: '#EF4444' },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        brand: {
          gold: '#D4AF37',
          'gold-muted': '#8B6914',
          obsidian: '#0A0B0F',
          surface: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.10)',
        },
      },
      fontFamily: {
        display: ['"Syne"', '"Bricolage Grotesque"', 'sans-serif'],
        hero: ['"Orbitron"', '"Syne"', 'sans-serif'],
        body: ['"DM Sans"', '"Satoshi"', 'sans-serif'],
        mono: ['"DM Mono"', '"JetBrains Mono"', 'monospace'],
      },
      backdropBlur: { glass: '24px' },
      animation: {
        ticker: 'ticker 25s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'glow-pulse': {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
