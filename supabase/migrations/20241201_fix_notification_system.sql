-- Fix for Real Notification System Database Schema
-- This migration safely creates the notification system tables

-- First, ensure user_profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_time TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  notification_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('push', 'email', 'both', 'system')),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_active ON user_notification_preferences(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Enable RLS (Row Level Security)
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON user_notification_preferences;

DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Service role can insert notification logs" ON notification_logs;

-- Create RLS Policies for user_notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for push_subscriptions
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON user_notification_preferences;
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Create triggers for updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at 
  BEFORE UPDATE ON user_notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get users who should receive notifications
CREATE OR REPLACE FUNCTION get_users_for_notification()
RETURNS TABLE (
  user_id UUID,
  preferred_time TIME,
  timezone TEXT,
  is_active BOOLEAN,
  push_enabled BOOLEAN,
  email_enabled BOOLEAN,
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  experience_level TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unp.user_id,
    unp.preferred_time,
    unp.timezone,
    unp.is_active,
    unp.push_enabled,
    unp.email_enabled,
    unp.last_notification_sent,
    COALESCE(up.experience_level, 'beginner') as experience_level,
    COALESCE(up.email, au.email) as email
  FROM user_notification_preferences unp
  LEFT JOIN user_profiles up ON unp.user_id = up.user_id
  LEFT JOIN auth.users au ON unp.user_id = au.id
  WHERE unp.is_active = true
    AND (unp.push_enabled = true OR unp.email_enabled = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to monitor notification status
CREATE OR REPLACE VIEW notification_status AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE push_enabled = true AND is_active = true) as push_enabled_users,
  COUNT(*) FILTER (WHERE email_enabled = true AND is_active = true) as email_enabled_users,
  COUNT(*) FILTER (WHERE last_notification_sent >= CURRENT_DATE) as users_notified_today,
  AVG(notification_count) as avg_notifications_sent
FROM user_notification_preferences;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_users_for_notification() TO anon, authenticated;
GRANT SELECT ON notification_status TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Real notification system database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: user_profiles, user_notification_preferences, push_subscriptions, notification_logs';
    RAISE NOTICE '🔒 RLS policies enabled for all tables';
    RAISE NOTICE '📈 Monitoring view created: notification_status';
END $$;


