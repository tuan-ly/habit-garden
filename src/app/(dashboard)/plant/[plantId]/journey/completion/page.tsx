import { notFound, redirect } from 'next/navigation'
import { getPlantHref } from '@/capabilities/core/routes'
import { renderCapabilityScreen } from '@/capabilities/core/server-screen-registry'
import { getPlantCapabilitySummary } from '@/lib/actions/capabilities'

interface CapabilityCompletionPageProps {
  params: Promise<{ plantId: string }>
  searchParams: Promise<{ id?: string | string[] }>
}

export default async function CapabilityCompletionPage({ params, searchParams }: CapabilityCompletionPageProps) {
  const [{ plantId }, query] = await Promise.all([params, searchParams])
  const capability = await getPlantCapabilitySummary(plantId)
  if (!capability.success || !capability.data?.is_active) redirect(getPlantHref(plantId))

  const screen = await renderCapabilityScreen(capability.data.type, 'completion', {
    plantId,
    sessionId: typeof query.id === 'string' ? query.id : undefined,
  })
  if (!screen) notFound()
  return screen
}
