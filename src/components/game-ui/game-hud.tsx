'use client'

import { useState } from 'react'
import { Star, ChevronDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLevelInfo } from '@/lib/xp-system'
import type { WeatherType, Profile } from '@/types/database'

interface GameHudProps {
  profile?: Profile | null
  weather?: WeatherType | null
}

const weatherConfig: Record<WeatherType, { label: string; bgColor: string; effect: string; bonus: string }> = {
  sunny: {
    label: 'Sunny',
    bgColor: 'from-amber-400 to-orange-500',
    effect: '☀️',
    bonus: '+10% XP'
  },
  cloudy: {
    label: 'Cloudy',
    bgColor: 'from-slate-400 to-slate-600',
    effect: '☁️',
    bonus: 'Normal'
  },
  rainy: {
    label: 'Rainy',
    bgColor: 'from-blue-400 to-cyan-500',
    effect: '🌧️',
    bonus: '+20% Growth'
  },
  stormy: {
    label: 'Stormy',
    bgColor: 'from-purple-500 to-violet-600',
    effect: '⛈️',
    bonus: '-10% Decay'
  },
  rainbow: {
    label: 'Rainbow',
    bgColor: 'from-pink-400 via-purple-400 to-cyan-400',
    effect: '🌈',
    bonus: '+25% XP'
  },
}

export function GameHud({ profile, weather }: GameHudProps) {
  const [expanded, setExpanded] = useState(false)
  const levelInfo = profile ? getLevelInfo(profile.xp) : null
  const currentWeather = weather ? weatherConfig[weather] : weatherConfig.sunny

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

      {/* Right side: Weather - Compact pill */}
      <div className="fixed top-2 right-2 sm:top-3 sm:right-3 z-40 pointer-events-auto">
        <div className={cn(
          "relative flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl overflow-hidden",
          "bg-gradient-to-r from-slate-900/90 to-slate-800/90",
          "border-2 shadow-lg transition-all duration-300",
          weather === 'rainbow' ? "border-pink-500/30 shadow-pink-500/10" :
          weather === 'sunny' ? "border-amber-500/30 shadow-amber-500/10" :
          weather === 'rainy' ? "border-blue-500/30 shadow-blue-500/10" :
          weather === 'stormy' ? "border-purple-500/30 shadow-purple-500/10" :
          "border-slate-500/30 shadow-slate-500/10"
        )}>
          {/* Weather icon */}
          <div className={cn(
            "w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg flex items-center justify-center",
            `bg-gradient-to-br ${currentWeather.bgColor}`,
            "shadow-md border border-white/20"
          )}>
            <span className="text-base sm:text-lg drop-shadow-md">{currentWeather.effect}</span>
          </div>

          {/* Weather info - Hidden label on very small screens */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold text-white">
              {currentWeather.label}
            </span>
            <span className={cn(
              "text-[9px] sm:text-[10px] font-medium hidden xs:block",
              weather === 'rainbow' ? "text-pink-400" :
              weather === 'sunny' ? "text-amber-400" :
              weather === 'rainy' ? "text-blue-400" :
              weather === 'stormy' ? "text-purple-400" :
              "text-slate-400"
            )}>
              {currentWeather.bonus}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
