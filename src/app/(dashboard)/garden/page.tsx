import { getPlants, getPlantTypes } from '@/lib/actions/plants'
import { getProfile } from '@/lib/actions/profile'
import { GardenView } from '@/components/garden/garden-view'
import { getTodayWeather } from '@/lib/weather-system'
import { PlantsProvider } from '@/lib/context'

export default async function GardenPage() {
  const [plants, plantTypes, profile] = await Promise.all([
    getPlants(),
    getPlantTypes(),
    getProfile(),
  ])

  const weather = getTodayWeather()

  return (
    <PlantsProvider initialPlants={plants}>
      <div className="h-full">
        <GardenView
          plantTypes={plantTypes}
          weather={weather.type}
          profile={profile}
        />
      </div>
    </PlantsProvider>
  )
}
