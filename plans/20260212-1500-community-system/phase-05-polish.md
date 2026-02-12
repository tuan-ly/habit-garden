# Phase 05: Polish - Notifications, Referrals, Moderation

## Context

- [plan.md](plan.md) - Overview
- [researcher-02-monetization-privacy.md](research/researcher-02-monetization-privacy.md) - Referrals, moderation

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-12 |
| Priority | P2 - Medium |
| Status | Pending |
| Estimate | 3-4 days |
| Dependencies | Phase 01-04 complete |

Polish the community system with notifications, referral program, and content moderation.

---

## Requirements

### Notifications

1. **Friend Requests** - New request, request accepted
2. **Challenge Updates** - Invite, start, progress, complete
3. **Leaderboard** - Rank change, top 10 entry
4. **In-App** - Bell icon with badge, notification center
5. **Push (Future)** - Web push for mobile PWA

### Referral System

1. Generate unique referral code
2. Share via link/social
3. Track sign-ups and conversions
4. Reward referrer (1 month PRO)
5. Reward referred (2 weeks PRO trial)

### Moderation

1. Report content/users
2. Automated spam detection
3. Manual review queue (admin)
4. Actions: warn, mute, ban
5. Appeal process

---

## Architecture

### Database Schema

```sql
-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'friend_request', 'friend_accepted',
    'challenge_invite', 'challenge_started', 'challenge_completed',
    'leaderboard_rank', 'leaderboard_top10',
    'referral_signup', 'referral_converted',
    'moderation_warning', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}', -- { friendRequestId, challengeId, etc. }
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  friend_requests BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  leaderboard_updates BOOLEAN DEFAULT true,
  referral_updates BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation actions
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES profiles(id),
  report_id UUID REFERENCES reports(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'mute_1d', 'mute_7d', 'ban_temp', 'ban_permanent')),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User moderation status (denormalized for quick checks)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'good';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moderation_until TIMESTAMPTZ;

-- Referral tracking improvements
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_amount INTEGER DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_reward_claimed BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_moderation_actions_user ON moderation_actions(target_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);
```

### RLS Policies

```sql
-- Notifications: Only own
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Notification preferences: Only own
CREATE POLICY "Users manage own notification prefs"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Moderation actions: Only own (admins via service role)
CREATE POLICY "Users see own moderation"
  ON moderation_actions FOR SELECT
  USING (target_user_id = auth.uid());
```

### Notification Triggers

```sql
-- Notify on friend request
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.receiver_id,
    'friend_request',
    'New friend request',
    (SELECT display_name || ' wants to be your friend' FROM profiles WHERE id = NEW.sender_id),
    jsonb_build_object('friendRequestId', NEW.id, 'senderId', NEW.sender_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_friend_request
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_friend_request();

-- Notify on friend accepted
CREATE OR REPLACE FUNCTION notify_friend_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.sender_id,
      'friend_accepted',
      'Friend request accepted',
      (SELECT display_name || ' accepted your friend request' FROM profiles WHERE id = NEW.receiver_id),
      jsonb_build_object('friendId', NEW.receiver_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_friend_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_accepted();

-- Notify on challenge invite
CREATE OR REPLACE FUNCTION notify_challenge_invite()
RETURNS TRIGGER AS $$
DECLARE
  challenge_title TEXT;
BEGIN
  IF NEW.status = 'invited' THEN
    SELECT title INTO challenge_title FROM challenges WHERE id = NEW.challenge_id;
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'challenge_invite',
      'Challenge invite',
      'You''ve been invited to: ' || challenge_title,
      jsonb_build_object('challengeId', NEW.challenge_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_challenge_invite
  AFTER INSERT ON challenge_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_challenge_invite();
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `src/lib/actions/notifications.ts` | Notification server actions |
| `src/lib/actions/referrals.ts` | Referral server actions |
| `src/lib/actions/moderation.ts` | Moderation server actions |
| `src/components/notifications/notification-bell.tsx` | Bell icon with badge |
| `src/components/notifications/notification-center.tsx` | Notification list |
| `src/components/community/report-dialog.tsx` | Report user/content |
| `src/app/(dashboard)/settings/notifications/page.tsx` | Notification settings |

---

## Implementation Steps

### Step 1: Create Migration

File: `supabase/migrations/20260216_polish_system.sql`

Include all schema from above.

### Step 2: Add TypeScript Types

File: `src/types/database.ts` (add)

```typescript
// Notification types
export type NotificationType =
  | 'friend_request' | 'friend_accepted'
  | 'challenge_invite' | 'challenge_started' | 'challenge_completed'
  | 'leaderboard_rank' | 'leaderboard_top10'
  | 'referral_signup' | 'referral_converted'
  | 'moderation_warning' | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown>
  read: boolean
  read_at: string | null
  created_at: string
}

export interface NotificationPreferences {
  user_id: string
  friend_requests: boolean
  challenge_updates: boolean
  leaderboard_updates: boolean
  referral_updates: boolean
  marketing: boolean
  push_enabled: boolean
  updated_at: string
}

