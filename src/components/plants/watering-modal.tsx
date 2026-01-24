'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Droplets, Loader2, Sprout, ArrowUpRight, Move, Sparkles, PenLine } from 'lucide-react'
import { resolveGrowthConflict } from '@/lib/actions/plants'
import { toast } from "sonner"

interface WateringModalProps {
    plant: PlantWithType | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onWater: (notes?: string) => Promise<void>
    estimatedXp?: number
    journalStreak?: number
}

// Calculate note bonus based on note length (mirror server logic)
function calculateNoteBonus(noteLength: number, journalStreak: number): number {
    if (noteLength === 0) return 0

    let bonus = 3 // Base bonus
    if (noteLength > 50) bonus += 2 // Thoughtful
    if (noteLength > 100) bonus += 2 // Detailed

    // Journal streak bonus
    if (journalStreak >= 30) bonus += 12
    else if (journalStreak >= 14) bonus += 8
    else if (journalStreak >= 7) bonus += 5
    else if (journalStreak >= 3) bonus += 3

    return bonus
}

/**
 * Modal for simple watering (without numeric goal).
 * Allows adding a note to the watering log with XP bonuses.
 */
export function WateringModal({
    plant,
    open,
    onOpenChange,
    onWater,
    estimatedXp = 10,
    journalStreak = 0,
}: WateringModalProps) {
    const [notes, setNotes] = useState('')
    const [isWatering, setIsWatering] = useState(false)
    const [isResolving, setIsResolving] = useState(false)
    const notesRef = useRef<HTMLTextAreaElement>(null)

    // Calculate note bonus XP
    const noteBonus = useMemo(() => {
        return calculateNoteBonus(notes.trim().length, journalStreak)
    }, [notes, journalStreak])

    const totalXp = estimatedXp + noteBonus

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setNotes('')
            // Focus textarea provided it's a desktop environment where it makes sense
            // On mobile, auto-focus might bring up keyboard covering the UI
            if (window.matchMedia('(min-width: 640px)').matches) {
                setTimeout(() => notesRef.current?.focus(), 100)
            }
        }
    }, [open])

    const handleWater = async () => {
        if (isWatering) return

        setIsWatering(true)
        try {
            await onWater(notes.trim() || undefined)
            onOpenChange(false)
        } finally {
            setIsWatering(false)
        }
    }

    const handleResolveConflict = async () => {
        if (isResolving || !plant) return
        setIsResolving(true)
        try {
            const result = await resolveGrowthConflict(plant.id)
            if (result.success) {
                toast.success("Garden Rearranged!", {
                    description: `${plant.name} has grown and neighbors have been moved.`
                })
                onOpenChange(false)
            } else {
                toast.error("Could not expand", {
                    description: result.error || "Failed to rearrange garden."
                })
            }
        } catch (error) {
            toast.error("Error", {
                description: "Something went wrong."
            })
        } finally {
            setIsResolving(false)
        }
    }

    if (!plant) return null

    // Determine note bonus tier for visual feedback
    const noteLength = notes.trim().length
    const noteTier = noteLength > 100 ? 'detailed' : noteLength > 50 ? 'thoughtful' : noteLength > 0 ? 'basic' : 'none'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                            <span className="relative text-3xl">{plant.plant_type.icon}</span>
                        </div>
                        <div>
                            <DialogTitle className="text-white flex items-center gap-2">
                                Water {plant.name}
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                <span>Streak: {plant.current_streak} days</span>
                                {plant.current_streak > 3 && <span>🔥</span>}
                                {journalStreak > 0 && (
                                    <>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-purple-400">Journal: {journalStreak} days 📝</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Growth Conflict Resolution */}
                    {plant.growth_blocked && (
                        <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-500/20 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-full">
                                    <Move className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-amber-200">Needs Space to Grow!</h4>
                                    <p className="text-xs text-amber-200/70 mt-1">
                                        This plant is ready to expand but is blocked by neighbors.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleResolveConflict}
                                disabled={isResolving}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                                size="sm"
                            >
                                {isResolving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Rearranging...
                                    </>
                                ) : (
                                    <>
                                        <ArrowUpRight className="w-4 h-4 mr-2" />
                                        Expand & Auto-Arrange
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Notes with XP Bonus Indicator */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                <PenLine className="w-3.5 h-3.5" />
                                Add a reflection
                            </label>
                            {noteBonus > 0 && (
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-all",
                                    noteTier === 'detailed'
                                        ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
                                        : noteTier === 'thoughtful'
                                        ? "bg-blue-500/20 text-blue-300"
                                        : "bg-emerald-500/20 text-emerald-300"
                                )}>
                                    <Sparkles className="w-3 h-3" />
                                    +{noteBonus} XP
                                </span>
                            )}
                        </div>
                        <Textarea
                            ref={notesRef}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="How did it go? What did you learn? Any wins today?"
                            maxLength={500}
                            className={cn(
                                'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500',
                                'focus:border-emerald-500 focus:ring-emerald-500/20',
                                'resize-none h-24 transition-all',
                                noteBonus > 0 && 'border-emerald-500/50'
                            )}
                        />

                        {/* Note bonus tiers hint */}
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                            <span className={cn(
                                "px-1.5 py-0.5 rounded",
                                noteLength > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800"
                            )}>
                                Any note +3
                            </span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded",
                                noteLength > 50 ? "bg-blue-500/20 text-blue-400" : "bg-slate-800"
                            )}>
                                50+ chars +2
                            </span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded",
                                noteLength > 100 ? "bg-purple-500/20 text-purple-400" : "bg-slate-800"
                            )}>
                                100+ chars +2
                            </span>
                        </div>
                    </div>

                    {/* Motivation tip when no note */}
                    {noteLength === 0 && (
                        <div className="p-3 rounded-lg bg-purple-900/10 border border-purple-500/20 text-xs text-purple-200/80">
                            <p className="flex items-start gap-2">
                                <span className="text-base">💡</span>
                                <span>
                                    <strong>Tip:</strong> Writing a short reflection helps you stay mindful and earns bonus XP.
                                    {journalStreak > 0
                                        ? ` Keep your ${journalStreak}-day journal streak going!`
                                        : ' Start a journal streak for even more rewards!'}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Water Button */}
                    <Button
                        onClick={handleWater}
                        disabled={isWatering}
                        className={cn(
                            'w-full h-12',
                            'bg-linear-to-r from-emerald-500 to-green-600',
                            'hover:from-emerald-400 hover:to-green-500',
                            'text-white font-semibold text-base',
                            'shadow-lg shadow-emerald-500/30',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'transition-all duration-200'
                        )}
                    >
                        {isWatering ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Watering...
                            </>
                        ) : (
                            <>
                                <Droplets className="w-5 h-5 mr-2" />
                                Water Plant (+{totalXp} XP)
                            </>
                        )}
                    </Button>

                    {/* Status */}
                    <div className="flex justify-between text-xs text-slate-500 px-1">
                        <span className="flex items-center gap-1">
                            <Sprout className="w-3 h-3" />
                            Growth: {Math.round(plant.growth_percentage)}%
                        </span>
                        <span>
                            Total Waterings: {plant.total_waterings}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
