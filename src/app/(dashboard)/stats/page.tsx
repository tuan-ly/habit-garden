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
    <div className="min-h-screen pt-4 px-4 pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Statistics</h1>
            <p className="text-sm text-slate-500">Track your growth journey</p>
          </div>
        </div>

        {/* Weekly Summary - Game Style Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-lg card-lift">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-500">This Week</span>
              </div>
              <p className="text-4xl font-bold">{stats?.weeklyWaterings ?? 0}</p>
              <p className="text-sm text-slate-500 mt-1">waterings completed</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-lg card-lift">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-500">XP Earned</span>
              </div>
              <p className="text-4xl font-bold">{stats?.weeklyXp ?? 0}</p>
              <p className="text-sm text-slate-500 mt-1">experience this week</p>
            </div>
          </div>
        </div>

        {/* Activity Chart - Game Style */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/30">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold">Weekly Activity</h2>
              <p className="text-xs text-slate-500">Last 7 days</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-40 mt-4">
            {stats?.last7Days.map((date) => {
              const count = stats.dailyWaterings[date] ?? 0
              const height = maxDaily > 0 ? (count / maxDaily) * 100 : 0
              const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = date === new Date().toISOString().split('T')[0]

              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-28">
                    <span className="text-xs font-bold mb-1">{count}</span>
                    <div
                      className={`w-full rounded-xl transition-all ${
                        count > 0
                          ? 'bg-gradient-to-t from-blue-500 to-cyan-400 shadow-md shadow-blue-500/30'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      style={{ height: `${Math.max(height, 8)}%` }}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? 'font-bold text-blue-500' : 'text-slate-400'}`}>
                    {dayName}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Plant Streaks - Game Style */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold">Current Streaks</h2>
              <p className="text-xs text-slate-500">Keep them alive!</p>
            </div>
          </div>

          {stats?.plants && stats.plants.length > 0 ? (
            <div className="space-y-3 mt-4">
              {stats.plants.map((plant) => {
                const plantType = Array.isArray(plant.plant_type)
                  ? plant.plant_type[0]
                  : plant.plant_type
                const isOnFire = plant.current_streak >= 7
                return (
                  <div
                    key={plant.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                        <span className="text-2xl">
                          {plantType?.icon ?? '🌱'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{plant.name}</p>
                        <p className="text-xs text-slate-500">
                          Best: {plant.longest_streak} days
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      plant.current_streak > 0
                        ? isOnFire
                          ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md shadow-orange-500/30'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                      <Flame className={`h-4 w-4 ${isOnFire ? 'animate-pulse' : ''}`} />
                      <span className="font-bold">{plant.current_streak}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-3xl">🌱</span>
              </div>
              <p className="text-slate-500">No growing plants yet</p>
              <p className="text-sm text-slate-400">Start by adding a habit!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
