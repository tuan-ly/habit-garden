'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Link2,
  Unlink,
  Trophy,
  Pause,
  Play,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import type { IdentityWithGoals, IdentityColor, Goal } from '@/types/database'
import { cn } from '@/lib/utils'
import {
  updateIdentity,
  deleteIdentity,
  linkGoalToIdentity,
  unlinkGoalFromIdentity,
  getUnlinkedGoals,
  getIdentityStats,
} from '@/lib/actions/identity'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Color gradients (same as identity-card)
const IDENTITY_GRADIENTS: Record<IdentityColor, string> = {
  purple: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
  blue: 'from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30',
  green: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  amber: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
  rose: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
  cyan: 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30',
  pink: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30',
  orange: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
}

const IDENTITY_ACCENT_COLORS: Record<IdentityColor, string> = {
  purple: 'text-purple-600 dark:text-purple-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  pink: 'text-pink-600 dark:text-pink-400',
  orange: 'text-orange-600 dark:text-orange-400',
}

interface IdentityDetailSheetProps {
  identity: IdentityWithGoals
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (identity: IdentityWithGoals) => void
  onDelete?: (identityId: string) => void
}

type TabValue = 'overview' | 'goals' | 'stats'

export function IdentityDetailSheet({
  identity,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: IdentityDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLinkGoalsDialog, setShowLinkGoalsDialog] = useState(false)
  const [unlinkedGoals, setUnlinkedGoals] = useState<Goal[]>([])
  const [stats, setStats] = useState<{
    totalGoals: number
    activeGoals: number
    completedGoals: number
    averageProgress: number
    totalValue: number
  } | null>(null)

  // Edit form state
  const [editName, setEditName] = useState(identity.name)
  const [editDescription, setEditDescription] = useState(identity.description || '')

  // Reset edit state when identity changes
  useEffect(() => {
    setEditName(identity.name)
    setEditDescription(identity.description || '')
  }, [identity])

  // Load stats when stats tab is active
  useEffect(() => {
    if (activeTab === 'stats' && open) {
      getIdentityStats(identity.id).then(setStats)
    }
  }, [activeTab, open, identity.id])

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    startTransition(async () => {
      const result = await updateIdentity(identity.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      })

      if (result.success && result.identity) {
        toast.success('Identity updated')
        onUpdate?.({ ...identity, ...result.identity })
        setIsEditing(false)
      } else {
        toast.error(result.error || 'Failed to update')
      }
    })
  }

  const handleCancelEdit = () => {
    setEditName(identity.name)
    setEditDescription(identity.description || '')
    setIsEditing(false)
  }

  const handleToggleStatus = () => {
    const newStatus = identity.status === 'active' ? 'paused' : 'active'
    startTransition(async () => {
      const result = await updateIdentity(identity.id, { status: newStatus })
      if (result.success && result.identity) {
        toast.success(`Identity ${newStatus === 'active' ? 'resumed' : 'paused'}`)
        onUpdate?.({ ...identity, ...result.identity })
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteIdentity(identity.id)
      if (result.success) {
        toast.success('Identity deleted')
        onDelete?.(identity.id)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to delete')
      }
    })
    setShowDeleteDialog(false)
  }

  const handleOpenLinkGoals = async () => {
    const goals = await getUnlinkedGoals()
    setUnlinkedGoals(goals)
    setShowLinkGoalsDialog(true)
  }

  const handleLinkGoal = (goalId: string) => {
    startTransition(async () => {
      const result = await linkGoalToIdentity(goalId, identity.id)
      if (result.success) {
        toast.success('Goal linked to identity')
        // Update the local state - remove from unlinked, add to identity
        const linkedGoal = unlinkedGoals.find((g) => g.id === goalId)
        if (linkedGoal) {
          setUnlinkedGoals((prev) => prev.filter((g) => g.id !== goalId))
          onUpdate?.({
            ...identity,
            goals: [...identity.goals, linkedGoal],
            goals_count: identity.goals_count + 1,
          })
        }
      } else {
        toast.error(result.error || 'Failed to link goal')
      }
    })
  }

  const handleUnlinkGoal = (goalId: string) => {
    startTransition(async () => {
      const result = await unlinkGoalFromIdentity(goalId)
      if (result.success) {
        toast.success('Goal unlinked from identity')
        const unlinkedGoal = identity.goals.find((g) => g.id === goalId)
        if (unlinkedGoal) {
          onUpdate?.({
            ...identity,
            goals: identity.goals.filter((g) => g.id !== goalId),
            goals_count: Math.max(0, identity.goals_count - 1),
          })
        }
      } else {
        toast.error(result.error || 'Failed to unlink goal')
      }
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            {/* Header with icon and name */}
            <div
              className={cn(
                'rounded-xl p-4 mb-2 bg-gradient-to-br',
                IDENTITY_GRADIENTS[identity.color]
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-3xl shadow-sm">
                  {identity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-lg font-bold mb-1"
                      maxLength={30}
                    />
                  ) : (
                    <SheetTitle className={cn('text-xl', IDENTITY_ACCENT_COLORS[identity.color])}>
                      {identity.name}
                    </SheetTitle>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        identity.status === 'active' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
                        identity.status === 'paused' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                        identity.status === 'achieved' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                      )}
                    >
                      {identity.status === 'active' && <Target className="w-3 h-3 mr-1" />}
                      {identity.status === 'paused' && <Pause className="w-3 h-3 mr-1" />}
                      {identity.status === 'achieved' && <Trophy className="w-3 h-3 mr-1" />}
                      {identity.status.charAt(0).toUpperCase() + identity.status.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {identity.goals_count} goal{identity.goals_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className={cn('font-medium', IDENTITY_ACCENT_COLORS[identity.color])}>
                    {Math.round(identity.progress_percentage)}%
                  </span>
                </div>
                <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 bg-gradient-to-r',
                      identity.color === 'purple' && 'from-purple-500 to-violet-500',
                      identity.color === 'blue' && 'from-blue-500 to-sky-500',
                      identity.color === 'green' && 'from-green-500 to-emerald-500',
                      identity.color === 'amber' && 'from-amber-500 to-yellow-500',
                      identity.color === 'rose' && 'from-rose-500 to-pink-500',
                      identity.color === 'cyan' && 'from-cyan-500 to-teal-500',
                      identity.color === 'pink' && 'from-pink-500 to-fuchsia-500',
                      identity.color === 'orange' && 'from-orange-500 to-amber-500'
                    )}
                    style={{ width: `${Math.min(identity.progress_percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <SheetDescription className="sr-only">Details for {identity.name}</SheetDescription>
          </SheetHeader>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                {isEditing ? (
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="What does this identity mean to you?"
                    rows={3}
                    maxLength={200}
                  />
                ) : identity.description ? (
                  <p className="text-sm text-muted-foreground">{identity.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">No description</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-4">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={isPending} className="flex-1">
                      {isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isPending}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Identity
                    </Button>

                    <Button variant="outline" onClick={handleToggleStatus} disabled={isPending} className="w-full">
                      {identity.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause Identity
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume Identity
                        </>
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Identity
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="mt-4 space-y-4">
              {/* Link goals button */}
              <Button variant="outline" onClick={handleOpenLinkGoals} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Link Goals
              </Button>

              {/* Linked goals list */}
              {identity.goals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No goals linked yet</p>
                  <p className="text-sm">Link goals to track progress towards this identity</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {identity.goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{goal.tracking_metric}</p>
                        <p className="text-xs text-muted-foreground">
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {Math.round((goal.current_value / goal.target_value) * 100)}%
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnlinkGoal(goal.id)}
                        disabled={isPending}
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-4 space-y-4">
              {stats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold">{stats.totalGoals}</p>
                    <p className="text-sm text-muted-foreground">Total Goals</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold">{stats.activeGoals}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold">{stats.completedGoals}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold">{stats.averageProgress}%</p>
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading stats...</p>
                </div>
              )}

              <div className="pt-4 text-center text-sm text-muted-foreground">
                <p>
                  Created {new Date(identity.created_at).toLocaleDateString()}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Identity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{identity.name}". Linked goals will be unlinked but not deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link goals dialog */}
      <AlertDialog open={showLinkGoalsDialog} onOpenChange={setShowLinkGoalsDialog}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Link Goals to {identity.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Select goals to link to this identity. Progress will be tracked together.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {unlinkedGoals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No unlinked goals available</p>
              <p className="text-sm mt-1">Create goals on your plants first</p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              {unlinkedGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleLinkGoal(goal.id)}
                  disabled={isPending}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left',
                    'bg-slate-50 dark:bg-slate-800/50',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                    'transition-colors disabled:opacity-50'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{goal.tracking_metric}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.current_value} / {goal.target_value} {goal.unit}
                    </p>
                  </div>
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Done</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
