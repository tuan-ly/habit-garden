import { redirect } from 'next/navigation'
import { getCapabilityCompletionHref, getPlantHref } from '@/capabilities/core/routes'

interface CompletionPageProps {
  params: Promise<{ plantId: string }>
  searchParams: Promise<{ id?: string | string[] }>
}

export default async function CompletionPage({
  params,
  searchParams,
}: CompletionPageProps) {
  const [{ plantId }, query] = await Promise.all([params, searchParams])
  const sessionId = typeof query.id === 'string' ? query.id : undefined
  if (!sessionId) redirect(getPlantHref(plantId))
  redirect(getCapabilityCompletionHref(plantId, sessionId))
}
