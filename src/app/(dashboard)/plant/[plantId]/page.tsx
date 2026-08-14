import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { PlantCapabilityHome } from '@/components/plants/plant-capability-home'
import { ReadingHome } from '@/components/reading/reading-home'
import { ReadingShell } from '@/components/reading/reading-shell'
import { getReadingJourneySnapshot } from '@/lib/actions/habit-sessions'
import { getPlant } from '@/lib/actions/plants'
import { getPlantHref } from '@/lib/reading-routes'

interface PlantPageProps {
  params: Promise<{ plantId: string }>
}

export default async function PlantPage({ params }: PlantPageProps) {
  const { plantId } = await params
  const plant = await getPlant(plantId)
  if (!plant) notFound()

  const result = await getReadingJourneySnapshot(plantId)
  if (result.success) return <ReadingHome snapshot={result.data} />
  if (result.code === 'NOT_FOUND') return <PlantCapabilityHome plant={plant} />

  return (
    <ReadingShell
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
    </ReadingShell>
  )
}
