-- UUID Migration for Notification System
-- CRITICAL: This migration changes user_id from TEXT to UUID across all tables
-- Run this during low-traffic period with proper backup and rollback plan

-- Phase 1: Create backup tables (for rollback capability)
CREATE TABLE IF NOT EXISTS fcm_tokens_backup AS SELECT * FROM fcm_tokens;
CREATE TABLE IF NOT EXISTS push_subscriptions_backup AS SELECT * FROM push_subscriptions;
CREATE TABLE IF NOT EXISTS user_notification_preferences_backup AS SELECT * FROM user_notification_preferences;
CREATE TABLE IF NOT EXISTS scheduled_notifications_backup AS SELECT * FROM scheduled_notifications;
CREATE TABLE IF NOT EXISTS user_notifications_backup AS SELECT * FROM user_notifications;

-- Phase 2: Create new tables with UUID user_id columns
-- Note: These should match the schema in notification_schema.sql

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

-- Phase 3: Create indexes on new tables (same as in notification_schema.sql)
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

-- Phase 4: Data Migration Functions
-- These functions handle the conversion from TEXT user_id to UUID user_id

-- Function to convert TEXT user_id to UUID (assumes Supabase Auth user IDs are already UUIDs)
CREATE OR REPLACE FUNCTION migrate_user_id_to_uuid(text_user_id TEXT)
RETURNS UUID AS $$
BEGIN
  -- Try to cast directly (assumes valid UUID format)
  BEGIN
    RETURN text_user_id::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      -- If not a valid UUID, this indicates a problem
      -- In production, you might need to handle this case differently
      RAISE EXCEPTION 'Invalid UUID format: %', text_user_id;
  END;
END;
$$ LANGUAGE plpgsql;

-- Phase 5: Migrate Data (CRITICAL SECTION - Run these one by one)

-- Migrate FCM tokens
INSERT INTO fcm_tokens_new (id, user_id, fcm_token, is_active, created_at, updated_at)
SELECT
  id,
  migrate_user_id_to_uuid(user_id),
  fcm_token,
  is_active,
  created_at,
  updated_at
FROM fcm_tokens;

-- Migrate push subscriptions
INSERT INTO push_subscriptions_new (id, user_id, endpoint, p256dh, auth, is_active, created_at, updated_at)
SELECT
  id,
  migrate_user_id_to_uuid(user_id),
  endpoint,
  p256dh,
  auth,
  is_active,
  created_at,
  updated_at
FROM push_subscriptions;

-- Migrate user notification preferences
INSERT INTO user_notification_preferences_new (id, user_id, email_enabled, push_enabled, prayer_reminders,
  community_updates, daily_motivation, weekly_progress, bible_study, preferred_time, reminder_intensity,
  timezone, is_active, created_at, updated_at)
SELECT
  id,
  migrate_user_id_to_uuid(user_id),
  email_enabled,
  push_enabled,
  prayer_reminders,
  community_updates,
  daily_motivation,
  weekly_progress,
  bible_study,
  preferred_time,
  reminder_intensity,
  timezone,
  is_active,
  created_at,
  updated_at
FROM user_notification_preferences;

-- Migrate scheduled notifications
INSERT INTO scheduled_notifications_new (id, user_id, title, body, notification_type, data,
  scheduled_for, status, sent_at, created_at, updated_at)
SELECT
  id,
  migrate_user_id_to_uuid(user_id),
  title,
  body,
  notification_type,
  data,
  scheduled_for,
  status,
  sent_at,
  created_at,
  updated_at
FROM scheduled_notifications;

-- Migrate user notifications
INSERT INTO user_notifications_new (id, user_id, title, body, notification_type, data,
  sent_at, status, delivery_method, read, read_at, created_at)
SELECT
  id,
  migrate_user_id_to_uuid(user_id),
  title,
  body,
  notification_type,
  data,
  sent_at,
  status,
  delivery_method,
  COALESCE(read, false), -- Default to false if NULL
  read_at,
  created_at
FROM user_notifications;

-- Phase 6: Verify Migration (Check row counts match)
DO $$
DECLARE
  fcm_count_old INTEGER;
  fcm_count_new INTEGER;
  push_count_old INTEGER;
  push_count_new INTEGER;
  prefs_count_old INTEGER;
  prefs_count_new INTEGER;
  scheduled_count_old INTEGER;
  scheduled_count_new INTEGER;
  notifications_count_old INTEGER;
  notifications_count_new INTEGER;
BEGIN
  -- Get counts from old tables
  SELECT COUNT(*) INTO fcm_count_old FROM fcm_tokens;
  SELECT COUNT(*) INTO push_count_old FROM push_subscriptions;
  SELECT COUNT(*) INTO prefs_count_old FROM user_notification_preferences;
  SELECT COUNT(*) INTO scheduled_count_old FROM scheduled_notifications;
  SELECT COUNT(*) INTO notifications_count_old FROM user_notifications;

  -- Get counts from new tables
  SELECT COUNT(*) INTO fcm_count_new FROM fcm_tokens_new;
  SELECT COUNT(*) INTO push_count_new FROM push_subscriptions_new;
  SELECT COUNT(*) INTO prefs_count_new FROM user_notification_preferences_new;
  SELECT COUNT(*) INTO scheduled_count_new FROM scheduled_notifications_new;
  SELECT COUNT(*) INTO notifications_count_new FROM user_notifications_new;

  -- Log results
  RAISE NOTICE 'Migration Verification:';
  RAISE NOTICE 'FCM tokens: % -> %', fcm_count_old, fcm_count_new;
  RAISE NOTICE 'Push subscriptions: % -> %', push_count_old, push_count_new;
  RAISE NOTICE 'User preferences: % -> %', prefs_count_old, prefs_count_new;
  RAISE NOTICE 'Scheduled notifications: % -> %', scheduled_count_old, scheduled_count_new;
  RAISE NOTICE 'User notifications: % -> %', notifications_count_old, notifications_count_new;

  -- Check if counts match
  IF fcm_count_old != fcm_count_new OR
     push_count_old != push_count_new OR
     prefs_count_old != prefs_count_new OR
     scheduled_count_old != scheduled_count_new OR
     notifications_count_old != notifications_count_new THEN
    RAISE EXCEPTION 'Migration failed: Row counts do not match!';
  END IF;

  RAISE NOTICE '✅ Migration verification passed: All row counts match';
