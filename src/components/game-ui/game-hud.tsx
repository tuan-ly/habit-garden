'use client'

import { useState } from 'react'
import { Cloud, Sun, CloudRain, CloudLightning, Rainbow, Star, ChevronDown, Zap, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLevelInfo } from '@/lib/xp-system'
import type { WeatherType, Profile } from '@/types/database'

interface GameHudProps {
  profile?: Profile | null
  weather?: WeatherType | null
}

const weatherConfig: Record<WeatherType, { icon: typeof Sun; label: string; color: string; bgColor: string; effect: string; bonus: string }> = {
  sunny: {
    icon: Sun,
    label: 'Sunny',
    color: 'text-amber-500',
    bgColor: 'from-amber-400 to-orange-500',
    effect: '☀️',
    bonus: '+10% XP'
  },
  cloudy: {
    icon: Cloud,
    label: 'Cloudy',
    color: 'text-slate-500',
    bgColor: 'from-slate-400 to-slate-600',
    effect: '☁️',
    bonus: 'Normal'
  },
  rainy: {
    icon: CloudRain,
    label: 'Rainy',
    color: 'text-blue-500',
    bgColor: 'from-blue-400 to-cyan-500',
    effect: '🌧️',
    bonus: '+20% Growth'
  },
  stormy: {
    icon: CloudLightning,
    label: 'Stormy',
    color: 'text-purple-500',
    bgColor: 'from-purple-500 to-violet-600',
    effect: '⛈️',
    bonus: '-10% Decay'
  },
  rainbow: {
    icon: Rainbow,
    label: 'Rainbow',
    color: 'text-pink-500',
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
    <div className="fixed top-3 left-3 right-3 z-40 pointer-events-none">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          {/* Left side: XP & Level - RPG Style */}
          {levelInfo && (
            <div className="pointer-events-auto">
              <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl overflow-hidden",
                  "bg-gradient-to-r from-slate-900/95 to-slate-800/95 dark:from-slate-950/95 dark:to-slate-900/95",
                  "border-2 border-amber-500/30 shadow-xl shadow-amber-500/10",
                  "transition-all duration-300 hover:border-amber-400/50 hover:shadow-amber-500/20",
                  expanded ? "p-4" : "p-3"
                )}
              >
                {/* Animated border glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Level badge - Hexagon style */}
                <div className="relative">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 animate-pulse-slow opacity-50" />
                    {/* Inner badge */}
                    <div className={cn(
                      "relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500",
                      "flex items-center justify-center shadow-lg shadow-amber-500/50",
                      "border-2 border-amber-300/50"
                    )}>
                      <span className="text-white font-black text-xl drop-shadow-md">
                        {levelInfo.level}
                      </span>
                    </div>
                  </div>
                  {/* Star decoration */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>

                {/* XP info */}
                <div className="flex flex-col min-w-28 gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-400 tracking-wide">
                      {levelInfo.title}
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-amber-400/60 transition-transform",
                      expanded && "rotate-180"
                    )} />
                  </div>

                  {/* XP Bar - Fancy */}
                  <div className="relative h-3 w-full bg-slate-700/80 rounded-full overflow-hidden border border-slate-600/50">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(255,255,255,0.1)_4px,rgba(255,255,255,0.1)_8px)]" />
                    {/* Progress fill */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${levelInfo.progress}%` }}
                    />
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    {/* Glow at end */}
                    <div
                      className="absolute top-0 bottom-0 w-2 bg-white/50 rounded-full blur-sm transition-all duration-700"
                      style={{ left: `calc(${levelInfo.progress}% - 4px)` }}
                    />
                  </div>

                  {/* XP numbers */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-300/80 font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {profile?.xp.toLocaleString()} XP
                    </span>
                    <span className="text-slate-400">
                      Lv.{levelInfo.level + 1}: {levelInfo.xpForNextLevel.toLocaleString()}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {expanded && (
                <div className="mt-2 p-4 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border-2 border-amber-500/20 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Current XP</span>
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {profile?.xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">To Next Level</span>
                      <span className="font-bold text-cyan-400">
                        {(levelInfo.xpForNextLevel - (profile?.xp || 0)).toLocaleString()} XP
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Progress</span>
                      <span className="font-bold text-green-400">{Math.round(levelInfo.progress)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right side: Weather - Game Style */}
          <div className="pointer-events-auto">
            <div className={cn(
              "relative flex items-center gap-3 px-4 py-3 rounded-2xl overflow-hidden",
              "bg-gradient-to-r from-slate-900/95 to-slate-800/95 dark:from-slate-950/95 dark:to-slate-900/95",
              "border-2 shadow-xl transition-all duration-300",
              weather === 'rainbow' ? "border-pink-500/30 shadow-pink-500/10" :
              weather === 'sunny' ? "border-amber-500/30 shadow-amber-500/10" :
              weather === 'rainy' ? "border-blue-500/30 shadow-blue-500/10" :
              weather === 'stormy' ? "border-purple-500/30 shadow-purple-500/10" :
              "border-slate-500/30 shadow-slate-500/10"
            )}>
              {/* Weather icon with glow */}
              <div className="relative">
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-md opacity-50",
                  `bg-gradient-to-br ${currentWeather.bgColor}`
                )} />
                <div className={cn(
                  "relative w-12 h-12 rounded-xl flex items-center justify-center",
                  `bg-gradient-to-br ${currentWeather.bgColor}`,
                  "shadow-lg border border-white/20"
                )}>
                  <span className="text-2xl drop-shadow-md">{currentWeather.effect}</span>
                </div>
              </div>

              {/* Weather info */}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  {currentWeather.label}
                </span>
                <span className={cn(
                  "text-xs font-medium",
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
        </div>
      </div>
    </div>
  )
}
