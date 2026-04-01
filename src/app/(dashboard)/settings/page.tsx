import { getAuthUser } from '@/lib/auth-cached'
import { getProfile } from '@/lib/actions/profile'
import { PerformanceSettings } from '@/components/settings/performance-settings'
import { SubscriptionSection } from '@/components/settings/subscription-section'
import { AccountSettings } from '@/components/settings/account-settings'
import { NotificationSettings, AppearanceSettings, SecuritySettings } from '@/components/settings/general-settings'

export default async function SettingsPage() {
  const user = await getAuthUser()
  const profile = await getProfile()

  return (
    <div className="h-full overflow-y-auto pt-4 px-4 pb-36 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Settings */}
      <AccountSettings
        email={user?.email ?? ''}
        defaultDisplayName={profile?.display_name ?? user?.user_metadata?.full_name ?? ''}
      />

      {/* Subscription */}
      <SubscriptionSection />

      {/* Notification Settings */}
      <NotificationSettings />

      {/* Appearance */}
      <AppearanceSettings />

      {/* Performance */}
      <PerformanceSettings />

      {/* Security */}
      <SecuritySettings />
    </div>
  )
}
