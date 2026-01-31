'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Goal, GoalLog, CreateGoalDto, LogGoalDto, GoalMode, ProgressionType } from '@/types/database'
import { calculateTarget, generateProgressionPlan, type ProgressionType as ProgType } from '@/lib/progression'
import { calculateWateringXp, calculateNoteBonus } from '@/lib/xp-system'
import { getTodayWeather, calculateWeatherXp } from '@/lib/weather-system'
import { getPeriodInfo, getPeriodTarget } from '@/lib/goal-utils'

export interface GoalWithStats extends Goal {
  // Period-based (respects frequency: daily/weekly/monthly)
  periodProgress: number          // Progress in current period
  currentPeriodTarget: number     // Target for current period
  periodNumber: number            // Which period we're in (1-indexed)
  periodLabel: string             // Human-readable period label (e.g., "Week 3", "Jan 29")
  periodDateRange: string         // Date range for current period
  // Overall
  overallProgress: number         // Percentage towards final goal
  isOnTrack: boolean
  personalRecords: number
  // Legacy (for backwards compatibility)
  weeklyProgress: number
  currentWeekTarget: number
  weekNumber: number
}

export interface GoalStatistics {
  goal: Goal
  logs: GoalLog[]
  // Period-based
  currentPeriod: number
  periodTarget: number
  periodProgress: number
  periodLabel: string
  // Overall
  overallProgress: number
  personalRecords: number
  periodsCompleted: number
  predictedCompletion: Date | null
  isOnTrack: boolean
  periodTrend: 'up' | 'down' | 'stable'
  // Legacy
  currentWeek: number
  weeklyTarget: number
  weeklyProgress: number
  weeksCompleted: number
  weeklyTrend: 'up' | 'down' | 'stable'
}

// Create a goal for a plant
export async function createGoal(dto: CreateGoalDto): Promise<{ success: boolean; goal?: Goal; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify the plant belongs to the user
  const { data: plant } = await supabase
    .from('plants')
    .select('id, user_id')
    .eq('id', dto.plant_id)
    .eq('user_id', user.id)
    .single()

  if (!plant) {
    return { success: false, error: 'Plant not found' }
  }

  // Use custom weekly targets if provided, otherwise generate based on progression type
  const progressionType = (dto.progression_type || 'linear') as ProgType
  const weeklyTargets = dto.weekly_targets || generateProgressionPlan({
    startValue: dto.start_value || 0,
    endValue: dto.target_value,
    totalWeeks: dto.duration_weeks,
    type: progressionType,
    stepSize: dto.step_size,
  })

  // Calculate target date
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + dto.duration_weeks * 7)

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      plant_id: dto.plant_id,
      goal_mode: dto.goal_mode,
      tracking_metric: dto.tracking_metric,
      unit: dto.unit,
      start_value: dto.start_value || 0,
      target_value: dto.target_value,
      current_value: dto.goal_mode === 'total_progress' ? (dto.initial_amount || 0) : (dto.start_value || 0),
      initial_amount: dto.initial_amount || 0,
      duration_weeks: dto.duration_weeks,
      target_date: targetDate.toISOString(),
      progression_type: dto.progression_type || 'linear',
      step_size: dto.step_size || 5,
      weekly_targets: weeklyTargets,
      // Frequency tracking
      frequency: dto.frequency || 'weekly',
      frequency_target: dto.frequency_target || 1,
      period_start_day: dto.period_start_day || 1, // Monday default
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating goal:', error)
    return { success: false, error: error.message }
  }

  // Update plant with goal_mode
  await supabase
    .from('plants')
    .update({ goal_mode: dto.goal_mode })
    .eq('id', dto.plant_id)

  revalidatePath('/garden')
  return { success: true, goal: goal as Goal }
}

