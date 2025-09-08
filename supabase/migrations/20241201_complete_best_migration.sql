-- ================================================================
-- CHRISTIANKIT COMPLETE DATABASE MIGRATION
-- The most comprehensive, production-ready SQL migration
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- 1. CORE USER PROFILES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  favorite_verse TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  church_denomination TEXT,
  spiritual_maturity TEXT CHECK (spiritual_maturity IN ('new_believer', 'growing', 'mature', 'leader')),
  prayer_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  is_verified BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create comprehensive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON profiles 
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================================
-- 2. SOCIAL FEATURES - FOLLOWS SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Users can't follow themselves
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON user_follows 
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON user_follows 
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows 
    FOR DELETE USING (auth.uid() = follower_id);

-- ================================================================
-- 3. COMMUNITY POSTS SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'prayer_request', 'testimony', 'scripture', 'encouragement', 'question')),
  hashtags TEXT[] DEFAULT '{}',
  mentioned_users UUID[] DEFAULT '{}',
  amens_count INTEGER DEFAULT 0 CHECK (amens_count >= 0),
  loves_count INTEGER DEFAULT 0 CHECK (loves_count >= 0),
  prayers_count INTEGER DEFAULT 0 CHECK (prayers_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  shares_count INTEGER DEFAULT 0 CHECK (shares_count >= 0),
  is_live BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  flagged_count INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS first
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Create policies after table is fully created
CREATE POLICY "Anyone can view approved posts" ON community_posts 
    FOR SELECT USING (moderation_status = 'approved' AND is_live = true);

CREATE POLICY "Users can create posts" ON community_posts 
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON community_posts 
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" ON community_posts 
    FOR DELETE USING (auth.uid() = author_id);

-- ================================================================
-- 4. POST INTERACTIONS (AMENS, LOVES, PRAYERS)
-- ================================================================
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('amen', 'love', 'prayer', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, interaction_type)
);

ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interactions" ON post_interactions 
    FOR SELECT USING (true);

CREATE POLICY "Users can create interactions" ON post_interactions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" ON post_interactions 
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 5. COMPREHENSIVE NOTIFICATIONS SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow', 'amen', 'love', 'prayer', 'post_mention', 'comment', 'prayer_reminder', 'milestone', 'system')),
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 100),
  message TEXT NOT NULL CHECK (length(message) > 0 AND length(message) <= 500),
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  action_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications 
    FOR INSERT WITH CHECK (true);

