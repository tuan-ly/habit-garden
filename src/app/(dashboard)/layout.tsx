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

  // Fetch user's timezone and subscription tier for auto-sync
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone, subscription_tier')
    .eq('id', user.id)
    .single()
  const userTimezone = profile?.timezone ?? null
  const initialTier = (profile?.subscription_tier as 'free' | 'pro' | 'premium') ?? 'free'

  return (
    <DashboardProviders initialMood={initialMood} initialTier={initialTier}>
      <div className="min-h-screen relative ">
        {/* Static gradient background - single layer, no animations for better performance */}
        <div className="fixed inset-0 bg-gradient-to-br from-sky-200 via-emerald-100 to-green-200 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 pointer-events-none" />

        {/* Static soft glow accents - no animations, GPU-composited via will-change */}
        <div className="fixed inset-0 opacity-20 dark:opacity-15 pointer-events-none" style={{ willChange: 'auto' }}>
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-300 dark:bg-green-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-300 dark:bg-emerald-500 rounded-full blur-3xl" />
        </div>

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
