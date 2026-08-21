import type { HabitUnit } from '@/types/habits'

export type CapabilityKey = string

export type CapabilityIconKey = 'book-open'

export type CapabilityTone = 'canopy' | 'sunlit' | 'earth'

export type CapabilityHighlightIconKey = 'gentle-growth' | 'session'

export type HabitIntentDomain =
  | 'reading'
  | 'movement'
  | 'focus'
  | 'reflection'
  | 'other'

export type CapabilityEligibility =
  | { mode: 'any' }
  | {
      mode: 'explicit_match'
      domain: HabitIntentDomain
      confirmationTitle: string
      confirmationDescription: string
    }

export interface CapabilityInstanceDefaults<TConfig extends Record<string, unknown>> {
  name: string
  description: string
  unit: HabitUnit
  customUnit: string | null
  sessionDurationMinutes: number
  config: TConfig
}

export interface CapabilityManifest<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  key: CapabilityKey
  version: number
  label: string
  shortLabel: string
  description: string
  outcome: string
  icon: CapabilityIconKey
  tone: CapabilityTone
  eligibility: CapabilityEligibility
  sessionModel: 'guided' | 'instant' | 'none'
  highlights: Array<{
    icon: CapabilityHighlightIconKey
    title: string
    description: string
  }>
  defaults: CapabilityInstanceDefaults<TConfig>
}
