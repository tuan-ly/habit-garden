import { notFound, redirect } from 'next/navigation'
import { getPlantHref } from '@/capabilities/core/routes'
import { renderCapabilityScreen } from '@/capabilities/core/server-screen-registry'
import { getPlantCapabilitySummary } from '@/lib/actions/capabilities'

interface CapabilityPlanPageProps {
  params: Promise<{ plantId: string }>
}

export default async function CapabilityPlanPage({ params }: CapabilityPlanPageProps) {
  const { plantId } = await params
  const capability = await getPlantCapabilitySummary(plantId)
  if (!capability.success || !capability.data?.is_active) redirect(getPlantHref(plantId))

  const screen = await renderCapabilityScreen(capability.data.type, 'plan', { plantId })
  if (!screen) notFound()
  return screen
}
