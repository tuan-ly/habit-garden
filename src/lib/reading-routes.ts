import {
  getCapabilityCompletionHref,
  getCapabilityPlanHref,
  getCapabilitySessionHref,
  getPlantHref,
} from '@/capabilities/core/routes'

export { getPlantHref }

export function getReadingSessionHref(plantId: string, sessionId?: string): string {
  return getCapabilitySessionHref(plantId, sessionId)
}

export function getReadingCompletionHref(plantId: string, sessionId: string): string {
  return getCapabilityCompletionHref(plantId, sessionId)
}

export function getReadingGrowthPlanHref(plantId: string): string {
  return getCapabilityPlanHref(plantId)
}
