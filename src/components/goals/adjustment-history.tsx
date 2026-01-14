'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  History,
  TrendingUp,
  TrendingDown,
  Moon,
  Calendar,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react'
import type { GoalAdjustment, AdjustmentType } from '@/types/database'
import { getAdjustmentHistory } from '@/lib/actions/adaptive'

interface AdjustmentHistoryProps {
  goalId: string
  className?: string
}

export function AdjustmentHistory({ goalId, className }: AdjustmentHistoryProps) {
  const [adjustments, setAdjustments] = useState<GoalAdjustment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getAdjustmentHistory(goalId)
      setAdjustments(history)
      setIsLoading(false)
    }
    loadHistory()
  }, [goalId])

  const getTypeIcon = (type: AdjustmentType) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'recovery_week':
        return <Moon className="h-4 w-4 text-purple-500" />
      case 'timeline_extend':
        return <Calendar className="h-4 w-4 text-blue-500" />
      default:
        return <Sparkles className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeLabel = (type: AdjustmentType) => {
    switch (type) {
      case 'increase':
        return 'Target Increased'
      case 'decrease':
        return 'Target Decreased'
      case 'recovery_week':
        return 'Recovery Week'
      case 'timeline_extend':
        return 'Timeline Extended'
      default:
        return type
    }
  }

  const getResponseBadge = (response: string | null, autoApplied: boolean) => {
    if (autoApplied) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          Auto
        </Badge>
      )
    }
    if (response === 'accepted') {
      return (
        <Badge variant="default" className="text-xs bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Applied
        </Badge>
      )
    }
    if (response === 'rejected') {
      return (
        <Badge variant="outline" className="text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Dismissed
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
        Pending
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Adjustment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (adjustments.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Adjustment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No adjustments yet</p>
            <p className="text-xs">Your goal hasn't been adjusted</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Adjustment History
          <Badge variant="secondary" className="ml-auto">
            {adjustments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {adjustments.map((adjustment) => (
              <div
                key={adjustment.id}
                className="border-l-2 border-muted pl-4 pb-4 last:pb-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(adjustment.adjustment_type)}
                    <span className="font-medium text-sm">
                      {getTypeLabel(adjustment.adjustment_type)}
                    </span>
                  </div>
                  {getResponseBadge(adjustment.response, adjustment.auto_applied)}
                </div>

                {adjustment.trigger_reason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {adjustment.trigger_reason}
                  </p>
                )}

                {/* Changes */}
                {adjustment.old_value && adjustment.new_value && (
                  <div className="mt-2 text-xs bg-muted/50 rounded p-2 space-y-1">
                    {Object.keys(adjustment.new_value).map((key) => {
                      const oldVal = (adjustment.old_value as Record<string, unknown>)?.[key]
                      const newVal = (adjustment.new_value as Record<string, unknown>)?.[key]
                      if (oldVal === undefined || newVal === undefined) return null
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="line-through text-red-500">
                            {String(oldVal)}
                          </span>
                          <span className="text-green-600 font-medium">
                            {String(newVal)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground mt-2">
                  {new Date(adjustment.suggested_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