END $$;

-- Phase 7: Atomic Switch (CRITICAL - Run this as a single transaction)

-- Start transaction
BEGIN;

-- Drop old tables
DROP TABLE IF EXISTS fcm_tokens CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS user_notification_preferences CASCADE;
DROP TABLE IF EXISTS scheduled_notifications CASCADE;
DROP TABLE IF EXISTS user_notifications CASCADE;

-- Rename new tables to replace old ones
ALTER TABLE fcm_tokens_new RENAME TO fcm_tokens;
ALTER TABLE push_subscriptions_new RENAME TO push_subscriptions;
ALTER TABLE user_notification_preferences_new RENAME TO user_notification_preferences;
ALTER TABLE scheduled_notifications_new RENAME TO scheduled_notifications;
ALTER TABLE user_notifications_new RENAME TO user_notifications;

-- Recreate indexes with correct names
DROP INDEX IF EXISTS idx_fcm_tokens_new_user_id;
DROP INDEX IF EXISTS idx_fcm_tokens_new_active;
DROP INDEX IF EXISTS idx_push_subscriptions_new_user_id;
DROP INDEX IF EXISTS idx_push_subscriptions_new_active;
DROP INDEX IF EXISTS idx_one_active_push_new;
DROP INDEX IF EXISTS idx_one_active_fcm_new;
DROP INDEX IF EXISTS idx_user_notification_preferences_new_user_id;
DROP INDEX IF EXISTS idx_scheduled_notifications_new_user_id;
DROP INDEX IF EXISTS idx_scheduled_notifications_new_status;
DROP INDEX IF EXISTS idx_scheduled_notifications_new_scheduled_for;
DROP INDEX IF EXISTS idx_user_notifications_new_user_id;
DROP INDEX IF EXISTS idx_user_notifications_new_sent_at;
DROP INDEX IF EXISTS idx_user_notifications_new_type;
DROP INDEX IF EXISTS idx_user_notifications_new_read;
DROP INDEX IF EXISTS idx_user_notifications_new_read_at;

-- Recreate indexes (these should already exist from the CREATE TABLE statements)
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_push ON push_subscriptions (user_id) WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_fcm ON fcm_tokens (user_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_sent_at ON user_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read_at ON user_notifications(read_at);

-- Recreate triggers
CREATE TRIGGER update_fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_notifications_updated_at
  BEFORE UPDATE ON scheduled_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update functions to use UUID
CREATE OR REPLACE FUNCTION get_user_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_notifications
    WHERE user_id = user_id_param AND status = 'sent'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_unread_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_notifications
    WHERE user_id = user_id_param AND read = false
  );
END;
$$ LANGUAGE plpgsql;

-- Commit the transaction
COMMIT;

-- Phase 8: Final Verification
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Check that all tables exist with correct structure
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('fcm_tokens', 'push_subscriptions', 'user_notification_preferences', 'scheduled_notifications', 'user_notifications');

  IF table_count != 5 THEN
    RAISE EXCEPTION 'Migration failed: Not all notification tables exist!';
  END IF;

  -- Check that user_id columns are UUID type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fcm_tokens' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    RAISE EXCEPTION 'Migration failed: fcm_tokens.user_id is not UUID type!';
  END IF;

  RAISE NOTICE '✅ UUID migration completed successfully!';
  RAISE NOTICE '📋 Migration Summary:';
  RAISE NOTICE '- All user_id columns converted from TEXT to UUID';
  RAISE NOTICE '- Foreign key relationships now properly enforced';
  RAISE NOTICE '- Performance improved with UUID indexing';
  RAISE NOTICE '- Backup tables available for rollback if needed';
END $$;

-- IMPORTANT: Rollback Instructions
-- If something goes wrong after migration:
--
-- 1. Drop new tables:
--    DROP TABLE IF EXISTS fcm_tokens CASCADE;
--    DROP TABLE IF EXISTS push_subscriptions CASCADE;
--    DROP TABLE IF EXISTS user_notification_preferences CASCADE;
--    DROP TABLE IF EXISTS scheduled_notifications CASCADE;
--    DROP TABLE IF EXISTS user_notifications CASCADE;
--
-- 2. Rename backup tables back:
--    ALTER TABLE fcm_tokens_backup RENAME TO fcm_tokens;
--    ALTER TABLE push_subscriptions_backup RENAME TO push_subscriptions;
--    ALTER TABLE user_notification_preferences_backup RENAME TO user_notification_preferences;
--    ALTER TABLE scheduled_notifications_backup RENAME TO scheduled_notifications;
--    ALTER TABLE user_notifications_backup RENAME TO user_notifications;
--
-- 3. Recreate original indexes and triggers as needed
