'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Play } from 'lucide-react'
import { getCapabilityManifest } from '@/capabilities/core/catalog'
import { getCapabilitySessionHref } from '@/capabilities/core/routes'
import { CapabilityIcon } from '@/components/capabilities/capability-icon'
import { Button } from '@/components/ui/button'
import { getActiveCapabilitySession } from '@/lib/actions/capabilities'
import { usePathname, useRouter } from 'next/navigation'
import type { ActiveCapabilitySession } from '@/types/habits'

interface ActiveSessionBannerProps {
  activeSession: ActiveCapabilitySession | null
}

function getInitialElapsed(activeSession: ActiveCapabilitySession | null): number {
  if (!activeSession) return 0
  return activeSession.accumulated_seconds
}

export function ActiveSessionBanner({ activeSession }: ActiveSessionBannerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const previousPathname = useRef(pathname)
  const [currentSession, setCurrentSession] = useState(activeSession)
  const [elapsed, setElapsed] = useState(() => getInitialElapsed(currentSession))
  const manifest = currentSession
    ? getCapabilityManifest(currentSession.capability_type)
    : null

  useEffect(() => {
    setCurrentSession(activeSession)
  }, [activeSession])

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    let cancelled = false

    void getActiveCapabilitySession().then(result => {
      if (!cancelled && result.success) {
        setCurrentSession(result.data)
      }
    })

    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => {
    setElapsed(getInitialElapsed(currentSession))
  }, [currentSession])

  useEffect(() => {
    if (!currentSession || currentSession.status !== 'running') return

    const calculateElapsed = () => {
      if (!currentSession.last_resumed_at) return currentSession.accumulated_seconds
      const now = Date.now()
      const lastResumed = new Date(currentSession.last_resumed_at).getTime()
      const sessionElapsed = Math.max(0, Math.floor((now - lastResumed) / 1000))
      return Math.min(
        currentSession.duration_seconds,
        currentSession.accumulated_seconds + sessionElapsed
      )
    }

    const interval = window.setInterval(() => {
      setElapsed(calculateElapsed())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [currentSession])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {currentSession && manifest && currentSession.status === 'running' && (
        <motion.div
          initial={reduceMotion ? false : { y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: -100, opacity: 0 }}
          transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-1/2 top-16 z-50 w-[min(92vw,26rem)] -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/65 bg-[#31523b]/96 px-3 py-2.5 text-[#fff9e8] shadow-[0_16px_38px_rgba(24,54,34,0.3)] backdrop-blur-xl">
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
              transition={reduceMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff9e8]/12"
              aria-hidden="true"
            >
              <CapabilityIcon icon={manifest.icon} className="h-5 w-5" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#cbdac3]">
                Hành trình đang mở
              </p>
              <p className="mt-0.5 truncate text-sm font-bold">
                {manifest.shortLabel} · {formatTime(elapsed)}
              </p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push(getCapabilitySessionHref(currentSession.plant_id, currentSession.id))}
              className="h-10 shrink-0 rounded-full bg-[#fff9e8] px-3 text-xs font-bold text-[#31523b] hover:bg-white"
              aria-label={`Tiếp tục hành trình ${manifest.shortLabel}`}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Tiếp tục
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
