import { getAggregatedGardenStats } from '@/lib/actions/plants'
import OverviewClient from './overview-client'

// Format date as YYYY-MM-DD in server's timezone (will be re-anchored on client if needed)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default async function OverviewPage() {
  // Pre-fetch default period stats on the server so the first paint
  // includes data — removes client-side fetch waterfall on page load.
  const initialPeriod = 'week' as const
  const initialStats = await getAggregatedGardenStats(
    initialPeriod,
    formatDateLocal(new Date())
  ).catch(() => null)

  return (
    <OverviewClient initialPeriod={initialPeriod} initialStats={initialStats} />
  )
}
