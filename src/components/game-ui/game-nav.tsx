'use client'

import { useState } from 'react'
import { Flower2, BarChart3, User as UserIcon, TreeDeciduous, Menu, X, Settings, LogOut, Trophy, Sparkles, Crown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@supabase/supabase-js'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  color: string
  activeColor: string
  glowColor: string
  premium?: boolean
}

const navItems: NavItem[] = [
  {
    title: 'Garden',
    url: '/garden',
    icon: Flower2,
    color: 'from-green-400 to-emerald-500',
    activeColor: 'bg-green-500',
    glowColor: 'shadow-green-500/50'
  },
  {
    title: 'Overview',
    url: '/overview',
    icon: TreeDeciduous,
    color: 'from-teal-400 to-cyan-500',
    activeColor: 'bg-teal-500',
    glowColor: 'shadow-teal-500/50'
  },
  {
    title: 'Stats',
    url: '/stats',
    icon: BarChart3,
    color: 'from-blue-400 to-indigo-500',
    activeColor: 'bg-blue-500',
    glowColor: 'shadow-blue-500/50'
  },
  {
    title: 'Identity',
    url: '/identity',
    icon: Crown,
    color: 'from-purple-400 to-violet-500',
    activeColor: 'bg-purple-500',
    glowColor: 'shadow-purple-500/50',
    premium: true
  },
  {
    title: 'Profile',
    url: '/profile',
    icon: Trophy,
    color: 'from-amber-400 to-orange-500',
    activeColor: 'bg-amber-500',
    glowColor: 'shadow-amber-500/50'
  },
]

interface GameNavProps {
  user: User | null
}

export function GameNav({ user }: GameNavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* Bottom Navigation Bar - Game Style - Floats over content */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-lg mx-auto px-3 pb-2 sm:px-4 sm:pb-3 pointer-events-auto">
          {/* Main nav container - Dark game style with transparency to see content behind */}
          <div className="relative bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-slate-800/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700/40 shadow-2xl shadow-black/50">
            {/* Top glow line */}
            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />

            <div className="flex items-center justify-around px-2 py-2 sm:px-3 sm:py-3">
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className="relative group flex flex-col items-center py-1 px-1 sm:py-1 sm:px-2 transition-all duration-300"
                  >
                    {/* Active background glow */}
                    {isActive && (
                      <div className={cn(
                        "absolute inset-0 rounded-2xl opacity-20 blur-xl",
                        `bg-gradient-to-br ${item.color}`
                      )} />
                    )}

                    {/* Icon container */}
                    <div className={cn(
                      "relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl transition-all duration-300",
                      isActive
                        ? `bg-gradient-to-br ${item.color} shadow-lg ${item.glowColor} scale-110 -translate-y-2`
                        : "bg-slate-800/80 group-hover:bg-slate-700/80 border border-slate-700/50"
                    )}>
                      {/* Inner glow for active */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/10" />
                      )}

                      <item.icon className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300 relative z-10",
                        isActive
                          ? "text-white drop-shadow-lg"
                          : "text-slate-400 group-hover:text-slate-200"
                      )} />

                      {/* Sparkle for active */}
                      {isActive && (
                        <Sparkles className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse drop-shadow-lg" />
                      )}

                      {/* Premium badge */}
                      {item.premium && !isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                          <Crown className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <span className={cn(
                      "text-[10px] sm:text-xs font-bold mt-1.5 transition-all duration-300 uppercase tracking-wider",
                      isActive
                        ? "text-white translate-y-0.5"
                        : "text-slate-500 group-hover:text-slate-300"
                    )}>
                      {item.title}
                    </span>

                    {/* Active dot indicator */}
                    {isActive && (
                      <div className={cn(
                        "absolute -bottom-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                        item.activeColor
                      )} />
                    )}
                  </Link>
                )
              })}

              {/* Menu Button */}
              <button
                onClick={() => setMenuOpen(true)}
                className="relative group flex flex-col items-center py-1 px-1 sm:py-1 sm:px-2 transition-all duration-300"
              >
                <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-800/80 group-hover:bg-slate-700/80 border border-slate-700/50 transition-all duration-300">
                  <Menu className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-slate-200 transition-colors" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold mt-1.5 text-slate-500 group-hover:text-slate-300 uppercase tracking-wider">
                  Menu
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Game Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute bottom-0 left-0 right-0 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-lg mx-auto p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50">
                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-lg shadow-lg shadow-green-500/30">
                      🌱
                    </div>
                    <div>
                      <h2 className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Habit Garden
                      </h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Menu</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* User profile section */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 ring-4 ring-green-500/20 ring-offset-2 ring-offset-white dark:ring-offset-slate-900">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-xl font-bold">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg truncate">
                        {user?.user_metadata?.full_name || 'Gardener'}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Profile</p>
                      <p className="text-xs text-slate-500">View achievements & stats</p>
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-md shadow-slate-500/30 group-hover:scale-110 transition-transform">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Settings</p>
                      <p className="text-xs text-slate-500">Customize your garden</p>
                    </div>
                  </Link>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/30 group-hover:scale-110 transition-transform">
                        <LogOut className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-red-600 dark:text-red-400">Sign Out</p>
                        <p className="text-xs text-slate-500">See you later!</p>
                      </div>
                    </button>
                  </form>
                </div>

                {/* Footer tip */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-t border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Daily Tip</p>
                      <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70">
                        Keep your streak alive by watering plants daily!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
