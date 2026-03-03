'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import {
  type SubscriptionTier,
  type Feature,
  type UpgradeTrigger,
  getTierLimits,
  hasFeature,
  canAddPlant as checkCanAddPlant,
  canAddGoal as checkCanAddGoal,
  canPlantTierLevel as checkCanPlantTierLevel,
  isWithinLevelCap as checkIsWithinLevelCap,
  getUpgradePrompt,
} from '@/lib/subscription-limits'
import { getUserTier, trackUpgradePrompt } from '@/lib/actions/subscription'
import { useDevOverride } from '@/components/dev/dev-debug-context'

interface UpgradeModalState {
  open: boolean
  trigger: UpgradeTrigger
  context?: string
}

interface SubscriptionContextType {
  // Current tier (with dev override support)
  tier: SubscriptionTier
  isLoading: boolean

  // Quick feature checks
  hasGoals: boolean
  hasIdentity: boolean
  hasMetrics: boolean
  hasWeeklyReports: boolean

  // Limit checks
  canAddPlant: (currentCount: number) => boolean
  canAddGoal: (currentCount: number) => boolean
  canUsePlantTier: (plantTier: number) => boolean
  isWithinLevelCap: (level: number) => boolean

  // Generic feature check
  checkFeature: (feature: Feature) => boolean

  // Tier limits
  limits: ReturnType<typeof getTierLimits>

  // Upgrade modal
  showUpgradeModal: (trigger: UpgradeTrigger, context?: string) => void
  hideUpgradeModal: () => void
  upgradeModal: UpgradeModalState

  // Refresh tier from server
  refreshTier: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

interface SubscriptionProviderProps {
  children: ReactNode
  initialTier?: SubscriptionTier
}

export function SubscriptionProvider({
  children,
  initialTier,
}: SubscriptionProviderProps) {
  const [serverTier, setServerTier] = useState<SubscriptionTier>(initialTier ?? 'free')
  // Skip loading state if SSR already provided a tier
  const [isLoading, setIsLoading] = useState(initialTier === undefined)

  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({
    open: false,
    trigger: 'feature_gate',
    context: undefined,
  })

  // Use dev override if available
  const devTierOverride = useDevOverride('subscriptionTier', undefined)
  const tier: SubscriptionTier = devTierOverride
    ? (devTierOverride.toLowerCase() as SubscriptionTier)
    : serverTier

  // Get tier limits (memoized to prevent recalculation)
  const limits = useMemo(() => getTierLimits(tier), [tier])

  // Load tier from server on mount only if SSR did not provide an initialTier
  useEffect(() => {
    if (initialTier !== undefined) {
      setIsLoading(false)
      return // SSR already provided the tier
    }

    let mounted = true

    async function loadTier() {
      try {
        const fetchedTier = await getUserTier()
        if (mounted) {
          setServerTier(fetchedTier)
        }
      } catch (error) {
        console.error('Failed to fetch subscription tier:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadTier()
    return () => {
      mounted = false
    }
  }, [initialTier])

  // Refresh tier from server
  const refreshTier = useCallback(async () => {
    try {
      const fetchedTier = await getUserTier()
      setServerTier(fetchedTier)
    } catch (error) {
      console.error('Failed to refresh subscription tier:', error)
    }
  }, [])

  // Feature checks
  const hasGoals = hasFeature(tier, 'goals')
  const hasIdentity = hasFeature(tier, 'identity')
  const hasMetrics = hasFeature(tier, 'metrics')
  const hasWeeklyReports = hasFeature(tier, 'weekly_reports')

  const checkFeature = useCallback(
    (feature: Feature) => hasFeature(tier, feature),
    [tier]
  )

  const canAddPlant = useCallback(
    (currentCount: number) => checkCanAddPlant(tier, currentCount),
    [tier]
  )

  const canAddGoal = useCallback(
    (currentCount: number) => checkCanAddGoal(tier, currentCount),
    [tier]
  )

  const canUsePlantTier = useCallback(
    (plantTier: number) => checkCanPlantTierLevel(tier, plantTier),
    [tier]
  )

  const isWithinLevelCap = useCallback(
    (level: number) => checkIsWithinLevelCap(tier, level),
    [tier]
  )

  // Upgrade modal controls
  const showUpgradeModal = useCallback(
    async (trigger: UpgradeTrigger, context?: string) => {
      setUpgradeModal({ open: true, trigger, context })

      // Track prompt shown (fire and forget)
      trackUpgradePrompt(trigger, context).catch(console.error)
    },
    []
  )

  const hideUpgradeModal = useCallback(() => {
    setUpgradeModal((prev) => ({ ...prev, open: false }))
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      tier,
      isLoading,
      hasGoals,
      hasIdentity,
      hasMetrics,
      hasWeeklyReports,
      canAddPlant,
      canAddGoal,
      canUsePlantTier,
      isWithinLevelCap,
      checkFeature,
      limits,
      showUpgradeModal,
      hideUpgradeModal,
      upgradeModal,
      refreshTier,
    }),
    [tier, isLoading, hasGoals, hasIdentity, hasMetrics, hasWeeklyReports, canAddPlant, canAddGoal, canUsePlantTier, isWithinLevelCap, checkFeature, limits, showUpgradeModal, hideUpgradeModal, upgradeModal, refreshTier]
  )

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

/**
 * Hook to use subscription context
 * Throws error if used outside provider
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

/**
 * Hook to use subscription context (optional)
 * Returns null if used outside provider (for components that may be rendered without auth)
 */
export function useSubscriptionOptional() {
  return useContext(SubscriptionContext)
}

/**
 * Hook to check if a feature is available and show upgrade modal if not
 *
 * @example
 * const { isAvailable, requestAccess } = useFeatureGate('goals')
 * if (!isAvailable) {
 *   return <FeatureLock onUpgrade={requestAccess} />
 * }
 */
export function useFeatureGate(feature: Feature) {
  const { checkFeature, showUpgradeModal } = useSubscription()

  const isAvailable = checkFeature(feature)

  const requestAccess = useCallback(() => {
    showUpgradeModal('feature_gate', feature)
  }, [showUpgradeModal, feature])

  return { isAvailable, requestAccess }
}
