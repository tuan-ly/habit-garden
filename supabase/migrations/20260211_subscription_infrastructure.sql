-- Habien 2.0 Phase 3: Subscription Infrastructure
-- Creates subscription tables and adds subscription fields to profiles

-- =====================================================
-- 1. Create subscription_tiers table
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY, -- 'free', 'pro', 'premium'
  name TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  price_monthly_usd INTEGER DEFAULT 0, -- in cents
  price_yearly_usd INTEGER DEFAULT 0,
  price_monthly_vnd INTEGER DEFAULT 0,
  price_yearly_vnd INTEGER DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Create subscriptions table
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  tier_id TEXT REFERENCES subscription_tiers(id) DEFAULT 'free',
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing', 'expired'
  payment_provider TEXT, -- 'polar', 'stripe', 'sepay'
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

-- =====================================================
-- 3. Create subscription_events table (for analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'trial_started', 'trial_ended', 'payment_failed'
  from_tier TEXT,
  to_tier TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Create upgrade_prompts table (track upgrade UX)
-- =====================================================

CREATE TABLE IF NOT EXISTS upgrade_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL, -- 'level_6_goals', 'level_13_identity', 'plant_limit', 'tier_limit', 'feature_gate'
  feature_context TEXT, -- e.g., 'goals', 'identity', 'tier_3_plant'
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT, -- 'dismissed', 'clicked_upgrade', 'started_trial', 'converted'
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ
);

-- =====================================================
-- 5. Add subscription fields to profiles
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- =====================================================
-- 6. Seed subscription_tiers data
-- =====================================================

INSERT INTO subscription_tiers (id, name, description, tagline, price_monthly_usd, price_yearly_usd, features, sort_order) VALUES
('free', 'Seedling', 'Start your habit journey', 'Bắt đầu thói quen', 0, 0, '{
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
  "hasMetrics": false,
  "hasWeeklyReports": false,
  "hasAds": true,
  "backfillDays": 0,
  "quickNoteChars": 50,
  "themes": ["default"],
  "decorations": ["basic"],
  "offlineDays": 0,
  "devices": 1
}', 0),

('pro', 'Gardener', 'Achieve your goals', 'Đạt mục tiêu', 499, 4799, '{
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
  "hasMetrics": true,
  "hasWeeklyReports": true,
  "hasAds": false,
  "backfillDays": 3,
  "quickNoteChars": 500,
  "themes": ["default", "forest", "desert", "ocean", "mountain", "zen"],
  "decorations": ["basic", "advanced"],
  "offlineDays": 3,
  "devices": 3
}', 1),

('premium', 'Sage', 'Transform your identity', 'Trở thành ai đó', 999, 9599, '{
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
  "hasMetrics": true,
  "hasWeeklyReports": true,
  "hasAds": false,
  "backfillDays": 7,
  "quickNoteChars": -1,
  "themes": ["all"],
  "decorations": ["all"],
  "offlineDays": 30,
  "devices": -1,
  "earlyAccess": true,
  "prioritySupport": true,
  "aiSuggestions": true
}', 2)
ON CONFLICT (id) DO UPDATE SET
  features = EXCLUDED.features,
  price_monthly_usd = EXCLUDED.price_monthly_usd,
  price_yearly_usd = EXCLUDED.price_yearly_usd;

-- =====================================================
-- 7. Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_upgrade_prompts_user ON upgrade_prompts(user_id);

-- =====================================================
-- 8. Create function to sync subscription to profile
-- =====================================================

CREATE OR REPLACE FUNCTION sync_subscription_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    subscription_tier = NEW.tier_id,
    subscription_status = NEW.status,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Create trigger to auto-sync subscription changes
-- =====================================================

DROP TRIGGER IF EXISTS trigger_sync_subscription ON subscriptions;
CREATE TRIGGER trigger_sync_subscription
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_subscription_to_profile();

-- =====================================================
-- 10. Create default subscription for existing users
-- =====================================================

INSERT INTO subscriptions (user_id, tier_id, status)
SELECT id, 'free', 'active' FROM profiles
WHERE id NOT IN (SELECT user_id FROM subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 11. Enable RLS on new tables
-- =====================================================

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_prompts ENABLE ROW LEVEL SECURITY;

-- subscription_tiers: Everyone can read
CREATE POLICY "Anyone can view subscription tiers"
ON subscription_tiers FOR SELECT
USING (true);

-- subscriptions: Users can only see their own
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- subscription_events: Users can see their own events
CREATE POLICY "Users can view own subscription events"
ON subscription_events FOR SELECT
USING (auth.uid() = user_id);

-- upgrade_prompts: Users can see and create their own
CREATE POLICY "Users can view own upgrade prompts"
ON upgrade_prompts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own upgrade prompts"
ON upgrade_prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upgrade prompts"
ON upgrade_prompts FOR UPDATE
USING (auth.uid() = user_id);
