'use server'

/**
 * Journal Actions - Reflective Content for Plant Detail Sheet
 *
 * Philosophy:
 * - Surface notes and reflections as memories
 * - Celebrate milestones as journey markers
 * - Create emotional connection to habit journey
 */

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-cached'
import { revalidatePath } from 'next/cache'
import type {
  ActivityLog,
  RestDay,
  Reflection,
  CreateReflectionDto,
  MilestoneType,
} from '@/types/database'

// =====================================================
// Types
// =====================================================

export interface JournalEntry {
  id: string
  date: string
  type: 'activity' | 'rest_day' | 'reflection'
  activityType?: 'watering' | 'progress' | 'rest_day' | 'reflection'
  notes: string | null
  value?: number | null
  xpEarned?: number
  isPersonalRecord?: boolean
  mood?: string | null
  // For grouping
  dateGroup: 'today' | 'yesterday' | 'this_week' | 'earlier'
}

export interface MilestoneData {
  type: MilestoneType | 'days_7' | 'days_14' | 'first_pr' | 'first_note'
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: string
  progress?: number // 0-100 for locked milestones
  daysToGo?: number
  reflection?: Reflection | null
}

export interface JournalData {
  entries: JournalEntry[]
  milestones: MilestoneData[]
  reflections: Reflection[]
  stats: {
    totalEntries: number
    entriesWithNotes: number
    personalRecords: number
  }
}

// =====================================================
// Get Journal Entries
// =====================================================

/**
 * Get journal entries (activities with notes) for a plant
 */
export async function getPlantJournalEntries(
  plantId: string,
  limit: number = 50
): Promise<JournalEntry[]> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return []

  // Get activities (include those with notes, but also recent ones)
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(limit)

  // Get rest days with reasons
  const { data: restDays } = await supabase
    .from('rest_days')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .order('rest_date', { ascending: false })
    .limit(20)

  const entries: JournalEntry[] = []
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Helper to determine date group
  const getDateGroup = (dateStr: string): JournalEntry['dateGroup'] => {
    if (dateStr === todayStr) return 'today'
    if (dateStr === yesterdayStr) return 'yesterday'
    const date = new Date(dateStr)
    if (date >= weekAgo) return 'this_week'
    return 'earlier'
  }

  // Add activities
  for (const activity of activities || []) {
    entries.push({
      id: activity.id,
      date: activity.logged_date,
      type: 'activity',
      activityType: activity.activity_type,
      notes: activity.notes,
      value: activity.value,
      xpEarned: activity.xp_earned,
      isPersonalRecord: activity.is_personal_record,
      dateGroup: getDateGroup(activity.logged_date),
    })
  }

  // Add rest days (if not already in activities)
  const activityDates = new Set((activities || []).map(a => a.logged_date))
  for (const rest of restDays || []) {
    if (!activityDates.has(rest.rest_date)) {
      entries.push({
        id: rest.id,
        date: rest.rest_date,
        type: 'rest_day',
        notes: rest.reason,
        dateGroup: getDateGroup(rest.rest_date),
      })
    }
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return entries
}

// =====================================================
// Get Milestones
// =====================================================

const MILESTONE_DEFINITIONS: Array<{
  type: MilestoneData['type']
  title: string
  description: string
  descriptionLocked: string
  requiredDays?: number
  requiresPR?: boolean
  requiresNote?: boolean
}> = [
  {
    type: 'days_7',
    title: 'First Week',
    description: "A week of showing up. That's the hardest part done.",
    descriptionLocked: 'Show up for 7 days',
    requiredDays: 7,
  },
  {
    type: 'first_note',
    title: 'First Memory',
    description: 'You started capturing your journey in words.',
    descriptionLocked: 'Write your first note',
    requiresNote: true,
  },
  {
    type: 'days_14',
    title: 'Two Weeks Strong',
    description: "Two weeks in. You're building something real.",
    descriptionLocked: 'Keep going for 14 days',
    requiredDays: 14,
  },
  {
    type: 'first_pr',
    title: 'Personal Best',
    description: 'You beat yourself. Growth looks like this.',
    descriptionLocked: 'Set your first personal record',
    requiresPR: true,
  },
  {
    type: 'days_30',
    title: 'One Month',
    description: 'A month of growth. This habit is becoming part of you.',
    descriptionLocked: 'Complete 30 days',
    requiredDays: 30,
  },
  {
    type: 'days_100',
    title: 'Century Club',
    description: "100 days. You've proven this matters to you.",
    descriptionLocked: 'Reach 100 days',
    requiredDays: 100,
  },
]

/**
 * Calculate milestones for a plant based on activity history
 */
