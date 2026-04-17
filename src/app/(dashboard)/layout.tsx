import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Toaster } from '@/components/ui/sonner'
import { GameNav } from '@/components/game-ui'
import { DashboardProviders } from './providers'
import { getTodayMood } from '@/lib/actions/mood'
import { getProfile } from '@/lib/actions/profile'
import { getPlantTypes } from '@/lib/actions/plants'
import { getAuthUser } from '@/lib/auth-cached'
import { TimezoneSync } from '@/components/timezone-sync'

// Dynamic imports for rarely-shown modals — reduces initial JS bundle
const OnboardingModal = dynamic(() => import('@/components/onboarding').then(m => ({ default: m.OnboardingModal })), { ssr: false })
const MoodProactivePrompt = dynamic(() => import('@/components/mood').then(m => ({ default: m.MoodProactivePrompt })), { ssr: false })

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

  // Fetch mood, profile, and plant types in parallel
  // All three internally call getAuthUser() which is deduped by React cache()
  const [initialMood, profile, plantTypes] = await Promise.all([
    getTodayMood(),
    getProfile(),
    getPlantTypes(),
  ])
  const userTimezone = profile?.timezone ?? null

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

        {/* Game-style bottom navigation - uses DashboardDataContext for user */}
        <GameNav />

        <Toaster />
        <OnboardingModal />
        <MoodProactivePrompt />
        <TimezoneSync currentTimezone={userTimezone} />
      </div>
    </DashboardProviders>
  )
}
