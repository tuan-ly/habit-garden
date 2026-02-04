'use server'

/**
 * Activity Actions - Unified Plant Activity Logging
 *
 * Single log table for ALL plant activities:
 * - 'watering' = "Just checking in" (water only, no completion)
 * - 'completed' = "I did it" for non-goal plants
 * - 'progress' = "I did it" for goal plants (with numeric value)
 *
 * Key Logic:
 * - When logging 'completed' or 'progress': if not watered today, add watering XP
 * - Always update plant status (moisture, growth, streak) on completed/progress
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ActivityLog,
  ActivityType,
  RestDay,
  PlantWithType,
} from '@/types/database'
import { calculateNoteBonus } from '@/lib/xp-system'
import { getTodayWeather, calculateWeatherXp } from '@/lib/weather-system'
import { calculateRhythm } from '@/lib/plant-status'
import { XP_VALUES, isMorningTime } from '@/lib/xp-constants'

// =====================================================
// Main Activity Logging - Single Unified Function
// =====================================================

export interface LogActivityDto {
  plant_id: string
  /** 'watering' = just checking in, 'completed' = did it (no goal), 'progress' = did it with value */
  activity_type: 'watering' | 'completed' | 'progress'
  /** Required for 'progress' type */
  value?: number
  notes?: string
}

export interface LogActivityResult {
  success: boolean
  xpEarned?: number
  isPersonalRecord?: boolean
  newGoalValue?: number
  message?: string
  error?: string
}

/**
 * Unified activity logging for all plant actions
 *
 * Activity types:
 * - 'watering': Just checking in, water only (+10 XP base)
 * - 'completed': I did it! For plants without goals (+10 XP, updates plant status)
 * - 'progress': I did it! For plants with goals (+10 XP + goal bonuses, updates goal value)
 *
 * When logging 'completed' or 'progress':
 * - If NOT watered today: includes watering XP (10 base)
 * - If already watered today: only note XP
 * - Always updates plant status (moisture, growth, streak)
 */
