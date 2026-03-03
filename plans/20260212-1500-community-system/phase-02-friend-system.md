# Phase 02: Friend System - UI & User Experience

## Context

- [plan.md](plan.md) - Overview
- [phase-01-foundation.md](phase-01-foundation.md) - Database foundation
- [researcher-01-social-features.md](research/researcher-01-social-features.md) - Friend patterns

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-12 |
| Priority | P0 - Critical |
| Status | Pending |
| Estimate | 3-4 days |
| Dependencies | Phase 01 complete |

Build the friend system UI: friend list, profile viewing, friend requests, search, and privacy settings.

---

## Requirements

### UI Components

1. **FriendList** - Display friends with online status
2. **FriendRequestCard** - Accept/reject incoming requests
3. **FriendSearchDialog** - Find users by username
4. **UserProfileCard** - View public profile
5. **PrivacySettingsSection** - Manage privacy preferences
6. **BlockedUsersSection** - Manage blocks

### Pages/Routes

1. `/community` - Main community hub (friend list, requests)
2. `/community/search` - User search
3. `/profile/[userId]` - Public profile view
4. `/settings/privacy` - Privacy settings

### Key Interactions

- Send friend request from profile or search
- Accept/reject request from notification or list
- View friend's garden/achievements (if permitted)
- Remove friend with confirmation
- Block user (removes friendship, hides from all)

---

## Architecture

### Component Structure

```
src/components/community/
  friend-list.tsx           # Main friend list component
  friend-card.tsx           # Individual friend display
  friend-request-card.tsx   # Accept/reject UI
  friend-search-dialog.tsx  # Search modal
  user-profile-card.tsx     # Profile preview
  blocked-users-section.tsx # Manage blocks
  privacy-settings-section.tsx # Privacy toggles

src/app/(dashboard)/community/
  page.tsx                  # Community hub
  search/page.tsx          # Search page
  layout.tsx               # Community layout

src/app/(dashboard)/profile/
  [userId]/page.tsx        # Public profile
```

### State Management

Use React Server Components for data fetching; client components for interactivity.

```typescript
// Community page (server component)
export default async function CommunityPage() {
  const friends = await getFriends()
  const requests = await getPendingRequests()

  return (
    <div>
      <FriendRequestSection requests={requests} />
      <FriendList friends={friends} />
    </div>
  )
}
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `src/lib/actions/community.ts` | Server actions (from Phase 1) |
| `src/lib/subscription-limits.ts` | Friend limit checks |
| `src/components/game-ui/upgrade-modal.tsx` | Upgrade prompts |

---

## Implementation Steps

### Step 1: Create Community Page Layout

File: `src/app/(dashboard)/community/layout.tsx`

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community | Habit Garden',
  description: 'Connect with other gardeners'
}

export default function CommunityLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {children}
    </div>
  )
}
```

### Step 2: Create Friend List Component

File: `src/components/community/friend-list.tsx`

```typescript
'use client'

import { useState } from 'react'
import { FriendshipWithProfile } from '@/types/database'
import { FriendCard } from './friend-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserPlus, Search } from 'lucide-react'
import { FriendSearchDialog } from './friend-search-dialog'

interface FriendListProps {
  friends: FriendshipWithProfile[]
  currentUserId: string
  maxFriends: number | 'unlimited'
}

export function FriendList({ friends, currentUserId, maxFriends }: FriendListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const filteredFriends = friends.filter(f => {
    const friend = f.user_id === currentUserId ? f.friend : f.friend
    const name = friend?.display_name || friend?.username || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const friendCount = friends.length
  const limitText = maxFriends === 'unlimited'
    ? `${friendCount} friends`
    : `${friendCount}/${maxFriends} friends`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Friends</h2>
        <span className="text-sm text-muted-foreground">{limitText}</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowSearch(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </div>

      {filteredFriends.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {friends.length === 0
            ? "No friends yet. Start by adding some!"
            : "No friends match your search."}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredFriends.map(friendship => (
            <FriendCard
              key={friendship.id}
              friendship={friendship}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      <FriendSearchDialog
        open={showSearch}
        onOpenChange={setShowSearch}
        currentFriendIds={friends.map(f =>
          f.user_id === currentUserId ? f.friend_id : f.user_id
        )}
      />
    </div>
  )
}
```

### Step 3: Create Friend Card Component