// Log a value for a goal (also waters the plant)
export async function logGoalValue(dto: LogGoalDto): Promise<{
  success: boolean
  xpEarned?: number
  isPersonalRecord?: boolean
  exceededTarget?: boolean
  newValue?: number
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get the goal with plant info
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select(`
      *,
      plant:plants(
        id,
        user_id,
        plant_type_id,
        current_moisture,
        current_streak,
        longest_streak,
        total_waterings,
        growth_percentage,
        status,
        last_watered_at,
        plant_type:plant_types(*)
      )
    `)
    .eq('id', dto.goal_id)
    .single()

  if (goalError || !goal) {
    return { success: false, error: 'Goal not found' }
  }

  const plant = goal.plant as any
  if (plant.user_id !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Goal plants allow multiple logs per day (multi-log support)
  // Check if already watered today (for plant watering, not goal logging)
  const { data: existingWatering } = await supabase
    .from('watering_logs')
    .select('id')
    .eq('plant_id', plant.id)
    .eq('watered_date', today)
    .single()

  const isFirstLogToday = !existingWatering

  // Calculate week number
  const startDate = new Date(goal.started_at)
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const weekNumber = Math.floor(daysSinceStart / 7) + 1

  // Get weekly target from pre-generated targets
  const weeklyTargets = goal.weekly_targets as number[] || []
  const weeklyTarget = weeklyTargets[Math.min(weekNumber, weeklyTargets.length - 1)] || goal.target_value

  // Calculate new current value based on goal mode
  let newCurrentValue: number
  let isPersonalRecord = false

  if (goal.goal_mode === 'total_progress') {
    // SUM: accumulate values
    newCurrentValue = Number(goal.current_value) + dto.value
  } else {
    // Build Capacity: track based on metric
    const metric = goal.tracking_metric
    if (metric === 'max') {
      newCurrentValue = Math.max(Number(goal.current_value), dto.value)
      isPersonalRecord = dto.value > Number(goal.current_value)
    } else if (metric === 'min') {
      newCurrentValue = goal.current_value === 0 ? dto.value : Math.min(Number(goal.current_value), dto.value)
    } else {
      // average - we'll need to calculate this properly
      newCurrentValue = dto.value
    }
  }

  const exceededTarget = dto.value >= weeklyTarget

  // Create goal log
  const { error: logError } = await supabase
    .from('goal_logs')
    .insert({
      goal_id: dto.goal_id,
      plant_id: plant.id,
      user_id: user.id,
      value: dto.value,
      logged_date: today,
      notes: dto.notes || null,
      week_number: weekNumber,
      weekly_target: weeklyTarget,
      is_personal_record: isPersonalRecord,
      exceeded_target: exceededTarget,
    })

  if (logError) {
    console.error('Error creating goal log:', logError)
    return { success: false, error: logError.message }
  }

  // Update goal current value
  await supabase
    .from('goals')
    .update({
      current_value: newCurrentValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dto.goal_id)

  // Calculate XP - first log gets full XP, subsequent logs only get note XP
  const weather = getTodayWeather()
  const plantType = plant.plant_type
  const currentHour = new Date().getHours()
  const isMorning = currentHour >= 5 && currentHour < 9

  // Get journal streak for note bonus
  const { data: journalProfile } = await supabase
    .from('profiles')
    .select('journal_streak, longest_journal_streak, last_journal_date, total_journal_entries, xp')
    .eq('id', user.id)
    .single()

  const lastJournalDate = journalProfile?.last_journal_date
  const currentJournalStreak = journalProfile?.journal_streak || 0

  // Calculate note bonus if notes provided
  let noteXp = 0
  let newJournalStreak = currentJournalStreak
  const hasNote = dto.notes && dto.notes.trim().length > 0

  if (hasNote) {
    // Calculate new journal streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (lastJournalDate === yesterday) {
      newJournalStreak = currentJournalStreak + 1
    } else if (lastJournalDate !== today) {
      newJournalStreak = 1 // Reset streak if not consecutive
    }

    const noteResult = calculateNoteBonus({
      noteLength: dto.notes!.trim().length,
      journalStreak: newJournalStreak,
    })
    noteXp = noteResult.total
  }

  let totalXp = 0

  // Only do plant watering effects on first log of the day
  if (isFirstLogToday) {
    // Calculate streak
    const lastWateredDate = plant.last_watered_at
      ? new Date(plant.last_watered_at).toISOString().split('T')[0]
      : null
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let newStreak = 1
    if (lastWateredDate === yesterday) {
      newStreak = plant.current_streak + 1
    } else if (lastWateredDate === today) {
      // Already watered today, keep streak
      newStreak = plant.current_streak
    }

    // Add full watering XP for first log
    const { total: wateringXp, breakdown } = calculateWateringXp({
      streak: newStreak,
      isMorning,
      isRainyDay: weather.type === 'rainy',
      isRainbowDay: weather.type === 'rainbow',
    })
    totalXp = calculateWeatherXp(wateringXp, weather.type)

    // Add bonuses for first log only
    if (isPersonalRecord) totalXp += 25
    if (exceededTarget) totalXp += 10

    // Add note XP
    totalXp += noteXp

    // Calculate new moisture and growth
    const newMoisture = Math.min(100, plant.current_moisture + plantType.moisture_boost)
    const baseGrowth = 100 / plantType.maturity_days
    const weatherGrowth = baseGrowth * weather.growthModifier
    const newGrowth = Math.min(100, plant.growth_percentage + weatherGrowth)
    const totalWaterings = plant.total_waterings + 1
    const hasMatured = newGrowth >= 100 && plant.status === 'growing'

    // Create watering log (only once per day)
    await supabase
      .from('watering_logs')
      .insert({
        plant_id: plant.id,
        user_id: user.id,
        watered_date: today,
        xp_earned: totalXp,
        morning_bonus: isMorning,
        streak_bonus: breakdown.streakBonus || 0,
        note_bonus: noteXp,
      })

    // Update plant
    await supabase
      .from('plants')
      .update({
        current_moisture: newMoisture,
        growth_percentage: newGrowth,
        total_waterings: totalWaterings,
        current_streak: newStreak,
        longest_streak: Math.max(plant.longest_streak, newStreak),
        last_watered_at: new Date().toISOString(),
        status: hasMatured ? 'mature' : plant.status,
        matured_at: hasMatured ? new Date().toISOString() : plant.matured_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plant.id)
  } else {
    // Subsequent logs: only note XP (no base watering XP)
    totalXp = noteXp
  }

  // Update user XP and journal tracking in profiles table
  if (journalProfile && totalXp > 0) {
    const profileUpdate: Record<string, unknown> = {
      xp: journalProfile.xp + totalXp,
      updated_at: new Date().toISOString(),
    }

    // Update journal tracking if note was provided
    if (hasNote) {
      profileUpdate.journal_streak = newJournalStreak
      profileUpdate.longest_journal_streak = Math.max(
        newJournalStreak,
        journalProfile.longest_journal_streak || 0
      )
      profileUpdate.last_journal_date = today
      profileUpdate.total_journal_entries = (journalProfile.total_journal_entries || 0) + 1
    }

    const { error: xpError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (xpError) {
      console.error('Error updating user XP:', xpError)
    }
  } else if (journalProfile && hasNote) {
    // Even if totalXp is 0, still update journal tracking
    await supabase
      .from('profiles')
      .update({
        journal_streak: newJournalStreak,
        longest_journal_streak: Math.max(
          newJournalStreak,
          journalProfile.longest_journal_streak || 0
        ),
        last_journal_date: today,
        total_journal_entries: (journalProfile.total_journal_entries || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  }

  revalidatePath('/garden')
  return {
    success: true,
    xpEarned: totalXp,
    isPersonalRecord,
    exceededTarget,
    newValue: newCurrentValue,
  }
}

// Get goal with statistics
export async function getGoalStats(goalId: string): Promise<GoalStatistics | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get goal with plant
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select(`
      *,
      plant:plants!inner(user_id)
    `)
    .eq('id', goalId)
    .single()

  if (goalError || !goal || (goal.plant as any).user_id !== user.id) {
    return null
  }

  // Get all logs for this goal
  const { data: logs } = await supabase
    .from('goal_logs')
    .select('*')
    .eq('goal_id', goalId)
    .order('logged_at', { ascending: true })

  const goalLogs = (logs || []) as GoalLog[]

  // Calculate statistics
  const startDate = new Date(goal.started_at)
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const currentWeek = Math.floor(daysSinceStart / 7) + 1

  const weeklyTargets = goal.weekly_targets as number[] || []
  const weeklyTarget = weeklyTargets[Math.min(currentWeek - 1, weeklyTargets.length - 1)] || goal.target_value

  // Get period info
  const periodInfo = getPeriodInfo(goal as Goal)
  const periodTarget = getPeriodTarget(goal as Goal, periodInfo.periodNumber)

  // Calculate period progress
  const periodLogs = goalLogs.filter(log => {
    const logDate = new Date(log.logged_at)
    return logDate >= periodInfo.periodStart && logDate <= periodInfo.periodEnd
  })

  let periodProgress = 0
  if (goal.goal_mode === 'total_progress') {
    periodProgress = periodLogs.reduce((sum, log) => sum + Number(log.value), 0)
  } else {
    periodProgress = periodLogs.length > 0
      ? Math.max(...periodLogs.map(log => Number(log.value)))
      : 0
  }

  // Calculate weekly progress (logs from current week)
  const weekStart = new Date(startDate)
  weekStart.setDate(weekStart.getDate() + (currentWeek - 1) * 7)
  const weeklyLogs = goalLogs.filter(log => new Date(log.logged_at) >= weekStart)

  let weeklyProgress = 0
  if (goal.goal_mode === 'total_progress') {
    weeklyProgress = weeklyLogs.reduce((sum, log) => sum + Number(log.value), 0)
  } else {
    weeklyProgress = weeklyLogs.length > 0
      ? Math.max(...weeklyLogs.map(log => Number(log.value)))
      : 0
  }

  // Overall progress percentage
  const overallProgress = goal.goal_mode === 'total_progress'
    ? (Number(goal.current_value) / Number(goal.target_value)) * 100
    : (Number(goal.current_value) / Number(goal.target_value)) * 100

  // Count personal records
  const personalRecords = goalLogs.filter(log => log.is_personal_record).length

  // Count weeks where target was met
  const weeksCompleted = goalLogs.filter(log => log.exceeded_target).length

  // Predict completion date
  let predictedCompletion: Date | null = null
  if (goalLogs.length >= 7) {
    const avgDailyProgress = Number(goal.current_value) / daysSinceStart
    if (avgDailyProgress > 0) {
      const remaining = Number(goal.target_value) - Number(goal.current_value)
      const daysToComplete = remaining / avgDailyProgress
      predictedCompletion = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000)
    }
  }

  // Determine if on track
  const expectedProgress = weeklyTargets[currentWeek - 1] || 0
  const isOnTrack = Number(goal.current_value) >= expectedProgress

  // Weekly trend (compare last 2 weeks)
  let weeklyTrend: 'up' | 'down' | 'stable' = 'stable'
  if (currentWeek >= 2) {
    const prevWeekStart = new Date(startDate)
    prevWeekStart.setDate(prevWeekStart.getDate() + (currentWeek - 2) * 7)
    const prevWeekLogs = goalLogs.filter(log => {
      const logDate = new Date(log.logged_at)
      return logDate >= prevWeekStart && logDate < weekStart
    })
    const prevWeekTotal = prevWeekLogs.reduce((sum, log) => sum + Number(log.value), 0)
    const currWeekTotal = weeklyLogs.reduce((sum, log) => sum + Number(log.value), 0)

    if (currWeekTotal > prevWeekTotal * 1.1) weeklyTrend = 'up'
    else if (currWeekTotal < prevWeekTotal * 0.9) weeklyTrend = 'down'
  }

  return {
    goal: goal as Goal,
    logs: goalLogs,
    // Period-based
    currentPeriod: periodInfo.periodNumber,
    periodTarget,
    periodProgress,
    periodLabel: periodInfo.periodLabel,
    periodsCompleted: goalLogs.filter(log => log.exceeded_target).length,
    periodTrend: weeklyTrend, // Use same trend logic for now
    // Overall
    overallProgress: Math.min(100, overallProgress),
    personalRecords,
    predictedCompletion,
    isOnTrack,
    // Legacy
    currentWeek,
    weeklyTarget,
    weeklyProgress,
    weeksCompleted,
    weeklyTrend,
  }
}

// Get goal for a plant
export async function getGoalForPlant(plantId: string): Promise<GoalWithStats | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: goal, error } = await supabase
    .from('goals')
    .select('*')
    .eq('plant_id', plantId)
    .single()

  if (error || !goal) return null

  // Get period info based on frequency
  const periodInfo = getPeriodInfo(goal as Goal)
  const currentPeriodTarget = getPeriodTarget(goal as Goal, periodInfo.periodNumber)

  // Also calculate week info for legacy compatibility
  const startDate = new Date(goal.started_at)
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const weekNumber = Math.floor(daysSinceStart / 7) + 1
  const weeklyTargets = goal.weekly_targets as number[] || []
  const currentWeekTarget = weeklyTargets[Math.min(weekNumber - 1, weeklyTargets.length - 1)] || goal.target_value

  // Get logs for current period
  const { data: periodLogs } = await supabase
    .from('goal_logs')
    .select('value, is_personal_record')
    .eq('goal_id', goal.id)
    .gte('logged_at', periodInfo.periodStart.toISOString())
    .lte('logged_at', periodInfo.periodEnd.toISOString())

  // Calculate period progress
  let periodProgress = 0
  if (goal.goal_mode === 'total_progress') {
    periodProgress = (periodLogs || []).reduce((sum, log) => sum + Number(log.value), 0)
  } else {
    periodProgress = periodLogs && periodLogs.length > 0
      ? Math.max(...periodLogs.map(log => Number(log.value)))
      : 0
  }

  // Get logs for current week (legacy)
  const weekStart = new Date(startDate)
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const { data: weeklyLogs } = await supabase
    .from('goal_logs')
    .select('value, is_personal_record')
    .eq('goal_id', goal.id)
    .gte('logged_at', weekStart.toISOString())
    .lte('logged_at', weekEnd.toISOString())

  let weeklyProgress = 0
  if (goal.goal_mode === 'total_progress') {
    weeklyProgress = (weeklyLogs || []).reduce((sum, log) => sum + Number(log.value), 0)
  } else {
    weeklyProgress = weeklyLogs && weeklyLogs.length > 0
      ? Math.max(...weeklyLogs.map(log => Number(log.value)))
      : 0
  }

  const overallProgress = (Number(goal.current_value) / Number(goal.target_value)) * 100
  const isOnTrack = periodProgress >= currentPeriodTarget * 0.8 // Consider 80%+ as on track

  const { count: personalRecords } = await supabase
    .from('goal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('goal_id', goal.id)
    .eq('is_personal_record', true)

  return {
    ...goal,
    // Period-based stats
    periodProgress,
    currentPeriodTarget,
    periodNumber: periodInfo.periodNumber,
    periodLabel: periodInfo.periodLabel,
    periodDateRange: periodInfo.periodDateRange,
    // Overall
    overallProgress: Math.min(100, overallProgress),
    isOnTrack,
    personalRecords: personalRecords || 0,
    // Legacy
    weeklyProgress,
    currentWeekTarget,
    weekNumber,
  } as GoalWithStats
}

// Get all goals for the user
export async function getUserGoals(): Promise<GoalWithStats[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: goals, error } = await supabase
    .from('goals')
    .select(`
      *,
      plant:plants!inner(user_id, name, plant_type:plant_types(icon))
    `)
    .eq('plant.user_id', user.id)

  if (error || !goals) return []

  // Calculate stats for each goal
  const goalsWithStats: GoalWithStats[] = []

  for (const goal of goals) {
    const stats = await getGoalForPlant(goal.plant_id)
    if (stats) {
      goalsWithStats.push(stats)
    }
  }

  return goalsWithStats
}

// Modify an existing goal
export async function modifyGoal(dto: {
  goal_id: string
  target_value?: number
  duration_weeks?: number
  weekly_targets?: number[]
}): Promise<{ success: boolean; goal?: Goal; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify the goal belongs to the user
  const { data: existingGoal, error: fetchError } = await supabase
    .from('goals')
    .select(`
      *,
      plant:plants!inner(user_id)
    `)
    .eq('id', dto.goal_id)
    .single()

  if (fetchError || !existingGoal) {
    return { success: false, error: 'Goal not found' }
  }

  const plant = existingGoal.plant as { user_id: string } | null
  if (!plant || plant.user_id !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // Build update object
  const updates: Partial<Goal> & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  }

  if (dto.target_value !== undefined) {
    updates.target_value = dto.target_value
  }

  if (dto.duration_weeks !== undefined) {
    updates.duration_weeks = dto.duration_weeks

    // Recalculate target date
    const targetDate = new Date(existingGoal.started_at)
    targetDate.setDate(targetDate.getDate() + dto.duration_weeks * 7)
    updates.target_date = targetDate.toISOString()
  }

  if (dto.weekly_targets !== undefined) {
    updates.weekly_targets = dto.weekly_targets
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', dto.goal_id)
    .select()
    .single()

  if (error) {
    console.error('Error modifying goal:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')
  return { success: true, goal: goal as Goal }
}
