'use client'

import { cn } from '@/lib/utils'
import {
  getTodayWeather,
  getWeatherForecast,
  getWeatherEffectDescription,
  type WeatherConfig,
  WEATHER_CONFIGS,
} from '@/lib/weather-system'
import type { WeatherType } from '@/types/database'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface WeatherBadgeProps {
  weather?: WeatherConfig
  size?: 'sm' | 'md' | 'lg'
  showEffects?: boolean
  className?: string
}

export function WeatherBadge({
  weather: weatherProp,
  size = 'md',
  showEffects = false,
  className,
}: WeatherBadgeProps) {
  const weather = weatherProp || getTodayWeather()

  const sizeClasses = {
    sm: 'text-lg px-2 py-1',
    md: 'text-2xl px-3 py-1.5',
    lg: 'text-3xl px-4 py-2',
  }

  const effects = getWeatherEffectDescription(weather.type)

  const bgClasses: Record<WeatherType, string> = {
    sunny: 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
    cloudy: 'bg-gradient-to-r from-gray-100 to-slate-200 dark:from-gray-800/30 dark:to-slate-700/30',
    rainy: 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
    stormy: 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30',
    rainbow: 'bg-gradient-to-r from-pink-100 via-purple-100 to-cyan-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-cyan-900/30',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border',
              bgClasses[weather.type],
              sizeClasses[size],
              weather.type === 'rainbow' && 'weather-rainbow',
              className
            )}
          >
            <span>{weather.icon}</span>
            <span className="text-sm font-medium">{weather.name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{weather.name} Day</p>
            <p className="text-sm text-muted-foreground">{weather.description}</p>
            {effects.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {effects.map((effect, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                  >
                    {effect}
                  </span>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Weather forecast display
interface WeatherForecastProps {
  days?: number
  className?: string
}

export function WeatherForecast({ days = 5, className }: WeatherForecastProps) {
  const forecast = getWeatherForecast(days)
  const today = new Date()

  const dayLabels = forecast.map((_, i) => {
    if (i === 0) return 'Today'
    if (i === 1) return 'Tomorrow'

    const date = new Date(today)
    date.setDate(date.getDate() + i)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  })

  return (
    <div className={cn('p-4 bg-card rounded-lg border', className)}>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <span>📅</span>
        Weather Forecast
      </h3>

      <div className="flex justify-between gap-2">
        {forecast.map((weather, i) => (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg flex-1',
                    i === 0 && 'bg-primary/10'
                  )}
                >
                  <span className="text-xs text-muted-foreground">{dayLabels[i]}</span>
                  <span className="text-2xl">{weather.icon}</span>
                  <span className="text-xs font-medium truncate max-w-full">
                    {weather.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{weather.name}</p>
                <p className="text-xs text-muted-foreground">{weather.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  )
}

// Weather effects panel for today
interface WeatherEffectsPanelProps {
  className?: string
}

export function WeatherEffectsPanel({ className }: WeatherEffectsPanelProps) {
  const weather = getTodayWeather()
  const effects = getWeatherEffectDescription(weather.type)

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        weather.type === 'sunny' && 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800',
        weather.type === 'cloudy' && 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700',
        weather.type === 'rainy' && 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800',
        weather.type === 'stormy' && 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800',
        weather.type === 'rainbow' && 'bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-cyan-900/20 border-pink-200 dark:border-pink-800',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn('text-4xl', weather.type === 'rainbow' && 'weather-rainbow')}
        >
          {weather.icon}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{weather.name} Day</h3>
          <p className="text-sm text-muted-foreground mb-2">{weather.description}</p>

          {effects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {effects.map((effect, i) => (
                <span
                  key={i}
                  className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    effect.includes('+')
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  )}
                >
                  {effect}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact weather indicator
interface WeatherIndicatorProps {
  weather?: WeatherConfig
  className?: string
}

export function WeatherIndicator({ weather: weatherProp, className }: WeatherIndicatorProps) {
  const weather = weatherProp || getTodayWeather()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'text-xl cursor-help',
              weather.type === 'rainbow' && 'weather-rainbow',
              className
            )}
          >
            {weather.icon}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{weather.name}</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            {weather.description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Weather animation overlay
interface WeatherOverlayProps {
  weather?: WeatherType
  className?: string
}

export function WeatherOverlay({ weather: weatherType, className }: WeatherOverlayProps) {
  const weather = weatherType || getTodayWeather().type

  // Only show overlay for certain weather types
  if (weather === 'sunny' || weather === 'cloudy') return null

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-0 opacity-30', className)}>
      {weather === 'rainy' && <RainEffect />}
      {weather === 'stormy' && <StormEffect />}
      {weather === 'rainbow' && <RainbowEffect />}
    </div>
  )
}

// Rain animation
function RainEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-3 bg-blue-400/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animation: `water-drop ${0.5 + Math.random() * 0.5}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}

// Storm animation
function StormEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden weather-stormy">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-4 bg-purple-400/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animation: `water-drop ${0.3 + Math.random() * 0.3}s linear infinite`,
            animationDelay: `${Math.random() * 1}s`,
            transform: 'rotate(-20deg)',
          }}
        />
      ))}
    </div>
  )
}

// Rainbow effect
function RainbowEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-48 rounded-b-full opacity-20"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(255,0,0,0.2) 14%, rgba(255,165,0,0.2) 28%, rgba(255,255,0,0.2) 42%, rgba(0,128,0,0.2) 56%, rgba(0,0,255,0.2) 70%, rgba(75,0,130,0.2) 84%, rgba(238,130,238,0.2) 100%)',
        }}
      />
    </div>
  )
}
