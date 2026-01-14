import { getPlants, getPlantTypes } from '@/lib/actions/plants'
import { getProfile } from '@/lib/actions/profile'
import { GardenView } from '@/components/garden/garden-view'
import { getTodayWeather } from '@/lib/weather-system'

export default async function GardenPage() {
  const [plants, plantTypes, profile] = await Promise.all([
    getPlants(),
    getPlantTypes(),
    getProfile(),
  ])

  const weather = getTodayWeather()

  return (
    <div className="h-full">
      <GardenView
        plants={plants}
        plantTypes={plantTypes}
        weather={weather.type}
        profile={profile}
      />
    </div>
  )
}
