export function getPlantHref(plantId: string): string {
  return `/plant/${encodeURIComponent(plantId)}`
}

export function getCapabilitySessionHref(plantId: string, sessionId?: string): string {
  const href = `${getPlantHref(plantId)}/journey/session`
  return sessionId ? `${href}?id=${encodeURIComponent(sessionId)}` : href
}

export function getCapabilityCompletionHref(plantId: string, sessionId: string): string {
  return `${getPlantHref(plantId)}/journey/completion?id=${encodeURIComponent(sessionId)}`
}

export function getCapabilityPlanHref(plantId: string): string {
  return `${getPlantHref(plantId)}/journey/plan`
}
