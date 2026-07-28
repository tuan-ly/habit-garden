'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/lib/context/dashboard-data-context'
import { cn } from '@/lib/utils'
import { BookOpenText, Leaf, MapPinned } from 'lucide-react'

export function GameNav() {
  const pathname = usePathname()
  const user = useUser()

  if (pathname === '/garden') return null

  const initials = (user?.user_metadata?.full_name || user?.email || 'G')
    .trim()
    .charAt(0)
    .toUpperCase()

  const items = [
    { label: 'Vườn', href: '/garden', icon: Leaf },
    { label: 'Đọc', href: '/reading', icon: BookOpenText },
    { label: 'Hành trình', href: '/overview', icon: MapPinned },
  ]

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
      aria-label="Điều hướng chính"
    >
      <div className="pointer-events-auto mx-auto mb-[max(0.65rem,env(safe-area-inset-bottom))] flex w-fit items-center gap-1 rounded-full border border-white/65 bg-[#fffaf0]/92 p-1.5 shadow-[0_18px_45px_rgba(32,61,38,0.2)] backdrop-blur-2xl">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-12 min-w-[5.75rem] items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]',
                active
                  ? 'bg-[#5f854f] text-white shadow-[0_8px_18px_rgba(69,105,57,0.22)]'
                  : 'text-[#607258] hover:bg-[#edf2e4]'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'fill-white/15')} />
              {item.label}
            </Link>
          )
        })}

        <Link
          href="/profile"
          aria-label="Tôi"
          className={cn(
            'rounded-full p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]',
            pathname.startsWith('/profile') || pathname.startsWith('/settings') || pathname.startsWith('/identity')
              ? 'bg-[#dfe9d3] ring-2 ring-[#6f925e]'
              : 'hover:bg-[#edf2e4]'
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="" />
            <AvatarFallback className="bg-[#dce8cb] text-sm font-bold text-[#49693f]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </nav>
  )
}
