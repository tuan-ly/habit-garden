'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface WeedItemProps {
  position: { x: number; y: number; rotate: number }
  index: number
  onClear: () => Promise<void>
  disabled?: boolean
}

export function WeedItem({ position, index, onClear, disabled }: WeedItemProps) {
  const [isClearing, setIsClearing] = useState(false)
  const [isCleared, setIsCleared] = useState(false)

  const handleClick = async () => {
    if (disabled || isClearing || isCleared) return

    setIsClearing(true)

    // Start clear animation
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsCleared(true)

    // Actually clear the weed
    await onClear()
  }

  return (
    <AnimatePresence>
      {!isCleared && (
        <motion.button
          initial={{ opacity: 0, scale: 0, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            rotate: [position.rotate - 3, position.rotate + 3, position.rotate],
          }}
          exit={{
            opacity: 0,
            scale: 0,
            y: -30,
            transition: { duration: 0.3, ease: 'easeOut' },
          }}
          transition={{
            delay: index * 0.1,
            duration: 0.4,
            rotate: {
              repeat: Infinity,
              duration: 2 + index * 0.3,
              ease: 'easeInOut',
            },
          }}
          onClick={handleClick}
          disabled={disabled || isClearing}
          className={cn(
            'absolute cursor-pointer select-none touch-manipulation',
            'hover:scale-110 active:scale-95 transition-transform',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            isClearing && 'animate-pulse pointer-events-none'
          )}
          style={{
            left: `calc(50% + ${position.x}px)`,
            top: `calc(50% + ${position.y}px)`,
            transform: `rotate(${position.rotate}deg)`,
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-2xl drop-shadow-sm">🌿</span>

          {/* Sparkle effect on hover */}
          <motion.span
            className="absolute -top-1 -right-1 text-xs pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            whileHover={{ opacity: 1, scale: 1 }}
          >
            ✨
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// XP popup that appears when clearing a weed
export function WeedClearEffect({ xp }: { xp: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -40, scale: 1.2 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <span className="text-green-500 font-bold text-sm">+{xp} XP</span>
    </motion.div>
  )
}
