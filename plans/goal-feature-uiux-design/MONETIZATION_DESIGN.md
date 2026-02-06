# Habien Monetization Design

> **Created**: 2026-02-06
> **Status**: Design Document
> **Philosophy**: "Free để tạo thói quen. Pro để đạt mục tiêu. Premium để xây dựng identity."

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tier Definitions](#2-tier-definitions)
3. [Feature Matrix](#3-feature-matrix)
4. [Pricing Strategy](#4-pricing-strategy)
5. [Upgrade Triggers](#5-upgrade-triggers)
6. [Implementation Phases](#6-implementation-phases)
7. [Database Schema](#7-database-schema)
8. [UI/UX Considerations](#8-uiux-considerations)

---

## 1. Overview

### Core Principle

Free tier phải đủ giá trị để người dùng thực sự xây dựng thói quen. Paywall chỉ áp dụng cho advanced features, không block core experience.

### Tier Summary

| Tier | Price | Tagline | Target User |
|------|-------|---------|-------------|
| **FREE** | $0 | "Bắt đầu thói quen" | Người mới, casual users |
| **PRO** | $4.99/mo | "Đạt mục tiêu" | Serious habit builders |
| **PREMIUM** | $9.99/mo | "Trở thành ai đó" | Power users, identity seekers |

### Value Ladder

```
FREE: Habit Tracking
  ↓ Level 6 trigger
PRO: Goal Achievement
  ↓ Level 13 trigger
PREMIUM: Identity Transformation
```

---

## 2. Tier Definitions

### FREE - "Seedling"

**Who**: Anyone starting their habit journey
**Value**: Full habit tracking experience without limits on core functionality

**Key Features**:
- 3 plant slots (enough to build multiple habits)
- Tier 1-2 plants (Forgiving Friends + Reliable Partners)
- 3x3 garden with basic decorations
- Streaks, achievements (basic set)
- Levels 1-10
- 1 rest day/week/plant
- 3 water reserves

**Restrictions**:
- No goals system
- No metrics tracking
- No weekly reports
- Level cap at 10
- Basic decorations only

### PRO - "Gardener"

**Who**: Users ready to set and achieve specific goals
**Value**: Transform habits into measurable outcomes

**Key Features** (everything in FREE plus):
- 8 plant slots
- Tier 1-4 plants (including Life Companions)
- 5x5 garden with advanced decorations
- **Goals system** (5 active goals)
- **Metrics tracking**
- **Weekly reports**
- Levels 1-15
- 2 rest days/week/plant
- 7 water reserves
- 1.2x XP boost
- Backfill watering (3 days)
- 5 visual themes

**Unlock Trigger**: Level 6 (natural progression ~70 days)

### PREMIUM - "Sage"

**Who**: Long-term users building lasting identity
**Value**: Complete transformation system

**Key Features** (everything in PRO plus):
- Unlimited plant slots
- Tier 5 plants (Garden Legends)
- Dynamic garden (7x7+) with all decorations
- **Identity system**
- Unlimited goals
- N:1 goal-plant linking
- Detailed insights + AI suggestions
- Levels 1-20+
- 3 rest days/week/plant
- 14 water reserves
- 1.5x XP boost
- Backfill watering (7 days)
- All themes + custom colors
- Early access to features
- Priority support

**Unlock Trigger**: Level 13 (natural progression ~250 days)

---

## 3. Feature Matrix

### Plants & Garden

| Feature | FREE | PRO | PREMIUM |
|---------|:----:|:---:|:-------:|
| Plant slots | 3 | 8 | ∞ |
| Plant tiers | 1-2 | 1-4 | 1-5 |
| Garden size | 3x3 | 5x5 | 7x7+ |
| Basic decorations | ✓ | ✓ | ✓ |
| Advanced decorations | ✗ | ✓ | ✓ |
| Premium decorations | ✗ | ✗ | ✓ |
| Visual themes | 1 | 5 | All |

### Habits & Watering

| Feature | FREE | PRO | PREMIUM |
|---------|:----:|:---:|:-------:|
| Daily check-in | ✓ | ✓ | ✓ |
| Streaks | ✓ | ✓ | ✓ |
| Rest days/week | 1 | 2 | 3 |
| Water reserves | 3 | 7 | 14 |
| Backfill days | 0 | 3 | 7 |
| Quick notes | 50 chars | 500 chars | ∞ |

### Goals & Metrics

| Feature | FREE | PRO | PREMIUM |
|---------|:----:|:---:|:-------:|
| Goals system | ✗ | ✓ | ✓ |
| Active goals | 0 | 5 | ∞ |
| Goal modes | - | 2 | All |
| Metrics tracking | ✗ | ✓ | ✓ |
| Weekly reports | ✗ | Basic | Detailed |
| Seasons | ✗ | ✓ | ✓ |
| Goal-Plant linking | - | 1:1 | N:1 |

### Identity System

| Feature | FREE | PRO | PREMIUM |
|---------|:----:|:---:|:-------:|
| Identity creation | ✗ | ✗ | ✓ |
| Identity dashboard | ✗ | ✗ | ✓ |
| Goal grouping | ✗ | ✗ | ✓ |
| AI suggestions | ✗ | ✗ | ✓ |

### Gamification

| Feature | FREE | PRO | PREMIUM |
|---------|:----:|:---:|:-------:|
| XP multiplier | 1.0x | 1.2x | 1.5x |
| Level cap | 10 | 15 | 20+ |
| Achievements | 10 | 20+ | All + Exclusive |
| Weather bonuses | ✓ | ✓ | ✓ |
| Special weather | ✗ | ✗ | ✓ |

### App Features

| Feature | FREE | PRO | PREMIUM |
|---------|:----:|:---:|:-------:|
| Devices | 1 | 3 | ∞ |
| Data export | ✗ | CSV | All formats |
| Offline mode | ✗ | 3 days | 30 days |
| Ads | Yes | No | No |
| Support | Community | Email 48h | Priority 24h |

---

## 4. Pricing Strategy

### Monthly Pricing

| Tier | VND | USD |
|------|-----|-----|
| FREE | 0 | $0 |
| PRO | 99,000đ | $4.99 |
| PREMIUM | 199,000đ | $9.99 |

### Annual Pricing (Save 20%)

| Tier | VND | USD | Monthly Equiv |
|------|-----|-----|---------------|
| PRO | 950,000đ | $47.99 | ~$4/mo |
| PREMIUM | 1,900,000đ | $95.99 | ~$8/mo |

### Lifetime (Limited Availability)

| Tier | VND | USD | Notes |
|------|-----|-----|-------|
| PRO | 1,990,000đ | $99 | One-time |
| PREMIUM | 3,990,000đ | $199 | First 1000 users |

### Regional Pricing

| Region | Discount |
|--------|----------|
| Vietnam | 50% |
| SEA (Thailand, Indonesia, Philippines) | 40% |
| India | 40% |
| Students (verified) | 50% |

---

## 5. Upgrade Triggers

### FREE → PRO: Level 6 Unlock

**Context**: User reaches Level 6 (~70 days of consistent use)

```
🎯 Goals Unlocked!

You've proven you can maintain habits.
Now let's set real goals for your plants.

With PRO, you can:
• Set measurable goals for each habit
• Track your progress with metrics
• Get weekly insights on your growth
• Unlock 5 more plant slots

[Try PRO free for 7 days]
[Maybe later]
```

**Trial**: 7 days free, no credit card required

### PRO → PREMIUM: Level 13 Unlock

**Context**: User reaches Level 13 (~250 days)

```
🌳 Identity Awaits!

After 250+ days, habits become who you are.
It's time to define your identity.

PREMIUM unlocks:
• Create identities ("I am a reader")
• Group goals under identities
• Legendary Tier 5 plants
• Unlimited everything

[Upgrade to PREMIUM]
[Stay with PRO]
```

### Soft Upsells (Non-Blocking)

**Plant slot limit reached (FREE)**:
```
Your garden is full! 🌱

You have 3 plants growing beautifully.
PRO members can grow up to 8 plants.

[See PRO benefits] [I'm good for now]
```

**Tier 3+ plant attempted (FREE)**:
```
🌹 Rose requires PRO

Tier 3 plants need more care and dedication.
They're available for PRO gardeners.

[Learn about PRO] [Choose another plant]
```

---

## 6. Implementation Phases

### Current Progress

- [x] Phase 1: Tier system, slot limits (DONE)
- [x] Phase 2: Garden expansion system (DONE)

### Updated Roadmap

```
PHASE 3: Subscription Infrastructure (Week 1-2)
├── Database: subscriptions, subscription_tiers tables
├── Payment: Integrate payment provider (Polar.sh or Stripe)
├── Auth: Add subscription status to user profile
├── API: Subscription check middleware
└── UI: Basic paywall component

PHASE 4: Feature Gating (Week 2-3)
├── Gate goals system behind PRO
├── Gate identity system behind PREMIUM
├── Apply tier limits (plants, decorations, garden size)
├── Apply level caps by tier
└── Add upgrade prompts at natural triggers

PHASE 5: Goals System (Week 3-5)
├── Goals V2 table (standalone from plants)
├── Goal creation flow (PRO+)
├── Metrics tracking
├── Weekly reports
├── Plant-Goal linking (1:1 for PRO, N:1 for PREMIUM)
└── Seasons system

PHASE 6: Identity System (Week 5-7)
├── Identities table (PREMIUM only)
├── Identity creation flow
├── Goal grouping under identity
├── Identity dashboard
└── AI suggestions for identity

PHASE 7: Polish & Launch (Week 7-8)
├── Upgrade flow UX polish
├── Trial management
├── Billing portal
├── Analytics for conversion tracking
└── A/B test pricing
```

### Phase 3 Detail: Subscription Infrastructure

**Database Tables**:
```sql
-- Subscription tiers definition
CREATE TABLE subscription_tiers (
  id TEXT PRIMARY KEY, -- 'free', 'pro', 'premium'
  name TEXT NOT NULL,
  price_monthly INTEGER, -- in cents
  price_yearly INTEGER,
  features JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id TEXT REFERENCES subscription_tiers(id),
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'
  payment_provider TEXT, -- 'polar', 'stripe'
  provider_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Profile Extension**:
```sql
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'active';
```

**Feature Check Function**:
```typescript
interface TierLimits {
  maxPlants: number;
  maxTier: number;
  gardenSize: number;
  maxGoals: number;
  restDaysPerWeek: number;
  waterReserves: number;
  levelCap: number;
  xpMultiplier: number;
  hasGoals: boolean;
  hasIdentity: boolean;
  hasAds: boolean;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    maxPlants: 3,
    maxTier: 2,
    gardenSize: 3,
    maxGoals: 0,
    restDaysPerWeek: 1,
    waterReserves: 3,
    levelCap: 10,
    xpMultiplier: 1.0,
    hasGoals: false,
    hasIdentity: false,
    hasAds: true,
  },
  pro: {
    maxPlants: 8,
    maxTier: 4,
    gardenSize: 5,
    maxGoals: 5,
    restDaysPerWeek: 2,
    waterReserves: 7,
    levelCap: 15,
    xpMultiplier: 1.2,
    hasGoals: true,
    hasIdentity: false,
    hasAds: false,
  },
  premium: {
    maxPlants: Infinity,
    maxTier: 5,
    gardenSize: 7,
    maxGoals: Infinity,
    restDaysPerWeek: 3,
    waterReserves: 14,
    levelCap: 20,
    xpMultiplier: 1.5,
    hasGoals: true,
    hasIdentity: true,
    hasAds: false,
  },
};

function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

function canAccess(feature: string, tier: string): boolean {
  const limits = getTierLimits(tier);
  switch (feature) {
    case 'goals': return limits.hasGoals;
    case 'identity': return limits.hasIdentity;
    default: return true;
  }
}
```

---

## 7. Database Schema

### New Tables

```sql
-- Subscription tiers (seed data)
CREATE TABLE subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly_usd INTEGER, -- cents
  price_yearly_usd INTEGER,
  price_monthly_vnd INTEGER,
  price_yearly_vnd INTEGER,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  tier_id TEXT REFERENCES subscription_tiers(id) DEFAULT 'free',
  status TEXT DEFAULT 'active',
  payment_provider TEXT,
  provider_subscription_id TEXT,
  provider_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription history for analytics
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'trial_started', 'trial_ended'
  from_tier TEXT,
  to_tier TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade prompts tracking
CREATE TABLE upgrade_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL, -- 'level_6_goals', 'level_13_identity', 'plant_limit', 'tier_limit'
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT, -- 'dismissed', 'clicked_upgrade', 'started_trial'
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ
);
```

### Seed Data

```sql
INSERT INTO subscription_tiers (id, name, description, price_monthly_usd, price_yearly_usd, features, sort_order) VALUES
('free', 'Seedling', 'Start your habit journey', 0, 0, '{
  "maxPlants": 3,
  "maxTier": 2,
  "gardenSize": 3,
  "maxGoals": 0,
  "restDaysPerWeek": 1,
  "waterReserves": 3,
  "levelCap": 10,
  "xpMultiplier": 1.0,
  "hasGoals": false,
  "hasIdentity": false,
  "hasAds": true,
  "backfillDays": 0,
  "themes": ["default"],
  "decorations": ["basic"]
}', 0),

('pro', 'Gardener', 'Achieve your goals', 499, 4799, '{
  "maxPlants": 8,
  "maxTier": 4,
  "gardenSize": 5,
  "maxGoals": 5,
  "restDaysPerWeek": 2,
  "waterReserves": 7,
  "levelCap": 15,
  "xpMultiplier": 1.2,
  "hasGoals": true,
  "hasIdentity": false,
  "hasAds": false,
  "backfillDays": 3,
  "themes": ["default", "forest", "desert", "ocean", "mountain", "zen"],
  "decorations": ["basic", "advanced"]
}', 1),

('premium', 'Sage', 'Transform your identity', 999, 9599, '{
  "maxPlants": -1,
  "maxTier": 5,
  "gardenSize": 7,
  "maxGoals": -1,
  "restDaysPerWeek": 3,
  "waterReserves": 14,
  "levelCap": 20,
  "xpMultiplier": 1.5,
  "hasGoals": true,
  "hasIdentity": true,
  "hasAds": false,
  "backfillDays": 7,
  "themes": ["all"],
  "decorations": ["all"],
  "earlyAccess": true,
  "prioritySupport": true
}', 2);
```

### Profile Updates

```sql
-- Add subscription fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
```

---

## 8. UI/UX Considerations

### Paywall Design Principles

1. **Never block core experience** - User can always water plants
2. **Show value before asking** - Let them see what they're missing
3. **Natural upgrade moments** - Level 6, Level 13, hitting limits
4. **Easy dismissal** - "Maybe later" always available
5. **No dark patterns** - Clear pricing, easy cancellation

### Upgrade Modal Component

```tsx
interface UpgradeModalProps {
  trigger: 'level_6' | 'level_13' | 'plant_limit' | 'tier_limit' | 'feature';
  targetTier: 'pro' | 'premium';
  featureHighlight?: string;
}

// Show benefits specific to context
// Include trial offer for first-time
// Track prompt for analytics
```

### Feature Lock UI

When user tries to access locked feature:
```
┌─────────────────────────────────┐
│  🔒 Goals require PRO           │
│                                 │
│  Set measurable targets for     │
│  your habits and track your     │
│  progress over time.            │
│                                 │
│  [Unlock with PRO - $4.99/mo]   │
│  [Maybe later]                  │
└─────────────────────────────────┘
```

### Settings → Subscription Page

```
┌─────────────────────────────────┐
│  Your Plan: FREE (Seedling)     │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  PRO - $4.99/mo                 │
│  ✓ Goals & metrics              │
│  ✓ 8 plant slots                │
│  ✓ Tier 1-4 plants              │
│  ✓ No ads                       │
│  [Upgrade to PRO]               │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  PREMIUM - $9.99/mo             │
│  ✓ Everything in PRO            │
│  ✓ Identity system              │
│  ✓ Unlimited plants             │
│  ✓ Legendary plants             │
│  [Upgrade to PREMIUM]           │
│                                 │
└─────────────────────────────────┘
```

---

## Appendix: Payment Provider Options

### Option 1: Polar.sh (Recommended for MVP)

**Pros**:
- Built for indie developers
- Simple API
- Handles subscriptions, one-time, donations
- Good for open source projects

**Cons**:
- Less known
- Fewer payment methods

### Option 2: Stripe

**Pros**:
- Industry standard
- More payment methods
- Better for scaling

**Cons**:
- More complex setup
- Higher fees for small transactions

### Option 3: Vietnamese Local (SePay + Polar)

- SePay for VN users (bank transfer, VietQR)
- Polar for international users

---

*Document created: 2026-02-06*
*Author: Habien Team + Claude*
