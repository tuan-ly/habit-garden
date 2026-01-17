'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useMood } from '@/lib/context/mood-context'
import { getAllMoodLevels, type MoodLevel, type MoodConfig } from '@/lib/mood-system'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MoodCheckInDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MoodCheckInDialog({ open, onOpenChange }: MoodCheckInDialogProps) {
    const { setMood } = useMood()
    const [isSelecting, setIsSelecting] = useState(false)
    const moodLevels = getAllMoodLevels()

    const handleSelectMood = async (selectedLevel: MoodLevel) => {
        setIsSelecting(true)
        await setMood(selectedLevel)
        setIsSelecting(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-3xl border-none bg-slate-50 dark:bg-slate-950 p-0 overflow-hidden shadow-2xl">
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl animate-pulse delay-700" />
                    </div>

                    <div className="relative z-10 space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">How's your weather today?</h2>
                        <p className="text-indigo-100 text-sm opacity-90">
                            Your garden reflects your mood. Let's start with a quick check-in.
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid gap-3">
                        {moodLevels.map((config) => (
                            <button
                                key={config.level}
                                disabled={isSelecting}
                                onClick={() => handleSelectMood(config.level)}
                                className={cn(
                                    "group relative w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
                                    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
                                    "hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5",
                                    "active:scale-95 disabled:opacity-50"
                                )}
                            >
                                {/* Icon Circle */}
                                <div className={cn(
                                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner",
                                    `bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}`
                                )}>
                                    {config.icon}
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 dark:text-slate-100">{config.weather}</span>
                                        <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {config.description}
                                    </p>
                                </div>

                                {/* XP Badge */}
                                {config.xpMultiplier > 1 && (
                                    <div className="flex-shrink-0">
                                        <span className={cn(
                                            "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider",
                                            config.level === 1 ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30" :
                                                config.level === 2 ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                                                    "bg-slate-100 text-slate-600 dark:bg-slate-800"
                                        )}>
                                            +{Math.round((config.xpMultiplier - 1) * 100)}% XP
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        Tough days build the strongest streaks.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
