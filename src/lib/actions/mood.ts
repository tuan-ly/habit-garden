'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MoodLevel } from '@/lib/mood-system'
import { DEFAULT_MOOD } from '@/lib/mood-system'

export interface MoodLog {
  id: string
  user_id: string
  date: string
  mood_level: MoodLevel
  note: string | null
  set_at: string
  created_at: string
}

// Get today's mood for the user
export async function getTodayMood(): Promise<MoodLevel> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_MOOD

  const today = new Date().toISOString().split('T')[0]

  // Try mood_logs table first, fallback to energy_logs for migration
  let moodLog = await supabase
    .from('mood_logs')
    .select('mood_level')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (moodLog.data) {
    return (moodLog.data.mood_level as MoodLevel) || DEFAULT_MOOD
  }

  // Fallback: check energy_logs and convert
  const energyLog = await supabase
    .from('energy_logs')
    .select('energy_level')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (energyLog.data) {
    // Convert energy (1-4) to mood (1-5)
    // Energy 4 -> Mood 5, Energy 3 -> Mood 4, Energy 2 -> Mood 3, Energy 1 -> Mood 2
    const energyToMood: Record<number, MoodLevel> = {
      4: 5,
      3: 4,
      2: 3,
      1: 2,
    }
    return energyToMood[energyLog.data.energy_level] || DEFAULT_MOOD
  }

  return DEFAULT_MOOD
}

// Set mood for today
export async function setTodayMood(
  moodLevel: MoodLevel,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Upsert mood for today
  const { error } = await supabase.from('mood_logs').upsert(
    {
      user_id: user.id,
      date: today,
      mood_level: moodLevel,
      note: note || null,
      set_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,date',
    }
  )

  if (error) {
    console.error('Error setting mood:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')
  return { success: true }
}

// Get mood history for a date range
export async function getMoodHistory(startDate: string, endDate: string): Promise<MoodLog[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: moodLogs } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  return (moodLogs || []) as MoodLog[]
}

// Get mood for a specific date
export async function getMoodForDate(date: string): Promise<MoodLevel> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_MOOD

  const { data: moodLog } = await supabase
    .from('mood_logs')
    .select('mood_level')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  return (moodLog?.mood_level as MoodLevel) || DEFAULT_MOOD
}

// Check if user has set mood today
export async function hasMoodSetToday(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const today = new Date().toISOString().split('T')[0]

  const { data: moodLog } = await supabase
    .from('mood_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return !!moodLog
}

// Get mood statistics for a period
export async function getMoodStats(days: number = 30): Promise<{
  total: number
  byLevel: Record<MoodLevel, number>
  averageLevel: number
  toughDays: number // Stormy + Rainy
  greatDays: number // Sunny
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      total: 0,
      byLevel: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      averageLevel: 0,
      toughDays: 0,
      greatDays: 0,
    }
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: moodLogs } = await supabase
    .from('mood_logs')
    .select('mood_level')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])

  if (!moodLogs || moodLogs.length === 0) {
    return {
      total: 0,
      byLevel: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      averageLevel: 0,
      toughDays: 0,
      greatDays: 0,
    }
  }

  const byLevel: Record<MoodLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let totalLevel = 0

  for (const log of moodLogs) {
    const level = log.mood_level as MoodLevel
    byLevel[level] = (byLevel[level] || 0) + 1
    totalLevel += level
  }

  return {
    total: moodLogs.length,
    byLevel,
    averageLevel: Math.round((totalLevel / moodLogs.length) * 10) / 10,
    toughDays: byLevel[1] + byLevel[2], // Stormy + Rainy
    greatDays: byLevel[5], // Sunny
  }
}

// Get mood pattern insights
export async function getMoodPatterns(days: number = 30): Promise<{
  weekdayAverages: Record<number, number> // 0=Sun, 1=Mon, etc.
  trend: 'improving' | 'declining' | 'stable'
  insight: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      weekdayAverages: {},
      trend: 'stable',
      insight: 'Start tracking your mood to see patterns.',
    }
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: moodLogs } = await supabase
    .from('mood_logs')
    .select('mood_level, date')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (!moodLogs || moodLogs.length < 7) {
    return {
      weekdayAverages: {},
      trend: 'stable',
      insight: 'Track your mood for at least a week to see patterns.',
    }
  }

  // Calculate weekday averages
  const weekdayTotals: Record<number, { sum: number; count: number }> = {}
  for (let i = 0; i < 7; i++) {
    weekdayTotals[i] = { sum: 0, count: 0 }
  }

  for (const log of moodLogs) {
    const date = new Date(log.date)
    const weekday = date.getDay()
    weekdayTotals[weekday].sum += log.mood_level
    weekdayTotals[weekday].count += 1
  }

  const weekdayAverages: Record<number, number> = {}
  for (let i = 0; i < 7; i++) {
    if (weekdayTotals[i].count > 0) {
      weekdayAverages[i] = Math.round((weekdayTotals[i].sum / weekdayTotals[i].count) * 10) / 10
    }
  }

  // Calculate trend (compare first half vs second half)
  const midpoint = Math.floor(moodLogs.length / 2)
  const firstHalf = moodLogs.slice(0, midpoint)
  const secondHalf = moodLogs.slice(midpoint)

  const firstAvg = firstHalf.reduce((sum, l) => sum + l.mood_level, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, l) => sum + l.mood_level, 0) / secondHalf.length

  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (secondAvg - firstAvg > 0.3) trend = 'improving'
  else if (firstAvg - secondAvg > 0.3) trend = 'declining'

  // Generate insight
  let insight = ''
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Find lowest mood day
  const lowestDay = Object.entries(weekdayAverages).reduce<[string, number]>(
    (min, [day, avg]) => (avg < min[1] ? [day, avg] : min),
    ['0', 6]
  )[0]

  // Find highest mood day
  const highestDay = Object.entries(weekdayAverages).reduce<[string, number]>(
    (max, [day, avg]) => (avg > max[1] ? [day, avg] : max),
    ['0', 0]
  )[0]

  if (weekdayAverages[Number(lowestDay)] < 3) {
    insight = `${dayNames[Number(lowestDay)]}s tend to be tough. Be extra kind to yourself!`
  } else if (trend === 'declining') {
    insight = 'Your mood has been dipping lately. Remember: doing habits on tough days earns bonus XP!'
  } else if (trend === 'improving') {
    insight = 'Your mood is trending up! Keep nurturing those good habits.'
  } else {
    insight = `You tend to feel best on ${dayNames[Number(highestDay)]}s. Your mood is stable overall.`
  }

  return { weekdayAverages, trend, insight }
}
