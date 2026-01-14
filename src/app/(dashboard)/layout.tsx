import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'

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
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="flex h-12 shrink-0 items-center gap-4 border-b px-4 lg:px-6">
          <SidebarTrigger />
        </header>
        <div className="flex-1 overflow-auto p-3 lg:p-4">
          {children}
        </div>
      </main>
      <Toaster />
    </SidebarProvider>
  )
}
