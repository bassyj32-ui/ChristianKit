-- Row Level Security (RLS) Policies for Notification System
-- Adds security layer while maintaining Edge Function access

-- Enable RLS on all notification tables
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: FCM Tokens - Users can only access their own tokens
-- Edge Functions with service role can access all (for sending notifications)
CREATE POLICY "Users can view own FCM tokens" ON fcm_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own FCM tokens" ON fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FCM tokens" ON fcm_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own FCM tokens" ON fcm_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Policy 2: Push Subscriptions - Users can only access their own subscriptions
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Policy 3: User Notification Preferences - Users can only access their own preferences
CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences" ON user_notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Policy 4: Scheduled Notifications - Users can only access their own scheduled notifications
-- Edge Functions need access for sending notifications
CREATE POLICY "Users can view own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled notifications" ON scheduled_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: Edge Functions handle updates/deletes for scheduled notifications

-- Policy 5: User Notifications - Users can only access their own notification history
CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Note: Only Edge Functions should insert notifications (for security)
-- Users should not be able to modify their notification history

-- Grant necessary permissions to authenticated users for reading their own data
GRANT SELECT ON fcm_tokens TO authenticated;
GRANT SELECT ON push_subscriptions TO authenticated;
GRANT SELECT ON user_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_notification_preferences TO authenticated;
GRANT SELECT ON scheduled_notifications TO authenticated;
GRANT SELECT ON user_notifications TO authenticated;

-- Grant full access to service role (for Edge Functions)
GRANT ALL ON fcm_tokens TO service_role;
GRANT ALL ON push_subscriptions TO service_role;
GRANT ALL ON user_notification_preferences TO service_role;
GRANT ALL ON scheduled_notifications TO service_role;
GRANT ALL ON user_notifications TO service_role;

-- Create a function to safely check if a user owns a resource
CREATE OR REPLACE FUNCTION auth.user_owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to use the helper function for consistency
DROP POLICY IF EXISTS "Users can view own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can insert own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can update own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can delete own FCM tokens" ON fcm_tokens;

CREATE POLICY "Users can view own FCM tokens" ON fcm_tokens
  FOR SELECT USING (auth.user_owns_resource(user_id));

CREATE POLICY "Users can insert own FCM tokens" ON fcm_tokens
  FOR INSERT WITH CHECK (auth.user_owns_resource(user_id));

CREATE POLICY "Users can update own FCM tokens" ON fcm_tokens
  FOR UPDATE USING (auth.user_owns_resource(user_id));

CREATE POLICY "Users can delete own FCM tokens" ON fcm_tokens
  FOR DELETE USING (auth.user_owns_resource(user_id));

-- Apply the same pattern to other tables
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.user_owns_resource(user_id));

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.user_owns_resource(user_id));

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.user_owns_resource(user_id));

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.user_owns_resource(user_id));

DROP POLICY IF EXISTS "Users can view own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON user_notification_preferences;

CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.user_owns_resource(user_id));

CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.user_owns_resource(user_id));

CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.user_owns_resource(user_id));

CREATE POLICY "Users can delete own notification preferences" ON user_notification_preferences
  FOR DELETE USING (auth.user_owns_resource(user_id));

DROP POLICY IF EXISTS "Users can view own scheduled notifications" ON scheduled_notifications;

CREATE POLICY "Users can view own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.user_owns_resource(user_id));

DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;

CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.user_owns_resource(user_id));

-- Verification queries (run these to verify RLS is working)
-- These should return results when run as an authenticated user:
/*
SELECT COUNT(*) FROM fcm_tokens WHERE user_id = auth.uid();
SELECT COUNT(*) FROM push_subscriptions WHERE user_id = auth.uid();
SELECT COUNT(*) FROM user_notification_preferences WHERE user_id = auth.uid();
SELECT COUNT(*) FROM user_notifications WHERE user_id = auth.uid();
*/

-- Note: Edge Functions using service_role key will bypass RLS policies
-- This provides security for client-side queries while maintaining full access for server-side operations
