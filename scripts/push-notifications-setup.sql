-- Push Notifications Setup for ChristianKit PWA
-- This script creates the necessary database tables and policies for PWA push notifications

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{"prayer": true, "bible": true, "meditation": true, "journal": true}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for sending notifications)
DROP POLICY IF EXISTS "Service role can manage all push subscriptions" ON push_subscriptions;
CREATE POLICY "Service role can manage all push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create notification_logs table for tracking push notification delivery
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('prayer', 'bible', 'meditation', 'journal', 'general')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'clicked')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  device_info JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Enable RLS for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_logs
-- Users can view their own notification logs
DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;
CREATE POLICY "Users can view their own notification logs"
  ON notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all notification logs
DROP POLICY IF EXISTS "Service role can manage all notification logs" ON notification_logs;
CREATE POLICY "Service role can manage all notification logs"
  ON notification_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create notification_preferences table for user preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  prayer_enabled BOOLEAN DEFAULT true,
  bible_enabled BOOLEAN DEFAULT true,
  meditation_enabled BOOLEAN DEFAULT true,
  journal_enabled BOOLEAN DEFAULT true,
  general_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification_preferences updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Enable RLS for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_preferences
-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all preferences
DROP POLICY IF EXISTS "Service role can manage all notification preferences" ON notification_preferences;
CREATE POLICY "Service role can manage all notification preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Create a view for active push subscriptions with user info
CREATE OR REPLACE VIEW active_push_subscriptions AS
SELECT 
  ps.id,
  ps.user_id,
  ps.endpoint,
  ps.p256dh,
  ps.auth,
  ps.is_active,
  ps.notification_preferences,
  up.email,
  up.full_name,
  np.prayer_enabled,
  np.bible_enabled,
  np.meditation_enabled,
  np.journal_enabled,
  np.general_enabled,
  np.quiet_hours_start,
  np.quiet_hours_end,
  np.timezone
FROM push_subscriptions ps
JOIN user_profiles up ON ps.user_id = up.id
LEFT JOIN notification_preferences np ON ps.user_id = np.user_id
WHERE ps.is_active = true;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT SELECT ON active_push_subscriptions TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON push_subscriptions TO service_role;
GRANT ALL ON notification_logs TO service_role;
GRANT ALL ON notification_preferences TO service_role;
GRANT SELECT ON active_push_subscriptions TO service_role;

-- Create function to get users for specific notification type
CREATE OR REPLACE FUNCTION get_users_for_notification(
  notification_type TEXT,
  current_time TIME DEFAULT CURRENT_TIME
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  notification_preferences JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aps.user_id,
    aps.email,
    aps.full_name,
    aps.endpoint,
    aps.p256dh,
    aps.auth,
    aps.notification_preferences
  FROM active_push_subscriptions aps
  WHERE 
    aps.is_active = true
    AND (
      (notification_type = 'prayer' AND aps.prayer_enabled = true) OR
      (notification_type = 'bible' AND aps.bible_enabled = true) OR
      (notification_type = 'meditation' AND aps.meditation_enabled = true) OR
      (notification_type = 'journal' AND aps.journal_enabled = true) OR
      (notification_type = 'general' AND aps.general_enabled = true)
    )
    AND (
      aps.quiet_hours_start IS NULL OR 
      aps.quiet_hours_end IS NULL OR
      (
        aps.quiet_hours_start <= aps.quiet_hours_end AND
        (current_time >= aps.quiet_hours_start AND current_time <= aps.quiet_hours_end)
      ) OR
      (
        aps.quiet_hours_start > aps.quiet_hours_end AND
        (current_time >= aps.quiet_hours_start OR current_time <= aps.quiet_hours_end)
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_users_for_notification(TEXT, TIME) TO service_role;

-- Log the setup completion
INSERT INTO system_logs (event_type, details) 
VALUES (
  'push_notifications_setup',
  jsonb_build_object(
    'timestamp', NOW(),
    'version', '1.0.0',
    'tables_created', ARRAY['push_subscriptions', 'notification_logs', 'notification_preferences'],
    'policies_created', 12,
    'functions_created', 3,
    'view_created', 'active_push_subscriptions'
  )
) ON CONFLICT DO NOTHING;

-- Output completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Push notifications setup completed successfully!';
  RAISE NOTICE '📱 Tables created: push_subscriptions, notification_logs, notification_preferences';
  RAISE NOTICE '🔐 RLS policies configured for security';
  RAISE NOTICE '👥 View created: active_push_subscriptions';
  RAISE NOTICE '⚙️ Function created: get_users_for_notification';
  RAISE NOTICE '🚀 Your PWA is now ready for push notifications!';
END $$;

