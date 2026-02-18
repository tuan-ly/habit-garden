'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import type { MoodLevel } from '@/lib/mood-system'
import {
  DEFAULT_MOOD,
  getMoodConfig,
  getMoodXpMultiplier,
  calculateXpWithMood,
  getMoodBonusXp,
  isToughDay,
  getMoodEncouragement,
} from '@/lib/mood-system'
import { getTodayMood, setTodayMood as setMoodAction, hasMoodSetToday } from '@/lib/actions/mood'
import { toast } from 'sonner'

interface MoodContextValue {
  mood: MoodLevel
  isLoading: boolean
  isMoodSet: boolean
  setMood: (level: MoodLevel, note?: string) => Promise<void>
  // Derived values
  xpMultiplier: number
  isToughDay: boolean
  encouragement: string
  weatherIcon: string
  weatherName: string
  // Helper functions
  calculateXp: (baseXp: number) => number
  getBonusXp: (baseXp: number) => number
}

const MoodContext = createContext<MoodContextValue | null>(null)

export function MoodProvider({
  children,
  initialMood,
}: {
  children: ReactNode
  initialMood?: MoodLevel
}) {
  const [mood, setMoodState] = useState<MoodLevel>(initialMood || DEFAULT_MOOD)
  const [isMoodSet, setIsMoodSet] = useState(!!initialMood && initialMood !== DEFAULT_MOOD)
  const [isLoading, setIsLoading] = useState(!initialMood)

  // Only fetch from server if initialMood was not provided via SSR
  useEffect(() => {
    if (initialMood) return // SSR already provided the mood

    const initMood = async () => {
      setIsLoading(true)
      const [fetchedMood, moodWasSet] = await Promise.all([
        getTodayMood(),
        hasMoodSetToday()
      ])

      setMoodState(fetchedMood)
      setIsMoodSet(moodWasSet)
      setIsLoading(false)
    }

    initMood()
  }, [initialMood])

  // Set mood handler
  const setMood = useCallback(
    async (newMood: MoodLevel, note?: string) => {
      const previousMood = mood

      // Optimistic update
      setMoodState(newMood)

      const result = await setMoodAction(newMood, note)

      if (result.success) {
        const config = getMoodConfig(newMood)
        const bonusPercent = Math.round((config.xpMultiplier - 1) * 100)

        if (isToughDay(newMood)) {
          toast.success(`${config.icon} ${config.weather}`, {
            description: `Tough day? You'll earn +${bonusPercent}% XP for showing up!`,
          })
        } else {
          toast.success(`${config.icon} ${config.weather}`, {
            description: config.description,
          })
        }
        setIsMoodSet(true)
      } else {
        // Revert on error
        setMoodState(previousMood)
        toast.error('Failed to set mood', {
          description: result.error,
        })
      }
    },
    [mood]
  )

  // Derived values
  const config = getMoodConfig(mood)
  const xpMultiplier = getMoodXpMultiplier(mood)
  const tough = isToughDay(mood)
  const encouragement = getMoodEncouragement(mood)

  // Helper functions
  const calculateXp = useCallback(
    (baseXp: number) => calculateXpWithMood(baseXp, mood),
    [mood]
  )

  const getBonusXp = useCallback(
    (baseXp: number) => getMoodBonusXp(baseXp, mood),
    [mood]
  )

  // Memoize context value to prevent unnecessary consumer re-renders
  const contextValue = useMemo(
    () => ({
      mood,
      isLoading,
      isMoodSet,
      setMood,
      xpMultiplier,
      isToughDay: tough,
      encouragement,
      weatherIcon: config.icon,
      weatherName: config.weather,
      calculateXp,
      getBonusXp,
    }),
    [mood, isLoading, isMoodSet, setMood, xpMultiplier, tough, encouragement, config.icon, config.weather, calculateXp, getBonusXp]
  )

  return (
    <MoodContext.Provider value={contextValue}>
      {children}
    </MoodContext.Provider>
  )
}

export function useMood() {
  const context = useContext(MoodContext)
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider')
  }
  return context
}

// Optional hook that returns null if not in provider (for conditional usage)
export function useMoodOptional() {
  return useContext(MoodContext)
}