File: `src/components/community/friend-card.tsx`

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FriendshipWithProfile } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, User, Trash2, Ban } from 'lucide-react'
import { removeFriend, blockUser } from '@/lib/actions/community'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface FriendCardProps {
  friendship: FriendshipWithProfile
  currentUserId: string
}

export function FriendCard({ friendship, currentUserId }: FriendCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const friend = friendship.friend
  const initials = (friend.display_name || friend.username || 'U').slice(0, 2).toUpperCase()

  const handleRemove = async () => {
    setIsLoading(true)
    const result = await removeFriend(friend.id)
    setIsLoading(false)

    if (result.success) {
      toast.success('Friend removed')
    } else {
      toast.error(result.error || 'Failed to remove friend')
    }
    setShowRemoveDialog(false)
  }

  const handleBlock = async () => {
    setIsLoading(true)
    const result = await blockUser(friend.id)
    setIsLoading(false)

    if (result.success) {
      toast.success('User blocked')
    } else {
      toast.error(result.error || 'Failed to block user')
    }
    setShowBlockDialog(false)
  }

  return (
    <>
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <Link href={`/profile/${friend.id}`} className="flex items-center gap-3 flex-1">
          <Avatar>
            <AvatarImage src={friend.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{friend.display_name || friend.username}</p>
            <p className="text-sm text-muted-foreground">Level {friend.level}</p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/profile/${friend.id}`}>
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowRemoveDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Friend
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowBlockDialog(true)}
              className="text-destructive"
            >
              <Ban className="h-4 w-4 mr-2" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        title="Remove Friend"
        description={`Are you sure you want to remove ${friend.display_name || friend.username} from your friends?`}
        confirmText="Remove"
        onConfirm={handleRemove}
        loading={isLoading}
      />

      <ConfirmDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        title="Block User"
        description={`Are you sure you want to block ${friend.display_name || friend.username}? They won't be able to see your profile or send you friend requests.`}
        confirmText="Block"
        variant="destructive"
        onConfirm={handleBlock}
        loading={isLoading}
      />
    </>
  )
}
```

### Step 4: Create Friend Request Card

File: `src/components/community/friend-request-card.tsx`

```typescript
'use client'

import { useState } from 'react'
import { FriendRequestWithProfile } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { respondToRequest } from '@/lib/actions/community'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface FriendRequestCardProps {
  request: FriendRequestWithProfile
}

export function FriendRequestCard({ request }: FriendRequestCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const sender = request.sender
  const initials = (sender.display_name || sender.username || 'U').slice(0, 2).toUpperCase()
  const timeAgo = formatDistanceToNow(new Date(request.created_at), { addSuffix: true })

  const handleResponse = async (accept: boolean) => {
    setIsLoading(true)
    const result = await respondToRequest(request.id, accept)
    setIsLoading(false)

    if (result.success) {
      toast.success(accept ? 'Friend request accepted!' : 'Friend request rejected')
    } else {
      toast.error(result.error || 'Failed to respond')
    }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={sender.avatar_url || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{sender.display_name || sender.username}</p>
          <p className="text-xs text-muted-foreground">
            Level {sender.level} • {timeAgo}
          </p>
          {request.message && (
            <p className="text-sm text-muted-foreground mt-1 italic">
              "{request.message}"
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleResponse(false)}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => handleResponse(true)}
          disabled={isLoading}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

### Step 5: Create Friend Search Dialog

File: `src/components/community/friend-search-dialog.tsx`

```typescript
'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { searchUsers, sendFriendRequest } from '@/lib/actions/community'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

interface FriendSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentFriendIds: string[]
}

export function FriendSearchDialog({
  open,
  onOpenChange,
  currentFriendIds
}: FriendSearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'level'>[]>([])
  const [isSearching, startSearch] = useTransition()
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  const handleSearch = async () => {
    if (query.length < 2) {
      toast.error('Enter at least 2 characters')
      return
    }

    startSearch(async () => {
      const users = await searchUsers(query)
      // Filter out current friends
      setResults(users.filter(u => !currentFriendIds.includes(u.id)))
    })
  }

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId)
    const result = await sendFriendRequest(userId)
    setSendingTo(null)

    if (result.success) {
      toast.success('Friend request sent!')
      // Remove from results
      setResults(prev => prev.filter(u => u.id !== userId))
    } else {
      toast.error(result.error || 'Failed to send request')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Find Friends</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.length === 0 && query.length >= 2 && !isSearching && (
            <p className="text-center text-muted-foreground py-4">
              No users found
            </p>
          )}

          {results.map(user => {
            const initials = (user.display_name || user.username || 'U').slice(0, 2).toUpperCase()
            const isSending = sendingTo === user.id

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">Level {user.level}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendRequest(user.id)}
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 6: Add Search Users Action

File: `src/lib/actions/community.ts` (add to existing)

```typescript
export async function searchUsers(
  query: string,
  limit: number = 20
): Promise<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'level'>[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, level')
    .neq('id', user.id)
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(limit)

  if (!data) return []

  // Filter out blocked users
  const { data: blocks } = await supabase
    .from('blocks')
    .select('blocked_id, blocker_id')
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)

  const blockedIds = new Set(
    blocks?.flatMap(b => [b.blocked_id, b.blocker_id]) || []
  )
  blockedIds.delete(user.id)

  return data.filter(u => !blockedIds.has(u.id))
}
```

### Step 7: Create Community Page

File: `src/app/(dashboard)/community/page.tsx`

```typescript
import { getFriends, getPendingRequests, getPrivacySettings } from '@/lib/actions/community'
import { getProfile } from '@/lib/actions/profile'
import { getTierLimits } from '@/lib/subscription-limits'
import { FriendList } from '@/components/community/friend-list'
import { FriendRequestCard } from '@/components/community/friend-request-card'
import { redirect } from 'next/navigation'

export default async function CommunityPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const [friends, requests] = await Promise.all([
    getFriends(),
    getPendingRequests()
  ])

  const limits = getTierLimits(profile.subscription_tier)
  const maxFriends = limits.maxFriends === -1 ? 'unlimited' : limits.maxFriends

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-muted-foreground">Connect with other gardeners</p>
      </div>

      {requests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Friend Requests ({requests.length})
          </h2>
          <div className="grid gap-3">
            {requests.map(request => (
              <FriendRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}

      <FriendList
        friends={friends}
        currentUserId={profile.id}
        maxFriends={maxFriends}
      />
    </div>
  )
}
```

### Step 8: Create Public Profile Page

File: `src/app/(dashboard)/profile/[userId]/page.tsx`

```typescript
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TierBadge } from '@/components/ui/tier-badge'
import { UserPlus, UserMinus, Ban } from 'lucide-react'
import { ProfileActions } from '@/components/community/profile-actions'

interface ProfilePageProps {
  params: Promise<{ userId: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params
  const currentUser = await getProfile()
  if (!currentUser) redirect('/login')

  // Fetch target user profile
  const supabase = await createClient()
  const { data: targetUser, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, xp, level, subscription_tier')
    .eq('id', userId)
    .single()

  if (error || !targetUser) notFound()

  // Check privacy settings
  const { data: privacy } = await supabase
    .from('privacy_settings')
    .select('profile_visibility')
    .eq('user_id', userId)
    .single()

  // Check if blocked
  const { data: isBlocked } = await supabase.rpc('is_blocked', {
    checker: currentUser.id,
    target: userId
  })

  if (isBlocked) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">This profile is not available.</p>
      </div>
    )
  }

  // Check friendship status
  const { data: isFriend } = await supabase.rpc('are_friends', {
    user1: currentUser.id,
    user2: userId
  })

  // Check if private profile
  const isPrivate = privacy?.profile_visibility === 'private'
  const isFriendsOnly = privacy?.profile_visibility === 'friends'
  const canView = !isPrivate && (!isFriendsOnly || isFriend || currentUser.id === userId)

  if (!canView) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">This profile is private.</p>
      </div>
    )
  }

  const initials = (targetUser.display_name || targetUser.username || 'U').slice(0, 2).toUpperCase()
  const isOwnProfile = currentUser.id === userId

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={targetUser.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {targetUser.display_name || targetUser.username}
            </h1>
            <TierBadge tier={targetUser.subscription_tier as any} size="sm" />
          </div>

          <p className="text-muted-foreground">
            Level {targetUser.level} • {targetUser.xp.toLocaleString()} XP
          </p>

          {!isOwnProfile && (
            <ProfileActions
              targetUserId={userId}
              isFriend={isFriend}
              currentUserId={currentUser.id}
            />
          )}
        </div>
      </div>

      {/* Stats section - TODO: Add achievements, plants, etc. */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold">{targetUser.level}</p>
          <p className="text-sm text-muted-foreground">Level</p>
        </div>
        <div className="p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold">{targetUser.xp.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total XP</p>
        </div>
        <div className="p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold">-</p>
          <p className="text-sm text-muted-foreground">Plants</p>
        </div>
      </div>
    </div>
  )
}
```

### Step 9: Create Profile Actions Component

File: `src/components/community/profile-actions.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus, Ban, Loader2, Check } from 'lucide-react'
import { sendFriendRequest, removeFriend, blockUser } from '@/lib/actions/community'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface ProfileActionsProps {
  targetUserId: string
  isFriend: boolean
  currentUserId: string
}

export function ProfileActions({
  targetUserId,
  isFriend,
  currentUserId
}: ProfileActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const handleAddFriend = async () => {
    setLoading(true)
    const result = await sendFriendRequest(targetUserId)
    setLoading(false)

    if (result.success) {
      setRequestSent(true)
      toast.success('Friend request sent!')
    } else {
      toast.error(result.error || 'Failed to send request')
    }
  }

  const handleRemoveFriend = async () => {
    setLoading(true)
    const result = await removeFriend(targetUserId)
    setLoading(false)

    if (result.success) {
      toast.success('Friend removed')
    } else {
      toast.error(result.error || 'Failed to remove friend')
    }
    setShowRemoveDialog(false)
  }

  const handleBlock = async () => {
    setLoading(true)
    const result = await blockUser(targetUserId)
    setLoading(false)

    if (result.success) {
      toast.success('User blocked')
      // Redirect away from blocked user's profile
      window.location.href = '/community'
    } else {
      toast.error(result.error || 'Failed to block user')
    }
    setShowBlockDialog(false)
  }

  return (
    <>
      <div className="flex gap-2 mt-4">
        {isFriend ? (
          <Button
            variant="outline"
            onClick={() => setShowRemoveDialog(true)}
            disabled={loading}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Remove Friend
          </Button>
        ) : requestSent ? (
          <Button variant="outline" disabled>
            <Check className="h-4 w-4 mr-2" />
            Request Sent
          </Button>
        ) : (
          <Button onClick={handleAddFriend} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Add Friend
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowBlockDialog(true)}
        >
          <Ban className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        title="Remove Friend"
        description="Are you sure you want to remove this friend?"
        confirmText="Remove"
        onConfirm={handleRemoveFriend}
        loading={loading}
      />

      <ConfirmDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        title="Block User"
        description="Are you sure you want to block this user? They won't be able to see your profile or send you messages."
        confirmText="Block"
        variant="destructive"
        onConfirm={handleBlock}
        loading={loading}
      />
    </>
  )
}
```

### Step 10: Add Navigation Item

File: Modify `src/components/game-ui/game-nav.tsx`

Add community nav item after existing items:
```typescript
{
  href: '/community',
  icon: Users,
  label: 'Community',
  badge: pendingRequestCount > 0 ? pendingRequestCount : undefined
}
```

---

## Todo Checklist

- [ ] Create community layout
- [ ] Create FriendList component
- [ ] Create FriendCard component
- [ ] Create FriendRequestCard component
- [ ] Create FriendSearchDialog component
- [ ] Add searchUsers action
- [ ] Create community page
- [ ] Create public profile page
- [ ] Create ProfileActions component
- [ ] Add community nav item
- [ ] Create ConfirmDialog component (if not exists)
- [ ] Test friend request flow
- [ ] Test block flow
- [ ] Test privacy settings respect
- [ ] Run type check

---

## Success Criteria

- [ ] Users can see friend list
- [ ] Users can send friend requests
- [ ] Users can accept/reject requests
- [ ] Users can remove friends
- [ ] Users can block other users
- [ ] Blocked users cannot see each other
- [ ] Private profiles show restricted message
- [ ] Friend limit enforced by tier
- [ ] Search excludes blocked users

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Friend search abuse | Server load | Rate limit search, min 2 chars |
| Block bypass | Privacy violation | Check blocks in all queries |
| Request spam | UX annoyance | 1 pending request per pair |
| Slow friend list | Poor UX | Pagination (Phase 5) |

---

## Security Considerations

1. **Profile Visibility**: Respect privacy settings in all profile views
2. **Block Enforcement**: Blocked users see "Profile not available"
3. **Friend Limit**: Server-side validation prevents exceeding tier limit
4. **Request Validation**: Cannot send request to self, blocked, or existing friend
5. **XSS Prevention**: Sanitize display_name in UI
