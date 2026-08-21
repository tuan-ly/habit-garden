import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCapabilityLogProjection } from '@/lib/capability-log-projection'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

interface ProjectionSetup {
  assignment?: { habit_id: string } | null
  assignmentError?: { message: string } | null
  sessions?: Array<{
    id: string
    user_id: string
    result_value: number | string | null
    reflection: string | null
    completed_at: string | null
    created_at: string
  }>
  sessionsError?: { message: string } | null
}

function setupSupabase({
  assignment = { habit_id: 'habit-reading' },
  assignmentError = null,
  sessions = [],
  sessionsError = null,
}: ProjectionSetup = {}) {
  const assignmentQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }
  assignmentQuery.select.mockReturnValue(assignmentQuery)
  assignmentQuery.eq.mockReturnValue(assignmentQuery)
  assignmentQuery.maybeSingle.mockResolvedValue({
    data: assignment,
    error: assignmentError,
  })

  const sessionsQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    gte: vi.fn(),
    limit: vi.fn(),
    then: vi.fn(),
  }
  sessionsQuery.select.mockReturnValue(sessionsQuery)
  sessionsQuery.eq.mockReturnValue(sessionsQuery)
  sessionsQuery.order.mockReturnValue(sessionsQuery)
  sessionsQuery.gte.mockReturnValue(sessionsQuery)
  sessionsQuery.limit.mockReturnValue(sessionsQuery)
  sessionsQuery.then.mockImplementation((resolve) => resolve({
    data: sessions,
    error: sessionsError,
  }))

  const from = vi.fn((table: string) => {
    if (table === 'plant_capability_assignments') return assignmentQuery
    if (table === 'habit_sessions') return sessionsQuery
    throw new Error(`Unexpected table: ${table}`)
  })
  mocks.createClient.mockResolvedValue({ from })

  return { assignmentQuery, sessionsQuery, from }
}

describe('getCapabilityLogProjection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('projects the same capability sessions onto every assigned plant', async () => {
    const completedAt = '2026-08-14T08:30:00.000Z'
    const { assignmentQuery, sessionsQuery } = setupSupabase({
      sessions: [
        {
          id: 'session-1',
          user_id: 'user-1',
          result_value: '12',
          reflection: 'Đọc xong một chương.',
          completed_at: completedAt,
          created_at: '2026-08-14T08:00:00.000Z',
        },
      ],
    })

    const firstPlant = await getCapabilityLogProjection('user-1', 'plant-1', {
      since: '2026-08-01T00:00:00.000Z',
      limit: 10,
    })
    const secondPlant = await getCapabilityLogProjection('user-1', 'plant-2')

    expect(firstPlant).toEqual([
      expect.objectContaining({
        id: 'session-1',
        plant_id: 'plant-1',
        user_id: 'user-1',
        activity_type: 'progress',
        logged_at: completedAt,
        logged_date: '2026-08-14',
        value: 12,
        notes: 'Đọc xong một chương.',
      }),
    ])
    expect(secondPlant).toEqual([
      expect.objectContaining({
        ...firstPlant?.[0],
        plant_id: 'plant-2',
      }),
    ])
    expect(assignmentQuery.eq).toHaveBeenCalledWith('plant_id', 'plant-1')
    expect(assignmentQuery.eq).toHaveBeenCalledWith('plant_id', 'plant-2')
    expect(sessionsQuery.eq).toHaveBeenCalledWith('habit_id', 'habit-reading')
    expect(sessionsQuery.eq).toHaveBeenCalledWith('status', 'completed')
    expect(sessionsQuery.gte).toHaveBeenCalledWith(
      'completed_at',
      '2026-08-01T00:00:00.000Z'
    )
    expect(sessionsQuery.limit).toHaveBeenCalledWith(10)
  })

  it('returns null for an unassigned plant so callers can use legacy plant logs', async () => {
    const { from } = setupSupabase({ assignment: null })

    await expect(
      getCapabilityLogProjection('user-1', 'unassigned-plant')
    ).resolves.toBeNull()
    expect(from).not.toHaveBeenCalledWith('habit_sessions')
  })

  it('returns an empty assigned stream when capability sessions cannot be loaded', async () => {
    setupSupabase({ sessionsError: { message: 'query failed' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(
      getCapabilityLogProjection('user-1', 'plant-1')
    ).resolves.toEqual([])
    errorSpy.mockRestore()
  })
})
