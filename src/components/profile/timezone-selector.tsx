'use client'

import { useState, useTransition } from 'react'
import { Globe, Check } from 'lucide-react'
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
        toast.success('Đã cập nhật múi giờ')
      } else {
        toast.error(result.error || 'Chưa thể cập nhật múi giờ')
        setTimezone(currentTimezone) // Revert on error
      }
    })
  }

  const currentTz = TIMEZONES.find(tz => tz.value === timezone)

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dfe9d3] text-[#5f854f]">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-[#40583a]">Múi giờ</h3>
          <p className="text-xs text-[#7a8675]">Để khu vườn theo đúng nhịp ngày của bạn</p>
        </div>
      </div>

      <Select value={timezone} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="min-h-12 w-full rounded-2xl border-[#d7dfd0] bg-white/70">
          <SelectValue placeholder="Chọn múi giờ">
            {currentTz?.label || timezone}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {['Asia', 'Americas', 'Europe', 'Oceania', 'UTC'].map(region => (
            <div key={region}>
              <div className="bg-[#edf1e7] px-2 py-1.5 text-xs font-semibold text-[#6c7967]">
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

      <p className="mt-3 text-xs leading-5 text-[#7b8676]">
        Một ngày trong vườn khép lại lúc nửa đêm theo múi giờ này. Nếu lỡ hôm nay, cây chỉ nghỉ và chờ bạn trở lại.
      </p>
    </div>
  )
}
