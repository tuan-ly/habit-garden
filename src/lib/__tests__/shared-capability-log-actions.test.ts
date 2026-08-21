import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPlantActivityHistory } from '@/lib/actions/activity'
import { getPlantJournalEntries } from '@/lib/actions/journal'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
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

vi.mock('@/lib/actions/activity-legacy', () => ({
  logActivityLegacy: vi.fn(),
}))

const sharedCapabilityActivity = {
  id: 'session-1',
  plant_id: 'plant-2',
  season_id: null,
  user_id: 'user-1',
  activity_type: 'progress' as const,
  logged_at: '2026-08-14T08:30:00.000Z',
  logged_date: '2026-08-14',
  value: 12,
  notes: 'Đọc xong một chương.',
  difficulty: null,
  is_first_of_day: false,
  xp_earned: 0,
  morning_bonus: false,
  streak_bonus: 0,
  is_personal_record: false,
  created_at: '2026-08-14T08:00:00.000Z',
}

describe('plant capability instance log projections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createClient.mockResolvedValue({ from: mocks.from })
    mocks.getAuthUser.mockResolvedValue({ id: 'user-1' })
    mocks.getCapabilityLogProjection.mockResolvedValue([sharedCapabilityActivity])
  })

  it('uses the capability stream for plant journal entries', async () => {
    const entries = await getPlantJournalEntries('plant-2', 25)

    expect(mocks.getCapabilityLogProjection).toHaveBeenCalledWith(
      'user-1',
      'plant-2',
      { limit: 25 }
    )
    expect(mocks.from).not.toHaveBeenCalled()
    expect(entries).toEqual([
      expect.objectContaining({
        id: 'session-1',
        type: 'activity',
        activityType: 'progress',
        notes: 'Đọc xong một chương.',
        value: 12,
      }),
    ])
  })

  it('uses the capability stream for plant activity history', async () => {
    const history = await getPlantActivityHistory('plant-2', 30)

    expect(mocks.getCapabilityLogProjection).toHaveBeenCalledWith(
      'user-1',
      'plant-2',
      {
        since: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/),
      }
    )
    expect(mocks.from).not.toHaveBeenCalled()
    expect(history?.activities).toEqual([sharedCapabilityActivity])
  })

  it('does not fall back to legacy plant logs for an assigned capability with no sessions', async () => {
    mocks.getCapabilityLogProjection.mockResolvedValue([])

    const entries = await getPlantJournalEntries('plant-2')
    const history = await getPlantActivityHistory('plant-2')

    expect(entries).toEqual([])
    expect(history?.activities).toEqual([])
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
