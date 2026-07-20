-- subscription_tiers: public catalog
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id text PRIMARY KEY CHECK (id IN ('free','pro','premium')),
  name text NOT NULL,
  description text,
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tiers are public" ON subscription_tiers FOR SELECT USING (true);

INSERT INTO subscription_tiers (id, name, description, price_monthly, price_yearly, sort_order) VALUES
  ('free','Free','Get started with basic features',0,0,0),
  ('pro','Pro','More plants, goals and metrics',4.99,49.99,1),
  ('premium','Premium','Everything, including identity system',9.99,99.99,2)
ON CONFLICT (id) DO NOTHING;

-- subscriptions: one row per user, managed by service role via webhook
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id text NOT NULL REFERENCES subscription_tiers(id) DEFAULT 'free',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','trialing','past_due','canceled','paused','expired')),
  payment_provider text CHECK (payment_provider IN ('paddle','stripe')),
  provider_customer_id text,
  provider_subscription_id text UNIQUE,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscription" ON subscriptions
  FOR SELECT USING ((select auth.uid()) = user_id);
-- No client INSERT/UPDATE/DELETE policies: webhook (service role) only.

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub ON subscriptions(provider_subscription_id);

-- subscription_events: audit log
CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_tier text REFERENCES subscription_tiers(id),
  to_tier text REFERENCES subscription_tiers(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own events" ON subscription_events
  FOR SELECT USING ((select auth.uid()) = user_id);
-- No client write policies: server-side logging only.

CREATE INDEX IF NOT EXISTS idx_sub_events_user ON subscription_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_events_subscription ON subscription_events(subscription_id);

-- upgrade_prompts: client-inserted analytics
CREATE TABLE IF NOT EXISTS upgrade_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type text NOT NULL,
  feature_context text,
  action text CHECK (action IN ('dismissed','clicked_upgrade','started_trial','converted')),
  converted boolean NOT NULL DEFAULT false,
  converted_at timestamptz,
  shown_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE upgrade_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own prompts" ON upgrade_prompts
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own prompts" ON upgrade_prompts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users update own prompts" ON upgrade_prompts
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_upgrade_prompts_user_type ON upgrade_prompts(user_id, prompt_type, shown_at DESC);;
