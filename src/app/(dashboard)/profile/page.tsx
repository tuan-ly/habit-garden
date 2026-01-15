import { createClient } from '@/lib/supabase/server'
import { getProfile, getUserStats, getAchievementsData } from '@/lib/actions/profile'
import { getLevelInfo } from '@/lib/xp-system'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AchievementsGrid } from '@/components/gamification/achievements-grid'
import {
  Flower2,
  Droplets,
  Flame,
  Trophy,
  Star,
} from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profile, stats, achievementsData] = await Promise.all([
    getProfile(),
    getUserStats(),
    getAchievementsData(),
  ])

  const levelInfo = profile ? getLevelInfo(profile.xp) : {
    level: 1,
    xpInCurrentLevel: 0,
    xpToNextLevel: 100,
    progress: 0,
    title: 'Seedling',
    badge: '🌱',
    totalXp: 0,
    xpForCurrentLevel: 0,
    xpForNextLevel: 100,
  }

  return (
    <div className="min-h-screen pt-4 px-4 pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header - Game Style */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-slate-700/50 shadow-xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar with level ring */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse opacity-50" />
              <Avatar className="relative h-24 w-24 ring-4 ring-white dark:ring-slate-800">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Level badge */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 text-white font-bold">
                {levelInfo.level}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-bold">
                  {profile?.display_name || user?.email?.split('@')[0]}
                </h2>
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <p className="text-sm text-slate-500 mb-4">{user?.email}</p>

              {/* Level & XP Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{levelInfo.badge}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{levelInfo.title}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    {profile?.xp.toLocaleString()} XP
                  </span>
                </div>
                <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                </div>
                <p className="text-xs text-slate-400 text-right">
                  {(levelInfo.xpForNextLevel - (profile?.xp || 0)).toLocaleString()} XP to next level
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Game Style */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Flower2, label: 'Total Plants', value: stats?.totalPlants ?? 0, sub: 'habits planted', color: 'from-green-400 to-emerald-500', shadow: 'shadow-green-500/30' },
            { icon: Droplets, label: 'Waterings', value: stats?.totalWaterings ?? 0, sub: 'check-ins', color: 'from-blue-400 to-cyan-500', shadow: 'shadow-blue-500/30' },
            { icon: Flame, label: 'Best Streak', value: stats?.bestStreak ?? 0, sub: 'days', color: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/30' },
            { icon: Trophy, label: 'Achievements', value: stats?.achievementsCount ?? 0, sub: 'unlocked', color: 'from-amber-400 to-yellow-500', shadow: 'shadow-amber-500/30' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 dark:border-slate-700/50 shadow-lg card-lift"
            >
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md ${stat.shadow} mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Garden Overview - Game Style */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/30">
              <span className="text-lg">🌳</span>
            </div>
            <div>
              <h2 className="font-bold">Garden Overview</h2>
              <p className="text-xs text-slate-500">Status of your habits</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/30">
                <span className="text-xl">🌱</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.growing ?? 0}</p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">Growing</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <span className="text-xl">🌳</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.mature ?? 0}</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Mature</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-md">
                <span className="text-xl">🪦</span>
              </div>
              <p className="text-2xl font-bold text-slate-500">{stats?.dead ?? 0}</p>
              <p className="text-xs text-slate-400">Dead</p>
            </div>
          </div>
        </div>

        {/* Water Reserves - Game Style */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold">Water Reserves</h2>
              <p className="text-xs text-slate-500">Protect your plants when away</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {Array.from({ length: profile?.water_reserves ?? 0 }).map((_, i) => (
              <div
                key={i}
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30 animate-gentle-float"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <Droplets className="h-6 w-6 text-white" />
              </div>
            ))}
            {(profile?.water_reserves ?? 0) === 0 && (
              <div className="text-center py-4 w-full">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Droplets className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500">No water reserves</p>
                <p className="text-xs text-slate-400">Level up to earn reserves!</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements - Game Style */}
        {achievementsData && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold">Achievements</h2>
                <p className="text-xs text-slate-500">Track your progress</p>
              </div>
            </div>
            <AchievementsGrid
              progress={achievementsData.progress}
              unlockedIds={achievementsData.unlockedIds}
            />
          </div>
        )}
      </div>
    </div>
  )
}
