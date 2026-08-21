'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { getCapabilityLogProjection } from '@/lib/capability-log-projection'
import {
  buildPlantStorySnapshot,
  type PlantStoryPlant,
  type PlantStoryPlantOption,
  type PlantStorySnapshot,
  type PlantStorySourceEntry,
} from '@/lib/plant-story'
import { createClient } from '@/lib/supabase/server'
import type { PlantStatus, VisualStage } from '@/types/database'

const ACTIVITY_PAGE_SIZE = 500
const PLANT_TYPE_COLUMNS = 'id,name,name_vi,icon'
const PLANT_STORY_COLUMNS = [
  'id',
  'plant_type_id',
  'name',
  'habit_description',
  'why_i_started',
  'started_at',
  'created_at',
  'status',
  'growth_percentage',
  'visual_stage',
  'grid_size',
  `plant_type:plant_types(${PLANT_TYPE_COLUMNS})`,
].join(',')
const PLANT_OPTION_COLUMNS = [
  'id',
  'name',
  'status',
  'started_at',
  `plant_type:plant_types(${PLANT_TYPE_COLUMNS})`,
].join(',')
const ACTIVITY_COLUMNS = [
  'id',
  'plant_id',
  'activity_type',
  'logged_at',
  'logged_date',
  'value',
  'notes',
  'xp_earned',
  'is_personal_record',
].join(',')

interface PlantTypeRow {
  id: string
  name: string
  name_vi: string | null
  icon: string | null
}

interface PlantStoryRow {
  id: string
  plant_type_id: string
  name: string
  habit_description: string | null
  why_i_started: string | null
  started_at: string | null
  created_at: string | null
  status: string | null
  growth_percentage: number | null
  visual_stage: string | null
  grid_size: number | null
  plant_type: PlantTypeRow | PlantTypeRow[] | null
}

interface PlantOptionRow {
  id: string
  name: string
  status: string | null
  started_at: string | null
  plant_type: PlantTypeRow | PlantTypeRow[] | null
}

function unwrapPlantType(
  value: PlantTypeRow | PlantTypeRow[] | null
): PlantTypeRow | null {
  return Array.isArray(value) ? value[0] ?? null : value
}

function normalizePlant(row: PlantStoryRow): PlantStoryPlant {
  const plantType = unwrapPlantType(row.plant_type)

  return {
    id: row.id,
    name: row.name,
    habitDescription: row.habit_description,
    whyIStarted: row.why_i_started,
    startedAt: row.started_at ?? row.created_at ?? '',
    status: (row.status ?? 'growing') as PlantStatus,
    growthPercentage: row.growth_percentage ?? 0,
    visualStage: (row.visual_stage ?? 'seed') as VisualStage,
    gridSize: row.grid_size ?? 1,
    plantType: {
      id: plantType?.id ?? row.plant_type_id,
      name: plantType?.name ?? 'plant',
      nameVi: plantType?.name_vi ?? plantType?.name ?? 'Cây',
      icon: plantType?.icon ?? '🌱',
    },
  }
}

function normalizePlantOption(row: PlantOptionRow): PlantStoryPlantOption {
  const plantType = unwrapPlantType(row.plant_type)
  return {
    id: row.id,
    name: row.name,
    icon: plantType?.icon ?? '🌱',
    status: (row.status ?? 'growing') as PlantStatus,
  }
}

async function getAllLegacyPlantEntries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  plantId: string
): Promise<PlantStorySourceEntry[] | null> {
  const entries: PlantStorySourceEntry[] = []

  for (let from = 0; ; from += ACTIVITY_PAGE_SIZE) {
    const result = await supabase
      .from('activity_logs')
      .select(ACTIVITY_COLUMNS)
      .eq('plant_id', plantId)
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + ACTIVITY_PAGE_SIZE - 1)

    if (result.error) {
      console.error('Unable to load plant story activity log:', result.error)
      return null
    }

    const page = (result.data ?? []) as unknown as PlantStorySourceEntry[]
    entries.push(...page)
    if (page.length < ACTIVITY_PAGE_SIZE) return entries
  }
}

/** Loads the complete, owned event history needed by the Living Chapters UI. */
export async function getPlantStory(plantId: string): Promise<PlantStorySnapshot | null> {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const ownedPlant = await supabase
    .from('plants')
    .select(PLANT_STORY_COLUMNS)
    .eq('id', plantId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (ownedPlant.error) {
    console.error('Unable to load plant story identity:', ownedPlant.error)
    return null
  }
  if (!ownedPlant.data) return null

  const [capabilityEntries, plantOptionsResult] = await Promise.all([
    getCapabilityLogProjection(user.id, plantId),
    supabase
      .from('plants')
      .select(PLANT_OPTION_COLUMNS)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .order('id', { ascending: true }),
  ])

  if (plantOptionsResult.error) {
    console.error('Unable to load plant story switch options:', plantOptionsResult.error)
  }

  const entries = capabilityEntries
    ?? await getAllLegacyPlantEntries(supabase, user.id, plantId)
  if (!entries) return null

  const plant = normalizePlant(ownedPlant.data as unknown as PlantStoryRow)
  const plantOptions = plantOptionsResult.error
    ? [{ id: plant.id, name: plant.name, icon: plant.plantType.icon, status: plant.status }]
    : ((plantOptionsResult.data ?? []) as unknown as PlantOptionRow[]).map(normalizePlantOption)

  return buildPlantStorySnapshot({
    plant,
    plantOptions,
    entries,
  })
}
