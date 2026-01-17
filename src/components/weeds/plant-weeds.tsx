'use client'

import { useState, useCallback } from 'react'
import { WeedItem, WeedClearEffect } from './weed-item'
import { usePlantWeeds } from '@/lib/context/weeds-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Weed positions around the plant
const WEED_POSITIONS = [
  { x: -35, y: 25, rotate: -15 },   // bottom-left
  { x: 35, y: 25, rotate: 15 },     // bottom-right
  { x: -40, y: 5, rotate: -10 },    // mid-left
  { x: 40, y: 5, rotate: 10 },      // mid-right
  { x: -30, y: -15, rotate: -5 },   // top-left
  { x: 30, y: -15, rotate: 5 },     // top-right
  { x: 0, y: 30, rotate: 0 },       // base center
]

interface PlantWeedsProps {
  plantId: string
  weedCount?: number // Can be passed directly or fetched from context
  className?: string
  showClearAllButton?: boolean
}

export function PlantWeeds({
  plantId,
  weedCount: propWeedCount,
  className,
  showClearAllButton = true,
}: PlantWeedsProps) {
  const { weedCount: contextWeedCount, clearWeed, clearAllWeeds } = usePlantWeeds(plantId)
  const [showXpEffect, setShowXpEffect] = useState<number | null>(null)
  const [isClearingAll, setIsClearingAll] = useState(false)

  const weedCount = propWeedCount ?? contextWeedCount

  const handleClearWeed = useCallback(async () => {
    const result = await clearWeed()
    if (result.success && result.xpEarned) {
      setShowXpEffect(result.xpEarned)
      setTimeout(() => setShowXpEffect(null), 800)
    }
  }, [clearWeed])

  const handleClearAll = useCallback(async () => {
    setIsClearingAll(true)
    await clearAllWeeds()
    setIsClearingAll(false)
  }, [clearAllWeeds])

  if (weedCount <= 0) return null

  // Get positions for current weed count
  const activePositions = WEED_POSITIONS.slice(0, weedCount)

  return (
    <div className={cn('relative', className)}>
      {/* Weeds */}
      {activePositions.map((position, index) => (
        <WeedItem
          key={`weed-${index}`}
          position={position}
          index={index}
          onClear={handleClearWeed}
          disabled={isClearingAll}
        />
      ))}

      {/* XP Effect */}
      <AnimatePresence>
        {showXpEffect !== null && <WeedClearEffect xp={showXpEffect} />}
      </AnimatePresence>

      {/* Weed count indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-medium shadow-sm">
          <span>🌿</span>
          <span>{weedCount}</span>
        </div>
      </motion.div>

      {/* Clear all button */}
      {showClearAllButton && weedCount >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            disabled={isClearingAll}
            className="h-6 px-2 text-[10px] gap-1 bg-background/80 backdrop-blur-sm"
          >
            <Sparkles className="h-3 w-3" />
            {isClearingAll ? 'Clearing...' : `Clear all (+${weedCount * 5} XP)`}
          </Button>
        </motion.div>
      )}
    </div>
  )
}

// Compact weed indicator for garden view
export function WeedIndicator({
  weedCount,
  onClick,
  className,
}: {
  weedCount: number
  onClick?: () => void
  className?: string
}) {
  if (weedCount <= 0) return null

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full',
        'bg-amber-100 dark:bg-amber-950/50',
        'text-amber-700 dark:text-amber-400',
        'text-[10px] font-medium shadow-sm',
        'cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors',
        className
      )}
    >
      <span>🌿</span>
      <span>{weedCount}</span>
    </motion.button>
  )
}
