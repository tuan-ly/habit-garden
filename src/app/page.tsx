import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Droplets, Flame, Trophy, Sprout } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-white dark:from-green-950 dark:to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span className="font-bold text-xl">Habit Garden</span>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>

        <main className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="text-6xl mb-6">🌳</div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Grow Your Habits,
            <br />
            <span className="text-green-600">Watch Them Flourish</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Transform your daily habits into a beautiful garden. Each habit is a plant that needs your care to grow.
            Water it daily, watch it flourish, and build lasting positive change.
          </p>

          <div className="flex gap-4 mb-16">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signup">Start Growing Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-card border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4 mx-auto">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Daily Check-ins</h3>
              <p className="text-sm text-muted-foreground">
                Water your plants daily to keep them healthy and growing
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-card border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4 mx-auto">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Build Streaks</h3>
              <p className="text-sm text-muted-foreground">
                Keep your streaks alive and earn bonus XP for consistency
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-card border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4 mx-auto">
                <Sprout className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Watch Growth</h3>
              <p className="text-sm text-muted-foreground">
                See your habits mature from seeds to mighty trees
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-card border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4 mx-auto">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2">Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Unlock achievements and level up as you progress
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built with love for habit builders everywhere</p>
        </div>
      </footer>
    </div>
  )
}
