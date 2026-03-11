'use client'

import { Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInventoryOptional } from '@/lib/context'

interface CoinDisplayProps {
  className?: string
}

export function CoinDisplay({ className }: CoinDisplayProps) {
  const inventory = useInventoryOptional()
  if (!inventory) return null

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700',
      className
    )}>
      <Coins className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
        {inventory.coins}
      </span>
    </div>
  )
}
