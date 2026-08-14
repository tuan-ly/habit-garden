export function getPlantHref(plantId: string): string {
  return `/plant/${encodeURIComponent(plantId)}`
}

export function getReadingSessionHref(plantId: string, sessionId?: string): string {
  const href = `${getPlantHref(plantId)}/reading/session`
  return sessionId ? `${href}?id=${encodeURIComponent(sessionId)}` : href
}

export function getReadingCompletionHref(plantId: string, sessionId: string): string {
  return `${getPlantHref(plantId)}/reading/completion?id=${encodeURIComponent(sessionId)}`
}

export function getReadingGrowthPlanHref(plantId: string): string {
  return `${getPlantHref(plantId)}/reading/growth-plan`
}
