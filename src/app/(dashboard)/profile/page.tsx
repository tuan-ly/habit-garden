import { createClient } from '@/lib/supabase/server'
import { getProfile, getUserStats, getAchievementsData } from '@/lib/actions/profile'
import { getLevelInfo } from '@/lib/xp-system'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AchievementsGrid } from '@/components/gamification/achievements-grid'
import { TimezoneSelector } from '@/components/profile'
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
    <div className="h-full overflow-y-auto pt-3 px-3 pb-36 sm:pt-4 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Profile Header - Game Style */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 dark:border-slate-700/50 shadow-xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar with level ring */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse opacity-50" />
              <Avatar className="relative h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white dark:ring-slate-800">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Level badge */}
              <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 text-white text-sm sm:text-base font-bold">
                {levelInfo.level}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <h2 className="text-xl sm:text-2xl font-bold truncate">
                  {profile?.display_name || user?.email?.split('@')[0]}
                </h2>
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4 truncate">{user?.email}</p>

              {/* Level & XP Progress */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xl sm:text-2xl">{levelInfo.badge}</span>
                    <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400">{levelInfo.title}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-500">
                    {profile?.xp.toLocaleString()} XP
                  </span>
                </div>
                <div className="relative h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 text-right">
                  {(levelInfo.xpForNextLevel - (profile?.xp || 0)).toLocaleString()} XP to next level
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Game Style */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Flower2, label: 'Total Plants', value: stats?.totalPlants ?? 0, sub: 'habits', color: 'from-green-400 to-emerald-500', shadow: 'shadow-green-500/30' },
            { icon: Droplets, label: 'Waterings', value: stats?.totalWaterings ?? 0, sub: 'check-ins', color: 'from-blue-400 to-cyan-500', shadow: 'shadow-blue-500/30' },
            { icon: Flame, label: 'Best Streak', value: stats?.bestStreak ?? 0, sub: 'days', color: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/30' },
            { icon: Trophy, label: 'Achievements', value: stats?.achievementsCount ?? 0, sub: 'unlocked', color: 'from-amber-400 to-yellow-500', shadow: 'shadow-amber-500/30' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 dark:border-slate-700/50 shadow-lg card-lift"
            >
              <div className={`absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
              <div className="relative">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md ${stat.shadow} mb-2 sm:mb-3`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Garden Overview - Game Style */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/30">
              <span className="text-base sm:text-lg">🌳</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Garden Overview</h2>
              <p className="text-[10px] sm:text-xs text-slate-500">Status of your habits</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-center">
              <div className="w-9 h-9 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/30">
                <span className="text-base sm:text-xl">🌱</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats?.growing ?? 0}</p>
              <p className="text-[10px] sm:text-xs text-green-600/70 dark:text-green-400/70">Growing</p>
            </div>

            <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-center">
              <div className="w-9 h-9 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <span className="text-base sm:text-xl">🌳</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.mature ?? 0}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70">Mature</p>
            </div>

            <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 text-center">
              <div className="w-9 h-9 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-md">
                <span className="text-base sm:text-xl">🪦</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-500">{stats?.dead ?? 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-400">Dead</p>
            </div>
          </div>
        </div>

        {/* Timezone Selector */}
        <TimezoneSelector currentTimezone={profile?.timezone || 'Asia/Ho_Chi_Minh'} />

        {/* Water Reserves - Game Style */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Water Reserves</h2>
              <p className="text-[10px] sm:text-xs text-slate-500">Protect your plants when away</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {Array.from({ length: profile?.water_reserves ?? 0 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30 animate-gentle-float"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <Droplets className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            ))}
            {(profile?.water_reserves ?? 0) === 0 && (
              <div className="text-center py-3 sm:py-4 w-full">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Droplets className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                </div>
                <p className="text-sm sm:text-base text-slate-500">No water reserves</p>
                <p className="text-[10px] sm:text-xs text-slate-400">Level up to earn reserves!</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements - Game Style */}
        {achievementsData && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold">Achievements</h2>
                <p className="text-[10px] sm:text-xs text-slate-500">Track your progress</p>
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
