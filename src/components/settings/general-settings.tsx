'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bell, Shield, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { updateTheme, updateNotificationPrefs } from '@/lib/actions/profile'
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

  const toggleDaily = async (next: boolean) => {
    setSavingDaily(true)
    setDaily(next)
    const result = await updateNotificationPrefs({ daily_reminder_enabled: next })
    if (!result.success) {
      setDaily(!next)
      toast.error(result.error || 'Failed to update')
    } else {
      toast.success(next ? 'Daily reminders on' : 'Daily reminders off')
    }
    setSavingDaily(false)
  }

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>Configure how you receive reminders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Daily Reminders</p>
            <p className="text-sm text-muted-foreground">
              Get reminded to water your plants
            </p>
          </div>
          <Switch
            checked={daily}
            disabled={savingDaily}
            onCheckedChange={toggleDaily}
            aria-label="Toggle daily reminders"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Achievement Notifications</p>
            <p className="text-sm text-muted-foreground">
              Celebrate when you unlock achievements
            </p>
          </div>
          <Switch
            checked={achievements}
            disabled={savingAch}
            onCheckedChange={toggleAch}
            aria-label="Toggle achievement notifications"
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
