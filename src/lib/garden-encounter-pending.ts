import {
  getLocalGardenDate,
  type GardenActionKind,
} from '@/lib/garden-encounters'

const PENDING_ENCOUNTER_STORAGE_KEY = 'habien-pending-garden-encounter'

export interface PendingGardenEncounter {
  version: 1
  date: string
  plantId: string
  plantName: string
  actionKind: GardenActionKind
  queuedAt: string
}

interface QueuePendingGardenEncounterInput {
  plantId: string
  plantName: string
  actionKind: GardenActionKind
  date?: string
}

function getClientStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

function readPendingEncounter(storage: Storage): PendingGardenEncounter | null {
  try {
    const rawValue = storage.getItem(PENDING_ENCOUNTER_STORAGE_KEY)
    if (!rawValue) return null
    const stored = JSON.parse(rawValue) as Partial<PendingGardenEncounter>
    if (
      stored.version !== 1
      || typeof stored.date !== 'string'
      || typeof stored.plantId !== 'string'
      || typeof stored.plantName !== 'string'
      || !['care', 'tiny', 'rest'].includes(stored.actionKind ?? '')
      || typeof stored.queuedAt !== 'string'
    ) {
      return null
    }
    return stored as PendingGardenEncounter
  } catch {
    return null
  }
}

export function queuePendingGardenEncounter({
  plantId,
  plantName,
  actionKind,
  date = getLocalGardenDate(),
}: QueuePendingGardenEncounterInput): void {
  try {
    const storage = getClientStorage()
    if (!storage) return
    const existing = readPendingEncounter(storage)

    // Preserve the first successful action so later completions cannot reroll it.
    if (existing?.date === date) return

    storage.setItem(PENDING_ENCOUNTER_STORAGE_KEY, JSON.stringify({
      version: 1,
      date,
      plantId,
      plantName,
      actionKind,
      queuedAt: new Date().toISOString(),
    } satisfies PendingGardenEncounter))
  } catch {
    // Completing a habit must still work when browser storage is unavailable.
  }
}

export function consumePendingGardenEncounter(
  date = getLocalGardenDate()
): PendingGardenEncounter | null {
  try {
    const storage = getClientStorage()
    if (!storage) return null
    const pending = readPendingEncounter(storage)
    storage.removeItem(PENDING_ENCOUNTER_STORAGE_KEY)
    return pending?.date === date ? pending : null
  } catch {
    return null
  }
}
