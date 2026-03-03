# Phase 01: Foundation - Database & Types

## Context

- [plan.md](plan.md) - Overview
- [researcher-01-social-features.md](research/researcher-01-social-features.md) - Schema patterns
- [scout-report.md](scout/scout-report.md) - Integration points

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-12 |
| Priority | P0 - Critical |
| Status | Pending |
| Estimate | 2-3 days |
| Dependencies | None |

Create database tables, TypeScript types, and base server actions for the community system.

---

## Requirements

### Database Tables (6)

1. **friendships** - Friend relationships (bidirectional)
2. **blocks** - Block relationships (one-directional, overrides all)
3. **friend_requests** - Pending requests
4. **privacy_settings** - User privacy preferences
5. **referrals** - Referral tracking
6. **reports** - Content/user reports

### Types

Extend `src/types/database.ts` with:
- FriendshipStatus, BlockStatus
- FriendRequest, Friendship, Block
- PrivacySettings, PrivacyLevel
- Referral, ReferralStatus
- Report, ReportType, ReportStatus

### Server Actions

Create `src/lib/actions/community.ts`:
- `getFriends()` - List accepted friends
- `getPendingRequests()` - Incoming requests
- `sendFriendRequest()` - Create request
- `respondToRequest()` - Accept/reject
- `removeFriend()` - Delete friendship
- `blockUser()` - Block user
- `unblockUser()` - Remove block
- `getBlockedUsers()` - List blocks

---

## Architecture

### Database Schema

```sql
-- 1. Friendships (bidirectional - both users can see)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id < friend_id) -- Canonical ordering prevents duplicates
);

-- 2. Blocks (one-directional, takes precedence)
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 3. Friend Requests
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- 4. Privacy Settings
CREATE TABLE privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_on_leaderboard BOOLEAN DEFAULT true,
  allow_friend_requests TEXT DEFAULT 'everyone' CHECK (allow_friend_requests IN ('everyone', 'friends_of_friends', 'nobody')),
  share_achievements BOOLEAN DEFAULT true,
  share_streaks BOOLEAN DEFAULT true,
  gdpr_consent_profile BOOLEAN DEFAULT false,
  gdpr_consent_leaderboard BOOLEAN DEFAULT false,
  gdpr_consent_challenges BOOLEAN DEFAULT false,
  gdpr_consent_analytics BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted')),
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- 6. Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_content_type TEXT, -- 'profile', 'challenge', 'message'
  reported_content_id UUID,
  report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'spam', 'inappropriate', 'cheating', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

### RLS Policies

```sql
-- Friendships: Both parties can see
CREATE POLICY "Users see own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() IN (user_id, friend_id));

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() IN (user_id, friend_id));

-- Blocks: Only blocker can see and manage
CREATE POLICY "Users see own blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Friend Requests: Sender and receiver can see
CREATE POLICY "Users see relevant friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() IN (sender_id, receiver_id));

-- Privacy Settings: Only owner
CREATE POLICY "Users manage own privacy"
  ON privacy_settings FOR ALL
  USING (auth.uid() = user_id);

-- Referrals: Only referrer sees
CREATE POLICY "Users see own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Reports: Only reporter sees (admins via service role)
CREATE POLICY "Users see own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);
```

### Indexes

```sql
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id, status);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_reports_status ON reports(status);
```

### Helper Functions

```sql
-- Check if users are friends
CREATE OR REPLACE FUNCTION are_friends(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id = LEAST(user1, user2) AND friend_id = GREATEST(user1, user2))
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if user is blocked
CREATE OR REPLACE FUNCTION is_blocked(checker UUID, target UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = checker AND blocked_id = target)
       OR (blocker_id = target AND blocked_id = checker)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get friend count
