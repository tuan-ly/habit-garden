import { createClient } from '@/lib/supabase/server'
import { getProfile, getUserStats, getAchievementsData } from '@/lib/actions/profile'
import { getLevelInfo } from '@/lib/xp-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AchievementsGrid } from '@/components/gamification/achievements-grid'
import {
  Flower2,
  Droplets,
  Flame,
  Trophy,
  TreeDeciduous,
  Skull,
  Sprout,
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
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your gardening journey and stats
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-2xl">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">
                {profile?.display_name || user?.email?.split('@')[0]}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>

              {/* Level Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{levelInfo.badge}</span>
                    <span className="font-semibold">Level {levelInfo.level}</span>
                    <span className="text-sm text-muted-foreground">({levelInfo.title})</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {levelInfo.xpInCurrentLevel} / {levelInfo.xpToNextLevel} XP
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-2">
                Total XP: {profile?.xp ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
            <Flower2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPlants ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              habits planted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waterings</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWaterings ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              check-ins completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bestStreak ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.achievementsCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              unlocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plant Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Garden Overview</CardTitle>
          <CardDescription>Status of your habits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <Sprout className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {stats?.growing ?? 0}
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">Growing</p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
              <TreeDeciduous className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {stats?.mature ?? 0}
              </div>
              <p className="text-sm text-green-600 dark:text-green-500">Mature</p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <Skull className="h-8 w-8 mx-auto text-gray-500 mb-2" />
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {stats?.dead ?? 0}
              </div>
              <p className="text-sm text-gray-500">Dead</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Water Reserves */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Water Reserves
          </CardTitle>
          <CardDescription>
            Use water reserves to protect your plants when you cant water them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {Array.from({ length: profile?.water_reserves ?? 0 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
              >
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
            ))}
            {(profile?.water_reserves ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                No water reserves available. Earn them by leveling up!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {achievementsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
            <CardDescription>
              Track your progress and unlock rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AchievementsGrid
              progress={achievementsData.progress}
              unlockedIds={achievementsData.unlockedIds}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
