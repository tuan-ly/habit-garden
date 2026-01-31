'use server'

/**
 * Activity Actions - Unified Activity Logging
 *
 * Gentle Growth Philosophy:
 * - Watering ≠ Completing (separate actions)
 * - Rest days are valid, not failures
 * - Progress is logged, not just completion
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ActivityLog,
  ActivityType,
  LogActivityDto,
  MarkRestDayDto,
  RestDay,
  PlantWithType,
} from '@/types/database'
import { calculateWateringXp, calculateNoteBonus } from '@/lib/xp-system'
import { getTodayWeather, calculateWeatherXp } from '@/lib/weather-system'
import { calculatePlantStatus, calculateRhythm } from '@/lib/plant-status'
import { XP_VALUES, isMorningTime } from '@/lib/xp-constants'

// =====================================================
// Simple Watering (Caring, not completing)
// =====================================================

export interface WateringResult {
  success: boolean
  xpEarned?: number
  message?: string
  error?: string
}

/**
 * Water a plant - Simple care action
 * Different from logging progress - this is just "I'm thinking of you"
 */
export async function waterPlantSimple(
  plantId: string,
  notes?: string
): Promise<WateringResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Get plant
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('*, plant_type:plant_types(*)')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return { success: false, error: 'Plant not found' }
  }

  // Check if already watered today
  const { data: existingActivity } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('plant_id', plantId)
    .eq('logged_date', today)
    .eq('activity_type', 'watering')
    .single()

  const isFirstOfDay = !existingActivity

  const isMorning = isMorningTime()

  // XP Calculation using Constants
  // Base (10) + Morning (3) + Notes
  let totalXp = XP_VALUES.WATERING_BASE
  
  if (isMorning) {
    totalXp += XP_VALUES.MORNING_BONUS
  }

  // Note bonus
  if (notes && notes.trim().length > 0) {
    const noteBonus = calculateNoteBonus({
      noteLength: notes.trim().length,
      journalStreak: 0, // We can fetch this later if needed
    })
    totalXp += noteBonus.total
  }

  // Create activity log
  const { error: logError } = await supabase
    .from('activity_logs')
    .insert({
      plant_id: plantId,
      user_id: user.id,
      activity_type: 'watering',
      logged_date: today,
      notes: notes || null,
      xp_earned: totalXp,
      is_first_of_day: isFirstOfDay,
    })

  if (logError) {
    console.error('Error creating activity log:', logError)
    return { success: false, error: logError.message }
  }

  // Update plant moisture (gentle boost)
  const plantType = plant.plant_type
  const newMoisture = Math.min(100, plant.current_moisture + (plantType.moisture_boost * 0.5))

  await supabase
    .from('plants')
    .update({
      current_moisture: newMoisture,
      last_watered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)

  // Update user XP
  await updateUserXp(user.id, totalXp)

  revalidatePath('/garden')
  return {
    success: true,
    xpEarned: totalXp,
    message: 'Plant watered with care 💧',
  }
}

// =====================================================
// Log Progress (Achieving)
// =====================================================

export interface LogProgressResult {
  success: boolean
  xpEarned?: number
  isPersonalRecord?: boolean
  newValue?: number
  message?: string
  error?: string
}

/**
 * Log progress for a plant with a goal
 * This is the "achievement" action
 */
export async function logProgress(dto: LogActivityDto): Promise<LogProgressResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Get plant with active goal (season)
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

  // Get active season (goal)
  const goals = plant.goals as any[]
  const activeSeason = goals?.find(g => g.season_status === 'active') || goals?.[0]

  if (!activeSeason) {
    return { success: false, error: 'No active season found' }
  }

  // Check if first log of day
  const { data: existingActivity } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('plant_id', dto.plant_id)
    .eq('logged_date', today)
    .eq('activity_type', 'progress')
    .single()

  const isFirstOfDay = !existingActivity

  // Calculate new value
  let newValue = dto.value || 0
  let isPersonalRecord = false

  if (activeSeason.goal_mode === 'total_progress') {
    newValue = Number(activeSeason.current_value) + (dto.value || 0)
  } else {
    // Build capacity - check for personal record
    if ((dto.value || 0) > Number(activeSeason.current_value)) {
      isPersonalRecord = true
      newValue = dto.value || 0
    } else {
      newValue = Number(activeSeason.current_value)
    }
  }

  // Calculate XP
  const weather = getTodayWeather()
  const isMorning = isMorningTime()

  let baseXp = XP_VALUES.PROGRESS_LOG_BASE // Base (0)
  if (isFirstOfDay) baseXp += XP_VALUES.FIRST_LOG_BONUS // (0)
  if (isPersonalRecord) baseXp += XP_VALUES.PERSONAL_RECORD_BONUS
  if (isMorning) baseXp += XP_VALUES.MORNING_BONUS

  // Note bonus
  if (dto.notes && dto.notes.trim().length > 0) {
    const noteBonus = calculateNoteBonus({
      noteLength: dto.notes.trim().length,
      journalStreak: 0,
    })
    baseXp += noteBonus.total
  }

  const totalXp = calculateWeatherXp(baseXp, weather.type)

  // Create activity log
  const { error: logError } = await supabase
    .from('activity_logs')
    .insert({
      plant_id: dto.plant_id,
      season_id: activeSeason.id,
      user_id: user.id,
      activity_type: 'progress',
      logged_date: today,
      value: dto.value,
      notes: dto.notes || null,
      difficulty: dto.difficulty || null,
      xp_earned: totalXp,
      is_first_of_day: isFirstOfDay,
      is_personal_record: isPersonalRecord,
      morning_bonus: isMorning,
    })

  if (logError) {
    console.error('Error creating activity log:', logError)
    return { success: false, error: logError.message }
  }

  // Update season (goal) current value
  await supabase
    .from('goals')
    .update({
      current_value: newValue,
      days_active: activeSeason.days_active + (isFirstOfDay ? 1 : 0),
      best_streak: Math.max(activeSeason.best_streak, plant.current_streak + 1),
      updated_at: new Date().toISOString(),
    })
    .eq('id', activeSeason.id)

  // Update plant
  const plantType = plant.plant_type
  const newMoisture = Math.min(100, plant.current_moisture + plantType.moisture_boost)
  const baseGrowth = 100 / plantType.maturity_days
  const weatherGrowth = baseGrowth * weather.growthModifier
  const newGrowth = Math.min(100, plant.growth_percentage + weatherGrowth)

  // Calculate streak
  const lastWateredDate = plant.last_watered_at
    ? new Date(plant.last_watered_at).toISOString().split('T')[0]
    : null
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  let newStreak = lastWateredDate === yesterday ? plant.current_streak + 1 : 1

  await supabase
    .from('plants')
    .update({
      current_moisture: newMoisture,
      growth_percentage: newGrowth,
      total_waterings: plant.total_waterings + (isFirstOfDay ? 1 : 0),
      current_streak: newStreak,
      longest_streak: Math.max(plant.longest_streak, newStreak),
      last_watered_at: new Date().toISOString(),
      status: newGrowth >= 100 ? 'mature' : 'thriving',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dto.plant_id)

  // Update user XP
  await updateUserXp(user.id, totalXp)

  revalidatePath('/garden')
  return {
    success: true,
    xpEarned: totalXp,
    isPersonalRecord,
    newValue,
    message: isPersonalRecord ? 'New personal record! 🏆' : 'Progress logged! 📈',
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
      xp_earned: 2, // Small XP for self-awareness
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
  await updateUserXp(user.id, 2)

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
