'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInventory } from '@/lib/context/inventory-context'
import { ShoppingBag, Coins, Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DecorationType } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'

interface ShopSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopItems: DecorationType[]
}

export function ShopSheet({ open, onOpenChange, shopItems }: ShopSheetProps) {
  const inventory = useInventory()
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; name?: string; error?: string } | null>(null)

  const handlePurchase = async (item: DecorationType) => {
    if (!item.coin_price) return
    setPurchasingId(item.id)
    setPurchaseResult(null)

    const result = await inventory.purchaseDecoration(item.id)
    setPurchasingId(null)

    if (result.success) {
      setPurchaseResult({ success: true, name: item.name })
    } else {
      setPurchaseResult({ success: false, error: result.error })
    }
    setTimeout(() => setPurchaseResult(null), 3000)
  }

  const purchasableItems = shopItems.filter(item => item.coin_price != null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shop
          </SheetTitle>
        </SheetHeader>

        {/* Coin balance */}
        <div className="flex items-center justify-center gap-2 my-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <Coins className="h-5 w-5 text-amber-500" />
          <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
            {inventory.coins}
          </span>
          <span className="text-sm text-amber-600 dark:text-amber-500">coins</span>
        </div>

        {/* Result toast */}
        <AnimatePresence>
          {purchaseResult && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'mx-4 mb-2 p-3 rounded-lg flex items-center gap-2 text-sm',
                purchaseResult.success
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {purchaseResult.success ? (
                <><Check className="h-4 w-4" />Purchased {purchaseResult.name}!</>
              ) : (
                <><X className="h-4 w-4" />{purchaseResult.error}</>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3 p-1">
            {purchasableItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items available in the shop yet.
              </div>
            ) : (
              purchasableItems.map((item) => {
                const canBuy = inventory.canAfford(item.coin_price!)
                return (
                  <div key={item.id} className={cn(
                    'p-4 rounded-lg border transition-colors',
                    canBuy ? 'bg-card border-border' : 'bg-muted/30 border-border/50'
                  )}>
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <Badge variant="outline" className="text-[10px]">
                            {item.grid_size === 2 ? '2×2' : '1×1'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(item)}
                      disabled={!canBuy || purchasingId === item.id}
                      className="w-full mt-3 gap-1"
                    >
                      {purchasingId === item.id ? (
                        <><Loader2 className="h-3 w-3 animate-spin" />Purchasing...</>
                      ) : (
                        <><Coins className="h-3 w-3" />{item.coin_price} coins</>
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
