'use client'

import { useEffect, useState } from 'react'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

/**
 * Compute current time-of-day bucket. Updates every minute.
 *
 * morning   05–11
 * afternoon 12–16
 * evening   17–20
 * night     21–04
 */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h <= 11) return 'morning'
  if (h >= 12 && h <= 16) return 'afternoon'
  if (h >= 17 && h <= 20) return 'evening'
  return 'night'
}

export function useTimeOfDay(): TimeOfDay {
  const [tod, setTod] = useState<TimeOfDay>(() => getTimeOfDay())
  useEffect(() => {
    const id = setInterval(() => setTod(getTimeOfDay()), 60_000)
    return () => clearInterval(id)
  }, [])
  return tod
}
