'use server'

/**
 * Activity Actions - Unified Plant Activity Logging
 *
 * Single log table for ALL plant activities:
 * - 'watering' = "Just checking in" / "Not today" (water only, no completion)
 * - 'completed' = "I did it" for non-goal plants
 * - 'progress' = "I did it" for goal plants (with numeric value)
 *
 * Key Logic:
 * - When logging 'completed' or 'progress': if not watered today, add watering XP
 * - Always update plant status (moisture, growth, streak) on completed/progress
 * - "Not today" = user shows up but rests; still watered (uses 'watering' type)
 */

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-cached'
import { revalidatePath } from 'next/cache'
import type {
  ActivityLog,
  ActivityType,
  PlantWithType,
} from '@/types/database'
import { calculateNoteBonus, checkLevelUp, getLevelFromXp } from '@/lib/xp-system'
import { getTodayWeather, calculateWeatherXp } from '@/lib/weather-system'
import { calculateRhythm } from '@/lib/plant-status'
import { XP_VALUES, WELCOME_BACK_BONUS, isMorningTime, EASY_MODE_BONUS_PERCENT, EASY_MODE_BONUS_DAYS } from '@/lib/xp-constants'
import { checkAndUnlockAchievements } from './plants'

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
  /** One-time bonus for first watering after 3+ days absence */
  is_welcome_back?: boolean
}

export interface LogActivityResult {
  success: boolean
  xpEarned?: number
  isPersonalRecord?: boolean
  newGoalValue?: number
  message?: string
  error?: string
  leveledUp?: boolean
  newLevel?: number
  oldLevel?: number
  newAchievementIds?: string[]
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

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Get current profile XP for level up detection
  const { data: profileData } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', user.id)
    .single()
  const oldXp = profileData?.xp || 0

  // Get plant with goal and type info
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select(`
      *,
      plant_type:plant_types(*),
      goals(id, season_status, goal_mode, current_value, days_active)
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

  // Welcome back bonus (one-time on return after 3+ days absence)
  // Validated server-side: check last activity date in DB, ignore client flag
  if (dto.is_welcome_back) {
    const { data: lastActivity } = await supabase
      .from('activity_logs')
      .select('logged_date')
      .eq('user_id', user.id)
      .lt('logged_date', today)
      .order('logged_date', { ascending: false })
      .limit(1)
      .single()

    if (lastActivity) {
      const prev = new Date(lastActivity.logged_date)
      const now = new Date(today)
      const daysSince = Math.floor((now.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince >= 3) {
        totalXp += WELCOME_BACK_BONUS
      }
    }
  }

  // Easy Mode bonus: +20% XP for first 30 days
  if (plant.easy_mode && totalXp > 0) {
    const plantStart = plant.started_at || plant.created_at
    const plantAgeInDays = Math.floor(
      (Date.now() - new Date(plantStart).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (plantAgeInDays <= EASY_MODE_BONUS_DAYS) {
      const bonus = Math.round(totalXp * EASY_MODE_BONUS_PERCENT)
      totalXp += bonus
    }
  }

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

    const hasMatured = newGrowth >= 100 && plant.status !== 'mature' && plant.status !== 'dead'

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

  // Check for level up
  const levelUpResult = totalXp > 0 ? checkLevelUp(oldXp, oldXp + totalXp) : null

  // Check and unlock achievements
  const newAchievementIds = await checkAndUnlockAchievements(user.id)

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
    leveledUp: levelUpResult?.leveledUp,
    newLevel: levelUpResult?.newLevel,
    oldLevel: levelUpResult?.leveledUp ? getLevelFromXp(oldXp) : undefined,
    newAchievementIds: newAchievementIds.length > 0 ? newAchievementIds : undefined,
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
// Get Activity History
// =====================================================

export interface ActivityHistory {
  activities: ActivityLog[]
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

  const user = await getAuthUser()
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

  // Calculate rhythm
  const activityDates = (activities || []).map(a => a.logged_date)
  const rhythm = calculateRhythm(activityDates)

  return {
    activities: (activities || []) as ActivityLog[],
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
 * Check if plant has any activity today
 */
export async function hasActivityToday(plantId: string): Promise<boolean> {
  const supabase = await createClient()

  const user = await getAuthUser()
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
