import { getPlants, getPlantTypes } from '@/lib/actions/plants'
import { getProfile } from '@/lib/actions/profile'
import { GardenView } from '@/components/garden/garden-view'
import { GardenHeader } from '@/components/garden/garden-header'

export default async function GardenPage() {
  const [plants, plantTypes, profile] = await Promise.all([
    getPlants(),
    getPlantTypes(),
    getProfile(),
  ])

  return (
    <div className="space-y-6">
      <GardenHeader profile={profile} />

      <GardenView plants={plants} plantTypes={plantTypes} />
    </div>
  )
}