export async function logActivity(dto: LogActivityDto): Promise<LogActivityResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Get plant with goal and type info
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select(`
      *,
      plant_type:plant_types(*),
      goals(*)
    `)
    .eq('id', dto.plant_id)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return { success: false, error: 'Plant not found' }
  }

  // Check if already watered/logged today (any activity type)
  const { data: existingActivity } = await supabase
    .from('activity_logs')
    .select('id, activity_type')
    .eq('plant_id', dto.plant_id)
    .eq('logged_date', today)
    .limit(1)
    .single()

  const isFirstActivityToday = !existingActivity
  const isMorning = isMorningTime()

  // Get active goal if exists
  const goals = plant.goals as any[]
  const activeGoal = goals?.find(g => g.season_status === 'active') || goals?.[0]

  // =====================================================
  // XP Calculation
  // =====================================================

  let totalXp = 0
  let isPersonalRecord = false
  let newGoalValue: number | undefined

  // For 'completed' and 'progress': award watering XP if first activity today
  if (dto.activity_type === 'completed' || dto.activity_type === 'progress') {
    if (isFirstActivityToday) {
      // Base watering XP
      totalXp += XP_VALUES.WATERING_BASE
      if (isMorning) {
        totalXp += XP_VALUES.MORNING_BONUS
      }
    }

    // Personal record bonus (for progress with goal)
    if (dto.activity_type === 'progress' && activeGoal && dto.value !== undefined) {
      if (activeGoal.goal_mode === 'build_capacity') {
        if (dto.value > Number(activeGoal.current_value)) {
          isPersonalRecord = true
          totalXp += XP_VALUES.PERSONAL_RECORD_BONUS
        }
      }
    }
  } else if (dto.activity_type === 'watering') {
    // Plain watering: only XP if first of day
    if (isFirstActivityToday) {
      totalXp += XP_VALUES.WATERING_BASE
      if (isMorning) {
        totalXp += XP_VALUES.MORNING_BONUS
      }
    }
  }

  // Note bonus (applies to all activity types)
  if (dto.notes && dto.notes.trim().length > 0) {
    const noteBonus = calculateNoteBonus({
      noteLength: dto.notes.trim().length,
      journalStreak: 0, // Can enhance later
    })
    totalXp += noteBonus.total
  }

  // Apply weather modifier
  const weather = getTodayWeather()
  totalXp = calculateWeatherXp(totalXp, weather.type)

  // =====================================================
  // Update Goal Value (for 'progress' type only)
  // =====================================================

  if (dto.activity_type === 'progress' && activeGoal && dto.value !== undefined) {
    if (activeGoal.goal_mode === 'total_progress') {
      newGoalValue = Number(activeGoal.current_value) + dto.value
    } else {
      // Build capacity - take max
      newGoalValue = Math.max(Number(activeGoal.current_value), dto.value)
    }

    // Update goal
    await supabase
      .from('goals')
      .update({
        current_value: newGoalValue,
        days_active: activeGoal.days_active + (isFirstActivityToday ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeGoal.id)
  }

  // =====================================================
  // Create Activity Log
  // =====================================================

  const { error: logError } = await supabase
    .from('activity_logs')
    .insert({
      plant_id: dto.plant_id,
      season_id: activeGoal?.id || null,
      user_id: user.id,
      activity_type: dto.activity_type,
      logged_date: today,
      value: dto.value || null,
      notes: dto.notes || null,
      xp_earned: totalXp,
      is_first_of_day: isFirstActivityToday,
      is_personal_record: isPersonalRecord,
      morning_bonus: isMorning && isFirstActivityToday,
    })

  if (logError) {
    console.error('Error creating activity log:', logError)
    return { success: false, error: logError.message }
  }

  // =====================================================
  // Update Plant Status
  // =====================================================

  const plantType = plant.plant_type
  let plantUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (dto.activity_type === 'completed' || dto.activity_type === 'progress') {
    // Full update: moisture, growth, streak (like watering + more)
    const newMoisture = Math.min(100, plant.current_moisture + plantType.moisture_boost)
    const baseGrowth = 100 / plantType.maturity_days
    const weatherGrowth = baseGrowth * weather.growthModifier
    const newGrowth = Math.min(100, plant.growth_percentage + weatherGrowth)

    // Calculate streak
    const lastWateredDate = plant.last_watered_at
      ? new Date(plant.last_watered_at).toISOString().split('T')[0]
      : null
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    let newStreak = 1
    if (lastWateredDate === yesterday) {
      newStreak = plant.current_streak + 1
    } else if (lastWateredDate === today) {
      newStreak = plant.current_streak
    }

    const hasMatured = newGrowth >= 100 && plant.status === 'growing'

    plantUpdate = {
      ...plantUpdate,
      current_moisture: newMoisture,
      growth_percentage: newGrowth,
      total_waterings: plant.total_waterings + (isFirstActivityToday ? 1 : 0),
      current_streak: newStreak,
      longest_streak: Math.max(plant.longest_streak, newStreak),
      last_watered_at: new Date().toISOString(),
      status: hasMatured ? 'mature' : 'thriving',
      matured_at: hasMatured ? new Date().toISOString() : plant.matured_at,
    }
  } else if (dto.activity_type === 'watering') {
    // Light update: just moisture (gentle boost)
    const newMoisture = Math.min(100, plant.current_moisture + (plantType.moisture_boost * 0.5))

    plantUpdate = {
      ...plantUpdate,
      current_moisture: newMoisture,
      last_watered_at: new Date().toISOString(),
    }
  }

  await supabase
    .from('plants')
    .update(plantUpdate)
    .eq('id', dto.plant_id)

  // =====================================================
  // Update User XP
  // =====================================================

  if (totalXp > 0) {
    await updateUserXp(user.id, totalXp)
  }

  revalidatePath('/garden')

  // Generate appropriate message
  let message = ''
  if (dto.activity_type === 'watering') {
    message = 'Plant watered with care 💧'
  } else if (isPersonalRecord) {
    message = 'New personal record! 🏆'
  } else {
    message = 'Great job! 🎉'
  }

  return {
    success: true,
    xpEarned: totalXp,
    isPersonalRecord,
    newGoalValue,
    message,
  }
}

// =====================================================
// Legacy Functions (Maintained for backwards compat)
// =====================================================

export interface WateringResult {
  success: boolean
  xpEarned?: number
  message?: string
  error?: string
}

/**
 * @deprecated Use logActivity({ activity_type: 'watering' }) instead
 */
export async function waterPlantSimple(
  plantId: string,
  notes?: string
): Promise<WateringResult> {
  const result = await logActivity({
    plant_id: plantId,
    activity_type: 'watering',
    notes,
  })
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

/**
 * @deprecated Use logActivity({ activity_type: 'progress' }) instead
 */
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

// =====================================================
// Rest Day (Self-care, not failure)
// =====================================================

export interface RestDayResult {
  success: boolean
  message?: string
  error?: string
}

export interface MarkRestDayDto {
  plant_id: string
  reason?: string
}

/**
 * Mark today as a rest day for a plant
 * Rest days are valid and celebrated, not penalized
 */
export async function markRestDay(dto: MarkRestDayDto): Promise<RestDayResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Check if plant belongs to user
  const { data: plant } = await supabase
    .from('plants')
    .select('id, rest_days_allowed')
    .eq('id', dto.plant_id)
    .eq('user_id', user.id)
    .single()

  if (!plant) {
    return { success: false, error: 'Plant not found' }
  }

  // Check rest days this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const { count: restDaysThisWeek } = await supabase
    .from('rest_days')
    .select('*', { count: 'exact', head: true })
    .eq('plant_id', dto.plant_id)
    .gte('rest_date', weekStartStr)

  const allowedRestDays = plant.rest_days_allowed || 2
  if ((restDaysThisWeek || 0) >= allowedRestDays) {
    return {
      success: false,
      error: `You've used all ${allowedRestDays} rest days this week. Take it easy, but try to stay engaged!`,
    }
  }

  // Check if already a rest day
  const { data: existingRestDay } = await supabase
    .from('rest_days')
    .select('id')
    .eq('plant_id', dto.plant_id)
    .eq('rest_date', today)
    .single()

  if (existingRestDay) {
    return { success: false, error: 'Already marked as rest day' }
  }

  // Create rest day entry
  const { error: restError } = await supabase
    .from('rest_days')
    .insert({
      plant_id: dto.plant_id,
      user_id: user.id,
      rest_date: today,
      reason: dto.reason || null,
    })

  if (restError) {
    console.error('Error creating rest day:', restError)
    return { success: false, error: restError.message }
  }

  // Also create activity log for rest day
  await supabase
    .from('activity_logs')
    .insert({
      plant_id: dto.plant_id,
      user_id: user.id,
      activity_type: 'rest_day',
      logged_date: today,
      notes: dto.reason || 'Taking a rest day',
      xp_earned: XP_VALUES.REST_DAY_BASE,
      is_first_of_day: true,
    })

  // Update goal rest_days_used if applicable
  const { data: activeGoal } = await supabase
    .from('goals')
    .select('id, rest_days_used')
    .eq('plant_id', dto.plant_id)
    .eq('season_status', 'active')
    .single()

  if (activeGoal) {
    await supabase
      .from('goals')
      .update({
        rest_days_used: (activeGoal.rest_days_used || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeGoal.id)
  }

  // Update user XP (small reward for self-care)
  await updateUserXp(user.id, XP_VALUES.REST_DAY_BASE)

  revalidatePath('/garden')
  return {
    success: true,
    message: 'Rest day marked. Taking care of yourself is part of the journey 💚',
  }
}

// =====================================================
// Get Activity History
// =====================================================

export interface ActivityHistory {
  activities: ActivityLog[]
  restDays: RestDay[]
  rhythm: {
    daysThisWeek: number
    daysThisMonth: number
    consistencyPercentage: number
  }
}

/**
 * Get activity history for a plant
 */
export async function getPlantActivityHistory(
  plantId: string,
  days: number = 30
): Promise<ActivityHistory | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split('T')[0]

  // Get activities
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .gte('logged_date', startDateStr)
    .order('logged_at', { ascending: false })

  // Get rest days
  const { data: restDays } = await supabase
    .from('rest_days')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .gte('rest_date', startDateStr)
    .order('rest_date', { ascending: false })

  // Calculate rhythm
  const activityDates = (activities || [])
    .filter(a => a.activity_type !== 'rest_day')
    .map(a => a.logged_date)
  const rhythm = calculateRhythm(activityDates)

  return {
    activities: (activities || []) as ActivityLog[],
    restDays: (restDays || []) as RestDay[],
    rhythm,
  }
}

// =====================================================
// Helper Functions
// =====================================================

async function updateUserXp(userId: string, xp: number): Promise<void> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        xp: profile.xp + xp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  }
}

/**
 * Check if today is a rest day for a plant
 */
export async function isRestDayToday(plantId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const today = new Date().toISOString().split('T')[0]

  const { data: restDay } = await supabase
    .from('rest_days')
    .select('id')
    .eq('plant_id', plantId)
    .eq('rest_date', today)
    .single()

  return !!restDay
}

/**
 * Get rest days remaining this week for a plant
 */
export async function getRestDaysRemaining(plantId: string): Promise<number> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // Get plant's allowed rest days
  const { data: plant } = await supabase
    .from('plants')
    .select('rest_days_allowed')
    .eq('id', plantId)
    .single()

  const allowedRestDays = plant?.rest_days_allowed || 2

  // Count rest days this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const { count: usedRestDays } = await supabase
    .from('rest_days')
    .select('*', { count: 'exact', head: true })
    .eq('plant_id', plantId)
    .gte('rest_date', weekStartStr)

  return Math.max(0, allowedRestDays - (usedRestDays || 0))
}

/**
 * Check if plant has any activity today
 */
export async function hasActivityToday(plantId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const today = new Date().toISOString().split('T')[0]

  const { data: activity } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('plant_id', plantId)
    .eq('logged_date', today)
    .limit(1)
    .single()

  return !!activity
}
