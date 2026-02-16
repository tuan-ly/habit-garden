import { getIdentities } from '@/lib/actions/identity'
import { IdentityDashboard } from '@/components/identity'

export const metadata = {
  title: 'Identity | Habit Garden',
  description: 'Define who you want to become',
}

export default async function IdentityPage() {
  const identities = await getIdentities()

  return (
    <div className="h-full overflow-y-auto pt-3 px-3 pb-36 sm:pt-4 sm:px-4">
      <IdentityDashboard initialIdentities={identities} />
    </div>
  )
}
