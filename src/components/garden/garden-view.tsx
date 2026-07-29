'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { IsometricGarden } from './isometric-garden'
import { usePlants } from '@/lib/context/plants-context'
import { useMood } from '@/lib/context/mood-context'
import { usePlantTypes, useProfile } from '@/lib/context/dashboard-data-context'
import { useDevOverride } from '@/components/dev/dev-debug-context'
import { useGardenSettingsOptional } from '@/lib/context/garden-settings-context'
import type { WeatherType } from '@/types/database'
import type { HabitSession } from '@/types/habits'

const LAST_VISIT_KEY = 'habit-garden-last-visit'
const ABSENCE_THRESHOLD_DAYS = 3
const subscribeToHardware = () => () => undefined
const WeatherEffects = dynamic(
  () => import(/* webpackChunkName: "garden-effects" */ './weather-effects').then((module) => ({ default: module.WeatherEffects })),
  { ssr: false }
)

interface GardenViewProps {
  weather?: WeatherType | null
  activeSession?: HabitSession | null
}

function getDaysDiff(previousDate: string, today: string): number {
  const previous = new Date(previousDate)
  const current = new Date(today)
  return Math.floor((current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000))
}

function moodToWeather(mood: number | null, fallback?: WeatherType | null): WeatherType {
  switch (mood) {
    case 5:
      return 'sunny'
    case 4:
    case 3:
      return 'cloudy'
    case 2:
      return 'rainy'
    case 1:
      return 'stormy'
    default:
      return fallback ?? 'sunny'
  }
}

export function GardenView({ weather, activeSession = null }: GardenViewProps) {
  const { plants } = usePlants()
  const { mood } = useMood()
  const plantTypes = usePlantTypes()
  const gardenSettings = useGardenSettingsOptional()
  const isLowPowerDevice = useSyncExternalStore(
    subscribeToHardware,
    () => (navigator.hardwareConcurrency ?? 8) <= 4,
    () => false
  )
  const { profile } = useProfile()
  const effectiveLevel = useDevOverride('level', profile?.level ?? 1)
  const [welcomeBackDays, setWelcomeBackDays] = useState(0)
  const [welcomeBackPending, setWelcomeBackPending] = useState(false)

  useEffect(() => {
    document.body.classList.add('sanctuary-active')
    return () => document.body.classList.remove('sanctuary-active')
  }, [])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY)

    if (lastVisit && lastVisit !== today) {
      const daysAway = getDaysDiff(lastVisit, today)
      if (daysAway >= ABSENCE_THRESHOLD_DAYS) {
        queueMicrotask(() => {
          setWelcomeBackDays(daysAway)
          setWelcomeBackPending(true)
        })
      }
    }

    localStorage.setItem(LAST_VISIT_KEY, today)
  }, [])

  const displayWeather = moodToWeather(mood, weather)
  const hasLivingPlants = plants.some(
    (plant) => plant.status !== 'dead' && plant.status !== 'dormant'
  )

  return (
    <div className="relative h-full min-h-[540px] overflow-hidden bg-[#dbe8dc] text-[#263f22]">
      <Image
        src="/garden/backgrounds/sanctuary-golden-hour.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div className="absolute inset-0 bg-white/5" aria-hidden="true" />

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: [
            'radial-gradient(circle at 71% 12%, rgba(255,239,170,0.25) 0%, rgba(255,239,170,0.08) 28%, transparent 54%)',
            'linear-gradient(180deg, rgba(255,249,224,0.05) 42%, rgba(185,205,183,0.14) 100%)',
          ].join(', '),
        }}
      />

      {displayWeather !== 'sunny' && gardenSettings.showWeatherEffects && !gardenSettings.reducedMotion && !isLowPowerDevice && (
        <div className="absolute inset-0 z-10 pointer-events-none opacity-55">
          <WeatherEffects weather={displayWeather} />
        </div>
      )}

      <main className="absolute inset-0 z-20" aria-label="Khu vườn thói quen hôm nay">
        <IsometricGarden
          plantTypes={plantTypes}
          weather={displayWeather}
          journalStreak={profile?.journal_streak ?? 0}
          userLevel={effectiveLevel}
          welcomeBackPending={welcomeBackPending}
          welcomeBackDays={welcomeBackDays}
          onWelcomeBackUsed={() => setWelcomeBackPending(false)}
          sanctuaryMode
          activeHabitId={activeSession?.habit_id}
        />
      </main>

      {!hasLivingPlants && (
        <p className="sr-only">
          Khu vườn đang trống. Hãy gieo hạt giống đầu tiên để bắt đầu một thói quen.
        </p>
      )}
    </div>
  )
}
