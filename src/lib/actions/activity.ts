'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { calculateRhythm } from '@/lib/plant-status'
import { createClient } from '@/lib/supabase/server'
import type { ActivityLog, PlantWithType } from '@/types/database'

export type MutationErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'ALREADY_APPLIED'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'

export interface LogActivityDto {
  /** Stable idempotency key. Reuse this value when retrying the same user intent. */
  mutationId?: string
  plant_id: string
  activity_type: 'watering' | 'completed' | 'progress'
  value?: number
  notes?: string
  is_welcome_back?: boolean
}

export interface LogActivityResult {
  success: boolean
  mutationId?: string
  code?: MutationErrorCode
  xpEarned?: number
  isPersonalRecord?: boolean
  newGoalValue?: number
  message?: string
  error?: string
  leveledUp?: boolean
  newLevel?: number
  oldLevel?: number
  newAchievementIds?: string[]
  coinsEarned?: number
  harvestedMaterial?: { name: string; icon: string }
  plant?: PlantWithType
  goal?: PlantWithType['goal']
  weatherType?: string
}

/** Compatibility action backed by one idempotent, atomic database transaction. */
export async function logActivity(dto: LogActivityDto): Promise<LogActivityResult> {
  const user = await getAuthUser()
  if (!user) {
    return { success: false, code: 'UNAUTHENTICATED', error: 'Not authenticated' }
  }

  const mutationId = dto.mutationId ?? crypto.randomUUID()
  const startedAt = performance.now()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('record_activity_atomic', {
    p_mutation_id: mutationId,
    p_plant_id: dto.plant_id,
    p_activity_type: dto.activity_type,
    p_value: dto.value ?? null,
    p_notes: dto.notes ?? null,
    p_is_welcome_back: dto.is_welcome_back ?? false,
  })

  if (error) {
    console.info(JSON.stringify({
      event: 'server_action_duration', action: 'logActivity', mutationId,
      durationMs: Math.round(performance.now() - startedAt), success: false,
      code: 'DATABASE_ERROR',
    }))
    console.error('record_activity_atomic failed:', error)
    return { success: false, mutationId, code: 'DATABASE_ERROR', error: error.message }
  }

  const result = data as unknown as LogActivityResult
  console.info(JSON.stringify({
    event: 'server_action_duration', action: 'logActivity', mutationId,
    durationMs: Math.round(performance.now() - startedAt), success: result.success,
    code: result.code,
  }))
  return {
    ...result,
    mutationId: result.mutationId ?? mutationId,
    message: result.message ?? (
      dto.activity_type === 'watering'
        ? 'Plant watered with care 💧'
        : result.isPersonalRecord
          ? 'New personal record! 🏆'
          : 'Great job! 🎉'
    ),
  }
}

export interface WateringResult {
  success: boolean
  xpEarned?: number
  message?: string
  error?: string
}

/** @deprecated Use logActivity instead. */
export async function waterPlantSimple(plantId: string, notes?: string): Promise<WateringResult> {
  const result = await logActivity({ plant_id: plantId, activity_type: 'watering', notes })
  return {
    success: result.success,
    xpEarned: result.xpEarned,
    message: result.message,
    error: result.error,
  }
}

export interface LogProgressResult {
  success: boolean
  xpEarned?: number
  isPersonalRecord?: boolean
  newValue?: number
  message?: string
  error?: string
}

/** @deprecated Use logActivity instead. */
export async function logProgress(dto: {
  plant_id: string
  activity_type?: string
  value?: number
  notes?: string
}): Promise<LogProgressResult> {
  const result = await logActivity({
    plant_id: dto.plant_id,
    activity_type: dto.value !== undefined ? 'progress' : 'completed',
    value: dto.value,
    notes: dto.notes,
  })
  return {
    success: result.success,
    xpEarned: result.xpEarned,
    isPersonalRecord: result.isPersonalRecord,
    newValue: result.newGoalValue,
    message: result.message,
    error: result.error,
  }
}

export interface ActivityHistory {
  activities: ActivityLog[]
  rhythm: {
    daysThisWeek: number
    daysThisMonth: number
    consistencyPercentage: number
  }
}

export async function getPlantActivityHistory(
  plantId: string,
  days: number = 30
): Promise<ActivityHistory | null> {
  const user = await getAuthUser()
  if (!user) return null

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const supabase = await createClient()
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .gte('logged_date', startDate.toISOString().split('T')[0])
    .order('logged_at', { ascending: false })

  const typedActivities = (activities ?? []) as ActivityLog[]
  return {
    activities: typedActivities,
    rhythm: calculateRhythm(typedActivities.map((activity) => activity.logged_date)),
  }
}

export async function hasActivityToday(plantId: string): Promise<boolean> {
  const user = await getAuthUser()
  if (!user) return false

  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .eq('logged_date', new Date().toISOString().split('T')[0])
    .limit(1)
    .maybeSingle()

  return !!data
}
