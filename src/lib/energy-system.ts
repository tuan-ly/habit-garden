// Energy System for Habit Garden
// User tracks daily energy/capacity which affects goal targets
// No XP bonuses - just realistic target adjustments

export type EnergyLevel = 1 | 2 | 3 | 4

export interface EnergyConfig {
  level: EnergyLevel
  label: string
  labelVi: string
  description: string
  descriptionVi: string
  icon: string
  bars: number // Visual representation (1-4 bars)
  targetMultiplier: number // How much of the original target is expected
  color: string
  bgClass: string
}

export const ENERGY_CONFIG: Record<EnergyLevel, EnergyConfig> = {
  4: {
    level: 4,
    label: 'Full Energy',
    labelVi: 'Tran day',
    description: 'Ready to crush it!',
    descriptionVi: 'San sang chien!',
    icon: '⚡',
    bars: 4,
    targetMultiplier: 1.0, // 100% target
    color: 'text-green-500',
    bgClass: 'bg-green-500',
  },
  3: {
    level: 3,
    label: 'Good Energy',
    labelVi: 'Kha tot',
    description: 'Feeling capable',
    descriptionVi: 'Cam thay on',
    icon: '⚡',
    bars: 3,
    targetMultiplier: 0.85, // 85% target
    color: 'text-emerald-500',
    bgClass: 'bg-emerald-500',
  },
  2: {
    level: 2,
    label: 'Low Energy',
    labelVi: 'Hoi met',
    description: 'Taking it easy today',
    descriptionVi: 'Nhe nhang thoi',
    icon: '⚡',
    bars: 2,
    targetMultiplier: 0.6, // 60% target
    color: 'text-amber-500',
    bgClass: 'bg-amber-500',
  },
  1: {
    level: 1,
    label: 'Rest Day',
    labelVi: 'Nghi ngoi',
    description: 'Just check in, no pressure',
    descriptionVi: 'Chi can check-in thoi',
    icon: '🔋',
    bars: 1,
    targetMultiplier: 0.0, // Any check-in counts
    color: 'text-slate-400',
    bgClass: 'bg-slate-400',
  },
}

// Get energy configuration
export function getEnergyConfig(level: EnergyLevel): EnergyConfig {
  return ENERGY_CONFIG[level]
}

// Get adjusted target based on energy
export function getAdjustedTarget(target: number, energyLevel: EnergyLevel): number {
  const config = getEnergyConfig(energyLevel)
  // Rest day: any effort counts, minimum 1
  if (energyLevel === 1) {
    return 1
  }
  return Math.round(target * config.targetMultiplier)
}

// Check if target is hit based on energy-adjusted threshold
export function isTargetHitWithEnergy(
  actual: number,
  originalTarget: number,
  energyLevel: EnergyLevel
): boolean {
  // Rest day: any positive effort counts
  if (energyLevel === 1) {
    return actual > 0
  }
  const adjustedTarget = getAdjustedTarget(originalTarget, energyLevel)
  return actual >= adjustedTarget
}

// Get all energy levels for selection (highest first)
export function getAllEnergyLevels(): EnergyConfig[] {
  return [ENERGY_CONFIG[4], ENERGY_CONFIG[3], ENERGY_CONFIG[2], ENERGY_CONFIG[1]]
}

// Default energy for new day
export const DEFAULT_ENERGY: EnergyLevel = 3

// Format energy for display
export function formatEnergyDisplay(level: EnergyLevel): string {
  const config = getEnergyConfig(level)
  const bars = '⚡'.repeat(config.bars) + '○'.repeat(4 - config.bars)
  return `${bars} ${config.label}`
}

// Format energy with percentage
export function formatEnergyWithTarget(level: EnergyLevel): string {
  const config = getEnergyConfig(level)
  if (level === 1) {
    return `${config.icon} ${config.labelVi} (chi can check-in)`
  }
  const percent = Math.round(config.targetMultiplier * 100)
  return `${config.icon.repeat(config.bars)} ${config.labelVi} (${percent}% target)`
}

// Get energy bar visual
export function getEnergyBars(level: EnergyLevel): { filled: number; empty: number } {
  const config = getEnergyConfig(level)
  return {
    filled: config.bars,
    empty: 4 - config.bars,
  }
}

// Check if it's a rest day
export function isRestDay(level: EnergyLevel): boolean {
  return level === 1
}

// Get target adjustment text
export function getTargetAdjustmentText(level: EnergyLevel): string {
  const config = getEnergyConfig(level)
  if (level === 4) return 'Full target'
  if (level === 1) return 'Rest day - just check in'
  const percent = Math.round(config.targetMultiplier * 100)
  return `${percent}% of target`
}

// Get achievement status based on energy-adjusted target
export function getGoalAchievementStatus(
  actual: number,
  originalTarget: number,
  energyLevel: EnergyLevel
): {
  isAchieved: boolean
  adjustedTarget: number
  percentOfAdjusted: number
  percentOfOriginal: number
  message: string
} {
  const adjustedTarget = getAdjustedTarget(originalTarget, energyLevel)
  const isAchieved = isTargetHitWithEnergy(actual, originalTarget, energyLevel)
  const percentOfAdjusted = adjustedTarget > 0 ? Math.round((actual / adjustedTarget) * 100) : 0
  const percentOfOriginal = originalTarget > 0 ? Math.round((actual / originalTarget) * 100) : 0

  let message = ''
  if (energyLevel === 1) {
    message = actual > 0 ? 'Rest day check-in complete!' : 'Just check in to complete'
  } else if (isAchieved) {
    message = percentOfOriginal >= 100
      ? 'Target achieved!'
      : `Energy-adjusted target hit (${percentOfAdjusted}%)`
  } else {
    const remaining = adjustedTarget - actual
    message = `${remaining} more to hit adjusted target`
  }

  return {
    isAchieved,
    adjustedTarget,
    percentOfAdjusted,
    percentOfOriginal,
    message,
  }
}
