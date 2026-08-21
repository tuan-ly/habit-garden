import { redirect } from 'next/navigation'
import { getCapabilitySessionHref } from '@/capabilities/core/routes'

interface FocusSessionPageProps {
  params: Promise<{ plantId: string }>
  searchParams: Promise<{ id?: string | string[] }>
}

export default async function FocusSessionPage({
  params,
  searchParams,
}: FocusSessionPageProps) {
  const [{ plantId }, query] = await Promise.all([params, searchParams])
  const sessionId = typeof query.id === 'string' ? query.id : undefined
  redirect(getCapabilitySessionHref(plantId, sessionId))
}
