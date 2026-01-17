'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalStatistics } from '@/lib/actions/goals'
import { GoalProgressChart } from './goal-progress-chart'
import { GoalTimeline } from './goal-timeline'
import { Button } from '@/components/ui/button'

interface GoalStatsProps {
  stats: GoalStatistics
  className?: string
}

export function GoalStats({ stats, className }: GoalStatsProps) {
  const { goal, logs, currentWeek, weeklyTarget, overallProgress, isOnTrack, weeklyTrend } = stats
  const [showFullTimeline, setShowFullTimeline] = useState(false)

  const TrendIcon =
    weeklyTrend === 'up' ? TrendingUp : weeklyTrend === 'down' ? TrendingDown : Minus
  const trendColor =
    weeklyTrend === 'up'
      ? 'text-green-500'
      : weeklyTrend === 'down'
      ? 'text-red-500'
      : 'text-gray-500'

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!goal.target_date) return 0
    const targetDate = new Date(goal.target_date)
    const today = new Date()
    return Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  }, [goal.target_date])

  return (
    <Tabs defaultValue="progress" className={cn('space-y-4', className)}>
      <TabsList className="grid w-full grid-cols-2 h-auto">
        <TabsTrigger value="progress" className="flex items-center gap-2 py-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Progress</span>
        </TabsTrigger>
        <TabsTrigger value="timeline" className="flex items-center gap-2 py-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Timeline</span>
        </TabsTrigger>
      </TabsList>

      {/* Progress Tab */}
      <TabsContent value="progress" className="space-y-4 mt-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200/50 dark:border-emerald-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                <Target className="h-4 w-4" />
                Overall Progress
              </div>
              <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">
                {Math.round(overallProgress)}%
              </div>
              <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                {Number(goal.current_value).toFixed(1)} / {goal.target_value} {goal.unit}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200/50 dark:border-blue-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                <Calendar className="h-4 w-4" />
                Week {currentWeek}
              </div>
              <div className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">
                {weeklyTarget.toFixed(1)}
              </div>
              <div className="text-xs text-blue-600/80 dark:text-blue-400/80">
                This week's target
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200/50 dark:border-amber-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <Trophy className="h-4 w-4" />
                Personal Records
              </div>
              <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">
                {stats.personalRecords}
              </div>
              <div className="text-xs text-amber-600/80 dark:text-amber-400/80">
                Milestones achieved
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200/50 dark:border-violet-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                Weeks Completed
              </div>
              <div className="text-2xl font-bold mt-1 text-violet-700 dark:text-violet-300">
                {stats.weeksCompleted}
              </div>
              <div className="text-xs text-violet-600/80 dark:text-violet-400/80">
                Target met
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full animate-pulse',
                    isOnTrack ? 'bg-green-500' : 'bg-amber-500'
                  )}
                />
                <span className="font-medium">
                  {isOnTrack ? 'On Track' : 'Behind Schedule'}
                </span>
              </div>
              <div className={cn('flex items-center gap-1', trendColor)}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-sm capitalize">{weeklyTrend} trend</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{daysRemaining} days remaining</span>
              </div>
              {stats.predictedCompletion && (
                <div className="text-muted-foreground">
                  Est. finish:{' '}
                  <span className="font-medium">
                    {stats.predictedCompletion.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card>
          <CardContent className="p-4">
            <GoalProgressChart stats={stats} />
          </CardContent>
        </Card>

        {/* Recent Logs */}
        {logs.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.slice(-5).reverse().map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {Number(log.value).toFixed(1)} {goal.unit}
                        </span>
                        {log.is_personal_record && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-medium">
                            <Trophy className="h-2.5 w-2.5" />
                            PR
                          </span>
                        )}
                        {log.exceeded_target && !log.is_personal_record && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 text-[10px] font-medium">
                            <CheckCircle className="h-2.5 w-2.5" />
                            Hit
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.logged_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Timeline Tab */}
      <TabsContent value="timeline" className="space-y-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <GoalTimeline stats={stats} showAll={showFullTimeline} />

            {/* Toggle button for full timeline */}
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullTimeline(!showFullTimeline)}
                className="text-xs"
              >
                {showFullTimeline ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show Full Timeline
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {stats.weeksCompleted}
            </div>
            <div className="text-[10px] text-muted-foreground">Weeks Hit</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {currentWeek - 1 - stats.weeksCompleted}
            </div>
            <div className="text-[10px] text-muted-foreground">Weeks Missed</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {((goal.weekly_targets as number[])?.length || goal.duration_weeks) - currentWeek + 1}
            </div>
            <div className="text-[10px] text-muted-foreground">Weeks Left</div>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
