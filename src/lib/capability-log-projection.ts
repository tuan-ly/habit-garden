import { createClient } from '@/lib/supabase/server'
import type { ActivityLog } from '@/types/database'

interface CapabilityLogProjectionOptions {
  since?: string
  limit?: number
}

interface CompletedCapabilitySessionRow {
  id: string
  user_id: string
  result_value: number | string | null
  reflection: string | null
  completed_at: string | null
  created_at: string
}

/**
 * Projects the assigned plant's isolated capability-instance event stream.
 * `null` means the plant has no capability assignment; `[]` means it is
 * assigned but the capability has no completed sessions in the requested span.
 */
export async function getCapabilityLogProjection(
  userId: string,
  plantId: string,
  options: CapabilityLogProjectionOptions = {}
): Promise<ActivityLog[] | null> {
  const supabase = await createClient()
  const assignment = await supabase
    .from('plant_capability_assignments')
    .select('habit_id')
    .eq('plant_id', plantId)
    .eq('user_id', userId)
    .maybeSingle()

  if (assignment.error) {
    console.error('Unable to resolve capability log assignment:', assignment.error)
    return null
  }
  if (!assignment.data) return null

  let sessionsQuery = supabase
    .from('habit_sessions')
    .select([
      'id',
      'user_id',
      'result_value',
      'reflection',
      'completed_at',
      'created_at',
    ].join(','))
    .eq('habit_id', assignment.data.habit_id)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (options.since) {
    sessionsQuery = sessionsQuery.gte('completed_at', options.since)
  }
  if (options.limit) {
    sessionsQuery = sessionsQuery.limit(options.limit)
  }

  const sessions = await sessionsQuery
  if (sessions.error) {
    console.error('Unable to load capability log:', sessions.error)
    return []
  }

  const completedSessions = (sessions.data ?? []) as unknown as CompletedCapabilitySessionRow[]
  return completedSessions.map(session => {
    const loggedAt = session.completed_at ?? session.created_at
    return {
      id: session.id,
      plant_id: plantId,
      season_id: null,
      user_id: session.user_id,
      activity_type: 'progress',
      logged_at: loggedAt,
      logged_date: loggedAt.slice(0, 10),
      value: session.result_value === null ? null : Number(session.result_value),
      notes: session.reflection,
      difficulty: null,
      is_first_of_day: false,
      xp_earned: 0,
      morning_bonus: false,
      streak_bonus: 0,
      is_personal_record: false,
      created_at: session.created_at,
    } satisfies ActivityLog
  })
}
