-- Migration: Add Paddle as payment provider
-- Phase 5: Payment Integration

-- Add index for webhook lookups by provider subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id
ON subscriptions(provider_subscription_id)
WHERE provider_subscription_id IS NOT NULL;

-- Add index for finding subscriptions by customer ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_customer_id
ON subscriptions(provider_customer_id)
WHERE provider_customer_id IS NOT NULL;

-- Note: The payment_provider column already supports 'paddle' as a text value
-- No constraint modification needed if using TEXT type

-- Add webhook events log table for debugging and audit trail
CREATE TABLE IF NOT EXISTS subscription_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding unprocessed webhooks
CREATE INDEX IF NOT EXISTS idx_subscription_webhooks_unprocessed
ON subscription_webhooks(provider, processed)
WHERE processed = false;

-- Index for looking up by event ID (for idempotency)
CREATE INDEX IF NOT EXISTS idx_subscription_webhooks_event_id
ON subscription_webhooks(event_id)
WHERE event_id IS NOT NULL;

-- RLS for subscription_webhooks (only service role can access)
ALTER TABLE subscription_webhooks ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - only service role should access webhook logs

-- Comment on table
COMMENT ON TABLE subscription_webhooks IS 'Audit log of all payment provider webhook events for debugging and replay';
