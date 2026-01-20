// Database types for Habit Garden

export type PlantStatus = 'growing' | 'mature' | 'dead' | 'dormant'
export type FrequencyType = 'daily' | 'flexible'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GoalMode = 'build_capacity' | 'total_progress'
export type AdaptiveMode = 'suggest' | 'auto' | 'off'
export type ProgressionType = 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'step' | 'custom'
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'rainbow'
export type AdjustmentType = 'increase' | 'decrease' | 'recovery_week' | 'timeline_extend'

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
  died_at: string | null
  death_reason: string | null
  goal_mode: GoalMode | null
  reminder_time: string | null
  reminder_enabled: boolean
  adaptive_mode: AdaptiveMode
  position: number
  // Grid positioning (multi-cell support)
  grid_size: number // Number of cells in one dimension (1 = 1x1, 2 = 2x2, etc.)
  grid_row: number // Top-left row position in garden grid
  grid_col: number // Top-left col position in garden grid
  // Weeds system
  weed_count: number
  last_weed_added: string | null
  weeds_cleared_total: number
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

// Goals table
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
