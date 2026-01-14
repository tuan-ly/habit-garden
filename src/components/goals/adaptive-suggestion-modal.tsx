'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Heart,
  Moon,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import type { AdaptiveSuggestion, SuggestionOption } from '@/lib/adaptive-goals'
import { applyAdjustment, rejectAdjustment } from '@/lib/actions/adaptive'

interface AdaptiveSuggestionModalProps {
  suggestion: AdaptiveSuggestion
  adjustmentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function AdaptiveSuggestionModal({
  suggestion,
  adjustmentId,
  open,
  onOpenChange,
  onComplete,
}: AdaptiveSuggestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getIcon = () => {
    switch (suggestion.type) {
      case 'increase':
        return <Sparkles className="h-8 w-8 text-yellow-500" />
      case 'decrease':
        return <Heart className="h-8 w-8 text-pink-500" />
      case 'recovery_week':
        return <Moon className="h-8 w-8 text-purple-500" />
      default:
        return <TrendingUp className="h-8 w-8 text-blue-500" />
    }
  }

  const getHeaderColor = () => {
    switch (suggestion.type) {
      case 'increase':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50'
      case 'decrease':
        return 'bg-gradient-to-r from-pink-50 to-rose-50'
      case 'recovery_week':
        return 'bg-gradient-to-r from-purple-50 to-indigo-50'
      default:
        return 'bg-gradient-to-r from-blue-50 to-cyan-50'
    }
  }

  const handleApply = async () => {
    if (!selectedOption) return

    const option = suggestion.options.find((o) => o.id === selectedOption)
    if (!option) return

    setIsSubmitting(true)
    try {
      if (selectedOption === 'keep' || selectedOption === 'acknowledge') {
        await rejectAdjustment(adjustmentId)
      } else {
        await applyAdjustment(adjustmentId, selectedOption, option.changes)
      }
      onOpenChange(false)
      onComplete?.()
    } catch (error) {
      console.error('Error applying adjustment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = async () => {
    setIsSubmitting(true)
    try {
      await rejectAdjustment(adjustmentId)
      onOpenChange(false)
      onComplete?.()
    } catch (error) {
      console.error('Error dismissing adjustment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className={cn('rounded-t-lg -mx-6 -mt-6 px-6 py-4', getHeaderColor())}>
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <DialogTitle className="text-lg">{suggestion.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {suggestion.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Performance Summary */}
        {suggestion.performanceData && (
          <div className="flex items-center gap-4 py-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {suggestion.performanceData.trend === 'upward' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : suggestion.performanceData.trend === 'downward' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <span className="text-gray-500">-</span>
              )}
              <span className="capitalize">{suggestion.performanceData.trend}</span>
            </div>
            <div>
              <Badge variant="outline">
                Avg: {suggestion.performanceData.averageScore}%
              </Badge>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {suggestion.options.map((option) => (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                selectedOption === option.id && 'border-primary ring-1 ring-primary'
              )}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
                      selectedOption === option.id
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted-foreground'
                    )}
                  >
                    {selectedOption === option.id && (
                      <CheckCircle className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {option.isRecommended && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedOption || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
