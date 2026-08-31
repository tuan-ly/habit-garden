import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { GameNav } from '@/components/game-ui/game-nav'
import { DashboardProviders } from './providers'
import { getAuthUser } from '@/lib/auth-cached'
import { getDashboardBootstrap } from '@/lib/actions/dashboard-bootstrap'
import { TimezoneSync } from '@/components/timezone-sync'
import { ClientModals } from './client-modals'
import { getActiveCapabilitySession } from '@/lib/actions/capabilities'
import { ActiveSessionBanner } from '@/components/game-ui/ActiveSessionBanner'
import { getNotifications } from '@/lib/actions/notifications'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { NativeReminderSync } from '@/components/notifications/native-reminder-sync'

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
  const [
    { mood: initialMood, profile, plantTypes },
    activeSessionResult,
    initialNotifications,
  ] = await Promise.all([
    getDashboardBootstrap(),
    getActiveCapabilitySession(),
    getNotifications(),
  ])
  const userTimezone = profile?.timezone ?? null
  const activeCapabilitySession = activeSessionResult.success
    ? activeSessionResult.data
    : null
  const hasExistingProgress = (profile?.xp ?? 0) > 0

  return (
    <DashboardProviders
      initialMood={initialMood}
      user={user}
      profile={profile}
      plantTypes={plantTypes}
    >
      <div className="min-h-screen relative ">
        <NativeReminderSync globallyEnabled={profile?.daily_reminder_enabled ?? true} />

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

        <ActiveSessionBanner activeSession={activeCapabilitySession} />

        <NotificationCenter initialNotifications={initialNotifications} />

        {/* Game-style bottom navigation - uses DashboardDataContext for user */}
        <GameNav />

        <Toaster />
        <ClientModals hasExistingProgress={hasExistingProgress} />
        <TimezoneSync currentTimezone={userTimezone} />
      </div>
    </DashboardProviders>
  )
}