export async function getPlantMilestones(plantId: string): Promise<MilestoneData[]> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return []

  // Get plant data for days calculation
  const { data: plant } = await supabase
    .from('plants')
    .select('started_at, total_waterings')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (!plant) return []

  // Get activity stats
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('logged_date, is_personal_record, notes')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)

  // Get existing reflections for milestones
  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)

  // Calculate unique active days
  const uniqueDays = new Set((activities || []).map(a => a.logged_date))
  const daysActive = uniqueDays.size

  // Check for personal records
  const hasPersonalRecord = (activities || []).some(a => a.is_personal_record)

  // Check for notes
  const hasNote = (activities || []).some(a => a.notes && a.notes.trim().length > 0)

  // Find earliest date for each milestone
  const sortedDates = Array.from(uniqueDays).sort()

  const milestones: MilestoneData[] = []

  for (const def of MILESTONE_DEFINITIONS) {
    let unlocked = false
    let unlockedAt: string | undefined
    let progress = 0
    let daysToGo: number | undefined

    if (def.requiredDays) {
      unlocked = daysActive >= def.requiredDays
      progress = Math.min(100, Math.round((daysActive / def.requiredDays) * 100))
      daysToGo = unlocked ? undefined : def.requiredDays - daysActive
      if (unlocked && sortedDates[def.requiredDays - 1]) {
        unlockedAt = sortedDates[def.requiredDays - 1]
      }
    } else if (def.requiresPR) {
      unlocked = hasPersonalRecord
      progress = unlocked ? 100 : 0
      // Find first PR date
      if (unlocked) {
        const prActivity = (activities || []).find(a => a.is_personal_record)
        unlockedAt = prActivity?.logged_date
      }
    } else if (def.requiresNote) {
      unlocked = hasNote
      progress = unlocked ? 100 : 0
      if (unlocked) {
        const noteActivity = (activities || []).find(a => a.notes && a.notes.trim().length > 0)
        unlockedAt = noteActivity?.logged_date
      }
    }

    // Find reflection for this milestone
    const reflection = (reflections || []).find(r => {
      // Direct matches for standard database types
      if (def.type === 'days_30' && r.milestone_type === 'days_30') return true
      if (def.type === 'days_100' && r.milestone_type === 'days_100') return true
      if (def.type === 'season_complete' && r.milestone_type === 'season_complete') return true
      if (def.type === 'year_1' && r.milestone_type === 'year_1') return true

      // Custom milestone types stored with milestone_value
      if (r.milestone_type === 'custom') {
        if (def.type === 'days_7' && r.milestone_value === 7) return true
        if (def.type === 'days_14' && r.milestone_value === 14) return true
        if (def.type === 'first_pr' && r.milestone_value === 1) return true
        if (def.type === 'first_note' && r.milestone_value === 2) return true
      }

      return false
    })

    milestones.push({
      type: def.type,
      title: def.title,
      description: unlocked ? def.description : def.descriptionLocked,
      unlocked,
      unlockedAt,
      progress,
      daysToGo,
      reflection: reflection || null,
    })
  }

  return milestones
}

// =====================================================
// Get Reflections
// =====================================================

/**
 * Get all reflections for a plant
 */
export async function getPlantReflections(plantId: string): Promise<Reflection[]> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return []

  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (reflections || []) as Reflection[]
}

// =====================================================
// Create Reflection
// =====================================================

export interface CreateReflectionResult {
  success: boolean
  reflection?: Reflection
  error?: string
}

// Map custom milestone types to database-valid types
// Database only accepts: 'days_30' | 'days_100' | 'season_complete' | 'year_1' | 'custom'
function mapMilestoneType(type: string): { dbType: MilestoneType; value: number | null } {
  switch (type) {
    case 'days_7':
      return { dbType: 'custom', value: 7 }
    case 'days_14':
      return { dbType: 'custom', value: 14 }
    case 'days_30':
      return { dbType: 'days_30', value: 30 }
    case 'days_100':
      return { dbType: 'days_100', value: 100 }
    case 'first_pr':
      return { dbType: 'custom', value: 1 } // 1 = first PR
    case 'first_note':
      return { dbType: 'custom', value: 2 } // 2 = first note
    case 'season_complete':
      return { dbType: 'season_complete', value: null }
    case 'year_1':
      return { dbType: 'year_1', value: 365 }
    default:
      return { dbType: 'custom', value: null }
  }
}

/**
 * Create a reflection for a milestone
 */
export async function createReflection(
  dto: CreateReflectionDto
): Promise<CreateReflectionResult> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get current plant stats for context
  const { data: plant } = await supabase
    .from('plants')
    .select('total_waterings')
    .eq('id', dto.plant_id)
    .eq('user_id', user.id)
    .single()

  // Get current goal if exists
  const { data: goal } = await supabase
    .from('goals')
    .select('current_value, season_number, days_active')
    .eq('plant_id', dto.plant_id)
    .eq('season_status', 'active')
    .single()

  // Map milestone type to database-valid type
  const { dbType, value } = mapMilestoneType(dto.milestone_type)

  const { data: reflection, error } = await supabase
    .from('reflections')
    .insert({
      plant_id: dto.plant_id,
      user_id: user.id,
      milestone_type: dbType,
      milestone_value: dto.milestone_value ?? value,
      life_changes: dto.life_changes,
      personal_note: dto.personal_note,
      mood: dto.mood,
      total_value_at_reflection: goal?.current_value || null,
      days_active_at_reflection: goal?.days_active || plant?.total_waterings || 0,
      season_number_at_reflection: goal?.season_number || 1,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create reflection:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')

  return {
    success: true,
    reflection: reflection as Reflection,
  }
}

// =====================================================
// Get Full Journal Data (Combined)
// =====================================================

/**
 * Get all journal data for a plant in one call
 * Use this for the Journal tab to minimize round trips
 */
export async function getPlantJournalData(plantId: string): Promise<JournalData | null> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return null

  // Fetch all data in parallel
  const [entries, milestones, reflections] = await Promise.all([
    getPlantJournalEntries(plantId),
    getPlantMilestones(plantId),
    getPlantReflections(plantId),
  ])

  // Calculate stats
  const entriesWithNotes = entries.filter(e => e.notes && e.notes.trim().length > 0)
  const personalRecords = entries.filter(e => e.isPersonalRecord)

  return {
    entries,
    milestones,
    reflections,
    stats: {
      totalEntries: entries.length,
      entriesWithNotes: entriesWithNotes.length,
      personalRecords: personalRecords.length,
    },
  }
}
