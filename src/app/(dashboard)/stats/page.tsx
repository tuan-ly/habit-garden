import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Flame, Calendar, TrendingUp } from 'lucide-react'

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
    .select('name, current_streak, longest_streak, total_waterings, plant_type:plant_types(icon)')
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground">
          Track your progress and see how your habits are growing
        </p>
      </div>

      {/* Weekly Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weeklyWaterings ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              waterings completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weeklyXp ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              experience points this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Activity
          </CardTitle>
          <CardDescription>Your watering activity over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-40">
            {stats?.last7Days.map((date) => {
              const count = stats.dailyWaterings[date] ?? 0
              const height = maxDaily > 0 ? (count / maxDaily) * 100 : 0
              const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = date === new Date().toISOString().split('T')[0]

              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-28">
                    <span className="text-xs font-medium mb-1">{count}</span>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        count > 0 ? 'bg-blue-500' : 'bg-muted'
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {dayName}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Plant Streaks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Current Streaks
          </CardTitle>
          <CardDescription>Keep your streaks alive by watering daily</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.plants && stats.plants.length > 0 ? (
            <div className="space-y-4">
              {stats.plants.map((plant) => {
                const plantType = Array.isArray(plant.plant_type)
                  ? plant.plant_type[0]
                  : plant.plant_type
                return (
                  <div key={plant.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {plantType?.icon ?? '🌱'}
                      </span>
                      <div>
                        <p className="font-medium">{plant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Best: {plant.longest_streak} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className={`h-5 w-5 ${plant.current_streak > 0 ? 'text-orange-500' : 'text-muted'}`} />
                      <span className={`text-lg font-bold ${plant.current_streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {plant.current_streak}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No growing plants yet. Start by adding a habit!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
