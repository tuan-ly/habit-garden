'use client'

import { WeatherBadge, WeatherEffectsPanel } from '@/components/gamification/weather-display'
import { XpBadge } from '@/components/gamification/xp-progress'
import type { Profile } from '@/types/database'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GardenHeaderProps {
  profile: Profile | null
}

export function GardenHeader({ profile }: GardenHeaderProps) {
  const [showWeatherDetails, setShowWeatherDetails] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Garden</h1>
          <p className="text-muted-foreground">
            Your habits are growing here. Water them daily to help them flourish.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile && <XpBadge totalXp={profile.xp} />}
          <WeatherBadge size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowWeatherDetails(!showWeatherDetails)}
          className="text-muted-foreground"
        >
          {showWeatherDetails ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide weather effects
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show weather effects
            </>
          )}
        </Button>
      </div>

      {showWeatherDetails && (
        <WeatherEffectsPanel className="animate-in fade-in slide-in-from-top-2 duration-200" />
      )}
    </div>
  )
}
