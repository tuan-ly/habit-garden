// Database types for Habit Garden

import type { HabitCapabilitySummary } from './habits'

// Gentle Growth: New plant statuses
// Note: 'dead' and 'dormant' kept for backward compatibility but deprecated
// UI should treat 'dead' as 'sleeping' and 'dormant' as 'resting'
export type PlantStatus = 'thriving' | 'growing' | 'resting' | 'waiting' | 'sleeping' | 'mature' | 'dead' | 'dormant'

// New statuses for Gentle Growth (use these in new code)
export type GentlePlantStatus = 'thriving' | 'growing' | 'resting' | 'waiting' | 'sleeping' | 'mature'

// Visual stages for plant display
export type VisualStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'established' | 'ancient' | 'legendary'

// Activity types for unified logging
// - 'watering' = Just checking in / "Not today" (water only, with or without habit completion)
// - 'completed' = I did it! (plants without goals)
// - 'progress' = I did it! with value (plants with goals)
// - 'reflection' = Milestone reflection
export type ActivityType = 'watering' | 'completed' | 'progress' | 'reflection'

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

// User phase for progressive disclosure
export type UserPhase = 'seedling' | 'gardener' | 'sage'

// Subscription types
export type SubscriptionTier = 'free' | 'pro' | 'premium'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired'

// Profile table
export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  water_reserves: number
  coins: number
  timezone: string
  // Journal tracking
  journal_streak: number
  longest_journal_streak: number
  last_journal_date: string | null
  total_journal_entries: number
  // Progressive disclosure (Habien 2.0)
  max_plants: number
  unlocked_tiers: number[]
  phase: UserPhase
  longest_streak: number
  total_mature_plants: number
  // Subscription (Habien 2.0 Phase 3)
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  // Preferences
  theme: 'light' | 'dark' | 'system' | null
  daily_reminder_enabled: boolean
  achievement_notifications: boolean
  created_at: string
  updated_at: string
}

// Plant tier (1-5 for progressive disclosure)
export type PlantTier = 1 | 2 | 3 | 4 | 5

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
  // Progressive disclosure (Habien 2.0)
  tier: PlantTier
  tier_unlock_level: number
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
  grace_period_days: number // Days before sleeping
  days_this_week: number // Rhythm tracking
  days_this_month: number
  consistency_percentage: number
  // Easy Mode (2-Minute Rule)
  easy_mode?: boolean          // Whether 2-minute rule is enabled
  tiny_seed?: string | null    // The tiny habit description (e.g., "Read 1 page")
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
  frequency: GoalFrequency
  period_progress: number
  current_period_target: number
  period_number: number
  period_label: string
  period_date_range: string
  period_end: string
}

