'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Droplets, Loader2, Sprout } from 'lucide-react'

interface WateringModalProps {
    plant: PlantWithType | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onWater: (notes?: string) => Promise<void>
    estimatedXp?: number
}

/**
 * Modal for simple watering (without numeric goal).
 * Allows adding a note to the watering log.
 */
export function WateringModal({
    plant,
    open,
    onOpenChange,
    onWater,
    estimatedXp = 10,
}: WateringModalProps) {
    const [notes, setNotes] = useState('')
    const [isWatering, setIsWatering] = useState(false)
    const notesRef = useRef<HTMLTextAreaElement>(null)

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

    if (!plant) return null

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
                                <span>Current Streak: {plant.current_streak} days</span>
                                {plant.current_streak > 3 && <span>🔥</span>}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Motivation / Context */}
                    <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-sm text-emerald-200">
                        <p>Taking a moment to nurture your habit helps it grow strong.</p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-2 block">
                            Add a note (optional)
                        </label>
                        <Textarea
                            ref={notesRef}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="How are you feeling today? Any small wins?"
                            maxLength={500}
                            className={cn(
                                'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500',
                                'focus:border-emerald-500 focus:ring-emerald-500/20',
                                'resize-none h-24'
                            )}
                        />
                    </div>

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
                                Water Plant (+{estimatedXp} XP)
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
