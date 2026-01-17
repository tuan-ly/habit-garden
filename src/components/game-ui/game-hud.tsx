'use client'

import { useState } from 'react'
import { Star, ChevronDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLevelInfo } from '@/lib/xp-system'
import type { Profile } from '@/types/database'
import { MoodSelector } from '@/components/mood'

interface GameHudProps {
  profile?: Profile | null
}

export function GameHud({ profile }: GameHudProps) {
  const [expanded, setExpanded] = useState(false)
  const levelInfo = profile ? getLevelInfo(profile.xp) : null

  return (
    <>
      {/* Left side: XP & Level - Compact */}
      {levelInfo && (
        <div className="fixed top-2 left-2 sm:top-3 sm:left-3 z-40 pointer-events-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "group relative flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl overflow-hidden",
              "bg-gradient-to-r from-slate-900/90 to-slate-800/90",
              "border-2 border-amber-500/30 shadow-lg shadow-amber-500/10",
              "transition-all duration-300 hover:border-amber-400/50",
              "px-2 py-1.5 sm:px-2.5 sm:py-2"
            )}
          >
            {/* Level badge - Compact */}
            <div className="relative">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-md sm:rounded-lg bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 opacity-50" />
                <div className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-md border border-amber-300/50">
                  <span className="text-white font-black text-sm sm:text-base drop-shadow-md">
                    {levelInfo.level}
                  </span>
                </div>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-md">
                <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white fill-white" />
              </div>
            </div>

            {/* XP info - Compact - Hidden on very small screens */}
            <div className="hidden xs:flex flex-col min-w-16 sm:min-w-20 gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-amber-400 truncate max-w-14 sm:max-w-none">
                  {levelInfo.title}
                </span>
                <ChevronDown className={cn(
                  "w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400/60 transition-transform ml-1",
                  expanded && "rotate-180"
                )} />
              </div>

              {/* XP Bar - Compact */}
              <div className="relative h-1.5 sm:h-2 w-full bg-slate-700/80 rounded-full overflow-hidden border border-slate-600/50">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>

              {/* XP numbers - Compact */}
              <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                <span className="text-amber-300/80 font-medium flex items-center gap-0.5">
                  <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  {profile?.xp}
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  Lv.{levelInfo.level + 1}: {levelInfo.xpForNextLevel}
                </span>
              </div>
            </div>
          </button>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-2 p-3 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border-2 border-amber-500/20 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current XP</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {profile?.xp.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">To Next Level</span>
                  <span className="font-bold text-cyan-400">
                    {(levelInfo.xpForNextLevel - (profile?.xp || 0)).toLocaleString()} XP
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-bold text-green-400">{Math.round(levelInfo.progress)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right side: Mood/Weather Selector */}
      <div className="fixed top-2 right-2 sm:top-3 sm:right-3 z-40 pointer-events-auto">
        <MoodSelector />
      </div>
    </>
  )
}
