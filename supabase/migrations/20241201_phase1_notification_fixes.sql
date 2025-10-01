-- Phase 1: Critical Notification System Fixes
-- Run this migration to fix the core notification system issues

-- 1. Fix user_id columns from TEXT to UUID for proper referential integrity
-- Note: This is a breaking change that requires data migration

-- First, create new tables with UUID user_id columns
CREATE TABLE IF NOT EXISTS fcm_tokens_new (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  fcm_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions_new (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notification_preferences_new (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  prayer_reminders BOOLEAN DEFAULT true,
  community_updates BOOLEAN DEFAULT true,
  daily_motivation BOOLEAN DEFAULT true,
  weekly_progress BOOLEAN DEFAULT false,
  bible_study BOOLEAN DEFAULT true,
  preferred_time TIME DEFAULT '09:00:00',
  reminder_intensity TEXT DEFAULT 'gentle' CHECK (reminder_intensity IN ('gentle', 'motivating', 'aggressive')),
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_notifications_new (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('prayer', 'bible', 'meditation', 'journal', 'reminder', 'achievement')),
  data JSON DEFAULT '{}',
  scheduled_for TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notifications_new (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('prayer', 'bible', 'meditation', 'journal', 'reminder', 'achievement')),
  data JSON DEFAULT '{}',
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered', 'clicked')),
  delivery_method TEXT DEFAULT 'push' CHECK (delivery_method IN ('push', 'email', 'sms')),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Copy data from old tables to new tables (with proper UUID conversion)
-- Note: This assumes Supabase Auth user IDs are already UUIDs in the auth.users table
-- If you have TEXT user IDs in your notification tables, you'll need to map them to UUIDs

-- For now, we'll assume the data migration will be handled manually or through a script
-- In production, you would:
-- 1. Create a mapping from old TEXT user_ids to new UUID user_ids
-- 2. Update all foreign key references
-- 3. Drop old tables

-- 3. Create indexes on new tables
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_new_user_id ON fcm_tokens_new(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_new_active ON fcm_tokens_new(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_new_user_id ON push_subscriptions_new(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_new_active ON push_subscriptions_new(is_active);

-- Enforce one active subscription per user (prevents duplicate notifications)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_push_new ON push_subscriptions_new (user_id) WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_fcm_new ON fcm_tokens_new (user_id) WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_new_user_id ON user_notification_preferences_new(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_new_user_id ON scheduled_notifications_new(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_new_status ON scheduled_notifications_new(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_new_scheduled_for ON scheduled_notifications_new(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_user_notifications_new_user_id ON user_notifications_new(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_new_sent_at ON user_notifications_new(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_new_type ON user_notifications_new(notification_type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_new_read ON user_notifications_new(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_new_read_at ON user_notifications_new(read_at);

-- 4. Update functions to use UUID
CREATE OR REPLACE FUNCTION get_user_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_notifications_new
    WHERE user_id = user_id_param AND status = 'sent'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_unread_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_notifications_new
    WHERE user_id = user_id_param AND read = false
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers for updated_at
CREATE TRIGGER update_fcm_tokens_new_updated_at
  BEFORE UPDATE ON fcm_tokens_new
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_new_updated_at
  BEFORE UPDATE ON push_subscriptions_new
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_new_updated_at
  BEFORE UPDATE ON user_notification_preferences_new
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_notifications_new_updated_at
  BEFORE UPDATE ON scheduled_notifications_new
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: After running this migration and migrating data:
-- 1. Drop old tables: DROP TABLE IF EXISTS fcm_tokens, push_subscriptions, etc.
-- 2. Rename new tables: ALTER TABLE fcm_tokens_new RENAME TO fcm_tokens;
-- 3. Update your application code to use UUID user_id types
-- 4. Test thoroughly before deploying to production


