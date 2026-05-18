'use client'

import { Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInventoryOptional } from '@/lib/context/inventory-context'

interface CoinDisplayProps {
  className?: string
}

export function CoinDisplay({ className }: CoinDisplayProps) {
  const inventory = useInventoryOptional()
  if (!inventory) return null

  return (
    <div className={cn(
      'garden-chrome flex items-center gap-1.5 px-2.5 py-1 rounded-full',
      className
    )}>
      <Coins className="h-3.5 w-3.5 text-honey" />
      <span className="text-sm font-semibold text-canopy">
        {inventory.coins}
      </span>
    </div>
  )
}
