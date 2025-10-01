-- NOTIFICATION SYSTEM IMPROVEMENTS
-- Safe improvements that enhance existing notification system
-- Run this if you want to improve without major schema changes

-- 1. Add read tracking to user_notifications (most important fix)
ALTER TABLE user_notifications
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- 2. Add indexes for read status (improves performance)
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read_at ON user_notifications(read_at);

-- 3. Add unique constraints for active subscriptions (prevents duplicates)
-- Only create if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'push_subscriptions'
    AND indexname = 'idx_one_active_push'
  ) THEN
    CREATE UNIQUE INDEX idx_one_active_push ON push_subscriptions (user_id) WHERE is_active;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'fcm_tokens'
    AND indexname = 'idx_one_active_fcm'
  ) THEN
    CREATE UNIQUE INDEX idx_one_active_fcm ON fcm_tokens (user_id) WHERE is_active;
  END IF;
END $$;

-- 4. Update the broken function to work with new read column
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

-- 5. Enable RLS on notification tables for security
-- Only enable if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.relname = 'user_notifications' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.relname = 'user_notification_preferences' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.relname = 'push_subscriptions' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 6. Create basic RLS policies (users can only see their own data)
-- User notifications (most important for privacy)
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- User notification preferences
DROP POLICY IF EXISTS "Users can view own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON user_notification_preferences;

CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Push subscriptions
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Grant permissions (safe defaults)
-- Authenticated users can read their own notification data
GRANT SELECT ON user_notifications TO authenticated;
GRANT SELECT ON user_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_notification_preferences TO authenticated;
GRANT SELECT ON push_subscriptions TO authenticated;

-- Service role (Edge Functions) gets full access
GRANT ALL ON user_notifications TO service_role;
GRANT ALL ON user_notification_preferences TO service_role;
GRANT ALL ON push_subscriptions TO service_role;

-- 8. Verification (check everything works)
DO $$
DECLARE
  notifications_with_read INTEGER;
  prefs_with_rls INTEGER;
  push_with_rls INTEGER;
BEGIN
  -- Check read column exists
  SELECT COUNT(*) INTO notifications_with_read
  FROM information_schema.columns
  WHERE table_name = 'user_notifications' AND column_name = 'read';

  IF notifications_with_read = 0 THEN
    RAISE EXCEPTION 'Read column not added to user_notifications table!';
  END IF;

  -- Check RLS is enabled
  SELECT COUNT(*) INTO prefs_with_rls
  FROM pg_class c
  WHERE c.relname = 'user_notification_preferences' AND c.relrowsecurity = true;

  SELECT COUNT(*) INTO push_with_rls
  FROM pg_class c
  WHERE c.relname = 'push_subscriptions' AND c.relrowsecurity = true;

  IF prefs_with_rls = 0 OR push_with_rls = 0 THEN
    RAISE WARNING 'RLS may not be properly enabled on some tables';
  END IF;

  RAISE NOTICE '✅ Notification system improvements applied successfully!';
  RAISE NOTICE '🎯 Key improvements:';
  RAISE NOTICE '- Read tracking for notifications (fixes unread badges)';
  RAISE NOTICE '- Unique constraints for active subscriptions';
  RAISE NOTICE '- Row Level Security for data privacy';
  RAISE NOTICE '- Updated functions for new schema';

  RAISE NOTICE '📋 Your notification system is now improved and ready!';
END $$;
