import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { GameNav } from '@/components/game-ui/game-nav'
import { DashboardProviders } from './providers'
import { getAuthUser } from '@/lib/auth-cached'
import { getDashboardBootstrap } from '@/lib/actions/dashboard-bootstrap'
import { TimezoneSync } from '@/components/timezone-sync'
import { ClientModals } from './client-modals'
import { getReadingJourneySnapshot } from '@/lib/actions/habit-sessions'
import { ActiveSessionBanner } from '@/components/game-ui/ActiveSessionBanner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use cached getAuthUser — shared with all server actions in this request
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  // One read-model request replaces the three shell queries.
  const [{ mood: initialMood, profile, plantTypes }, readingJourney] = await Promise.all([
    getDashboardBootstrap(),
    getReadingJourneySnapshot(),
  ])
  const userTimezone = profile?.timezone ?? null
  const activeReadingSession = readingJourney.success
    ? readingJourney.data.active_session
    : null

  return (
    <DashboardProviders
      initialMood={initialMood}
      user={user}
      profile={profile}
      plantTypes={plantTypes}
    >
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

        <ActiveSessionBanner activeSession={activeReadingSession} />

        {/* Game-style bottom navigation - uses DashboardDataContext for user */}
        <GameNav />

        <Toaster />
        <ClientModals />
        <TimezoneSync currentTimezone={userTimezone} />
      </div>
    </DashboardProviders>
  )
}
