'use client'

import { useState, useTransition } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { updateTimezone } from '@/lib/actions/profile'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Common timezones grouped by region
const TIMEZONES = [
  // Asia
  { value: 'Asia/Ho_Chi_Minh', label: 'Vietnam (UTC+7)', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul (UTC+9)', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)', region: 'Asia' },
  { value: 'Asia/Jakarta', label: 'Jakarta (UTC+7)', region: 'Asia' },
  { value: 'Asia/Manila', label: 'Manila (UTC+8)', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India (UTC+5:30)', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)', region: 'Asia' },
  // Americas
  { value: 'America/New_York', label: 'New York (UTC-5)', region: 'Americas' },
  { value: 'America/Chicago', label: 'Chicago (UTC-6)', region: 'Americas' },
  { value: 'America/Denver', label: 'Denver (UTC-7)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto (UTC-5)', region: 'Americas' },
  // Europe
  { value: 'Europe/London', label: 'London (UTC+0)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (UTC+3)', region: 'Europe' },
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10)', region: 'Oceania' },
  { value: 'Australia/Melbourne', label: 'Melbourne (UTC+10)', region: 'Oceania' },
  { value: 'Pacific/Auckland', label: 'Auckland (UTC+12)', region: 'Oceania' },
  // UTC
  { value: 'UTC', label: 'UTC (UTC+0)', region: 'UTC' },
]

interface TimezoneSelectorProps {
  currentTimezone: string
}

export function TimezoneSelector({ currentTimezone }: TimezoneSelectorProps) {
  const [timezone, setTimezone] = useState(currentTimezone)
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    setTimezone(value)
    startTransition(async () => {
      const result = await updateTimezone(value)
      if (result.success) {
        toast.success('Timezone updated')
      } else {
        toast.error(result.error || 'Failed to update timezone')
        setTimezone(currentTimezone) // Revert on error
      }
    })
  }

  const currentTz = TIMEZONES.find(tz => tz.value === timezone)

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/30">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold">Timezone</h2>
          <p className="text-[10px] sm:text-xs text-slate-500">Your local time for plant care</p>
        </div>
      </div>

      <Select value={timezone} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-full bg-white/50 dark:bg-slate-800/50">
          <SelectValue placeholder="Select timezone">
            {currentTz?.label || timezone}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {['Asia', 'Americas', 'Europe', 'Oceania', 'UTC'].map(region => (
            <div key={region}>
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800">
                {region}
              </div>
              {TIMEZONES.filter(tz => tz.region === region).map(tz => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex items-center gap-2">
                    {tz.value === timezone && <Check className="w-4 h-4 text-green-500" />}
                    <span>{tz.label}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      <p className="text-[10px] sm:text-xs text-slate-400 mt-2">
        Plants are evaluated at midnight in your timezone. Water before midnight to keep your streak!
      </p>
    </div>
  )
}
