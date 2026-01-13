'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Droplets } from 'lucide-react'
import type { PlantWithType, WeatherType } from '@/types/database'
import { MoistureBar } from './moisture-bar'
import { GrowthProgress } from './growth-progress'
import { PlantVisual, StreakFire, XpPopup } from './plant-visual'
import { waterPlant } from '@/lib/actions/plants'
import { toast } from 'sonner'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'

interface PlantCardProps {
  plant: PlantWithType
  onClick?: () => void
  weather?: WeatherType | null
}

export function PlantCard({ plant, onClick, weather }: PlantCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isWatering, setIsWatering] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)

  const isWateredToday = plant.last_watered_at
    ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
    : false

  const isDead = plant.status === 'dead'
  const isMature = plant.status === 'mature'

  const handleWater = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isWateredToday || isDead) return

    setIsWatering(true)
    startTransition(async () => {
      const result = await waterPlant(plant.id)

      if (result.success) {
        // Show XP popup animation
        setEarnedXp(result.xpEarned || 0)
        setShowXp(true)
        setTimeout(() => setShowXp(false), 1500)

        toast.success(`Watered ${plant.name}!`, {
          description: `+${result.xpEarned} XP earned`,
        })
      } else {
        toast.error('Failed to water', {
          description: result.error,
        })
      }
      // Keep watering animation for a moment after success
      setTimeout(() => setIsWatering(false), 800)
    })
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden',
        isDead && 'opacity-60',
        isMature && 'ring-2 ring-green-500'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PlantVisual
                plant={plant}
                size="md"
                showWateringEffect={isWatering}
                weather={weather}
              />
              <XpPopup amount={earnedXp} show={showXp} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{plant.name}</h3>
              <p className="text-xs text-muted-foreground">{plant.plant_type.name}</p>
            </div>
          </div>
          <StreakFire streak={plant.current_streak} show={plant.current_streak > 0} />
        </div>

        <div className="space-y-2 mb-3">
          <MoistureBar value={plant.current_moisture} />
          <GrowthProgress
            value={plant.growth_percentage}
            status={plant.status}
            maturityDays={plant.plant_type.maturity_days}
          />
        </div>

        <Button
          variant={isWateredToday ? 'secondary' : 'default'}
          size="sm"
          className={cn('w-full', isWatering && 'animate-pulse')}
          onClick={handleWater}
          disabled={isPending || isWatering || isWateredToday || isDead}
        >
          <Droplets className={cn('h-4 w-4 mr-2', isWatering && 'text-blue-400')} />
          {isDead ? 'Dead' : isWateredToday ? 'Watered' : isWatering ? 'Watering...' : 'Water'}
        </Button>
      </CardContent>
    </Card>
  )
}
