'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  Settings2,
  Sparkles,
  BellRing,
  Shield,
  Moon,
  Coffee,
  Loader2,
} from 'lucide-react'
import type { Goal, AdaptiveMode } from '@/types/database'
import { updateAdaptiveMode, activateRecoveryWeek } from '@/lib/actions/adaptive'

interface AdaptiveSettingsProps {
  goal: Goal
  className?: string
  onUpdate?: () => void
}

export function AdaptiveSettings({ goal, className, onUpdate }: AdaptiveSettingsProps) {
  const [mode, setMode] = useState<AdaptiveMode>(goal.adaptive_mode)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isActivatingRecovery, setIsActivatingRecovery] = useState(false)

  const handleModeChange = async (newMode: AdaptiveMode) => {
    setIsUpdating(true)
    try {
      const result = await updateAdaptiveMode(goal.id, newMode)
      if (result.success) {
        setMode(newMode)
        onUpdate?.()
      }
    } catch (error) {
      console.error('Error updating adaptive mode:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRecoveryWeek = async () => {
    setIsActivatingRecovery(true)
    try {
      const result = await activateRecoveryWeek(goal.id)
      if (result.success) {
        onUpdate?.()
      }
    } catch (error) {
      console.error('Error activating recovery week:', error)
    } finally {
      setIsActivatingRecovery(false)
    }
  }

  const getModeDescription = (m: AdaptiveMode) => {
    switch (m) {
      case 'off':
        return 'Không điều chỉnh tự động. Target cố định.'
      case 'suggest':
        return 'Nhận đề xuất điều chỉnh khi phù hợp. Bạn quyết định.'
      case 'auto':
        return 'Tự động điều chỉnh target dựa trên performance.'
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Adaptive Settings
        </CardTitle>
        <CardDescription>
          Customize how your goals adapt to your performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adaptive Mode */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Adaptive Mode</Label>
          <Select
            value={mode}
            onValueChange={(v) => handleModeChange(v as AdaptiveMode)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  Fixed
                </div>
              </SelectItem>
              <SelectItem value="suggest">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-blue-500" />
                  Suggest
                </div>
              </SelectItem>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Auto
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {getModeDescription(mode)}
          </p>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Actions</Label>

          {/* Recovery Week */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={isActivatingRecovery}
              >
                {isActivatingRecovery ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Moon className="h-4 w-4 mr-2 text-purple-500" />
                )}
                Take Recovery Week
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-purple-500" />
                  Activate Recovery Week?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>A recovery week will:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Reduce this week's target by 50%</li>
                    <li>Keep your streak intact</li>
                    <li>Not count towards performance trends</li>
                    <li>Help you rest and recover</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRecoveryWeek}>
                  <Moon className="h-4 w-4 mr-2" />
                  Activate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Adjustment count */}
          {goal.adjustment_count > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <span>Total adjustments made</span>
              <Badge variant="secondary">{goal.adjustment_count}</Badge>
            </div>
          )}

          {goal.last_adjusted_at && (
            <div className="text-xs text-muted-foreground">
              Last adjusted:{' '}
              {new Date(goal.last_adjusted_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}
        </div>

        {/* Mode Info */}
        {mode === 'suggest' && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
            <div className="flex items-center gap-2 font-medium">
              <BellRing className="h-4 w-4" />
              Suggest Mode Active
            </div>
            <p className="mt-1 text-blue-600">
              You'll receive suggestions when your performance indicates a need for adjustment.
            </p>
          </div>
        )}

        {mode === 'auto' && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-700">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Auto Mode Active
            </div>
            <p className="mt-1 text-yellow-600">
              Your targets will automatically adjust based on your performance.
              Protection limits are in place.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
