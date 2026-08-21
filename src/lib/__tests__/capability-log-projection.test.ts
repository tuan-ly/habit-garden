import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCapabilityLogProjection } from '@/lib/capability-log-projection'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

interface SessionRow {
  id: string
  user_id: string
  result_value: number | string | null
  reflection: string | null
  completed_at: string | null
  created_at: string
}

interface ProjectionSetup {
  assignment?: { habit_id: string } | null
  assignmentError?: { message: string } | null
  sessions?: SessionRow[]
  sessionPages?: SessionRow[][]
  sessionsError?: { message: string } | null
}

function setupSupabase({
  assignment = { habit_id: 'habit-reading' },
  assignmentError = null,
  sessions = [],
  sessionPages,
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
    range: vi.fn(),
    then: vi.fn(),
  }
  sessionsQuery.select.mockReturnValue(sessionsQuery)
  sessionsQuery.eq.mockReturnValue(sessionsQuery)
  sessionsQuery.order.mockReturnValue(sessionsQuery)
  sessionsQuery.gte.mockReturnValue(sessionsQuery)
  sessionsQuery.limit.mockReturnValue(sessionsQuery)
  sessionsQuery.range.mockImplementation((from: number) => Promise.resolve({
    data: sessionPages?.[Math.floor(from / 500)] ?? sessions,
    error: sessionsError,
  }))
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

  it('projects only the capability instance assigned to each plant', async () => {
    const completedAt = '2026-08-14T08:30:00.000Z'
    const firstSetup = setupSupabase({
      assignment: { habit_id: 'habit-plant-1' },
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

    const secondSetup = setupSupabase({
      assignment: { habit_id: 'habit-plant-2' },
      sessions: [],
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
    expect(secondPlant).toEqual([])
    expect(firstSetup.assignmentQuery.eq).toHaveBeenCalledWith('plant_id', 'plant-1')
    expect(secondSetup.assignmentQuery.eq).toHaveBeenCalledWith('plant_id', 'plant-2')
    expect(firstSetup.sessionsQuery.eq).toHaveBeenCalledWith('habit_id', 'habit-plant-1')
    expect(secondSetup.sessionsQuery.eq).toHaveBeenCalledWith('habit_id', 'habit-plant-2')
    expect(firstSetup.sessionsQuery.eq).toHaveBeenCalledWith('status', 'completed')
    expect(firstSetup.sessionsQuery.gte).toHaveBeenCalledWith(
      'completed_at',
      '2026-08-01T00:00:00.000Z'
    )
    expect(firstSetup.sessionsQuery.limit).toHaveBeenCalledWith(10)
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

  it('pages through the complete capability stream when no limit is requested', async () => {
    const createSession = (index: number) => ({
      id: `session-${String(index).padStart(3, '0')}`,
      user_id: 'user-1',
      result_value: index + 1,
      reflection: null,
      completed_at: `2026-08-14T08:${String(index % 60).padStart(2, '0')}:00.000Z`,
      created_at: '2026-08-14T08:00:00.000Z',
    })
    const firstPage = Array.from({ length: 500 }, (_, index) => createSession(index))
    const secondPage = [createSession(500)]
    const { sessionsQuery } = setupSupabase({
      sessionPages: [firstPage, secondPage],
    })

    const result = await getCapabilityLogProjection('user-1', 'plant-1')

    expect(result).toHaveLength(501)
    expect(sessionsQuery.range).toHaveBeenNthCalledWith(1, 0, 499)
    expect(sessionsQuery.range).toHaveBeenNthCalledWith(2, 500, 999)
  })
})
