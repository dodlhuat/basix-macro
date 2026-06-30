const STORAGE_KEY = 'theme'
const isDark = ref(false)

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
  isDark.value = theme === 'dark'
}

function saveTheme(theme: 'light' | 'dark') {
  // eslint-disable-next-line no-empty
  try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
}

function getSavedTheme(): 'light' | 'dark' | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch { return null }
}

export function useTheme() {
  function initTheme(darkModePreference?: boolean) {
    if (import.meta.server) return
    const saved = getSavedTheme()
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    let theme: 'light' | 'dark'

    if (saved) {
      theme = saved
    } else if (darkModePreference !== undefined) {
      theme = darkModePreference ? 'dark' : 'light'
    } else {
      theme = systemDark ? 'dark' : 'light'
    }

    applyTheme(theme)
  }

  function toggleTheme() {
    if (import.meta.server) return
    const next: 'light' | 'dark' = isDark.value ? 'light' : 'dark'
    saveTheme(next)
    applyTheme(next)
  }

  function setDarkMode(dark: boolean) {
    if (import.meta.server) return
    const theme: 'light' | 'dark' = dark ? 'dark' : 'light'
    saveTheme(theme)
    applyTheme(theme)
  }

  return { isDark, initTheme, toggleTheme, setDarkMode }
}
