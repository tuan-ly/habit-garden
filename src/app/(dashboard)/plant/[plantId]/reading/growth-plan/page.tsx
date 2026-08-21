import { redirect } from 'next/navigation'
import { getCapabilityPlanHref } from '@/capabilities/core/routes'

interface GrowthPlanPageProps {
  params: Promise<{ plantId: string }>
}

export default async function GrowthPlanPage({ params }: GrowthPlanPageProps) {
  const { plantId } = await params
  redirect(getCapabilityPlanHref(plantId))
}
