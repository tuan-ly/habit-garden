'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function getUserStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get plants count by status
  const { data: plants } = await supabase
    .from('plants')
    .select('status')
    .eq('user_id', user.id)

  // Get total waterings
  const { count: totalWaterings } = await supabase
    .from('watering_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get achievements count
  const { count: achievementsCount } = await supabase
    .from('user_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get best streak across all plants
  const { data: streakData } = await supabase
    .from('plants')
    .select('longest_streak')
    .eq('user_id', user.id)
    .order('longest_streak', { ascending: false })
    .limit(1)

  const growing = plants?.filter(p => p.status === 'growing').length ?? 0
  const mature = plants?.filter(p => p.status === 'mature').length ?? 0
  const dead = plants?.filter(p => p.status === 'dead').length ?? 0

  return {
    totalPlants: plants?.length ?? 0,
    growing,
    mature,
    dead,
    totalWaterings: totalWaterings ?? 0,
    achievementsCount: achievementsCount ?? 0,
    bestStreak: streakData?.[0]?.longest_streak ?? 0,
  }
}
