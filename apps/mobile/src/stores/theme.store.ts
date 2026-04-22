import { create } from 'zustand'
import { MMKV } from 'react-native-mmkv'
import { Appearance } from 'react-native'

const storage = new MMKV({ id: 'theme-store' })

type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeState {
  mode: ThemeMode
  /** Resolved theme based on mode + system preference */
  resolved: 'dark' | 'light'
  setMode: (m: ThemeMode) => void
  toggleTheme: () => void
}

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  }
  return mode
}

const persisted = storage.getString('theme-mode') as ThemeMode | undefined
const initialMode: ThemeMode = persisted ?? 'system'

export const useThemeStore = create<ThemeState>((set) => ({
  mode: initialMode,
  resolved: resolveTheme(initialMode),
  setMode: (m) => {
    storage.set('theme-mode', m)
    set({ mode: m, resolved: resolveTheme(m) })
  },
  toggleTheme: () =>
    set((s) => {
      const next: ThemeMode = s.resolved === 'dark' ? 'light' : 'dark'
      storage.set('theme-mode', next)
      return { mode: next, resolved: next }
    }),
}))

// Listen for system appearance changes
Appearance.addChangeListener(({ colorScheme }) => {
  const state = useThemeStore.getState()
  if (state.mode === 'system') {
    useThemeStore.setState({ resolved: colorScheme === 'dark' ? 'dark' : 'light' })
  }
})
