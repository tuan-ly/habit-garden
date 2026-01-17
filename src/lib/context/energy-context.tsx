'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { EnergyLevel } from '@/lib/energy-system'
import {
  DEFAULT_ENERGY,
  getEnergyConfig,
  getAdjustedTarget,
  isRestDay,
  getTargetAdjustmentText,
} from '@/lib/energy-system'
import { getTodayEnergy, setTodayEnergy as setEnergyAction } from '@/lib/actions/energy'
import { toast } from 'sonner'

interface EnergyContextValue {
  energy: EnergyLevel
  isLoading: boolean
  setEnergy: (level: EnergyLevel, note?: string) => Promise<void>
  // Derived values
  targetMultiplier: number
  isRestDay: boolean
  adjustmentText: string
  // Helper functions
  getAdjustedTargetValue: (originalTarget: number) => number
}

const EnergyContext = createContext<EnergyContextValue | null>(null)

export function EnergyProvider({
  children,
  initialEnergy,
}: {
  children: ReactNode
  initialEnergy?: EnergyLevel
}) {
  const [energy, setEnergyState] = useState<EnergyLevel>(initialEnergy || DEFAULT_ENERGY)
  const [isLoading, setIsLoading] = useState(!initialEnergy)

  // Fetch initial energy on mount if not provided
  useEffect(() => {
    if (!initialEnergy) {
      getTodayEnergy().then((fetchedEnergy) => {
        setEnergyState(fetchedEnergy)
        setIsLoading(false)
      })
    }
  }, [initialEnergy])

  // Set energy handler
  const setEnergy = useCallback(
    async (newEnergy: EnergyLevel, note?: string) => {
      const previousEnergy = energy

      // Optimistic update
      setEnergyState(newEnergy)

      const result = await setEnergyAction(newEnergy, note)

      if (result.success) {
        const config = getEnergyConfig(newEnergy)

        if (newEnergy === 1) {
          toast.success(`${config.icon} Rest Day`, {
            description: 'Take it easy - just check in today',
          })
        } else {
          const targetPercent = Math.round(config.targetMultiplier * 100)
          toast.success(`Energy set to ${config.labelVi}`, {
            description: `Goals adjusted to ${targetPercent}% today`,
          })
        }
      } else {
        // Revert on error
        setEnergyState(previousEnergy)
        toast.error('Failed to set energy', {
          description: result.error,
        })
      }
    },
    [energy]
  )

  // Derived values
  const config = getEnergyConfig(energy)
  const targetMultiplier = config.targetMultiplier
  const restDay = isRestDay(energy)
  const adjustmentText = getTargetAdjustmentText(energy)

  // Helper to calculate adjusted target
  const getAdjustedTargetValue = useCallback(
    (originalTarget: number) => {
      return getAdjustedTarget(originalTarget, energy)
    },
    [energy]
  )

  return (
    <EnergyContext.Provider
      value={{
        energy,
        isLoading,
        setEnergy,
        targetMultiplier,
        isRestDay: restDay,
        adjustmentText,
        getAdjustedTargetValue,
      }}
    >
      {children}
    </EnergyContext.Provider>
  )
}

export function useEnergy() {
  const context = useContext(EnergyContext)
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider')
  }
  return context
}

// Optional hook that returns null if not in provider (for conditional usage)
export function useEnergyOptional() {
  return useContext(EnergyContext)
}