CREATE OR REPLACE FUNCTION get_friend_count(uid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM friendships
    WHERE user_id = uid OR friend_id = uid
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `src/types/database.ts` | Add community types |
| `src/lib/actions/community.ts` | Server actions (new) |
| `src/lib/subscription-limits.ts` | Add social feature limits |
| `supabase/migrations/YYYYMMDD_community_foundation.sql` | Migration |

---

## Implementation Steps

### Step 1: Create Migration File

File: `supabase/migrations/20260213_community_foundation.sql`

1. Create all 6 tables
2. Add RLS policies
3. Create indexes
4. Create helper functions
5. Initialize privacy_settings for existing users

### Step 2: Extend TypeScript Types

File: `src/types/database.ts`

```typescript
// Privacy types
export type ProfileVisibility = 'public' | 'friends' | 'private'
export type FriendRequestSetting = 'everyone' | 'friends_of_friends' | 'nobody'

// Friendship types
export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  created_at: string
}

export interface FriendshipWithProfile extends Friendship {
  friend: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'xp' | 'level'>
}

// Block types
export interface Block {
  id: string
  blocker_id: string
  blocked_id: string
  reason: string | null
  created_at: string
}

// Friend Request types
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  message: string | null
  status: FriendRequestStatus
  created_at: string
  responded_at: string | null
}

export interface FriendRequestWithProfile extends FriendRequest {
  sender: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'xp' | 'level'>
}

// Privacy Settings
export interface PrivacySettings {
  user_id: string
  profile_visibility: ProfileVisibility
  show_on_leaderboard: boolean
  allow_friend_requests: FriendRequestSetting
  share_achievements: boolean
  share_streaks: boolean
  gdpr_consent_profile: boolean
  gdpr_consent_leaderboard: boolean
  gdpr_consent_challenges: boolean
  gdpr_consent_analytics: boolean
  updated_at: string
}

// Referral types
export type ReferralStatus = 'pending' | 'signed_up' | 'converted'

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string | null
  referral_code: string
  status: ReferralStatus
  reward_claimed: boolean
  created_at: string
  signed_up_at: string | null
  converted_at: string | null
}

// Report types
export type ReportType = 'harassment' | 'spam' | 'inappropriate' | 'cheating' | 'other'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string | null
  reported_content_type: string | null
  reported_content_id: string | null
  report_type: ReportType
  description: string | null
  status: ReportStatus
  resolution_notes: string | null
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
}
```

### Step 3: Extend Subscription Limits

File: `src/lib/subscription-limits.ts`

Add to `TierLimits` interface:
```typescript
// Social features
maxFriends: number        // -1 = unlimited
canFollow: boolean
canShareAchievements: boolean
maxActiveChallenges: number
canCreateChallenges: boolean
canMessage: boolean
canCreateGroups: boolean
```

Add to tier definitions:
```typescript
free: {
  // ... existing
  maxFriends: 5,
  canFollow: false,
  canShareAchievements: false,
  maxActiveChallenges: 0,
  canCreateChallenges: false,
  canMessage: false,
  canCreateGroups: false,
},
pro: {
  // ... existing
  maxFriends: 25,
  canFollow: true,
  canShareAchievements: true,
  maxActiveChallenges: 3,
  canCreateChallenges: false,
  canMessage: false,
  canCreateGroups: false,
},
premium: {
  // ... existing
  maxFriends: -1,
  canFollow: true,
  canShareAchievements: true,
  maxActiveChallenges: -1,
  canCreateChallenges: true,
  canMessage: true,
  canCreateGroups: true,
}
```

### Step 4: Create Server Actions

File: `src/lib/actions/community.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FriendshipWithProfile,
  FriendRequestWithProfile,
  Block,
  PrivacySettings
} from '@/types/database'

// === FRIENDS ===

export async function getFriends(): Promise<FriendshipWithProfile[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id, user_id, friend_id, created_at,
      friend:profiles!friendships_friend_id_fkey(
        id, username, display_name, avatar_url, xp, level
      )
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

  if (error) {
    console.error('Error fetching friends:', error)
    return []
  }

  return data as FriendshipWithProfile[]
}

export async function sendFriendRequest(
  receiverId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (user.id === receiverId) {
    return { success: false, error: 'Cannot send request to yourself' }
  }

  // Check if blocked
  const { data: blocked } = await supabase.rpc('is_blocked', {
    checker: user.id,
    target: receiverId
  })
  if (blocked) return { success: false, error: 'Cannot send request' }

  // Check if already friends
  const { data: existing } = await supabase.rpc('are_friends', {
    user1: user.id,
    user2: receiverId
  })
  if (existing) return { success: false, error: 'Already friends' }

  // Check tier limit
  // TODO: Check friend count vs tier limit

  const { error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      message,
      status: 'pending'
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Request already sent' }
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function respondToRequest(
  requestId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get the request
  const { data: request, error: fetchError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Request not found' }
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({
      status: accept ? 'accepted' : 'rejected',
      responded_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // If accepted, create friendship
  if (accept) {
    const userId1 = request.sender_id < user.id ? request.sender_id : user.id
    const userId2 = request.sender_id < user.id ? user.id : request.sender_id

    const { error: friendError } = await supabase
      .from('friendships')
      .insert({
        user_id: userId1,
        friend_id: userId2
      })

    if (friendError) {
      return { success: false, error: friendError.message }
    }
  }

  revalidatePath('/community')
  return { success: true }
}

export async function removeFriend(
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const userId1 = user.id < friendId ? user.id : friendId
  const userId2 = user.id < friendId ? friendId : user.id

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', userId1)
    .eq('friend_id', userId2)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/community')
  return { success: true }
}

// === BLOCKS ===

export async function blockUser(
  blockedId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // First remove any friendship
  await removeFriend(blockedId)

  // Delete pending friend requests both ways
  await supabase
    .from('friend_requests')
    .delete()
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${blockedId}),and(sender_id.eq.${blockedId},receiver_id.eq.${user.id})`)

  // Create block
  const { error } = await supabase
    .from('blocks')
    .insert({
      blocker_id: user.id,
      blocked_id: blockedId,
      reason
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Already blocked' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/community')
  return { success: true }
}

