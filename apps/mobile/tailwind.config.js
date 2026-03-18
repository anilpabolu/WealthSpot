/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B4FCF',
          light: '#E8E5FA',
          dark: '#4A3FB5',
        },
        secondary: '#FF6B35',
        accent: '#22C55E',
        surface: '#F8F9FA',
      },
      fontFamily: {
        display: ['Syne'],
        body: ['DMSans'],
        mono: ['DMMono'],
      },
    },
  },
  plugins: [],
}
