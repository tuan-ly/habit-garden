'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Package, Gem, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InventoryItemCard } from './inventory-item-card'
import type { InventoryItemWithDetails } from '@/types/database'

type InventoryTab = 'decorations' | 'materials'

interface InventoryPanelProps {
  materials: InventoryItemWithDetails[]
  decorations: InventoryItemWithDetails[]
  selectedItemId?: string | null
  onSelectItem: (item: InventoryItemWithDetails) => void
  className?: string
}

export function InventoryPanel({
  materials,
  decorations,
  selectedItemId,
  onSelectItem,
  className,
}: InventoryPanelProps) {
  const [activeTab, setActiveTab] = useState<InventoryTab>('decorations')
  const [isExpanded, setIsExpanded] = useState(true)

  const items = activeTab === 'decorations' ? decorations : materials

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        'absolute bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-lg',
        className
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border border-b-0 rounded-t-lg px-4 py-1"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <>
          {/* Tab buttons */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            <Button
              variant={activeTab === 'decorations' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('decorations')}
              className="h-7 text-xs gap-1"
            >
              <Package className="h-3 w-3" />
              Decorations ({decorations.length})
            </Button>
            <Button
              variant={activeTab === 'materials' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('materials')}
              className="h-7 text-xs gap-1"
            >
              <Gem className="h-3 w-3" />
              Materials ({materials.length})
            </Button>
          </div>

          {/* Items grid (horizontal scroll) */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 px-3 pb-3 pt-1">
              {items.length === 0 ? (
                <div className="flex items-center justify-center w-full py-4 text-sm text-muted-foreground">
                  {activeTab === 'decorations'
                    ? 'No decorations yet. Craft some in the Workshop!'
                    : 'No materials yet. Water your plants to harvest!'}
                </div>
              ) : (
                items.map((item) => (
                  <InventoryItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemId === item.id}
                    onClick={
                      activeTab === 'decorations' ? () => onSelectItem(item) : undefined
                    }
                  />
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}
    </motion.div>
  )
}
