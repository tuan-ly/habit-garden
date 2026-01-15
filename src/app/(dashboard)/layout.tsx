import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { OnboardingModal } from '@/components/onboarding'
import { GameNav } from '@/components/game-ui'

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-green-50 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Main content area - full screen with padding for nav */}
      <main className="min-h-screen pb-24">
        {children}
      </main>

      {/* Game-style bottom navigation */}
      <GameNav user={user} />

      <Toaster />
      <OnboardingModal />
    </div>
  )
}
