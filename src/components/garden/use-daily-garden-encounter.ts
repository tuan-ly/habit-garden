'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildDailyGardenPlan,
  getDailyGardenAtmosphere,
  getGardenEncounter,
  getGardenEncounterCopy,
  getLocalGardenDate,
  type DailyGardenPlan,
  type GardenActionKind,
  type GardenEncounterCopy,
} from '@/lib/garden-encounters'
import { consumePendingGardenEncounter } from '@/lib/garden-encounter-pending'
import { isVisibleInGarden } from '@/lib/plant-status'
import { isToday } from '@/lib/utils'
import type { PlantWithType, WeatherType } from '@/types/database'

const PLAN_STORAGE_PREFIX = 'habien-daily-garden-plan:'
const REVEAL_STORAGE_PREFIX = 'habien-daily-garden-encounter:'

interface StoredDailyPlan {
  version: 1
  date: string
  atmosphereId: DailyGardenPlan['atmosphere']['id']
  encounterId: DailyGardenPlan['encounter']['id']
}

interface StoredEncounterReveal {
  version: 1
  date: string
  encounterId: DailyGardenPlan['encounter']['id']
  plantId: string
  plantName: string
  actionKind: GardenActionKind
  revealedAt: string
}

export interface DailyGardenEncounterMemory {
  encounter: DailyGardenPlan['encounter']
  copy: GardenEncounterCopy
  plantId: string
  plantName: string
  actionKind: GardenActionKind
  revealedAt: string
}

interface UseDailyGardenEncounterInput {
  plants: PlantWithType[]
  weather?: WeatherType | null
  enabled: boolean
}

function parseStoredValue<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function readStoredValue<T>(key: string): T | null {
  try {
    return parseStoredValue<T>(localStorage.getItem(key))
  } catch {
    return null
  }
}

function writeStoredValue(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The garden remains functional when storage is disabled or full.
  }
}

function removeExpiredDailyState(today: string): void {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (!key) continue
      const isDailyGardenState = key.startsWith(PLAN_STORAGE_PREFIX)
        || key.startsWith(REVEAL_STORAGE_PREFIX)
      if (isDailyGardenState && !key.endsWith(today)) localStorage.removeItem(key)
    }
  } catch {
    // Storage cleanup is best-effort only.
  }
}

function restorePlan(stored: StoredDailyPlan | null): DailyGardenPlan | null {
  if (!stored || stored.version !== 1) return null
  const atmosphere = getDailyGardenAtmosphere(stored.atmosphereId)
  const encounter = getGardenEncounter(stored.encounterId)
  if (!atmosphere || !encounter) return null
  return { date: stored.date, atmosphere, encounter }
}

function createMemory(
  plan: DailyGardenPlan,
  stored: StoredEncounterReveal
): DailyGardenEncounterMemory {
  const encounter = getGardenEncounter(stored.encounterId) ?? plan.encounter
  return {
    encounter,
    copy: getGardenEncounterCopy(encounter, stored.plantName, stored.actionKind),
    plantId: stored.plantId,
    plantName: stored.plantName,
    actionKind: stored.actionKind,
    revealedAt: stored.revealedAt,
  }
}

function getMostRecentActivePlant(plants: PlantWithType[]): PlantWithType | null {
  return plants
    .filter((plant) => isVisibleInGarden(plant) && isToday(plant.last_watered_at))
    .sort((left, right) => (right.last_watered_at ?? '').localeCompare(left.last_watered_at ?? ''))[0]
    ?? null
}

