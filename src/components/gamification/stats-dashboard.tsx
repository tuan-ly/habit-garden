'use client'

import { cn } from '@/lib/utils'
import { getLevelInfo } from '@/lib/xp-system'
import { getTodayWeather, getWeatherForecast } from '@/lib/weather-system'
import {
  Flame,
  TreeDeciduous,
  Sprout,
  Skull,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Award,
} from 'lucide-react'
import { XpProgress } from './xp-progress'
import { WeatherEffectsPanel, WeatherForecast } from './weather-display'
import type { Profile } from '@/types/database'

interface StatsDashboardProps {
  profile: Profile
  stats: {
    totalPlants: number
    growing: number
    mature: number
    dead: number
    totalWaterings: number
    achievementsCount: number
    bestStreak: number
    currentStreak?: number
  }
  className?: string
}

export function StatsDashboard({ profile, stats, className }: StatsDashboardProps) {
  const levelInfo = getLevelInfo(profile.xp)

  return (
    <div className={cn('space-y-6', className)}>
      {/* XP and Level */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Your Progress
        </h2>
        <XpProgress totalXp={profile.xp} size="lg" showDetails />
      </section>

      {/* Today's Weather */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Weather
        </h2>
        <WeatherEffectsPanel />
      </section>

      {/* Quick Stats Grid */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Quick Stats
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Current Streak */}
          <StatCard
            icon={<Flame className="h-5 w-5 text-orange-500" />}
            label="Current Streak"
            value={stats.currentStreak ?? 0}
            suffix="days"
            highlight={!!stats.currentStreak && stats.currentStreak >= 7}
          />

          {/* Best Streak */}
          <StatCard
            icon={<Trophy className="h-5 w-5 text-yellow-500" />}
            label="Best Streak"
            value={stats.bestStreak}
            suffix="days"
          />

          {/* Total Waterings */}
          <StatCard
            icon={<Droplets className="h-5 w-5 text-blue-500" />}
            label="Total Waterings"
            value={stats.totalWaterings}
          />

          {/* Achievements */}
          <StatCard
            icon={<Award className="h-5 w-5 text-purple-500" />}
            label="Achievements"
            value={stats.achievementsCount}
            suffix="unlocked"
          />
        </div>
      </section>

      {/* Plants Overview */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          Garden Overview
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <PlantStatCard
            icon={<Sprout className="h-6 w-6 text-emerald-500" />}
            label="Growing"
            value={stats.growing}
            color="emerald"
          />
          <PlantStatCard
            icon={<TreeDeciduous className="h-6 w-6 text-green-600" />}
            label="Mature"
            value={stats.mature}
            color="green"
          />
          <PlantStatCard
            icon={<Skull className="h-6 w-6 text-gray-500" />}
            label="Dead"
            value={stats.dead}
            color="gray"
          />
        </div>

        {/* Total plants progress */}
        <div className="mt-3 p-3 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Plants</span>
            <span className="font-semibold">{stats.totalPlants}</span>
          </div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
            {stats.growing > 0 && (
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${(stats.growing / stats.totalPlants) * 100}%` }}
              />
            )}
            {stats.mature > 0 && (
              <div
                className="bg-green-600 transition-all"
                style={{ width: `${(stats.mature / stats.totalPlants) * 100}%` }}
              />
            )}
            {stats.dead > 0 && (
              <div
                className="bg-gray-400 transition-all"
                style={{ width: `${(stats.dead / stats.totalPlants) * 100}%` }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Weather Forecast */}
      <section>
        <WeatherForecast days={5} />
      </section>
    </div>
  )
}

// Simple stat card
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  suffix?: string
  highlight?: boolean
}

function StatCard({ icon, label, value, suffix, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border bg-card',
        highlight && 'ring-2 ring-orange-500/50'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

// Plant stat card with color
interface PlantStatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: 'emerald' | 'green' | 'gray'
}

function PlantStatCard({ icon, label, value, color }: PlantStatCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    gray: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
  }

  return (
    <div className={cn('p-4 rounded-lg border text-center', colorClasses[color])}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// Compact stats row for header/sidebar
interface StatsRowProps {
  profile: Profile
  stats: {
    currentStreak?: number
    totalPlants: number
  }
  className?: string
}

export function StatsRow({ profile, stats, className }: StatsRowProps) {
  const levelInfo = getLevelInfo(profile.xp)
  const weather = getTodayWeather()

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      {/* Level */}
      <div className="flex items-center gap-1">
        <span>{levelInfo.badge}</span>
        <span className="font-medium">Lv.{levelInfo.level}</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <span>{profile.xp.toLocaleString()} XP</span>
      </div>

      {/* Streak */}
      {stats.currentStreak !== undefined && stats.currentStreak > 0 && (
        <div className="flex items-center gap-1 text-orange-500">
          <Flame className="h-4 w-4" />
          <span className="font-medium">{stats.currentStreak}</span>
        </div>
      )}

      {/* Weather */}
      <span className="text-lg" title={weather.name}>
        {weather.icon}
      </span>
    </div>
  )
}

// Mini dashboard for sidebar
interface MiniDashboardProps {
  profile: Profile
  stats: {
    totalPlants: number
    growing: number
    mature: number
    currentStreak?: number
  }
  className?: string
}

export function MiniDashboard({ profile, stats, className }: MiniDashboardProps) {
  const levelInfo = getLevelInfo(profile.xp)
  const weather = getTodayWeather()

  return (
    <div className={cn('space-y-3 p-3 bg-card rounded-lg border', className)}>
      {/* Level & XP */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{levelInfo.badge}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Level {levelInfo.level}</span>
            <span className="text-xs text-muted-foreground">
              {levelInfo.progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-muted/50">
          <Sprout className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
          <span className="text-sm font-medium">{stats.growing}</span>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <TreeDeciduous className="h-4 w-4 mx-auto text-green-600 mb-1" />
          <span className="text-sm font-medium">{stats.mature}</span>
        </div>
        <div className="p-2 rounded bg-muted/50">
          {stats.currentStreak ? (
            <>
              <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
              <span className="text-sm font-medium">{stats.currentStreak}</span>
            </>
          ) : (
            <>
              <Flame className="h-4 w-4 mx-auto text-gray-400 mb-1" />
              <span className="text-sm font-medium text-muted-foreground">0</span>
            </>
          )}
        </div>
      </div>

      {/* Weather */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">{weather.icon}</span>
        <span className="text-muted-foreground">{weather.name} day</span>
      </div>
    </div>
  )
}
