-- Create user_follows table for follow/unfollow functionality
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Add RLS policies for user_follows
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Users can see all follow relationships
CREATE POLICY "Anyone can view follows" ON user_follows
  FOR SELECT USING (true);

-- Users can only create follows for themselves
CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follows
CREATE POLICY "Users can unfollow others" ON user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Add additional profile fields to existing profiles table (if not exists)
DO $$ 
BEGIN
  -- Add bio column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;
  
  -- Add location column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location TEXT;
  END IF;
  
  -- Add favorite_verse column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'favorite_verse') THEN
    ALTER TABLE profiles ADD COLUMN favorite_verse TEXT;
  END IF;
  
  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
  
  -- Add display_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Create a view for user stats (optional, for better performance)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.location,
  p.favorite_verse,
  p.created_at,
  COALESCE(posts.posts_count, 0) as posts_count,
  COALESCE(posts.amens_received, 0) as amens_received,
  COALESCE(posts.loves_received, 0) as loves_received,
  COALESCE(posts.prayers_received, 0) as prayers_received,
  COALESCE(followers.followers_count, 0) as followers_count,
  COALESCE(following.following_count, 0) as following_count
FROM profiles p
LEFT JOIN (
  SELECT 
    author_id,
    COUNT(*) as posts_count,
    SUM(COALESCE(amens_count, 0)) as amens_received,
    SUM(COALESCE(loves_count, 0)) as loves_received,
    SUM(COALESCE(prayers_count, 0)) as prayers_received
  FROM community_posts 
  GROUP BY author_id
) posts ON p.id = posts.author_id
LEFT JOIN (
  SELECT following_id, COUNT(*) as followers_count
  FROM user_follows 
  GROUP BY following_id
) followers ON p.id = followers.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as following_count
  FROM user_follows 
  GROUP BY follower_id
) following ON p.id = following.follower_id;

-- Grant access to the view
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON user_stats TO anon;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'amen', 'love', 'prayer', 'post_mention', 'comment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  follows BOOLEAN DEFAULT TRUE,
  interactions BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,
  comments BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can create notifications for any user
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can only see their own notification preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own notification preferences
CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create prayer reminders table
CREATE TABLE IF NOT EXISTS prayer_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  verse TEXT,
  verse_reference TEXT,
  time TEXT NOT NULL, -- HH:MM format
  days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}', -- 0-6 (Sunday-Saturday)
  is_active BOOLEAN DEFAULT TRUE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('morning', 'midday', 'evening', 'custom')) DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prayer notification logs table
CREATE TABLE IF NOT EXISTS prayer_notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID REFERENCES prayer_reminders(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'clicked', 'dismissed')) DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prayer sessions table
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES prayer_reminders(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'notification', 'scheduled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create push subscriptions table for Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create FCM tokens table for Firebase Cloud Messaging
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies for prayer tables
ALTER TABLE prayer_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Prayer reminders policies
CREATE POLICY "Users can view own prayer reminders" ON prayer_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prayer reminders" ON prayer_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Prayer notification logs policies (read-only for users, system can insert)
CREATE POLICY "Users can view own notification logs" ON prayer_notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prayer_reminders pr 
      WHERE pr.id = prayer_notification_logs.reminder_id 
      AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create notification logs" ON prayer_notification_logs
  FOR INSERT WITH CHECK (true);

-- Prayer sessions policies
CREATE POLICY "Users can view own prayer sessions" ON prayer_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prayer sessions" ON prayer_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- FCM tokens policies
CREATE POLICY "Users can manage own FCM tokens" ON fcm_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for prayer tables
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_user_id ON prayer_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_time ON prayer_reminders(time);
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_active ON prayer_reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_prayer_notification_logs_reminder_id ON prayer_notification_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_prayer_notification_logs_sent_at ON prayer_notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_started_at ON prayer_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
