'use client'

import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface HarvestDialogProps {
  open: boolean
  onClose: () => void
  plantName: string
  material: { name: string; icon: string } | null
}

export function HarvestDialog({
  open,
  onClose,
  plantName,
  material,
}: HarvestDialogProps) {
  if (!material) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-background rounded-2xl p-6 shadow-2xl border max-w-sm mx-4 text-center"
          >
            {/* Celebration */}
            <div className="text-4xl mb-2">🎉</div>

            <h3 className="text-lg font-bold mb-1">Harvest!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your <strong>{plantName}</strong> has matured and produced:
            </p>

            {/* Material reward */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
              className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 mb-4"
            >
              <span className="text-4xl">{material.icon}</span>
              <div className="text-left">
                <div className="font-semibold">{material.name}</div>
              </div>
              <span className="text-lg font-bold text-amber-600">×1</span>
            </motion.div>

            <p className="text-xs text-muted-foreground mb-4">
              Use materials in the Workshop to craft decorations!
            </p>

            <Button onClick={onClose} className="w-full">
              Collect
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
