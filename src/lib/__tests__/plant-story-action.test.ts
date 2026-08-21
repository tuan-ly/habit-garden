import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPlantStory } from '@/lib/actions/plant-story'
import type { PlantStorySourceEntry } from '@/lib/plant-story'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getAuthUser: vi.fn(),
  getCapabilityLogProjection: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/auth-cached', () => ({
  getAuthUser: mocks.getAuthUser,
}))

vi.mock('@/lib/capability-log-projection', () => ({
  getCapabilityLogProjection: mocks.getCapabilityLogProjection,
}))

const ownedPlant = {
  id: 'plant-1',
  plant_type_id: 'type-1',
  name: 'Đọc mỗi ngày',
  habit_description: 'Đọc sách trước khi ngủ',
  why_i_started: 'Muốn học đều hơn',
  started_at: '2026-05-01T00:00:00.000Z',
  created_at: '2026-05-01T00:00:00.000Z',
  status: 'growing',
  growth_percentage: 42,
  visual_stage: 'growing',
  grid_size: 1,
  plant_type: {
    id: 'type-1',
    name: 'Bamboo',
    name_vi: 'Tre',
    icon: '🎋',
  },
}

function activity(index: number): PlantStorySourceEntry {
  return {
    id: `activity-${String(index).padStart(3, '0')}`,
    plant_id: 'plant-1',
    activity_type: index === 500 ? 'rest_day' : 'progress',
    logged_at: `2026-08-20T08:${String(index % 60).padStart(2, '0')}:00.000Z`,
    logged_date: '2026-08-20',
    value: index === 500 ? null : index + 1,
    notes: null,
    xp_earned: 0,
    is_personal_record: false,
  }
}

function createQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
    range: vi.fn(),
    then: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  return query
}

function setupSupabase(activityPages: PlantStorySourceEntry[][] = [[]]) {
  const targetQuery = createQuery()
  targetQuery.maybeSingle.mockResolvedValue({ data: ownedPlant, error: null })

  const optionsQuery = createQuery()
  optionsQuery.then.mockImplementation(resolve => resolve({
    data: [ownedPlant],
    error: null,
  }))

  const activityQuery = createQuery()
  activityQuery.range.mockImplementation((from: number) => Promise.resolve({
    data: activityPages[Math.floor(from / 500)] ?? [],
    error: null,
  }))

  let plantQueryCount = 0
  const from = vi.fn((table: string) => {
    if (table === 'plants') {
      plantQueryCount += 1
      return plantQueryCount === 1 ? targetQuery : optionsQuery
    }
    if (table === 'activity_logs') return activityQuery
    throw new Error(`Unexpected table: ${table}`)
  })
  mocks.createClient.mockResolvedValue({ from })

  return { targetQuery, optionsQuery, activityQuery, from }
}

describe('getPlantStory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAuthUser.mockResolvedValue({ id: 'user-1' })
    mocks.getCapabilityLogProjection.mockResolvedValue([])
  })

  it('authenticates before querying and verifies the requested plant owner', async () => {
    mocks.getAuthUser.mockResolvedValue(null)

    await expect(getPlantStory('plant-1')).resolves.toBeNull()

    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('uses explicit columns and the isolated capability-instance stream for assigned plants', async () => {
    const capabilityEntry = activity(1)
    mocks.getCapabilityLogProjection.mockResolvedValue([capabilityEntry])
    const { targetQuery, from } = setupSupabase()

    const story = await getPlantStory('plant-1')

    expect(targetQuery.eq).toHaveBeenCalledWith('id', 'plant-1')
    expect(targetQuery.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(targetQuery.select).toHaveBeenCalledWith(expect.not.stringContaining('*'))
    expect(mocks.getCapabilityLogProjection).toHaveBeenCalledWith('user-1', 'plant-1')
    expect(from).not.toHaveBeenCalledWith('activity_logs')
    expect(story).toMatchObject({
      plant: { id: 'plant-1', plantType: { nameVi: 'Tre' } },
      totalEntryCount: 1,
      plantOptions: [{ id: 'plant-1', icon: '🎋' }],
    })
  })

  it('pages the full legacy activity stream for unassigned plants', async () => {
    const firstPage = Array.from({ length: 500 }, (_, index) => activity(index))
    const secondPage = [activity(500)]
    mocks.getCapabilityLogProjection.mockResolvedValue(null)
    const { activityQuery } = setupSupabase([firstPage, secondPage])

    const story = await getPlantStory('plant-1')

    expect(story?.totalEntryCount).toBe(501)
    expect(story?.currentMonth.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ activityType: 'rest_day' }),
    ]))
    expect(activityQuery.range).toHaveBeenNthCalledWith(1, 0, 499)
    expect(activityQuery.range).toHaveBeenNthCalledWith(2, 500, 999)
  })
})
