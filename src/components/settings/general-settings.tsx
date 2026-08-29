'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  BellRing,
  Clock3,
  Loader2,
  Palette,
  Save,
  Shield,
  Smartphone,
  Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateTheme, updateNotificationPrefs } from '@/lib/actions/profile'
import {
  getHabitReminderSettings,
  updateHabitReminder,
} from '@/lib/actions/notifications'
import {
  getDeviceNotificationPermission,
  isNativeNotificationPlatform,
  requestDeviceNotificationPermission,
  syncNativeHabitReminders,
} from '@/lib/native-notifications'
import { formatGoalValue } from '@/lib/notification-system'
import type {
  DeviceNotificationPermission,
  HabitReminderSetting,
} from '@/types/notifications'
import { ChangePasswordDialog } from './change-password-dialog'

interface NotificationSettingsProps {
  defaultDailyReminder?: boolean
  defaultAchievementNotifications?: boolean
}

export function NotificationSettings({
  defaultDailyReminder = true,
  defaultAchievementNotifications = true,
}: NotificationSettingsProps) {
  const [daily, setDaily] = useState(defaultDailyReminder)
  const [achievements, setAchievements] = useState(defaultAchievementNotifications)
  const [savingDaily, setSavingDaily] = useState(false)
  const [savingAch, setSavingAch] = useState(false)
  const [loadingReminders, setLoadingReminders] = useState(true)
  const [savingPlantId, setSavingPlantId] = useState<string | null>(null)
  const [requestingPermission, setRequestingPermission] = useState(false)
  const [permission, setPermission] = useState<DeviceNotificationPermission>('prompt')
  const [reminders, setReminders] = useState<HabitReminderSetting[]>([])
  const [persistedReminders, setPersistedReminders] = useState<HabitReminderSetting[]>([])

  useEffect(() => {
    let cancelled = false

    void Promise.all([
      getHabitReminderSettings(),
      getDeviceNotificationPermission(),
    ]).then(([settings, nextPermission]) => {
      if (cancelled) return
      setReminders(settings)
      setPersistedReminders(settings)
      setPermission(nextPermission)
      setLoadingReminders(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const toggleDaily = async (next: boolean) => {
    setSavingDaily(true)
    setDaily(next)
    const result = await updateNotificationPrefs({ daily_reminder_enabled: next })
    if (!result.success) {
      setDaily(!next)
      toast.error(result.error || 'Failed to update')
    } else {
      toast.success(next ? 'Đã bật nhắc hằng ngày' : 'Đã tắt nhắc hằng ngày')
      void syncNativeHabitReminders(reminders, next)
    }
    setSavingDaily(false)
  }

  const requestPermission = async () => {
    setRequestingPermission(true)
    const nextPermission = await requestDeviceNotificationPermission()
    setPermission(nextPermission)
    setRequestingPermission(false)

    if (nextPermission === 'granted') {
      await syncNativeHabitReminders(reminders, daily)
      toast.success('Thiết bị đã sẵn sàng nhận lời nhắc')
    } else if (nextPermission === 'denied') {
      toast.error('Quyền thông báo đang bị chặn trong cài đặt thiết bị')
    }
  }

  const patchReminder = (plantId: string, patch: Partial<HabitReminderSetting>) => {
    setReminders(current => current.map(reminder => (
      reminder.plantId === plantId ? { ...reminder, ...patch } : reminder
    )))
  }

  const saveReminder = async (reminder: HabitReminderSetting) => {
    setSavingPlantId(reminder.plantId)
    const result = await updateHabitReminder({
      plantId: reminder.plantId,
      enabled: reminder.enabled,
      time: reminder.time,
    })

    if (!result.success) {
      const persisted = persistedReminders.find(item => item.plantId === reminder.plantId)
      if (persisted) patchReminder(reminder.plantId, persisted)
      toast.error(result.error || 'Không thể lưu lịch nhắc')
    } else {
      const nextReminders = reminders.map(item => (
        item.plantId === reminder.plantId ? reminder : item
      ))
      setReminders(nextReminders)
      setPersistedReminders(current => current.map(item => (
        item.plantId === reminder.plantId ? reminder : item
      )))
      toast.success(`Đã lưu lịch nhắc cho ${reminder.plantName}`)
      await syncNativeHabitReminders(nextReminders, daily)
    }
    setSavingPlantId(null)
  }

  const changeReminderEnabled = async (
    reminder: HabitReminderSetting,
    enabled: boolean
  ) => {
    const nextReminder = { ...reminder, enabled }
    patchReminder(reminder.plantId, { enabled })
    await saveReminder(nextReminder)
  }

  const permissionCopy = permission === 'granted'
    ? 'Đã bật trên thiết bị này'
    : permission === 'denied'
      ? 'Đang bị chặn trong cài đặt thiết bị'
      : permission === 'unsupported'
        ? 'Trình duyệt này không hỗ trợ thông báo hệ thống'
        : 'Chưa cấp quyền trên thiết bị này'

  const toggleAch = async (next: boolean) => {
    setSavingAch(true)
    setAchievements(next)
    const result = await updateNotificationPrefs({ achievement_notifications: next })
    if (!result.success) {
      setAchievements(!next)
      toast.error(result.error || 'Failed to update')
    } else {
      toast.success(next ? 'Achievement notifications on' : 'Achievement notifications off')
    }
    setSavingAch(false)
  }

  return (
    <Card className="overflow-hidden border-[#d6dfca] bg-[#fffaf0]/88 text-[#355239] shadow-[0_16px_42px_rgba(58,82,50,0.08)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(218,232,199,0.8),_transparent_62%)]">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Nhắc nhở hằng ngày
        </CardTitle>
        <CardDescription className="text-[#71806c]">
          Mỗi habit có giờ riêng; lời nhắc tự mang theo mục tiêu hiện tại.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Công tắc nhắc hằng ngày</p>
            <p className="text-sm text-[#71806c]">
              Tắt toàn bộ lịch nhưng vẫn giữ giờ đã cấu hình.
            </p>
          </div>
          <Switch
            checked={daily}
            disabled={savingDaily}
            onCheckedChange={toggleDaily}
            aria-label="Bật hoặc tắt nhắc hằng ngày"
          />
        </div>

        <Separator />

        <div className="rounded-[1.35rem] border border-[#d9e2ce] bg-[#f1f5e8]/75 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#dce9cc] text-[#557849]">
                <Smartphone className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">Thông báo trên thiết bị</p>
                <p className="text-sm text-[#71806c]">{permissionCopy}</p>
              </div>
            </div>
            {permission !== 'granted' && permission !== 'unsupported' && (
              <Button
                type="button"
                size="sm"
                onClick={requestPermission}
                disabled={requestingPermission}
                className="rounded-full bg-[#638653] text-white hover:bg-[#557747]"
              >
                {requestingPermission
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <BellRing className="mr-2 h-4 w-4" />}
                Bật thông báo
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#7b8775]">
            {isNativeNotificationPlatform()
              ? 'Bản mobile sẽ nhắc đúng giờ ngay cả khi Habit Garden đang đóng.'
              : 'Trên web, inbox luôn đồng bộ; thông báo hệ thống xuất hiện khi Habit Garden đang mở.'}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="font-semibold">Lịch theo từng habit</p>
            <p className="text-sm text-[#71806c]">
              Chọn thời điểm bạn thực sự có thể bắt đầu, không phải thời điểm “lý tưởng”.
            </p>
          </div>

          {loadingReminders ? (
            <div className="flex min-h-24 items-center justify-center rounded-[1.35rem] border border-dashed border-[#d3ddc8]">
              <Loader2 className="h-5 w-5 animate-spin text-[#6f8f62]" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="rounded-[1.35rem] border border-dashed border-[#d3ddc8] bg-white/40 p-5 text-center text-sm text-[#71806c]">
              Trồng habit đầu tiên để tạo lịch nhắc riêng.
            </div>
          ) : reminders.map(reminder => (
            <div
              key={reminder.plantId}
              className="rounded-[1.35rem] border border-[#dbe3d2] bg-white/65 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf3e4] text-xl">
                    {reminder.plantIcon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#315027]">{reminder.plantName}</p>
                    {reminder.goal ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#6b7d63]">
                        <Target className="h-3.5 w-3.5" />
                        {formatGoalValue(reminder.goal.target)} {reminder.goal.unit} {reminder.goal.periodLabel}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-[#7b8775]">
                        Nhắc giữ nhịp, không tạo áp lực mục tiêu.
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={reminder.enabled}
                  disabled={!daily || savingPlantId === reminder.plantId}
                  onCheckedChange={enabled => {
                    void changeReminderEnabled(reminder, enabled)
                  }}
                  aria-label={`Bật nhắc cho ${reminder.plantName}`}
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78906d]" />
                  <Input
                    type="time"
                    step={300}
                    value={reminder.time}
                    disabled={!daily || !reminder.enabled || savingPlantId === reminder.plantId}
                    onChange={event => patchReminder(reminder.plantId, { time: event.target.value })}
                    className="rounded-xl border-[#d4dfca] bg-[#fffdf8] pl-10"
                    aria-label={`Giờ nhắc cho ${reminder.plantName}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveReminder(reminder)}
                  disabled={!daily || savingPlantId === reminder.plantId}
                  className="rounded-xl border-[#c9d6bd] bg-[#edf3e4] text-[#547348] hover:bg-[#e3edd8]"
                >
                  {savingPlantId === reminder.plantId
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />}
                  <span className="sr-only">Lưu lịch nhắc</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Thông báo thành tựu</p>
            <p className="text-sm text-[#71806c]">
              Ghi nhận milestone, streak và cây trưởng thành.
            </p>
          </div>
          <Switch
            checked={achievements}
            disabled={savingAch}
            onCheckedChange={toggleAch}
            aria-label="Bật hoặc tắt thông báo thành tựu"
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface AppearanceSettingsProps {
  defaultTheme?: 'light' | 'dark' | 'system' | null
}

export function AppearanceSettings({ defaultTheme }: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Sync from DB on first mount if user's stored theme differs from local
    if (defaultTheme && defaultTheme !== theme) {
      setTheme(defaultTheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = async (value: string) => {
    const next = value as 'light' | 'dark' | 'system'
    setTheme(next)
    const result = await updateTheme(next)
    if (!result.success) {
      toast.error(result.error || 'Failed to update theme')
    } else {
      toast.success('Theme updated')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Customize how Habit Garden looks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">
              Choose between light and dark mode
            </p>
          </div>
          {mounted ? (
            <Select value={theme ?? 'system'} onValueChange={handleChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Button variant="outline" size="sm" disabled>
              System
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function SecuritySettings() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your password regularly
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
