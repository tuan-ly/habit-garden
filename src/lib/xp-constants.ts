export const WELCOME_BACK_BONUS = 25

// Easy Mode (2-Minute Rule) bonus
export const EASY_MODE_BONUS_PERCENT = 0.20  // 20% bonus
export const EASY_MODE_BONUS_DAYS = 30       // For first 30 days

export const XP_VALUES = {
  // Constants
  MORNING_START_HOUR: 5,
  MORNING_END_HOUR: 9,

  // Goals & Progress (I did it)
  PROGRESS_LOG_BASE: 0,
  FIRST_LOG_BONUS: 0, // Total 20 for first log
  PERSONAL_RECORD_BONUS: 25,
  
  // Watering (Just checking in)
  WATERING_BASE: 10,
  
  // Shared Bonuses
  MORNING_BONUS: 3,      // 5am - 9am
  
  // Note Bonuses
  NOTE_ANY: 3,
  NOTE_LONG: 2,        // > 50 chars
  NOTE_VERY_LONG: 2,   // > 100 chars
} as const

// Helper to check if it's morning
export const isMorningTime = (date: Date = new Date()) => {
  const hour = date.getHours()
  return hour >= XP_VALUES.MORNING_START_HOUR && hour < XP_VALUES.MORNING_END_HOUR
}