-- ================================================================
-- 6. NOTIFICATION PREFERENCES
-- ================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  follows BOOLEAN DEFAULT TRUE,
  interactions BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,
  comments BOOLEAN DEFAULT TRUE,
  prayer_reminders BOOLEAN DEFAULT TRUE,
  milestones BOOLEAN DEFAULT TRUE,
  system_updates BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON notification_preferences 
    FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- 7. PRAYER SYSTEM - REMINDERS
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 100),
  message TEXT NOT NULL CHECK (length(message) > 0 AND length(message) <= 500),
  verse TEXT,
  verse_reference TEXT,
  time TEXT NOT NULL CHECK (time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'), -- HH:MM format validation
  days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}' CHECK (array_length(days, 1) > 0), -- 0-6 (Sunday-Saturday)
  is_active BOOLEAN DEFAULT TRUE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('morning', 'midday', 'evening', 'custom')) DEFAULT 'custom',
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prayer_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own prayer reminders" ON prayer_reminders 
    FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- 8. PRAYER SESSIONS TRACKING
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_id UUID REFERENCES prayer_reminders(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'notification', 'scheduled', 'quick_prayer')),
  prayer_type TEXT DEFAULT 'personal' CHECK (prayer_type IN ('personal', 'intercessory', 'thanksgiving', 'confession', 'worship')),
  notes TEXT CHECK (length(notes) <= 1000),
  mood_before TEXT CHECK (mood_before IN ('peaceful', 'anxious', 'grateful', 'sad', 'joyful', 'frustrated', 'hopeful')),
  mood_after TEXT CHECK (mood_after IN ('peaceful', 'anxious', 'grateful', 'sad', 'joyful', 'frustrated', 'hopeful')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own prayer sessions" ON prayer_sessions 
    FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- 9. PRAYER NOTIFICATION LOGS
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID REFERENCES prayer_reminders(id) ON DELETE CASCADE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'clicked', 'dismissed', 'snoozed')) DEFAULT 'sent',
  error_message TEXT,
  delivery_method TEXT CHECK (delivery_method IN ('push', 'email', 'sms', 'in_app')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prayer_notification_logs ENABLE ROW LEVEL SECURITY;

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

-- ================================================================
-- 10. PUSH NOTIFICATIONS - WEB PUSH
-- ================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL CHECK (length(endpoint) > 0),
  p256dh TEXT NOT NULL CHECK (length(p256dh) > 0),
  auth TEXT NOT NULL CHECK (length(auth) > 0),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions 
    FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- 11. FCM TOKENS - FIREBASE CLOUD MESSAGING
-- ================================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fcm_token TEXT NOT NULL CHECK (length(fcm_token) > 0),
  device_type TEXT CHECK (device_type IN ('web', 'android', 'ios')) DEFAULT 'web',
  device_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own FCM tokens" ON fcm_tokens 
    FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- 12. GAME SCORES & ACHIEVEMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('bible_memory_match', 'faith_runner', 'scripture_quiz')),
  score INTEGER NOT NULL CHECK (score >= 0),
  level INTEGER DEFAULT 1 CHECK (level > 0),
  duration_seconds INTEGER CHECK (duration_seconds > 0),
  accuracy_percentage DECIMAL(5,2) CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100),
  game_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all game scores" ON game_scores 
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own game scores" ON game_scores 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- 13. COMPREHENSIVE INDEXES FOR PERFORMANCE
-- ================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Follow relationship indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_moderation_status ON community_posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_community_posts_hashtags ON community_posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_community_posts_content_search ON community_posts USING GIN(to_tsvector('english', content));

-- Post interactions indexes
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_type ON post_interactions(interaction_type);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Prayer system indexes
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_user_id ON prayer_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_time ON prayer_reminders(time);
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_active ON prayer_reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_started_at ON prayer_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_notification_logs_reminder_id ON prayer_notification_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_prayer_notification_logs_sent_at ON prayer_notification_logs(sent_at);

-- Push notification indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active);

-- Game scores indexes
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at DESC);

-- ================================================================
-- 14. ADVANCED VIEWS FOR ANALYTICS
-- ================================================================

-- Comprehensive user stats view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.location,
  p.favorite_verse,
  p.spiritual_maturity,
  p.created_at as joined_at,
  p.last_active_at,
  
  -- Social stats
  COALESCE(posts.posts_count, 0) as posts_count,
  COALESCE(posts.total_amens_received, 0) as total_amens_received,
  COALESCE(posts.total_loves_received, 0) as total_loves_received,
  COALESCE(posts.total_prayers_received, 0) as total_prayers_received,
  COALESCE(followers.followers_count, 0) as followers_count,
  COALESCE(following.following_count, 0) as following_count,
  
  -- Prayer stats
  COALESCE(prayer_stats.total_prayer_sessions, 0) as total_prayer_sessions,
  COALESCE(prayer_stats.total_prayer_minutes, 0) as total_prayer_minutes,
  COALESCE(prayer_stats.prayer_streak_days, 0) as prayer_streak_days,
  COALESCE(prayer_stats.active_reminders, 0) as active_reminders,
  
  -- Game stats
  COALESCE(game_stats.total_games_played, 0) as total_games_played,
  COALESCE(game_stats.highest_score, 0) as highest_score,
  COALESCE(game_stats.average_score, 0) as average_score
  
FROM profiles p

-- Posts statistics
LEFT JOIN (
  SELECT 
    author_id,
    COUNT(*) as posts_count,
    SUM(COALESCE(amens_count, 0)) as total_amens_received,
    SUM(COALESCE(loves_count, 0)) as total_loves_received,
    SUM(COALESCE(prayers_count, 0)) as total_prayers_received
  FROM community_posts 
  WHERE moderation_status = 'approved' AND is_live = true
  GROUP BY author_id
) posts ON p.id = posts.author_id

