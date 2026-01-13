'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Droplets, Flame } from 'lucide-react'
import type { PlantWithType } from '@/types/database'
import { MoistureBar } from './moisture-bar'
import { GrowthProgress } from './growth-progress'
import { waterPlant } from '@/lib/actions/plants'
import { toast } from 'sonner'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'

interface PlantCardProps {
  plant: PlantWithType
  onClick?: () => void
}

export function PlantCard({ plant, onClick }: PlantCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isWatering, setIsWatering] = useState(false)

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
        toast.success(`Watered ${plant.name}!`, {
          description: `+${result.xpEarned} XP earned`,
        })
      } else {
        toast.error('Failed to water', {
          description: result.error,
        })
      }
      setIsWatering(false)
    })
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:-translate-y-1',
        isDead && 'opacity-60 grayscale',
        isMature && 'ring-2 ring-green-500'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{plant.plant_type.icon}</span>
            <div>
              <h3 className="font-semibold text-sm">{plant.name}</h3>
              <p className="text-xs text-muted-foreground">{plant.plant_type.name}</p>
            </div>
          </div>
          {plant.current_streak > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-medium">{plant.current_streak}</span>
            </div>
          )}
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
          className="w-full"
          onClick={handleWater}
          disabled={isPending || isWatering || isWateredToday || isDead}
        >
          <Droplets className="h-4 w-4 mr-2" />
          {isDead ? 'Dead' : isWateredToday ? 'Watered' : 'Water'}
        </Button>
      </CardContent>
    </Card>
  )
}
