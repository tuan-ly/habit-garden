import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { getPlantHref } from '@/capabilities/core/routes'
import { getCapabilityServerDriver } from '@/capabilities/core/server-registry'
import { renderCapabilityJourney } from '@/capabilities/core/ui-registry'
import { JourneyShell } from '@/components/capabilities/journey-shell'
import { PlantCapabilityHome } from '@/components/plants/plant-capability-home'
import { getPlantCapabilitySummary } from '@/lib/actions/capabilities'
import { getPlant } from '@/lib/actions/plants'

interface PlantPageProps {
  params: Promise<{ plantId: string }>
}

export default async function PlantPage({ params }: PlantPageProps) {
  const { plantId } = await params
  const plant = await getPlant(plantId)
  if (!plant) notFound()

  const capability = await getPlantCapabilitySummary(plantId)
  if (!capability.success) {
    return (
      <JourneyShell
        eyebrow={plant.name}
        title="Chưa thể mở cây lúc này"
        description={capability.error}
        backHref="/garden"
      >
        <div />
      </JourneyShell>
    )
  }
  if (!capability.data) return <PlantCapabilityHome plant={plant} />
  if (!capability.data.is_active) {
    return (
      <PlantCapabilityHome
        plant={{ ...plant, guided_habit: capability.data }}
      />
    )
  }

  const driver = getCapabilityServerDriver(capability.data.type)
  if (!driver) {
    return (
      <JourneyShell
        eyebrow={plant.name}
        title="Hành trình này chưa được hỗ trợ"
        description="Cây vẫn an toàn trong vườn. Hãy thử lại sau khi ứng dụng được cập nhật."
        backHref="/garden"
      >
        <div />
      </JourneyShell>
    )
  }

  const result = await driver.loadJourney(plantId)
  if (result.success) return renderCapabilityJourney(driver.key, result.data)
  if (result.code === 'NOT_FOUND') {
    return (
      <PlantCapabilityHome
        plant={{ ...plant, guided_habit: capability.data }}
      />
    )
  }

  return (
    <JourneyShell
      eyebrow={plant.name}
      title="Chưa thể mở cây lúc này"
      description={result.error}
      backHref="/garden"
    >
      <div className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/75 bg-[#fffaf0]/92 p-6 text-center shadow-xl">
        <Link
          href={getPlantHref(plant.id)}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#5f854f] px-5 text-sm font-extrabold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </Link>
      </div>
    </JourneyShell>
  )
}