-- Follower statistics
LEFT JOIN (
  SELECT following_id, COUNT(*) as followers_count
  FROM user_follows 
  GROUP BY following_id
) followers ON p.id = followers.following_id

-- Following statistics
LEFT JOIN (
  SELECT follower_id, COUNT(*) as following_count
  FROM user_follows 
  GROUP BY follower_id
) following ON p.id = following.follower_id

-- Prayer statistics
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_prayer_sessions,
    SUM(COALESCE(duration_minutes, 0)) as total_prayer_minutes,
    COUNT(DISTINCT DATE(started_at)) as prayer_streak_days,
    (SELECT COUNT(*) FROM prayer_reminders pr WHERE pr.user_id = ps.user_id AND pr.is_active = true) as active_reminders
  FROM prayer_sessions ps
  GROUP BY user_id
) prayer_stats ON p.id = prayer_stats.user_id

-- Game statistics
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_games_played,
    MAX(score) as highest_score,
    ROUND(AVG(score)::numeric, 2) as average_score
  FROM game_scores
  GROUP BY user_id
) game_stats ON p.id = game_stats.user_id;

-- Grant access to the view
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON user_stats TO anon;

-- ================================================================
-- 15. TRIGGERS AND FUNCTIONS
-- ================================================================

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update interaction counts on community posts
CREATE OR REPLACE FUNCTION public.update_post_interaction_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count
    UPDATE community_posts 
    SET 
      amens_count = CASE WHEN NEW.interaction_type = 'amen' THEN amens_count + 1 ELSE amens_count END,
      loves_count = CASE WHEN NEW.interaction_type = 'love' THEN loves_count + 1 ELSE loves_count END,
      prayers_count = CASE WHEN NEW.interaction_type = 'prayer' THEN prayers_count + 1 ELSE prayers_count END,
      shares_count = CASE WHEN NEW.interaction_type = 'share' THEN shares_count + 1 ELSE shares_count END,
      updated_at = NOW()
    WHERE id = NEW.post_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count
    UPDATE community_posts 
    SET 
      amens_count = CASE WHEN OLD.interaction_type = 'amen' THEN GREATEST(amens_count - 1, 0) ELSE amens_count END,
      loves_count = CASE WHEN OLD.interaction_type = 'love' THEN GREATEST(loves_count - 1, 0) ELSE loves_count END,
      prayers_count = CASE WHEN OLD.interaction_type = 'prayer' THEN GREATEST(prayers_count - 1, 0) ELSE prayers_count END,
      shares_count = CASE WHEN OLD.interaction_type = 'share' THEN GREATEST(shares_count - 1, 0) ELSE shares_count END,
      updated_at = NOW()
    WHERE id = OLD.post_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for interaction counts
DROP TRIGGER IF EXISTS post_interaction_counts_trigger ON post_interactions;
CREATE TRIGGER post_interaction_counts_trigger
  AFTER INSERT OR DELETE ON post_interactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_post_interaction_counts();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at 
  BEFORE UPDATE ON community_posts 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prayer_reminders_updated_at ON prayer_reminders;
CREATE TRIGGER update_prayer_reminders_updated_at 
  BEFORE UPDATE ON prayer_reminders 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ================================================================
-- 16. CLEANUP OLD NOTIFICATIONS (OPTIONAL MAINTENANCE)
-- ================================================================

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE read = true 
    AND created_at < NOW() - INTERVAL '30 days';
  
  -- Delete expired notifications
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
  -- Delete old prayer notification logs (keep last 90 days)
  DELETE FROM prayer_notification_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE 'ChristianKit database migration completed successfully! 🎉';
  RAISE NOTICE 'Created tables: profiles, user_follows, community_posts, post_interactions, notifications, notification_preferences, prayer_reminders, prayer_sessions, prayer_notification_logs, push_subscriptions, fcm_tokens, game_scores';
  RAISE NOTICE 'Created views: user_stats';
  RAISE NOTICE 'Created functions: handle_new_user, update_post_interaction_counts, update_updated_at_column, cleanup_old_notifications';
  RAISE NOTICE 'All RLS policies, indexes, and triggers are in place.';
  RAISE NOTICE 'Your ChristianKit app is ready for production! 🙏';
END $$;
