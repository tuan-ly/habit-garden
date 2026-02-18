import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cached today date string to avoid creating Date objects on every render.
// Refreshes every 60 seconds which is sufficient for day boundary detection.
let _cachedTodayStr = ''
let _cachedTodayTs = 0

export function getTodayDateString(): string {
  const now = Date.now()
  if (now - _cachedTodayTs > 60_000) {
    _cachedTodayStr = new Date(now).toDateString()
    _cachedTodayTs = now
  }
  return _cachedTodayStr
}

/** Check if a date string (ISO or similar) is from today */
export function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr).toDateString() === getTodayDateString()
}