export function useDailyGardenEncounter({
  plants,
  weather,
  enabled,
}: UseDailyGardenEncounterInput) {
  const [plan, setPlan] = useState<DailyGardenPlan | null>(null)
  const [memory, setMemory] = useState<DailyGardenEncounterMemory | null>(null)
  const [freshEncounter, setFreshEncounter] = useState<DailyGardenEncounterMemory | null>(null)
  const initializedDateRef = useRef<string | null>(null)
  const revealedRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const date = getLocalGardenDate()
    if (initializedDateRef.current === date) return
    initializedDateRef.current = date
    removeExpiredDailyState(date)

    const planKey = `${PLAN_STORAGE_PREFIX}${date}`
    const revealKey = `${REVEAL_STORAGE_PREFIX}${date}`
    const restoredPlan = restorePlan(
      readStoredValue<StoredDailyPlan>(planKey)
    )
    const nextPlan = restoredPlan ?? buildDailyGardenPlan({
      date,
      plants: plants.filter(isVisibleInGarden),
      weather,
    })

    if (!restoredPlan) {
      writeStoredValue(planKey, {
        version: 1,
        date,
        atmosphereId: nextPlan.atmosphere.id,
        encounterId: nextPlan.encounter.id,
      } satisfies StoredDailyPlan)
    }

    const storedReveal = readStoredValue<StoredEncounterReveal>(revealKey)
    const pendingEncounter = consumePendingGardenEncounter(date)
    let nextMemory: DailyGardenEncounterMemory | null = null
    let nextFreshEncounter: DailyGardenEncounterMemory | null = null
    if (storedReveal?.version === 1 && storedReveal.date === date) {
      revealedRef.current = true
      nextMemory = createMemory(nextPlan, storedReveal)
    } else if (pendingEncounter) {
      const pendingReveal: StoredEncounterReveal = {
        version: 1,
        date,
        encounterId: nextPlan.encounter.id,
        plantId: pendingEncounter.plantId,
        plantName: pendingEncounter.plantName,
        actionKind: pendingEncounter.actionKind,
        revealedAt: pendingEncounter.queuedAt,
      }
      writeStoredValue(revealKey, pendingReveal)
      revealedRef.current = true
      nextMemory = createMemory(nextPlan, pendingReveal)
      nextFreshEncounter = nextMemory
    } else {
      // A different device or cleared browser storage must not create a second
      // "first" encounter when today's activity is already visible in the read model.
      const recentPlant = getMostRecentActivePlant(plants)
      if (recentPlant) {
        const inferredReveal: StoredEncounterReveal = {
          version: 1,
          date,
          encounterId: nextPlan.encounter.id,
          plantId: recentPlant.id,
          plantName: recentPlant.name,
          actionKind: 'care',
          revealedAt: recentPlant.last_watered_at ?? new Date().toISOString(),
        }
        writeStoredValue(revealKey, inferredReveal)
        revealedRef.current = true
        nextMemory = createMemory(nextPlan, inferredReveal)
      }
    }

    queueMicrotask(() => {
      setPlan(nextPlan)
      if (nextMemory) setMemory(nextMemory)
      if (nextFreshEncounter) setFreshEncounter(nextFreshEncounter)
    })
  }, [enabled, plants, weather])

  const revealEncounter = useCallback((plant: PlantWithType, actionKind: GardenActionKind) => {
    if (!enabled || revealedRef.current) return
    const date = getLocalGardenDate()
    const nextPlan = plan ?? buildDailyGardenPlan({
      date,
      plants: plants.filter(isVisibleInGarden),
      weather,
    })
    const storedReveal: StoredEncounterReveal = {
      version: 1,
      date,
      encounterId: nextPlan.encounter.id,
      plantId: plant.id,
      plantName: plant.name,
      actionKind,
      revealedAt: new Date().toISOString(),
    }
    const nextMemory = createMemory(nextPlan, storedReveal)

    revealedRef.current = true
    setPlan(nextPlan)
    setMemory(nextMemory)
    setFreshEncounter(nextMemory)
    writeStoredValue(`${PLAN_STORAGE_PREFIX}${date}`, {
      version: 1,
      date,
      atmosphereId: nextPlan.atmosphere.id,
      encounterId: nextPlan.encounter.id,
    } satisfies StoredDailyPlan)
    writeStoredValue(`${REVEAL_STORAGE_PREFIX}${date}`, storedReveal)
  }, [enabled, plan, plants, weather])

  const completeFreshEncounter = useCallback(() => {
    setFreshEncounter(null)
  }, [])

  return {
    atmosphere: plan?.atmosphere ?? null,
    memory,
    freshEncounter,
    revealEncounter,
    completeFreshEncounter,
  }
}
