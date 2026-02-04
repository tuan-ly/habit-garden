// Database types for Habit Garden

// Gentle Growth: New plant statuses
// Note: 'dead' and 'dormant' kept for backward compatibility but deprecated
// UI should treat 'dead' as 'sleeping' and 'dormant' as 'resting'
export type PlantStatus = 'thriving' | 'growing' | 'resting' | 'waiting' | 'sleeping' | 'mature' | 'dead' | 'dormant'

// New statuses for Gentle Growth (use these in new code)
export type GentlePlantStatus = 'thriving' | 'growing' | 'resting' | 'waiting' | 'sleeping' | 'mature'

// Visual stages for plant display
export type VisualStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'established' | 'ancient' | 'legendary'

// Activity types for unified logging
// - 'watering' = Just checking in (water only)
// - 'completed' = I did it! (plants without goals)
// - 'progress' = I did it! with value (plants with goals)
// - 'rest_day' = Intentional rest
// - 'reflection' = Milestone reflection
export type ActivityType = 'watering' | 'completed' | 'progress' | 'rest_day' | 'reflection'

// Season status for goals
export type SeasonStatus = 'active' | 'completed' | 'ended'

// Milestone types for reflections
export type MilestoneType = 'days_30' | 'days_100' | 'season_complete' | 'year_1' | 'custom'
export type FrequencyType = 'daily' | 'flexible'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GoalMode = 'build_capacity' | 'total_progress'
export type AdaptiveMode = 'suggest' | 'auto' | 'off'
export type ProgressionType = 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'step' | 'custom'
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'rainbow'
export type AdjustmentType = 'increase' | 'decrease' | 'recovery_week' | 'timeline_extend'
export type GoalFrequency = 'daily' | 'weekly' | 'monthly'

// Special effect types for different plants
export type SpecialEffectType =
  | 'delayed_growth'
  | 'buff_others'
  | 'cycle'
  | 'drought_resistant'
  | 'difficulty_bonus'
  | 'spawn_children'
  | 'hidden_progress'
  | 'immortal_after_mature'

export interface SpecialEffect {
  type: SpecialEffectType
  hidden_until?: number
  burst_at?: number
  buff_percentage?: number
  cycle_days?: number
  bloom_days?: number
  decay_multiplier?: number
  hard_day_bonus?: number
  child_at?: number
}

// Profile table
export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  water_reserves: number
  timezone: string
  // Journal tracking
  journal_streak: number
  longest_journal_streak: number
  last_journal_date: string | null
  total_journal_entries: number
  created_at: string
  updated_at: string
}

// Plant types table
export interface PlantType {
  id: string
  name: string
  name_vi: string
  icon: string
  description: string | null
  description_vi: string | null
  maturity_days: number
  frequency_type: FrequencyType
  frequency_target: number
  moisture_decay_rate: number
  moisture_boost: number
  special_effect: SpecialEffect | null
  category: string | null
  difficulty: Difficulty
  is_premium: boolean
  created_at: string
}

// Plants table
export interface Plant {
  id: string
  user_id: string
  plant_type_id: string
  name: string
  habit_description: string | null
  started_at: string
  current_moisture: number
  growth_percentage: number
  total_waterings: number
  current_streak: number
  longest_streak: number
  last_watered_at: string | null
  status: PlantStatus
  matured_at: string | null
  died_at: string | null // Legacy: kept for backwards compat
  death_reason: string | null // Legacy: kept for backwards compat
  goal_mode: GoalMode | null
  reminder_time: string | null
  reminder_enabled: boolean
  adaptive_mode: AdaptiveMode
  position: number
  // Grid positioning (multi-cell support)
  grid_size: number // Number of cells in one dimension (1 = 1x1, 2 = 2x2, etc.)
  grid_row: number // Top-left row position in garden grid
  grid_col: number // Top-left col position in garden grid
  // Conflict status
  growth_blocked?: boolean // Computed flag: true if plant wants to grow but is blocked
  // Weeds system
  weed_count: number
  last_weed_added: string | null
  weeds_cleared_total: number
  // Gentle Growth fields
  why_i_started: string | null // Motivation for starting this habit
  maturity_level: number // 1-10 scale
  visual_stage: VisualStage // Display stage
  rest_days_allowed: number // Per week
  grace_period_days: number // Days before sleeping
  days_this_week: number // Rhythm tracking
  days_this_month: number
  consistency_percentage: number
  created_at: string
  updated_at: string
}

// Today's goal log (simplified for display)
export interface TodayGoalLog {
  id: string
  value: number
  notes: string | null
  logged_at: string
}

// Goal info embedded in plant (for garden view)
export interface PlantGoalInfo {
  id: string
  goal_mode: GoalMode
  tracking_metric: string
  unit: string
  target_value: number
  current_value: number
  weekly_targets: number[] | null
  current_week_target: number
  week_number: number
}

// Plant with type info (joined)
export interface PlantWithType extends Plant {
  plant_type: PlantType
  // Optional goal info (populated when plant has goal_mode)
  goal?: PlantGoalInfo | null
  // Today's goal logs for this plant
  today_logs?: TodayGoalLog[]
  // Computed: today's total log count
  today_log_count?: number
  // Computed: today's total value
  today_value?: number
}

// Watering logs table
export interface WateringLog {
  id: string
  plant_id: string
  user_id: string
  watered_at: string
  watered_date: string
  difficulty: string | null
  notes: string | null
  xp_earned: number
  morning_bonus: boolean
  streak_bonus: number
  created_at: string
}