// Moderation types
export type ModerationActionType = 'warning' | 'mute_1d' | 'mute_7d' | 'ban_temp' | 'ban_permanent'
export type ModerationStatus = 'good' | 'warned' | 'muted' | 'banned'

export interface ModerationAction {
  id: string
  target_user_id: string
  moderator_id: string | null
  report_id: string | null
  action_type: ModerationActionType
  reason: string | null
  expires_at: string | null
  created_at: string
}
```

### Step 3: Create Notification Actions

File: `src/lib/actions/notifications.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Notification, NotificationPreferences } from '@/types/database'

export async function getNotifications(
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const { data } = await query
  return data || []
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return count || 0
}

export async function markAsRead(
  notificationIds: string[]
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .in('id', notificationIds)

  return { success: !error }
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('read', false)

  revalidatePath('/')
  return { success: !error }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function updateNotificationPreferences(
  prefs: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>>
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString()
    })

  return { success: !error }
}
```

### Step 4: Create Referral Actions

File: `src/lib/actions/referrals.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import type { Referral } from '@/types/database'

export async function getMyReferralCode(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check for existing referral code
  const { data: existing } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referrer_id', user.id)
    .single()

  if (existing) return existing.referral_code

  // Generate new code
  const code = `HG-${nanoid(8).toUpperCase()}`

  const { error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: user.id,
      referral_code: code,
      status: 'pending'
    })

  if (error) return null
  return code
}

export async function getMyReferrals(): Promise<{
  code: string
  totalReferred: number
  totalConverted: number
  rewardsEarned: number
  referrals: Referral[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { code: '', totalReferred: 0, totalConverted: 0, rewardsEarned: 0, referrals: [] }
  }

  const { data } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  if (!data || data.length === 0) {
    const code = await getMyReferralCode()
    return { code: code || '', totalReferred: 0, totalConverted: 0, rewardsEarned: 0, referrals: [] }
  }

  const code = data[0].referral_code
  const signedUp = data.filter(r => r.status === 'signed_up' || r.status === 'converted')
  const converted = data.filter(r => r.status === 'converted')
  const rewards = data.reduce((sum, r) => sum + (r.reward_amount || 0), 0)

  return {
    code,
    totalReferred: signedUp.length,
    totalConverted: converted.length,
    rewardsEarned: rewards,
    referrals: data
  }
}

export async function applyReferralCode(
  code: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Find referral
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', code)
    .single()

  if (!referral) {
    return { success: false, error: 'Invalid referral code' }
  }

  if (referral.referrer_id === user.id) {
    return { success: false, error: 'Cannot use your own referral code' }
  }

  // Check if user already used a referral
  const { data: existingReferred } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', user.id)
    .single()

  if (existingReferred) {
    return { success: false, error: 'You have already used a referral code' }
  }

  // Create referral record for referred user
  const { error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referral.referrer_id,
      referred_id: user.id,
      referral_code: code,
      status: 'signed_up',
      signed_up_at: new Date().toISOString()
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // Grant 2-week PRO trial to referred user
  await supabase
    .from('subscriptions')
    .update({
      tier_id: 'pro',
      status: 'trialing',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('user_id', user.id)

  // Create notification for referrer
  await supabase
    .from('notifications')
    .insert({
      user_id: referral.referrer_id,
      type: 'referral_signup',
      title: 'New referral!',
      body: 'Someone signed up using your referral code',
      data: { referredId: user.id }
    })

  revalidatePath('/settings')
  return { success: true }
}

export async function claimReferralReward(
  referralId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify referral belongs to user and is converted
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .eq('referrer_id', user.id)
    .eq('status', 'converted')
    .eq('reward_claimed', false)
    .single()

  if (!referral) {
    return { success: false, error: 'No claimable reward found' }
  }

  // Grant 1 month PRO
  const now = new Date()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('current_period_end')
    .eq('user_id', user.id)
    .single()

  const startDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : now
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 1)

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      tier_id: 'pro',
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString()
    })

  // Mark reward as claimed
  await supabase
    .from('referrals')
    .update({
      reward_claimed: true,
      reward_amount: 499 // $4.99 in cents
    })
    .eq('id', referralId)

  revalidatePath('/settings')
  return { success: true }
}
```

### Step 5: Create Report Actions

File: `src/lib/actions/moderation.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Report, ReportType } from '@/types/database'

