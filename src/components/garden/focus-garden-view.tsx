'use client'

import { useMemo } from 'react'
import { IsometricGarden } from './isometric-garden'
import { FocusHeader } from './focus-header'
import type { FocusState } from './isometric-plant'
import type { PlantWithType, PlantType, WeatherType } from '@/types/database'

interface FocusGardenViewProps {
  plants: PlantWithType[]
  plantTypes: PlantType[]
  weather: WeatherType
  journalStreak?: number
}

// Check if a plant needs action today
function needsActionToday(plant: PlantWithType): boolean {
  // Goal plants: check if logged today
  if (plant.goal_mode && plant.goal) {
    return (plant.today_log_count || 0) === 0
  }

  // Regular plants: check if watered today
  if (plant.last_watered_at) {
    const lastWatered = new Date(plant.last_watered_at)
    const today = new Date()
    return lastWatered.toDateString() !== today.toDateString()
  }

  return true // Never watered, needs action
}

// Check if a plant is overdue (urgent)
function isOverdue(plant: PlantWithType): boolean {
  // Low moisture = urgent
  if (plant.current_moisture < 30) return true

  // Multiple days without watering
  if (plant.last_watered_at) {
    const lastWatered = new Date(plant.last_watered_at)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff >= 2
  }

  return false
}

export function FocusGardenView({
  plants,
  plantTypes,
  weather,
  journalStreak = 0
}: FocusGardenViewProps) {
  // Categorize plants
  const { needsAction, completed, urgentCount } = useMemo(() => {
    const needsAction: PlantWithType[] = []
    const completed: PlantWithType[] = []
    let urgentCount = 0

    for (const plant of plants) {
      if (plant.status === 'dead') continue

      if (needsActionToday(plant)) {
        needsAction.push(plant)
        if (isOverdue(plant)) {
          urgentCount++
        }
      } else {
        completed.push(plant)
      }
    }

    // Sort needsAction: urgent first, then by moisture level
    needsAction.sort((a, b) => {
      const aUrgent = isOverdue(a)
      const bUrgent = isOverdue(b)
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1
      return a.current_moisture - b.current_moisture
    })

    return { needsAction, completed, urgentCount }
  }, [plants])

  // Build focus state map for plants
  const focusStates = useMemo(() => {
    const states = new Map<string, 'highlight' | 'dim' | 'urgent'>()

    for (const plant of needsAction) {
      if (isOverdue(plant)) {
        states.set(plant.id, 'urgent')
      } else {
        states.set(plant.id, 'highlight')
      }
    }

    for (const plant of completed) {
      states.set(plant.id, 'dim')
    }

    return states
  }, [needsAction, completed])

  const totalPlants = needsAction.length + completed.length

  return (
    <div className="h-full relative">
      {/* Focus header showing progress */}
      <FocusHeader
        completed={completed.length}
        total={totalPlants}
        urgent={urgentCount}
      />

      {/* Isometric garden with focus mode enabled */}
      <IsometricGarden
        plantTypes={plantTypes}
        weather={weather}
        journalStreak={journalStreak}
        focusMode={true}
        focusStates={focusStates}
      />
    </div>
  )
}
