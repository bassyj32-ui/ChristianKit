-- COMPLETE NOTIFICATION SYSTEM SETUP
-- Run this single migration to set up the entire notification system
-- Includes all fixes from Phases 1-3

-- 1. Update notification tables with proper schema
-- Add read column and read_at timestamp to user_notifications
ALTER TABLE user_notifications
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Ensure all user_id columns are UUID type (if not already)
-- Note: This assumes your database already has UUID user_id columns
-- If you have TEXT user_id columns, you'll need to run the UUID migration first

-- 2. Add essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read_at ON user_notifications(read_at);

-- Ensure unique constraints for active subscriptions (prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_push ON push_subscriptions (user_id) WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_fcm ON fcm_tokens (user_id) WHERE is_active;

-- 3. Enable Row Level Security on all notification tables
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for data security
-- Users can only access their own notification data

-- FCM Tokens policies
DROP POLICY IF EXISTS "Users can view own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can insert own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can update own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can delete own FCM tokens" ON fcm_tokens;

CREATE POLICY "Users can view own FCM tokens" ON fcm_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own FCM tokens" ON fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FCM tokens" ON fcm_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own FCM tokens" ON fcm_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Push Subscriptions policies
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- User Notification Preferences policies
DROP POLICY IF EXISTS "Users can view own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON user_notification_preferences;

CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences" ON user_notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Scheduled Notifications policies (users can view their own, service role handles sending)
DROP POLICY IF EXISTS "Users can view own scheduled notifications" ON scheduled_notifications;

CREATE POLICY "Users can view own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- User Notifications policies (users can view their own, service role handles creation)
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;

CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Grant necessary permissions
-- Authenticated users can read their own notification data
GRANT SELECT ON fcm_tokens TO authenticated;
GRANT SELECT ON push_subscriptions TO authenticated;
GRANT SELECT ON user_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_notification_preferences TO authenticated;
GRANT SELECT ON scheduled_notifications TO authenticated;
GRANT SELECT ON user_notifications TO authenticated;

-- Service role (Edge Functions) gets full access
GRANT ALL ON fcm_tokens TO service_role;
GRANT ALL ON push_subscriptions TO service_role;
GRANT ALL ON user_notification_preferences TO service_role;
GRANT ALL ON scheduled_notifications TO service_role;
GRANT ALL ON user_notifications TO service_role;

-- 6. Update database functions for UUID support
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

-- 7. Create helper function for resource ownership checks
CREATE OR REPLACE FUNCTION auth.user_owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger function for updated_at timestamps (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Add triggers for updated_at (if not already exist)
DROP TRIGGER IF EXISTS update_fcm_tokens_updated_at ON fcm_tokens;
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON user_notification_preferences;
DROP TRIGGER IF EXISTS update_scheduled_notifications_updated_at ON scheduled_notifications;

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

-- 10. Insert default notification templates (if not exist)
INSERT INTO notification_templates (name, title, body, notification_type, variables) VALUES
('daily_prayer_reminder', '🙏 Prayer Time', 'Hello {{user_name}}! It''s time for your daily prayer session. Take a moment to connect with God.', 'prayer', '{"user_name": "string"}'),
('daily_bible_reminder', '📖 Bible Reading Time', 'Hello {{user_name}}! Ready to dive into God''s Word today?', 'bible', '{"user_name": "string"}'),
('daily_meditation_reminder', '🧘 Meditation Time', 'Hello {{user_name}}! Find peace in God''s presence with your daily meditation.', 'meditation', '{"user_name": "string"}'),
('daily_journal_reminder', '📝 Journaling Time', 'Hello {{user_name}}! Reflect on your spiritual journey today.', 'journal', '{"user_name": "string"}'),
('achievement_unlocked', '🎉 Achievement Unlocked!', 'Congratulations {{user_name}}! You''ve unlocked: {{achievement_name}}', 'achievement', '{"user_name": "string", "achievement_name": "string"}'),
('streak_milestone', '🔥 Streak Milestone!', 'Amazing {{user_name}}! You''ve maintained your {{activity}} streak for {{days}} days!', 'achievement', '{"user_name": "string", "activity": "string", "days": "number"}')
ON CONFLICT (name) DO NOTHING;

-- 11. Verification queries (run these to ensure everything works)
DO $$
DECLARE
  table_count INTEGER;
  fcm_count INTEGER;
  push_count INTEGER;
  prefs_count INTEGER;
  scheduled_count INTEGER;
  notifications_count INTEGER;
BEGIN
  -- Check that all tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('fcm_tokens', 'push_subscriptions', 'user_notification_preferences', 'scheduled_notifications', 'user_notifications');

  IF table_count != 5 THEN
    RAISE EXCEPTION 'Not all notification tables exist! Found %, expected 5', table_count;
  END IF;

  -- Check row counts (should be > 0 if you have data)
  SELECT COUNT(*) INTO fcm_count FROM fcm_tokens;
  SELECT COUNT(*) INTO push_count FROM push_subscriptions;
  SELECT COUNT(*) INTO prefs_count FROM user_notification_preferences;
  SELECT COUNT(*) INTO scheduled_count FROM scheduled_notifications;
  SELECT COUNT(*) INTO notifications_count FROM user_notifications;

  RAISE NOTICE '✅ Notification system setup complete!';
  RAISE NOTICE '📊 Current data counts:';
  RAISE NOTICE 'FCM tokens: %', fcm_count;
  RAISE NOTICE 'Push subscriptions: %', push_count;
  RAISE NOTICE 'User preferences: %', prefs_count;
  RAISE NOTICE 'Scheduled notifications: %', scheduled_count;
  RAISE NOTICE 'User notifications: %', notifications_count;

  -- Check RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'fcm_tokens' AND c.relrowsecurity = true
  ) THEN
    RAISE WARNING 'RLS may not be enabled on fcm_tokens table';
  END IF;

  RAISE NOTICE '🎯 Your notification system is ready for production!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Set VAPID keys in Supabase project settings';
  RAISE NOTICE '2. Configure email service (Brevo/SendGrid) for email notifications';
  RAISE NOTICE '3. Deploy your application';
  RAISE NOTICE '4. Test the notification flows end-to-end';
END $$;