// Plant with type info (joined)
export interface PlantWithType extends Plant {
  plant_type: PlantType
  // Optional guided behavior attached to this persisted garden plant.
  guided_habit?: HabitCapabilitySummary | null
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
  /** Easy Mode (2-Minute Rule) */
  easy_mode?: boolean
  tiny_seed?: string | null
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

// =====================================================
// Subscription System (Habien 2.0 Phase 3)
// =====================================================

// Subscription tier definition from DB
export interface SubscriptionTierDef {
  id: SubscriptionTier
  name: string
  description: string | null
  tagline: string | null
  price_monthly_usd: number
  price_yearly_usd: number
  price_monthly_vnd: number | null
  price_yearly_vnd: number | null
  features: Record<string, unknown>
  is_active: boolean
  sort_order: number
  created_at: string
}

// User subscription record
export interface Subscription {
  id: string
  user_id: string
  tier_id: SubscriptionTier
  status: SubscriptionStatus
  payment_provider: 'polar' | 'stripe' | 'sepay' | 'paddle' | null
  provider_subscription_id: string | null
  provider_customer_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  trial_start: string | null
  trial_end: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Subscription event for analytics
export interface SubscriptionEvent {
  id: string
  subscription_id: string
  user_id: string
  event_type: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'renewed' | 'trial_started' | 'trial_ended' | 'payment_failed'
  from_tier: SubscriptionTier | null
  to_tier: SubscriptionTier | null
  metadata: Record<string, unknown>
  created_at: string
}

// Upgrade prompt tracking
export interface UpgradePrompt {
  id: string
  user_id: string
  prompt_type: 'level_6_goals' | 'level_13_identity' | 'plant_limit' | 'tier_limit' | 'feature_gate'
  feature_context: string | null
  shown_at: string
  action: 'dismissed' | 'clicked_upgrade' | 'started_trial' | 'converted' | null
  converted: boolean
  converted_at: string | null
}

// =====================================================
// Subscription DTOs
// =====================================================

export interface CreateSubscriptionDto {
  tier_id: SubscriptionTier
  payment_provider: 'polar' | 'stripe' | 'sepay'
  provider_subscription_id?: string
  provider_customer_id?: string
  trial_days?: number
}

export interface TrackUpgradePromptDto {
  prompt_type: UpgradePrompt['prompt_type']
  feature_context?: string
  action: UpgradePrompt['action']
}

// =====================================================
// Identity System (Habien 2.0 Phase 6) - PREMIUM
// =====================================================

// Identity status
export type IdentityStatus = 'active' | 'achieved' | 'paused'

// Identity color options
export type IdentityColor = 'purple' | 'blue' | 'green' | 'amber' | 'rose' | 'cyan' | 'pink' | 'orange'

// Identity table
export interface Identity {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: IdentityColor
  status: IdentityStatus
  progress_percentage: number
  goals_count: number
  created_at: string
  updated_at: string
}

// Identity with linked goals
export interface IdentityWithGoals extends Identity {
  goals: Goal[]
}

// Identity preset suggestions (for UI)
export interface IdentityPreset {
  name: string
  icon: string
  color: IdentityColor
  description: string
}

// Identity DTOs
export interface CreateIdentityDto {
  name: string
  description?: string
  icon?: string
  color?: IdentityColor
}

export interface UpdateIdentityDto {
  name?: string
  description?: string
  icon?: string
  color?: IdentityColor
  status?: IdentityStatus
}

export interface LinkGoalToIdentityDto {
  goal_id: string
  identity_id: string
}

// =====================================================
// Decoration & Crafting System Types
// =====================================================

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type DecorationCategory = 'furniture' | 'nature' | 'lighting' | 'path' | 'water' | 'seasonal' | 'special'
export type InventoryItemType = 'material' | 'decoration'
export type AcquisitionMethod = 'harvest' | 'craft' | 'purchase' | 'reward' | 'gift' | 'pickup'
export type DecorationRotation = 0 | 90 | 180 | 270

// Material definition (produced by mature plants)
export interface Material {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string
  image_url: string | null
  rarity: ItemRarity
  plant_type_id: string | null
  created_at: string
}

// Decoration type definition
export interface DecorationType {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string
  image_url: string | null
  /** Square tile footprint. Decorations follow the same 1x1, 2x2, 3x3… model as plants. */
  grid_size: number
  category: DecorationCategory
  rarity: ItemRarity
  unlock_level: number
  coin_price: number | null
  subscription_tier: SubscriptionTier
  is_craftable: boolean
  created_at: string
}

// Recipe definition
export interface Recipe {
  id: string
  decoration_type_id: string
  name: string
  unlock_level: number
  craft_time_minutes: number
  is_active: boolean
  created_at: string
}

// Recipe ingredient
export interface RecipeIngredient {
  id: string
  recipe_id: string
  material_id: string
  quantity: number
}

// Full recipe with relations (for UI display)
export interface RecipeWithDetails extends Recipe {
  decoration_type: DecorationType
  ingredients: (RecipeIngredient & { material: Material })[]
}

// Inventory item (stored materials + decorations)
export interface InventoryItem {
  id: string
  user_id: string
  item_type: InventoryItemType
  material_id: string | null
  decoration_type_id: string | null
  quantity: number
  acquired_via: AcquisitionMethod
  created_at: string
  updated_at: string
}

// Inventory item with joined data (for UI)
export interface InventoryItemWithDetails extends InventoryItem {
  material?: Material
  decoration_type?: DecorationType
}

// Placed decoration (on the garden grid)
export interface PlacedDecoration {
  id: string
  user_id: string
  decoration_type_id: string
  grid_row: number
  grid_col: number
  grid_size: number
  rotation: DecorationRotation
  placed_at: string
}

// Placed decoration with type info (for rendering)
export interface PlacedDecorationWithType extends PlacedDecoration {
  decoration_type: DecorationType
}

// Coin transaction record
export interface CoinTransaction {
  id: string
  user_id: string
  amount: number
  reason: string
  reference_id: string | null
  balance_after: number
  created_at: string
}

// =====================================================
// DTOs for Decoration Actions
// =====================================================

export interface CraftDecorationDto {
  recipe_id: string
}

export interface PurchaseDecorationDto {
  decoration_type_id: string
}

export interface PlaceDecorationDto {
  inventory_item_id: string
  grid_row: number
  grid_col: number
  rotation?: DecorationRotation
}

export interface MoveDecorationDto {
  placed_decoration_id: string
  grid_row: number
  grid_col: number
}

export interface PickUpDecorationDto {
  placed_decoration_id: string
}

// =====================================================
// Dashboard performance RPC contracts
// =====================================================

export type MutationErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'ALREADY_APPLIED'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'

export interface DashboardBootstrapReadModel {
  profile: Profile | null
  mood: number | null
  plant_types: PlantType[]
}

export interface GardenSnapshotReadModel {
  plants: PlantWithType[]
  goals: Goal[]
  goal_logs: GoalLog[]
  placed_decorations: PlacedDecorationWithType[]
}
