'use client'

import { DecorationImage } from '@/components/garden/decoration-image'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { InventoryItemWithDetails } from '@/types/database'

interface InventoryItemCardProps {
  item: InventoryItemWithDetails
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

export function InventoryItemCard({
  item,
  isSelected = false,
  onClick,
  className,
}: InventoryItemCardProps) {
  const isMaterial = item.item_type === 'material'
  const name = isMaterial ? item.material?.name : item.decoration_type?.name
  const icon = isMaterial ? item.material?.icon : item.decoration_type?.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all min-w-[64px]',
        isSelected
          ? 'border-primary bg-primary/10 shadow-md'
          : 'border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20',
        className
      )}
    >
      {/* Item image/icon */}
      <div className="w-10 h-10 flex items-center justify-center">
        {item.decoration_type ? (
          <DecorationImage decorationType={item.decoration_type} size="sm" />
        ) : (
          <span className="text-2xl">{icon}</span>
        )}
      </div>

      {/* Item name */}
      <span className="text-[10px] text-muted-foreground text-center leading-tight truncate max-w-[56px]">
        {name}
      </span>

      {/* Quantity badge */}
      {item.quantity > 1 && (
        <Badge
          variant="secondary"
          className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-bold"
        >
          {item.quantity}
        </Badge>
      )}
    </button>
  )
}
