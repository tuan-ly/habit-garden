'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bell,
  BellRing,
  CheckCheck,
  CircleAlert,
  Clock3,
  Leaf,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  getNotifications,
  markNotificationsRead,
} from '@/lib/actions/notifications'
import {
  getNotificationCopy,
  getNotificationHref,
} from '@/lib/notification-system'
import { showBrowserNotification } from '@/lib/native-notifications'
import type { NotificationInboxItem } from '@/types/notifications'

interface NotificationCenterProps {
  initialNotifications: NotificationInboxItem[]
}

function NotificationTypeIcon({ type }: { type: string }) {
  if (type === 'goal_warning') return <Target className="h-4 w-4" />
  if (type === 'habit_reminder' || type === 'reminder') return <Clock3 className="h-4 w-4" />
  if (type === 'achievement' || type === 'streak') return <Trophy className="h-4 w-4" />
  if (type === 'plant_critical' || type === 'plant_died') return <CircleAlert className="h-4 w-4" />
  if (type === 'plant_matured') return <Sparkles className="h-4 w-4" />
  return <Leaf className="h-4 w-4" />
}

function formatNotificationTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function NotificationCenter({ initialNotifications }: NotificationCenterProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const knownIds = useRef(new Set(initialNotifications.map(notification => notification.id)))

  const unreadIds = notifications
    .filter(notification => !notification.read)
    .map(notification => notification.id)

  const refresh = useCallback(async () => {
    const next = await getNotifications(40)
    const fresh = next.filter(notification => !knownIds.current.has(notification.id))

    for (const notification of fresh) {
      knownIds.current.add(notification.id)
      showBrowserNotification(notification)
    }

    setNotifications(next)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh()
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [refresh])

  const markRead = (ids: string[]) => {
    if (ids.length === 0) return
    setNotifications(current => current.map(notification => (
      ids.includes(notification.id) ? { ...notification, read: true } : notification
    )))
    void markNotificationsRead(ids)
  }

  const isGarden = pathname === '/garden'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={unreadIds.length > 0
            ? `${unreadIds.length} thông báo chưa đọc`
            : 'Mở thông báo'}
          className={cn(
            'fixed z-[61] grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-[#fffaf0]/92 text-[#49693f] shadow-[0_12px_34px_rgba(41,69,38,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]',
            open && 'pointer-events-none opacity-0',
            isGarden
              ? 'right-[4.65rem] top-[max(1rem,env(safe-area-inset-top))] sm:left-[calc(50%+8.75rem)] sm:right-auto'
              : 'right-4 top-[max(1rem,env(safe-area-inset-top))] sm:right-6'
          )}
        >
          {unreadIds.length > 0
            ? <BellRing className="h-5 w-5" />
            : <Bell className="h-5 w-5" />}
          {unreadIds.length > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#d56f4f] px-1 text-[10px] font-black text-white shadow-sm">
              {Math.min(unreadIds.length, 99)}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        closeLabel="Đóng thông báo"
        className="w-[min(92vw,26rem)] border-[#d7dfcc] bg-[#f9f3e7] p-0 text-[#355239] sm:max-w-[26rem]"
      >
        <SheetHeader className="border-b border-[#dce3d2] bg-[radial-gradient(circle_at_top_left,_rgba(218,232,199,0.85),_transparent_62%)] px-5 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle className="font-display text-2xl text-[#315027]">
                Lời nhắn từ khu vườn
              </SheetTitle>
              <SheetDescription className="mt-1 text-[#6f8069]">
                Nhắc habit, mục tiêu và những khoảnh khắc đáng nhớ.
              </SheetDescription>
            </div>
          </div>
          {unreadIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => markRead(unreadIds)}
              className="mt-3 w-fit rounded-full text-[#58734e] hover:bg-[#e7efdb]"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {notifications.length === 0 ? (
            <div className="mx-2 mt-10 rounded-[1.75rem] border border-dashed border-[#cbd7bf] bg-white/55 px-6 py-10 text-center">
              <Leaf className="mx-auto h-8 w-8 text-[#7d9a6c]" />
              <p className="mt-3 font-semibold">Khu vườn đang yên tĩnh</p>
              <p className="mt-1 text-sm text-[#71806c]">
                Lời nhắc và cảnh báo mới sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : notifications.map(notification => {
            const copy = getNotificationCopy(notification)
            const href = getNotificationHref(notification.data)
            const content = (
              <article
                className={cn(
                  'rounded-[1.35rem] border px-4 py-3.5 transition',
                  notification.read
                    ? 'border-transparent bg-white/45 text-[#5f7059]'
                    : 'border-[#cbd9bc] bg-white/90 text-[#315027] shadow-[0_8px_22px_rgba(64,88,55,0.08)]'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn(
                    'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full',
                    notification.read
                      ? 'bg-[#e8ecdf] text-[#74806e]'
                      : 'bg-[#dce9cc] text-[#547847]'
                  )}>
                    <NotificationTypeIcon type={notification.type} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold leading-snug">{copy.title}</h3>
                      {!notification.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#d56f4f]" />
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[#687762]">
                      {copy.body}
                    </p>
                    <time className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a9585]">
                      {formatNotificationTime(notification.createdAt)}
                    </time>
                  </div>
                </div>
              </article>
            )

            return href ? (
              <Link
                key={notification.id}
                href={href}
                onClick={() => {
                  markRead([notification.id])
                  setOpen(false)
                }}
                className="mb-2 block rounded-[1.35rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
              >
                {content}
              </Link>
            ) : (
              <button
                key={notification.id}
                type="button"
                onClick={() => markRead([notification.id])}
                className="mb-2 block w-full rounded-[1.35rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
              >
                {content}
              </button>
            )
          })}
        </div>

        <div className="border-t border-[#dce3d2] bg-white/45 p-4">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-center rounded-full border border-[#c9d6bd] bg-[#edf3e4] px-4 text-sm font-bold text-[#547348] transition hover:bg-[#e3edd8]"
          >
            Chỉnh lịch nhắc theo từng habit
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
