import type { PlantWithType } from './database'

export type HabitUnit = 'pages' | 'minutes' | 'repetitions' | 'sessions' | 'other'

export type HabitSessionStatus =
  | 'running'
  | 'paused'
  | 'awaiting_completion'
  | 'completed'
  | 'cancelled'

export type HabitPlantStage = 'seed' | 'sprout' | 'growing' | 'blooming' | 'mature'

export type GrowthHistoryAction = 'advanced' | 'held' | 'completed'

export interface GrowthHistoryEntry {
  reviewed_on: string
  period_started_on: string
  period_ended_on: string
  previous_target: number
  new_target: number
  consistency: number
  successful_days: number
  review_period_days: number
  action: GrowthHistoryAction
  reason: 'threshold_met' | 'threshold_not_met' | 'end_target_reached'
}

export interface Habit {
  id: string
  user_id: string
  type: string
  name: string
  description: string | null
  unit: HabitUnit
  custom_unit: string | null
  session_duration_minutes: number
  config?: Record<string, unknown>
  definition_version?: number
  is_active: boolean
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export interface PlantCapabilitySummary {
  id: string
  plant_id: string
  type: string
  is_active: boolean
}

export type HabitCapabilitySummary = PlantCapabilitySummary

export interface GoalPlan {
  id: string
  habit_id: string
  user_id: string
  start_target: number
  end_target: number
  timeframe_weeks: number
  increment_value: number
  review_period_days: number
  performance_threshold: number
  started_on: string
  target_end_on: string
  created_at: string
  updated_at: string
}

export interface HabitSession {
  id: string
  habit_id: string
  user_id: string
  source_plant_id: string | null
  status: HabitSessionStatus
  target_value: number
  duration_seconds: number
  accumulated_seconds: number
  last_resumed_at: string | null
  ambient_enabled: boolean
  result_value: number | null
  reflection: string | null
  reward_points: number
  started_at: string
  paused_at: string | null
  finished_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type ActiveCapabilitySession = HabitSession & {
  plant_id: string
  capability_type: string
}

export type ActiveReadingSession = ActiveCapabilitySession

export interface DailyProgress {
  id: string
  habit_id: string
  user_id: string
  progress_date: string
  target_value: number
  completed_value: number
  session_count: number
  met_target: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface GrowthState {
  id: string
  habit_id: string
  user_id: string
  current_target: number
  previous_target: number | null
  next_target: number | null
  review_period_started_on: string
  next_review_on: string
  last_reviewed_on: string | null
  consistency_score: number
  current_streak: number
  best_streak: number
  last_completed_on: string | null
  total_growth_points: number
  plant_stage: HabitPlantStage
  history: GrowthHistoryEntry[]
  created_at: string
  updated_at: string
}

export interface ReadingJourneySnapshot {
  habit: Habit
  plant: PlantWithType
  plan: GoalPlan
  growth: GrowthState
  today: DailyProgress | null
  active_session: HabitSession | null
  latest_completed_session: HabitSession | null
}

export interface ReadingCompletionSnapshot {
  habit: Habit
  plan: GoalPlan
  growth: GrowthState
  daily_progress: DailyProgress
  session: HabitSession
}

