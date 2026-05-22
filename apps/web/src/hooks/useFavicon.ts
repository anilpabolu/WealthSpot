import { useEffect } from 'react'
import { useThemeStore } from '@/stores/theme.store'

const FAVICON_VERSION = '20260520'
const LIGHT_FAVICON = `/wealthspot-logo-light.png?v=${FAVICON_VERSION}`
const DARK_FAVICON = `/wealthspot-logo-light.png?v=${FAVICON_VERSION}`
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'
const DYNAMIC_FAVICON_ID = 'wealthspot-dynamic-favicon'

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? 'dark' : 'light'
}

function getActiveTheme(appTheme: 'dark' | 'light'): 'dark' | 'light' {
  const root = document.documentElement

  // Respect explicit dark mode from app state/class first.
  if (appTheme === 'dark' || root.classList.contains('dark')) {
    return 'dark'
  }

  if (appTheme === 'light') {
    return 'light'
  }

  // If app is not dark, follow browser preference dynamically.
  return getSystemTheme()
}

function applyFavicon(theme: 'dark' | 'light') {
  const head = document.head
  if (!head) return

  let dynamicLink = document.getElementById(DYNAMIC_FAVICON_ID) as HTMLLinkElement | null
  if (!dynamicLink) {
    dynamicLink = document.createElement('link')
    dynamicLink.id = DYNAMIC_FAVICON_ID
    dynamicLink.rel = 'icon'
    head.appendChild(dynamicLink)
  }

  dynamicLink.type = 'image/png'
  dynamicLink.href = theme === 'dark' ? DARK_FAVICON : LIGHT_FAVICON
}

export function useFavicon() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const sync = () => {
      applyFavicon(getActiveTheme(theme))
    }

    sync()

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY)
    const onChange = () => sync()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange)
      return () => {
        mediaQuery.removeEventListener('change', onChange)
      }
    }

    mediaQuery.addListener(onChange)
    return () => {
      mediaQuery.removeListener(onChange)
    }
  }, [theme])
}
