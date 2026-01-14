'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Goal, GoalLog, CreateGoalDto, LogGoalDto, GoalMode, ProgressionType } from '@/types/database'
import { calculateTarget, generateProgressionPlan, type ProgressionType as ProgType } from '@/lib/progression'
import { calculateWateringXp } from '@/lib/xp-system'
import { getTodayWeather, calculateWeatherXp } from '@/lib/weather-system'

export interface GoalWithStats extends Goal {
  weeklyProgress: number
  overallProgress: number
  currentWeekTarget: number
  isOnTrack: boolean
  personalRecords: number
  weekNumber: number
}

export interface GoalStatistics {
  goal: Goal
  logs: GoalLog[]
  currentWeek: number
  weeklyTarget: number
  weeklyProgress: number
  overallProgress: number
  personalRecords: number
  weeksCompleted: number
  predictedCompletion: Date | null
  isOnTrack: boolean
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

  // Generate weekly targets based on progression type
  const progressionType = (dto.progression_type || 'linear') as ProgType
  const weeklyTargets = generateProgressionPlan({
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

  // Check if already logged today
  const today = new Date().toISOString().split('T')[0]
  const { data: existingLog } = await supabase
    .from('goal_logs')
    .select('id')
    .eq('goal_id', dto.goal_id)
    .eq('logged_date', today)
    .single()

  if (existingLog) {
    return { success: false, error: 'Already logged today' }
  }

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

  // Also water the plant (same logic as regular watering)
  const weather = getTodayWeather()
  const plantType = plant.plant_type

  // Calculate streak
  const lastWateredDate = plant.last_watered_at
    ? new Date(plant.last_watered_at).toISOString().split('T')[0]
    : null
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = 1
  if (lastWateredDate === yesterday) {
    newStreak = plant.current_streak + 1
  }

  // Calculate XP
  const currentHour = new Date().getHours()
  const isMorning = currentHour >= 5 && currentHour < 9

  const { total: baseTotal, breakdown } = calculateWateringXp({
    streak: newStreak,
    isMorning,
    isRainyDay: weather.type === 'rainy',
    isRainbowDay: weather.type === 'rainbow',
  })

  // Bonus XP for exceeding target or PR
  let bonusXp = 0
  if (isPersonalRecord) bonusXp += 25
  if (exceededTarget) bonusXp += 10

  const totalXp = calculateWeatherXp(baseTotal, weather.type) + bonusXp

  // Calculate new moisture and growth
  const newMoisture = Math.min(100, plant.current_moisture + plantType.moisture_boost)
  const baseGrowth = 100 / plantType.maturity_days
  const weatherGrowth = baseGrowth * weather.growthModifier
  const newGrowth = Math.min(100, plant.growth_percentage + weatherGrowth)
  const totalWaterings = plant.total_waterings + 1
  const hasMatured = newGrowth >= 100 && plant.status === 'growing'

  // Create watering log
  await supabase
    .from('watering_logs')
    .insert({
      plant_id: plant.id,
      user_id: user.id,
      watered_date: today,
      xp_earned: totalXp,
      morning_bonus: isMorning,
      streak_bonus: breakdown.streakBonus || 0,
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

  // Update user XP
  await supabase.rpc('increment_user_xp', { user_id: user.id, xp_amount: totalXp })

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
  const weeklyTarget = weeklyTargets[Math.min(currentWeek, weeklyTargets.length - 1)] || goal.target_value

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
    currentWeek,
    weeklyTarget,
    weeklyProgress,
    overallProgress: Math.min(100, overallProgress),
    personalRecords,
    weeksCompleted,
    predictedCompletion,
    isOnTrack,
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

  // Calculate stats
  const startDate = new Date(goal.started_at)
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const weekNumber = Math.floor(daysSinceStart / 7) + 1

  const weeklyTargets = goal.weekly_targets as number[] || []
  const currentWeekTarget = weeklyTargets[Math.min(weekNumber, weeklyTargets.length - 1)] || goal.target_value

  // Get logs for current week
  const weekStart = new Date(startDate)
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7)

  const { data: weeklyLogs } = await supabase
    .from('goal_logs')
    .select('value, is_personal_record')
    .eq('goal_id', goal.id)
    .gte('logged_at', weekStart.toISOString())

  let weeklyProgress = 0
  if (goal.goal_mode === 'total_progress') {
    weeklyProgress = (weeklyLogs || []).reduce((sum, log) => sum + Number(log.value), 0)
  } else {
    weeklyProgress = weeklyLogs && weeklyLogs.length > 0
      ? Math.max(...weeklyLogs.map(log => Number(log.value)))
      : 0
  }

  const overallProgress = (Number(goal.current_value) / Number(goal.target_value)) * 100
  const isOnTrack = Number(goal.current_value) >= (weeklyTargets[weekNumber - 1] || 0)

  const { count: personalRecords } = await supabase
    .from('goal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('goal_id', goal.id)
    .eq('is_personal_record', true)

  return {
    ...goal,
    weeklyProgress,
    overallProgress: Math.min(100, overallProgress),
    currentWeekTarget,
    isOnTrack,
    personalRecords: personalRecords || 0,
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
