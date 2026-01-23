'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

// LocalStorage key for persisting settings
const GARDEN_SETTINGS_KEY = 'garden-settings'

// Default settings - all effects enabled
const DEFAULT_SETTINGS: GardenEffectSettings = {
  showParticles: true,
  showDecorations: true,
  showCelebrations: true,
  showWeatherEffects: true,
  reducedMotion: false,
  useCanvasRenderer: true, // Canvas for better performance on weak devices
}

export interface GardenEffectSettings {
  /** Show ambient particles (butterflies, pollen, fireflies) */
  showParticles: boolean
  /** Show garden decorations (bushes, rocks, flowers) */
  showDecorations: boolean
  /** Show watering celebrations (XP popup, sparkles) */
  showCelebrations: boolean
  /** Show weather-related effects */
  showWeatherEffects: boolean
  /** Reduced motion mode - disables most animations */
  reducedMotion: boolean
  /** Use Canvas renderer instead of SVG for better performance */
  useCanvasRenderer: boolean
}

interface GardenSettingsContextType {
  settings: GardenEffectSettings
  updateSetting: <K extends keyof GardenEffectSettings>(
    key: K,
    value: GardenEffectSettings[K]
  ) => void
  resetSettings: () => void
  /** Enable all effects */
  enableAll: () => void
  /** Disable all effects for maximum performance */
  disableAll: () => void
}

const GardenSettingsContext = createContext<GardenSettingsContextType | null>(null)

interface GardenSettingsProviderProps {
  children: ReactNode
}

export function GardenSettingsProvider({ children }: GardenSettingsProviderProps) {
  const [settings, setSettings] = useState<GardenEffectSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(GARDEN_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<GardenEffectSettings>
        setSettings((prev) => ({ ...prev, ...parsed }))
      }

      // Also check for system reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        setSettings((prev) => ({ ...prev, reducedMotion: true }))
      }
    } catch {
      // Ignore parse errors, use defaults
    }

    setIsLoaded(true)
  }, [])

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return

    try {
      localStorage.setItem(GARDEN_SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      // Ignore storage errors
    }
  }, [settings, isLoaded])

  const updateSetting = useCallback(
    <K extends keyof GardenEffectSettings>(
      key: K,
      value: GardenEffectSettings[K]
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const enableAll = useCallback(() => {
    setSettings({
      showParticles: true,
      showDecorations: true,
      showCelebrations: true,
      showWeatherEffects: true,
      reducedMotion: false,
      useCanvasRenderer: true,
    })
  }, [])

  const disableAll = useCallback(() => {
    setSettings({
      showParticles: false,
      showDecorations: false,
      showCelebrations: false,
      showWeatherEffects: false,
      reducedMotion: true,
      useCanvasRenderer: true, // Keep canvas for performance
    })
  }, [])

  return (
    <GardenSettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        enableAll,
        disableAll,
      }}
    >
      {children}
    </GardenSettingsContext.Provider>
  )
}

export function useGardenSettings() {
  const context = useContext(GardenSettingsContext)
  if (!context) {
    throw new Error('useGardenSettings must be used within a GardenSettingsProvider')
  }
  return context
}

// Optional hook that returns defaults if not in provider
export function useGardenSettingsOptional(): GardenEffectSettings {
  const context = useContext(GardenSettingsContext)
  return context?.settings ?? DEFAULT_SETTINGS
}
