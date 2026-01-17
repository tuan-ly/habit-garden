'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EnergyLevel } from '@/lib/energy-system'
import { DEFAULT_ENERGY } from '@/lib/energy-system'

export interface EnergyLog {
  id: string
  user_id: string
  date: string
  energy_level: EnergyLevel
  note: string | null
  set_at: string
  created_at: string
}

// Get today's energy for the user
export async function getTodayEnergy(): Promise<EnergyLevel> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_ENERGY

  const today = new Date().toISOString().split('T')[0]

  const { data: energyLog } = await supabase
    .from('energy_logs')
    .select('energy_level')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return (energyLog?.energy_level as EnergyLevel) || DEFAULT_ENERGY
}

// Set energy for today
export async function setTodayEnergy(
  energyLevel: EnergyLevel,
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

  // Upsert energy for today
  const { error } = await supabase.from('energy_logs').upsert(
    {
      user_id: user.id,
      date: today,
      energy_level: energyLevel,
      note: note || null,
      set_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,date',
    }
  )

  if (error) {
    console.error('Error setting energy:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')
  return { success: true }
}

// Get energy history for a date range
export async function getEnergyHistory(startDate: string, endDate: string): Promise<EnergyLog[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: energyLogs } = await supabase
    .from('energy_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  return (energyLogs || []) as EnergyLog[]
}

// Get energy for a specific date
export async function getEnergyForDate(date: string): Promise<EnergyLevel> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_ENERGY

  const { data: energyLog } = await supabase
    .from('energy_logs')
    .select('energy_level')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  return (energyLog?.energy_level as EnergyLevel) || DEFAULT_ENERGY
}

// Check if user has set energy today
export async function hasEnergySetToday(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const today = new Date().toISOString().split('T')[0]

  const { data: energyLog } = await supabase
    .from('energy_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return !!energyLog
}

// Get energy statistics for a period
export async function getEnergyStats(days: number = 30): Promise<{
  total: number
  byLevel: Record<EnergyLevel, number>
  averageLevel: number
  restDays: number
  fullEnergyDays: number
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      total: 0,
      byLevel: { 1: 0, 2: 0, 3: 0, 4: 0 },
      averageLevel: 0,
      restDays: 0,
      fullEnergyDays: 0,
    }
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: energyLogs } = await supabase
    .from('energy_logs')
    .select('energy_level')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])

  if (!energyLogs || energyLogs.length === 0) {
    return {
      total: 0,
      byLevel: { 1: 0, 2: 0, 3: 0, 4: 0 },
      averageLevel: 0,
      restDays: 0,
      fullEnergyDays: 0,
    }
  }

  const byLevel: Record<EnergyLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  let totalLevel = 0

  for (const log of energyLogs) {
    const level = log.energy_level as EnergyLevel
    byLevel[level] = (byLevel[level] || 0) + 1
    totalLevel += level
  }

  return {
    total: energyLogs.length,
    byLevel,
    averageLevel: Math.round((totalLevel / energyLogs.length) * 10) / 10,
    restDays: byLevel[1],
    fullEnergyDays: byLevel[4],
  }
}

// Get energy pattern insights
export async function getEnergyPatterns(days: number = 30): Promise<{
  weekdayAverages: Record<number, number> // 0=Sun, 1=Mon, etc.
  trend: 'improving' | 'declining' | 'stable'
  suggestion: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      weekdayAverages: {},
      trend: 'stable',
      suggestion: 'Start tracking your energy to see patterns.',
    }
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: energyLogs } = await supabase
    .from('energy_logs')
    .select('energy_level, date')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (!energyLogs || energyLogs.length < 7) {
    return {
      weekdayAverages: {},
      trend: 'stable',
      suggestion: 'Track your energy for at least a week to see patterns.',
    }
  }

  // Calculate weekday averages
  const weekdayTotals: Record<number, { sum: number; count: number }> = {}
  for (let i = 0; i < 7; i++) {
    weekdayTotals[i] = { sum: 0, count: 0 }
  }

  for (const log of energyLogs) {
    const date = new Date(log.date)
    const weekday = date.getDay()
    weekdayTotals[weekday].sum += log.energy_level
    weekdayTotals[weekday].count += 1
  }

  const weekdayAverages: Record<number, number> = {}
  for (let i = 0; i < 7; i++) {
    if (weekdayTotals[i].count > 0) {
      weekdayAverages[i] = Math.round((weekdayTotals[i].sum / weekdayTotals[i].count) * 10) / 10
    }
  }

  // Calculate trend (compare first half vs second half)
  const midpoint = Math.floor(energyLogs.length / 2)
  const firstHalf = energyLogs.slice(0, midpoint)
  const secondHalf = energyLogs.slice(midpoint)

  const firstAvg = firstHalf.reduce((sum, l) => sum + l.energy_level, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, l) => sum + l.energy_level, 0) / secondHalf.length

  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (secondAvg - firstAvg > 0.3) trend = 'improving'
  else if (firstAvg - secondAvg > 0.3) trend = 'declining'

  // Generate suggestion
  let suggestion = ''
  const lowestDay = Object.entries(weekdayAverages).reduce<[string, number]>(
    (min, [day, avg]) => (avg < min[1] ? [day, avg] : min),
    ['0', 5]
  )[0]
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (weekdayAverages[Number(lowestDay)] < 2.5) {
    suggestion = `Your energy tends to be lower on ${dayNames[Number(lowestDay)]}s. Consider lighter goals on that day.`
  } else if (trend === 'declining') {
    suggestion = 'Your energy has been declining. Consider taking more rest days.'
  } else if (trend === 'improving') {
    suggestion = 'Great progress! Your energy levels are improving.'
  } else {
    suggestion = 'Your energy is stable. Keep up the good work!'
  }

  return { weekdayAverages, trend, suggestion }
}