export async function unblockUser(
  blockedId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getBlockedUsers(): Promise<Block[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('blocks')
    .select('*')
    .eq('blocker_id', user.id)

  return data || []
}

// === PRIVACY ===

export async function getPrivacySettings(): Promise<PrivacySettings | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function updatePrivacySettings(
  settings: Partial<Omit<PrivacySettings, 'user_id' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('privacy_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString()
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

// === REQUESTS ===

export async function getPendingRequests(): Promise<FriendRequestWithProfile[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('friend_requests')
    .select(`
      *,
      sender:profiles!friend_requests_sender_id_fkey(
        id, username, display_name, avatar_url, xp, level
      )
    `)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')

  return data as FriendRequestWithProfile[] || []
}
```

### Step 5: Apply Migration to Supabase

```bash
# Using Supabase MCP or CLI
supabase db push
# or via dashboard: paste migration SQL
```

---

## Todo Checklist

- [ ] Create migration file `20260213_community_foundation.sql`
- [ ] Apply migration to Supabase project
- [ ] Add types to `src/types/database.ts`
- [ ] Extend `src/lib/subscription-limits.ts`
- [ ] Create `src/lib/actions/community.ts`
- [ ] Test helper functions (are_friends, is_blocked)
- [ ] Test RLS policies
- [ ] Initialize privacy_settings for existing users
- [ ] Run type check: `npm run typecheck`

---

## Success Criteria

- [ ] All 6 tables created with correct schema
- [ ] RLS policies prevent unauthorized access
- [ ] Helper functions work (are_friends, is_blocked, get_friend_count)
- [ ] Server actions compile without errors
- [ ] Privacy settings initialized for existing users
- [ ] Friend limit enforced based on subscription tier

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS too restrictive | Users can't see expected data | Test each policy manually |
| Friendship duplicates | Data inconsistency | Canonical ordering constraint |
| Block bypass | Privacy violation | Check blocks in all friend queries |
| Migration fails | Downtime | Test on branch DB first |

---

## Security Considerations

1. **RLS Enforcement**: All tables have RLS enabled; no SELECT/INSERT/UPDATE/DELETE without policy
2. **Block Precedence**: Block checks happen before any social query
3. **No Profile Leaks**: Blocked users cannot see blocker's profile
4. **GDPR Ready**: Privacy settings table supports granular consent
5. **Rate Limiting**: Consider adding at API level (not in this phase)
