'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { DEFAULT_SETTINGS, VAR_KEYS, settingsToVars, type PresetId, type SiteSettings } from '@/lib/theme'

type Mode = 'auto' | 'light' | 'dark'

type ThemeContextValue = {
  /** Settings currently shown (the published ones, or an admin's unsaved preview). */
  settings: SiteSettings
  /** Preset actually on screen after the visitor's light/dark choice. */
  activePreset: PresetId
  isLight: boolean
  toggleLight: () => void
  /** Studio only: show unsaved settings live. Pass null to go back to the published ones. */
  setPreview: (preview: SiteSettings | null) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  settings: DEFAULT_SETTINGS,
  activePreset: DEFAULT_SETTINGS.preset,
  isLight: false,
  toggleLight: () => {},
  setPreview: () => {},
})

const STORAGE_KEY = 'dw-mode'
const listeners = new Set<() => void>()

function readMode(): Mode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

function resolvePreset(preset: PresetId, mode: Mode): PresetId {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return preset === 'light' ? 'midnight' : preset
  return preset
}

export function ThemeProvider({
  settings: published,
  children,
}: {
  settings: SiteSettings
  children: React.ReactNode
}) {
  const [preview, setPreview] = useState<SiteSettings | null>(null)
  const mode = useSyncExternalStore<Mode>(subscribe, readMode, () => 'auto')
  const settings = preview ?? published
  const activePreset = resolvePreset(settings.preset, mode)
  const isLight = activePreset === 'light'
  const firstRender = useRef(true)

  useEffect(() => {
    const root = document.documentElement
    if (!firstRender.current) {
      root.classList.add('theme-transition')
      const t = window.setTimeout(() => root.classList.remove('theme-transition'), 450)
      applyTheme(root, activePreset, settings)
      return () => window.clearTimeout(t)
    }
    firstRender.current = false
    applyTheme(root, activePreset, settings)
  }, [activePreset, settings])

  const toggleLight = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isLight ? 'dark' : 'light')
    } catch {
      /* storage unavailable: the toggle simply won't persist */
    }
    listeners.forEach((l) => l())
  }, [isLight])

  const value = useMemo(
    () => ({ settings, activePreset, isLight, toggleLight, setPreview }),
    [settings, activePreset, isLight, toggleLight]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function applyTheme(root: HTMLElement, preset: PresetId, settings: SiteSettings) {
  root.dataset.theme = preset
  root.dataset.motion = settings.motion.intensity
  VAR_KEYS.forEach((k) => root.style.removeProperty(k))
  Object.entries(settingsToVars(settings)).forEach(([k, v]) => root.style.setProperty(k, v))
}

export const useSiteTheme = () => useContext(ThemeContext)

/**
 * Runs before first paint so a visitor's saved light/dark choice never flashes the wrong theme.
 * Mirrors resolvePreset() above.
 */
export const THEME_INIT_SCRIPT = `try{var m=localStorage.getItem('${STORAGE_KEY}'),e=document.documentElement;if(m==='light')e.dataset.theme='light';else if(m==='dark'&&e.dataset.theme==='light')e.dataset.theme='midnight'}catch(_){}`