export async function reportUser(
  reportedUserId: string,
  reportType: ReportType,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (user.id === reportedUserId) {
    return { success: false, error: 'Cannot report yourself' }
  }

  // Check for recent duplicate report
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reported_user_id', reportedUserId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .single()

  if (existing) {
    return { success: false, error: 'You have already reported this user recently' }
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      report_type: reportType,
      description,
      status: 'pending'
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function reportContent(
  contentType: string,
  contentId: string,
  reportType: ReportType,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_content_type: contentType,
      reported_content_id: contentId,
      report_type: reportType,
      description,
      status: 'pending'
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getMyModerationStatus(): Promise<{
  status: string
  until: string | null
  warnings: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'good', until: null, warnings: 0 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('moderation_status, moderation_until')
    .eq('id', user.id)
    .single()

  const { count: warnings } = await supabase
    .from('moderation_actions')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', user.id)
    .eq('action_type', 'warning')

  return {
    status: profile?.moderation_status || 'good',
    until: profile?.moderation_until || null,
    warnings: warnings || 0
  }
}
```

### Step 6: Create Notification Bell Component

File: `src/components/notifications/notification-bell.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getNotifications, getUnreadCount, markAsRead } from '@/lib/actions/notifications'
import { NotificationList } from './notification-list'
import type { Notification } from '@/types/database'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadUnreadCount, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    const [notifs, count] = await Promise.all([
      getNotifications(10),
      getUnreadCount()
    ])
    setNotifications(notifs)
    setUnreadCount(count)
  }

  const loadUnreadCount = async () => {
    const count = await getUnreadCount()
    setUnreadCount(count)
  }

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      await loadNotifications()
    }
  }

  const handleMarkAsRead = async (ids: string[]) => {
    await markAsRead(ids)
    setNotifications(prev =>
      prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - ids.length))
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
        />
      </PopoverContent>
    </Popover>
  )
}
```

### Step 7: Create Report Dialog

File: `src/components/community/report-dialog.tsx`

```typescript
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { reportUser, reportContent } from '@/lib/actions/moderation'
import { toast } from 'sonner'
import type { ReportType } from '@/types/database'

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId?: string
  contentType?: string
  contentId?: string
}

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or intimidation' },
  { value: 'spam', label: 'Spam', description: 'Unwanted promotional content' },
  { value: 'inappropriate', label: 'Inappropriate', description: 'Adult content or offensive material' },
  { value: 'cheating', label: 'Cheating', description: 'Gaming the system unfairly' },
  { value: 'other', label: 'Other', description: 'Something else not listed' }
]

export function ReportDialog({
  open,
  onOpenChange,
  targetUserId,
  contentType,
  contentId
}: ReportDialogProps) {
  const [reportType, setReportType] = useState<ReportType>('harassment')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    let result
    if (targetUserId) {
      result = await reportUser(targetUserId, reportType, description)
    } else if (contentType && contentId) {
      result = await reportContent(contentType, contentId, reportType, description)
    } else {
      result = { success: false, error: 'Invalid report target' }
    }

    setIsSubmitting(false)

    if (result.success) {
      toast.success('Report submitted. Thank you for helping keep our community safe.')
      onOpenChange(false)
      setDescription('')
      setReportType('harassment')
    } else {
      toast.error(result.error || 'Failed to submit report')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report {targetUserId ? 'User' : 'Content'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            {REPORT_TYPES.map(type => (
              <div key={type.value} className="flex items-start space-x-3 p-2 rounded hover:bg-muted">
                <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                <Label htmlFor={type.value} className="cursor-pointer">
                  <p className="font-medium">{type.label}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Textarea
            placeholder="Provide additional details (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Todo Checklist

- [ ] Create polish migration
- [ ] Apply migration to Supabase
- [ ] Add notification types
- [ ] Create notification actions
- [ ] Create referral actions
- [ ] Create moderation actions
- [ ] Create NotificationBell component
- [ ] Create NotificationList component
- [ ] Create ReportDialog component
- [ ] Add notification bell to game nav
- [ ] Create notification settings page
- [ ] Create referral section in settings
- [ ] Test notification triggers
- [ ] Test referral flow
- [ ] Test report submission

---

## Success Criteria

- [ ] Notifications appear for friend requests, challenges, etc.
- [ ] Bell shows unread count badge
- [ ] Users can mark notifications as read
- [ ] Referral codes generate and track
- [ ] Referred users get 2-week PRO trial
- [ ] Referrers get 1-month PRO on conversion
- [ ] Users can report others
- [ ] Reports create pending entries

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Notification spam | Poor UX | Preferences, rate limits |
| Referral abuse | Revenue loss | One code per user, verify conversion |
| False reports | User frustration | Review queue, warn abusers |
| Push notification failures | Missed alerts | Fallback to in-app |

---

## Security Considerations

1. **Notification Privacy**: Users only see own notifications (RLS)
2. **Referral Validation**: Prevent self-referral, one use per account
3. **Report Limits**: Rate limit reports to prevent abuse
4. **Moderation Audit**: All actions logged for accountability
5. **Push Token Security**: Store securely, validate ownership

---

## Future Enhancements (Post-MVP)

1. **Web Push Notifications**: Service worker + push subscription
2. **Email Notifications**: Digest emails for important updates
3. **Advanced Spam Detection**: ML-based content analysis
4. **Moderator Dashboard**: Admin UI for review queue
5. **Appeal System**: Users can contest moderation actions
6. **Referral Tiers**: More rewards for more referrals
