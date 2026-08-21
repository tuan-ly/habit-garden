import type { ReactNode } from 'react'
import { JourneyShell } from '@/components/capabilities/journey-shell'

interface ReadingShellProps {
  eyebrow: string
  title: string
  description?: string
  backHref?: string
  children: ReactNode
}

export function ReadingShell(props: ReadingShellProps) {
  return (
    <JourneyShell
      {...props}
      journeyLabel="Đọc"
      journeyIcon="book-open"
    />
  )
}
