'use client'

import { User } from '@supabase/supabase-js'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from '@/app/(auth)/actions'
import { Flower2, BarChart3, Settings, User as UserIcon, ChevronUp, LogOut, Sparkles, TreeDeciduous } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const menuItems = [
  { title: 'Garden', url: '/garden', icon: Flower2, description: 'Grow your habits' },
  { title: 'Overview', url: '/overview', icon: TreeDeciduous, description: 'Forest view' },
  { title: 'Stats', url: '/stats', icon: BarChart3, description: 'Track progress' },
  { title: 'Profile', url: '/profile', icon: UserIcon, description: 'View achievements' },
  { title: 'Settings', url: '/settings', icon: Settings, description: 'Customize app' },
]

export function AppSidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  
  return (
    <Sidebar className="border-r border-slate-200 dark:border-slate-800">
      <SidebarHeader className="border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xl shadow-lg shadow-green-500/25">
              🌱
            </div>
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] shadow-sm">
              <Sparkles className="h-2.5 w-2.5 text-amber-900" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Habit Garden
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Grow daily habits
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="px-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={cn(
                        'h-12 rounded-xl transition-all duration-200',
                        isActive 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 text-green-700 dark:text-green-400 shadow-sm border border-green-200/50 dark:border-green-800/50' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                          isActive 
                            ? 'bg-green-500 text-white shadow-md shadow-green-500/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className={cn(
                            'text-sm font-medium',
                            isActive ? 'text-green-700 dark:text-green-400' : ''
                          )}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator className="my-4 mx-4" />
        
        {/* Quick tip section */}
        <div className="mx-4 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">💡</span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Daily Tip</span>
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 leading-relaxed">
            Water your plants daily to build a healthy streak!
          </p>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 dark:border-slate-800 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full h-14 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Avatar className="h-9 w-9 ring-2 ring-green-500/20 ring-offset-2 ring-offset-background">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white font-semibold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate w-full text-left">
                      {user?.user_metadata?.full_name || 'Gardener'}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate w-full text-left">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] rounded-xl p-1"
              >
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 rounded-lg cursor-pointer">
                    <UserIcon className="h-4 w-4" />
                    <span>View Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 rounded-lg cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem asChild>
                    <button className="w-full cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400 rounded-lg">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
