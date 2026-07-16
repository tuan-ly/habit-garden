ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  ADD COLUMN IF NOT EXISTS daily_reminder_enabled boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS achievement_notifications boolean DEFAULT true NOT NULL;;
