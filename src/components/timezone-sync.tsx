'use client'

import { useEffect, useRef } from 'react'
import { updateTimezone } from '@/lib/actions/profile'

interface TimezoneSyncProps {
  currentTimezone: string | null
}

/**
 * Auto-detect and sync user's timezone from browser
 * Only syncs if the detected timezone differs from the stored one
 */
export function TimezoneSync({ currentTimezone }: TimezoneSyncProps) {
  const hasSynced = useRef(false)

  useEffect(() => {
    // Only run once per session
    if (hasSynced.current) return
    hasSynced.current = true

    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Only sync if different from current (or no current set)
    if (detectedTimezone && detectedTimezone !== currentTimezone) {
      updateTimezone(detectedTimezone).then((result) => {
        if (result.success) {
          console.log(`Timezone synced: ${currentTimezone} -> ${detectedTimezone}`)
        }
      })
    }
  }, [currentTimezone])

  // This component renders nothing
  return null
}
