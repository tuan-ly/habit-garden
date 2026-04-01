'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile, PlantType } from '@/types/database'
import { getProfile } from '@/lib/actions/profile'

interface DashboardDataContextType {
  user: User
  profile: Profile
  plantTypes: PlantType[]
  refreshProfile: () => Promise<void>
}

const DashboardDataContext = createContext<DashboardDataContextType | null>(null)

interface DashboardDataProviderProps {
  children: ReactNode
  initialUser: User
  initialProfile: Profile
  initialPlantTypes: PlantType[]
}

export function DashboardDataProvider({
  children,
  initialUser,
  initialProfile,
  initialPlantTypes,
}: DashboardDataProviderProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile)

  // Refresh profile from server
  const refreshProfile = useCallback(async () => {
    try {
      const refreshedProfile = await getProfile()
      if (refreshedProfile) {
        setProfile(refreshedProfile)
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user: initialUser,
      profile,
      plantTypes: initialPlantTypes,
      refreshProfile,
    }),
    [initialUser, profile, initialPlantTypes, refreshProfile]
  )

  return (
    <DashboardDataContext.Provider value={contextValue}>
      {children}
    </DashboardDataContext.Provider>
  )
}

/**
 * Hook to use the full dashboard data context
 * Throws error if used outside provider
 */
export function useDashboardData() {
  const context = useContext(DashboardDataContext)
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider')
  }
  return context
}

/**
 * Hook to get just the user
 * Throws error if used outside provider
 */
export function useUser() {
  const { user } = useDashboardData()
  return user
}

/**
 * Hook to get just the profile with refresh capability
 * Throws error if used outside provider
 */
export function useProfile() {
  const { profile, refreshProfile } = useDashboardData()
  return { profile, refreshProfile }
}

/**
 * Hook to get just the plant types
 * Throws error if used outside provider
 */
export function usePlantTypes() {
  const { plantTypes } = useDashboardData()
  return plantTypes
}
