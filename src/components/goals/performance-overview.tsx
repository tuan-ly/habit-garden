'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  AlertTriangle,
  Star,
  Target,
} from 'lucide-react'
import type { PerformanceAnalysis, PerformanceCategory, TrendDirection } from '@/lib/adaptive-goals'
import {
  getPerformanceEmoji,
  getTrendEmoji,
  getPerformanceColorClass,
} from '@/lib/adaptive-goals'

interface PerformanceOverviewProps {
  analysis: PerformanceAnalysis
  className?: string
}

export function PerformanceOverview({ analysis, className }: PerformanceOverviewProps) {
  const { weeklyScores, averageScore, currentCategory, trend, variance } = analysis

  const getCategoryLabel = (category: PerformanceCategory): string => {
    switch (category) {
      case 'exceptional':
        return 'Exceptional'
      case 'exceeding':
        return 'Exceeding'
      case 'on_track':
        return 'On Track'
      case 'below':
        return 'Below Target'
      case 'struggling':
        return 'Struggling'
      case 'critical':
        return 'Critical'
    }
  }

  const getCategoryColor = (category: PerformanceCategory): string => {
    switch (category) {
      case 'exceptional':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'exceeding':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'on_track':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'below':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'struggling':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getTrendLabel = (t: TrendDirection): string => {
    switch (t) {
      case 'upward':
        return 'Improving'
      case 'downward':
        return 'Declining'
      case 'stable':
        return 'Stable'
      case 'volatile':
        return 'Volatile'
    }
  }

  const TrendIcon = trend === 'upward'
    ? TrendingUp
    : trend === 'downward'
    ? TrendingDown
    : Minus

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">
              {averageScore}%
            </div>
            <div className="text-sm text-muted-foreground">
              Average Performance
            </div>
          </div>
          <Badge className={cn('text-sm', getCategoryColor(currentCategory))}>
            {getPerformanceEmoji(currentCategory)} {getCategoryLabel(currentCategory)}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress
            value={Math.min(averageScore, 150)}
            max={150}
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-blue-500">100% Target</span>
            <span>150%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {/* Trend */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <TrendIcon className={cn(
              'h-5 w-5 mx-auto mb-1',
              trend === 'upward' ? 'text-green-500' : trend === 'downward' ? 'text-red-500' : 'text-gray-500'
            )} />
            <div className="text-xs font-medium">{getTrendLabel(trend)}</div>
            <div className="text-[10px] text-muted-foreground">Trend</div>
          </div>

          {/* Variance */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold">{variance}%</div>
            <div className="text-xs font-medium">
              {variance > 25 ? 'High' : variance > 15 ? 'Medium' : 'Low'}
            </div>
            <div className="text-[10px] text-muted-foreground">Variance</div>
          </div>

          {/* Weeks Tracked */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold">{weeklyScores.length}</div>
            <div className="text-xs font-medium">Weeks</div>
            <div className="text-[10px] text-muted-foreground">Tracked</div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        {weeklyScores.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-sm font-medium">Recent Weeks</div>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {weeklyScores.slice(-8).map((week) => (
                <div
                  key={week.weekNumber}
                  className={cn(
                    'flex-shrink-0 w-12 p-2 rounded-lg text-center',
                    week.score >= 100
                      ? 'bg-green-100 text-green-800'
                      : week.score >= 70
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  )}
                >
                  <div className="text-xs font-medium">W{week.weekNumber}</div>
                  <div className="text-sm font-bold">{week.score}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings/Tips */}
        {variance > 25 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              <div className="font-medium text-amber-700">High Variance Detected</div>
              <p className="text-amber-600 text-xs mt-1">
                Your performance varies significantly. Try to maintain more consistent progress.
              </p>
            </div>
          </div>
        )}

        {currentCategory === 'exceptional' && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm">
            <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-700">Outstanding Performance!</div>
              <p className="text-yellow-600 text-xs mt-1">
                Consider increasing your target to challenge yourself further.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