// Goals table (now represents Seasons)
export interface Goal {
  id: string
  plant_id: string
  goal_mode: GoalMode
  tracking_metric: string
  unit: string
  start_value: number | null
  target_value: number
  current_value: number
  initial_amount: number
  duration_weeks: number
  started_at: string
  target_date: string | null
  progression_type: ProgressionType
  step_size: number
  weekly_targets: number[] | null
  adaptive_mode: AdaptiveMode
  last_adjusted_at: string | null
  adjustment_count: number
  // Frequency tracking
  frequency: GoalFrequency
  frequency_target: number
  period_start_day: number
  // Season support (Gentle Growth)
  season_number: number
  season_name: string | null
  season_status: SeasonStatus
  completed_at: string | null
  days_active: number
  best_streak: number
  rest_days_used: number
  end_reflection: string | null
  lessons_learned: string | null
  created_at: string
  updated_at: string
}

// Goal logs table
export interface GoalLog {
  id: string
  goal_id: string
  plant_id: string
  user_id: string
  value: number
  logged_at: string
  logged_date: string
  notes: string | null
  week_number: number | null
  weekly_target: number | null
  is_personal_record: boolean
  exceeded_target: boolean
  created_at: string
}

// Goal adjustments table
export interface GoalAdjustment {
  id: string
  goal_id: string
  adjustment_type: AdjustmentType
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  trigger_reason: string | null
  performance_data: Record<string, unknown> | null
  suggested_at: string
  responded_at: string | null
  response: string | null
  auto_applied: boolean
  created_at: string
}

// Daily weather table
export interface DailyWeather {
  id: string
  date: string
  weather_type: WeatherType
  growth_modifier: number
  moisture_modifier: number
  description: string | null
  created_at: string
}

// Achievements table
export interface Achievement {
  id: string
  name: string
  name_vi: string
  description: string | null
  description_vi: string | null
  icon: string
  requirement_type: string
  requirement_value: number | null
  requirement_data: Record<string, unknown> | null
  xp_reward: number
  is_hidden: boolean
  created_at: string
}

// User achievements table
export interface UserAchievement {
  user_id: string
  achievement_id: string
  unlocked_at: string
}

// Achievement with details (joined)
export interface UserAchievementWithDetails extends UserAchievement {
  achievement: Achievement
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// Create/Update DTOs
export interface CreatePlantDto {
  plant_type_id: string
  name: string
  habit_description?: string
  reminder_time?: string
  reminder_enabled?: boolean
  /** Optional grid position - if not provided, will be auto-assigned */
  grid_row?: number
  grid_col?: number
}

export interface UpdatePlantDto {
  name?: string
  habit_description?: string
  reminder_time?: string
  reminder_enabled?: boolean
  position?: number
}

export interface CreateGoalDto {
  plant_id: string
  goal_mode: GoalMode
  tracking_metric: string
  unit: string
  start_value?: number
  target_value: number
  initial_amount?: number
  duration_weeks: number
  progression_type?: ProgressionType
  step_size?: number
  weekly_targets?: number[] // Optional manual targets override
  // Frequency tracking
  frequency?: GoalFrequency
  frequency_target?: number
  period_start_day?: number
}

export interface LogGoalDto {
  goal_id: string
  value: number
  notes?: string
}

export interface WaterPlantDto {
  plant_id: string
  difficulty?: 'easy' | 'medium' | 'hard'
  notes?: string
}

// =====================================================
// Gentle Growth - New Tables
// =====================================================

// Activity logs - Unified activity tracking
export interface ActivityLog {
  id: string
  plant_id: string
  season_id: string | null
  user_id: string
  activity_type: ActivityType
  logged_at: string
  logged_date: string
  value: number | null
  notes: string | null
  difficulty: string | null
  is_first_of_day: boolean
  xp_earned: number
  morning_bonus: boolean
  streak_bonus: number
  is_personal_record: boolean
  created_at: string
}

// Rest days - Intentional rest tracking
export interface RestDay {
  id: string
  plant_id: string
  user_id: string
  rest_date: string
  reason: string | null
  created_at: string
}

// Reflections - Milestone reflections
export interface Reflection {
  id: string
  plant_id: string
  user_id: string
  milestone_type: MilestoneType
  milestone_value: number | null
  life_changes: string[] | null
  personal_note: string | null
  mood: string | null
  total_value_at_reflection: number | null
  days_active_at_reflection: number | null
  season_number_at_reflection: number | null
  created_at: string
}

// =====================================================
// Gentle Growth - DTOs
// =====================================================

export interface LogActivityDto {
  plant_id: string
  activity_type: ActivityType
  value?: number
  notes?: string
  difficulty?: 'easy' | 'normal' | 'hard'
}

export interface MarkRestDayDto {
  plant_id: string
  reason?: string
}

export interface CreateReflectionDto {
  plant_id: string
  milestone_type: MilestoneType
  milestone_value?: number
  life_changes?: string[]
  personal_note?: string
  mood?: string
}

export interface StartNewSeasonDto {
  plant_id: string
  goal_mode: GoalMode
  tracking_metric: string
  unit: string
  target_value: number
  duration_weeks: number
  season_name?: string
}

// Plant state info for UI
export interface PlantStateInfo {
  status: PlantStatus
  message: string
  emoji: string
  daysInactive: number
  canWater: boolean
  isResting: boolean
}
