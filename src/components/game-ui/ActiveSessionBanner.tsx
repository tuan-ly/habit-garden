'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Book, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { getReadingSessionHref } from '@/lib/reading-routes'
import type { ActiveReadingSession } from '@/types/habits'

interface ActiveSessionBannerProps {
  activeSession: ActiveReadingSession | null
}

function getInitialElapsed(activeSession: ActiveReadingSession | null): number {
  if (!activeSession) return 0
  return activeSession.accumulated_seconds
}

export function ActiveSessionBanner({ activeSession }: ActiveSessionBannerProps) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(() => getInitialElapsed(activeSession))

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'running') return

    const calculateElapsed = () => {
      if (!activeSession.last_resumed_at) return activeSession.accumulated_seconds
      const now = Date.now()
      const lastResumed = new Date(activeSession.last_resumed_at).getTime()
      const sessionElapsed = Math.max(0, Math.floor((now - lastResumed) / 1000))
      return Math.min(
        activeSession.duration_seconds,
        activeSession.accumulated_seconds + sessionElapsed
      )
    }

    const interval = window.setInterval(() => {
      setElapsed(calculateElapsed())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [activeSession])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {activeSession && activeSession.status === 'running' && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="flex items-center gap-2"
            >
              <Book className="w-4 h-4" />
              <Play className="w-3 h-3 fill-current" />
            </motion.div>

            <span className="font-medium">Reading: {formatTime(elapsed)}</span>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push(getReadingSessionHref(activeSession.plant_id))}
              className="h-7 px-3 text-xs"
            >
              Resume
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
