import { createClient } from '@/lib/supabase/server'
import { Droplets, Flame, Calendar, TrendingUp, Sparkles } from 'lucide-react'

async function getWateringStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get last 7 days of waterings
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentWaterings } = await supabase
    .from('watering_logs')
    .select('watered_date, xp_earned')
    .eq('user_id', user.id)
    .gte('watered_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('watered_date', { ascending: true })

  // Get all plants with streaks
  const { data: plants } = await supabase
    .from('plants')
    .select('id, name, current_streak, longest_streak, total_waterings, plant_type:plant_types(icon)')
    .eq('user_id', user.id)
    .eq('status', 'growing')
    .order('current_streak', { ascending: false })

  // Calculate weekly stats
  const weeklyWaterings = recentWaterings?.length ?? 0
  const weeklyXp = recentWaterings?.reduce((sum, w) => sum + (w.xp_earned ?? 0), 0) ?? 0

  // Group waterings by day
  const dailyWaterings: Record<string, number> = {}
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  last7Days.forEach(date => {
    dailyWaterings[date] = 0
  })

  recentWaterings?.forEach(w => {
    if (dailyWaterings[w.watered_date] !== undefined) {
      dailyWaterings[w.watered_date]++
    }
  })

  return {
    weeklyWaterings,
    weeklyXp,
    dailyWaterings,
    last7Days,
    plants: plants ?? [],
  }
}

export default async function StatsPage() {
  const stats = await getWateringStats()

  const maxDaily = Math.max(...Object.values(stats?.dailyWaterings ?? {}), 1)

  return (
    <div className="h-full overflow-y-auto pt-3 px-3 pb-36 sm:pt-4 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Statistics</h1>
            <p className="text-xs sm:text-sm text-slate-500">Track your growth journey</p>
          </div>
        </div>

        {/* Weekly Summary - Game Style Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2">
          <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-lg card-lift">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                  <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-500">This Week</span>
              </div>
              <p className="text-2xl sm:text-4xl font-bold">{stats?.weeklyWaterings ?? 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">waterings</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-lg card-lift">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-500">XP Earned</span>
              </div>
              <p className="text-2xl sm:text-4xl font-bold">{stats?.weeklyXp ?? 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">experience</p>
            </div>
          </div>
        </div>

        {/* Activity Chart - Game Style */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/30">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Weekly Activity</h2>
              <p className="text-[10px] sm:text-xs text-slate-500">Last 7 days</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-28 sm:h-40 mt-3 sm:mt-4">
            {stats?.last7Days.map((date) => {
              const count = stats.dailyWaterings[date] ?? 0
              const height = maxDaily > 0 ? (count / maxDaily) * 100 : 0
              const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = date === new Date().toISOString().split('T')[0]

              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-20 sm:h-28">
                    <span className="text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1">{count}</span>
                    <div
                      className={`w-full rounded-lg sm:rounded-xl transition-all ${
                        count > 0
                          ? 'bg-gradient-to-t from-blue-500 to-cyan-400 shadow-md shadow-blue-500/30'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      style={{ height: `${Math.max(height, 8)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] sm:text-xs ${isToday ? 'font-bold text-blue-500' : 'text-slate-400'}`}>
                    {dayName}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Plant Streaks - Game Style */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Current Streaks</h2>
              <p className="text-[10px] sm:text-xs text-slate-500">Keep them alive!</p>
            </div>
          </div>

          {stats?.plants && stats.plants.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
              {stats.plants.map((plant) => {
                const plantType = Array.isArray(plant.plant_type)
                  ? plant.plant_type[0]
                  : plant.plant_type
                const isOnFire = plant.current_streak >= 7
                return (
                  <div
                    key={plant.id}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center shrink-0">
                        <span className="text-lg sm:text-2xl">
                          {plantType?.icon ?? '🌱'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-semibold truncate">{plant.name}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">
                          Best: {plant.longest_streak} days
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shrink-0 ${
                      plant.current_streak > 0
                        ? isOnFire
                          ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md shadow-orange-500/30'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                      <Flame className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isOnFire ? 'animate-pulse' : ''}`} />
                      <span className="text-sm sm:text-base font-bold">{plant.current_streak}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">🌱</span>
              </div>
              <p className="text-sm sm:text-base text-slate-500">No growing plants yet</p>
              <p className="text-xs sm:text-sm text-slate-400">Start by adding a habit!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
