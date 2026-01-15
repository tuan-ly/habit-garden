'use client'

import { useState } from 'react'
import { Cloud, Sun, CloudRain, CloudLightning, Rainbow, Star, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLevelInfo } from '@/lib/xp-system'
import type { WeatherType, Profile } from '@/types/database'

interface GameHudProps {
  profile?: Profile | null
  weather?: WeatherType | null
}

const weatherConfig: Record<WeatherType, { icon: typeof Sun; label: string; color: string; bgColor: string; effect: string }> = {
  sunny: {
    icon: Sun,
    label: 'Sunny',
    color: 'text-amber-500',
    bgColor: 'from-amber-400 to-orange-500',
    effect: '☀️'
  },
  cloudy: {
    icon: Cloud,
    label: 'Cloudy',
    color: 'text-slate-500',
    bgColor: 'from-slate-400 to-slate-600',
    effect: '☁️'
  },
  rainy: {
    icon: CloudRain,
    label: 'Rainy',
    color: 'text-blue-500',
    bgColor: 'from-blue-400 to-cyan-500',
    effect: '🌧️'
  },
  stormy: {
    icon: CloudLightning,
    label: 'Stormy',
    color: 'text-purple-500',
    bgColor: 'from-purple-500 to-violet-600',
    effect: '⛈️'
  },
  rainbow: {
    icon: Rainbow,
    label: 'Rainbow',
    color: 'text-pink-500',
    bgColor: 'from-pink-400 via-purple-400 to-cyan-400',
    effect: '🌈'
  },
}

export function GameHud({ profile, weather }: GameHudProps) {
  const [expanded, setExpanded] = useState(false)
  const levelInfo = profile ? getLevelInfo(profile.xp) : null
  const currentWeather = weather ? weatherConfig[weather] : weatherConfig.sunny
  const WeatherIcon = currentWeather.icon

  return (
    <div className="fixed top-2 left-2 right-2 z-40 pointer-events-none">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-2">
          {/* Left side: XP & Level */}
          {levelInfo && (
            <div className="pointer-events-auto">
              <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                  "flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl",
                  "border border-white/20 dark:border-slate-700/50 shadow-lg shadow-black/10",
                  "transition-all duration-300 hover:shadow-xl",
                  expanded ? "p-3" : "p-2"
                )}
              >
                {/* Level badge */}
                <div className="relative">
                  <div className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500",
                    "flex items-center justify-center shadow-md shadow-amber-500/30",
                    "text-white font-bold text-sm"
                  )}>
                    {levelInfo.level}
                  </div>
                  <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-md" />
                </div>

                {/* XP info */}
                <div className="flex flex-col min-w-[100px]">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {levelInfo.title}
                    </span>
                    <ChevronDown className={cn(
                      "w-3 h-3 text-slate-400 transition-transform",
                      expanded && "rotate-180"
                    )} />
                  </div>

                  {/* XP Bar */}
                  <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${levelInfo.progress}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                  </div>

                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {profile?.xp.toLocaleString()} XP
                  </span>
                </div>
              </button>

              {/* Expanded details */}
              {expanded && (
                <div className="mt-2 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Current XP</span>
                      <span className="font-bold text-amber-600">{profile?.xp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">To Next Level</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {(levelInfo.xpForNextLevel - (profile?.xp || 0)).toLocaleString()} XP
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-bold text-green-600">{Math.round(levelInfo.progress)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Center: Weather */}
          <div className="pointer-events-auto">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-2xl",
              "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
              "border border-white/20 dark:border-slate-700/50",
              "shadow-lg shadow-black/10"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md",
                currentWeather.bgColor
              )}>
                <span className="text-base">{currentWeather.effect}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {currentWeather.label}
                </span>
                <span className="text-[10px] text-slate-500">
                  Today&apos;s Weather
                </span>
              </div>
            </div>
          </div>

          {/* Right side: Quick actions (future) */}
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </div>
    </div>
  )
}
