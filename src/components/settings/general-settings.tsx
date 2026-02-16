'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Bell, Shield, Palette } from 'lucide-react'
import { toast } from 'sonner'

export function NotificationSettings() {
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Coming soon!')}
          >
            Configure
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Achievement Notifications</p>
            <p className="text-sm text-muted-foreground">
              Celebrate when you unlock achievements
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Coming soon!')}
          >
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function AppearanceSettings() {
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Coming soon!')}
          >
            System
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SecuritySettings() {
  return (
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Coming soon!')}
          >
            Change
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-600">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all data
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => toast.info('Coming soon!')}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
