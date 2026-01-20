import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { OnboardingModal } from '@/components/onboarding'
import { GameNav } from '@/components/game-ui'
import { DashboardProviders } from './providers'
import { getTodayMood } from '@/lib/actions/mood'
import { MoodProactivePrompt } from '@/components/mood'
import { TimezoneSync } from '@/components/timezone-sync'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch initial mood for the provider
  const initialMood = await getTodayMood()

  // Fetch user's timezone for auto-sync
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()
  const userTimezone = profile?.timezone ?? null

  // Fetch initial weeds for all plants
  const { data: plantsWithWeeds } = await supabase
    .from('plants')
    .select('id, weed_count')
    .eq('user_id', user.id)
    .gt('weed_count', 0)

  const initialWeeds: { [plantId: string]: number } = {}
  if (plantsWithWeeds) {
    plantsWithWeeds.forEach((plant) => {
      initialWeeds[plant.id] = plant.weed_count || 0
    })
  }

  return (
    <DashboardProviders initialMood={initialMood} initialWeeds={initialWeeds}>
      <div className="min-h-screen relative ">
        {/* Animated gradient background */}
        <div className="fixed inset-0 bg-gradient-to-br from-sky-200 via-emerald-100 to-green-200 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950" />

        {/* Subtle animated patterns */}
        <div className="fixed inset-0 opacity-30 dark:opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-300 dark:bg-green-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-300 dark:bg-emerald-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-200 dark:bg-teal-600 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        </div>

        {/* Subtle grid pattern overlay */}
        <div className="fixed inset-0 opacity-5 dark:opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* Main content area - full screen, children handle their own scrolling */}
        <main className="relative h-dvh">
          {children}
        </main>

        {/* Game-style bottom navigation */}
        <GameNav user={user} />

        <Toaster />
        <OnboardingModal />
        <MoodProactivePrompt />
        <TimezoneSync currentTimezone={userTimezone} />
      </div>
    </DashboardProviders>
  )
}
