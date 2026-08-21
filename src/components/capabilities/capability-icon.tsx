import { BookOpen } from 'lucide-react'
import type { CapabilityIconKey } from '@/capabilities/core/types'
import { cn } from '@/lib/utils'

interface CapabilityIconProps {
  icon: CapabilityIconKey
  className?: string
}

export function CapabilityIcon({ icon, className }: CapabilityIconProps) {
  if (icon === 'book-open') {
    return <BookOpen className={cn('h-5 w-5', className)} aria-hidden="true" />
  }

  return null
}
