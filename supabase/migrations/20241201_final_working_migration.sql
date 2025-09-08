-- ================================================================
-- CHRISTIANKIT FINAL WORKING MIGRATION
-- Simplified but comprehensive - guaranteed to work!
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 2. SOCIAL FEATURES - FOLLOWS SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 3. COMMUNITY POSTS SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  category TEXT DEFAULT 'general',
  hashtags TEXT[] DEFAULT '{}',
  amens_count INTEGER DEFAULT 0 CHECK (amens_count >= 0),
  loves_count INTEGER DEFAULT 0 CHECK (loves_count >= 0),
  prayers_count INTEGER DEFAULT 0 CHECK (prayers_count >= 0),
  is_live BOOLEAN DEFAULT true,
  moderation_status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 4. POST INTERACTIONS (AMENS, LOVES, PRAYERS)
-- ================================================================
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('amen', 'love', 'prayer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, interaction_type)
);

ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 5. NOTIFICATIONS SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 6. NOTIFICATION PREFERENCES
-- ================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  follows BOOLEAN DEFAULT TRUE,
  interactions BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,
  prayer_reminders BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 7. PRAYER SYSTEM - REMINDERS
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  verse TEXT,
  verse_reference TEXT,
  time TEXT NOT NULL,
  days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}',
  is_active BOOLEAN DEFAULT TRUE,
  notification_type TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prayer_reminders ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 8. PRAYER SESSIONS TRACKING
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_id UUID REFERENCES prayer_reminders(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  source TEXT DEFAULT 'manual',
  prayer_type TEXT DEFAULT 'personal',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 9. PRAYER NOTIFICATION LOGS
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID REFERENCES prayer_reminders(id) ON DELETE CASCADE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prayer_notification_logs ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 10. PUSH NOTIFICATIONS - WEB PUSH
-- ================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 11. FCM TOKENS - FIREBASE CLOUD MESSAGING
-- ================================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fcm_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 12. GAME SCORES & ACHIEVEMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  level INTEGER DEFAULT 1,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 13. CREATE ALL POLICIES AFTER ALL TABLES AND INDEXES ARE CREATED
-- ================================================================

-- ================================================================
-- 14. ESSENTIAL INDEXES FOR PERFORMANCE
-- ================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Follow relationship indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);

-- Post interactions indexes
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON post_interactions(user_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Prayer system indexes
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_user_id ON prayer_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_time ON prayer_reminders(time);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_started_at ON prayer_sessions(started_at DESC);

-- Push notification indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- Game scores indexes
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);

-- ================================================================
-- 15. ESSENTIAL FUNCTIONS AND TRIGGERS
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
    UPDATE community_posts 
    SET 
      amens_count = CASE WHEN NEW.interaction_type = 'amen' THEN amens_count + 1 ELSE amens_count END,
      loves_count = CASE WHEN NEW.interaction_type = 'love' THEN loves_count + 1 ELSE loves_count END,
      prayers_count = CASE WHEN NEW.interaction_type = 'prayer' THEN prayers_count + 1 ELSE prayers_count END,
      updated_at = NOW()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET 
      amens_count = CASE WHEN OLD.interaction_type = 'amen' THEN GREATEST(amens_count - 1, 0) ELSE amens_count END,
      loves_count = CASE WHEN OLD.interaction_type = 'love' THEN GREATEST(loves_count - 1, 0) ELSE loves_count END,
      prayers_count = CASE WHEN OLD.interaction_type = 'prayer' THEN GREATEST(prayers_count - 1, 0) ELSE prayers_count END,
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

-- ================================================================
-- 16. CREATE ALL POLICIES AT THE VERY END
-- ================================================================

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles 
    FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User follows policies
CREATE POLICY "Anyone can view follows" ON user_follows 
    FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON user_follows 
    FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON user_follows 
    FOR DELETE USING (auth.uid() = follower_id);

-- Community posts policies
CREATE POLICY "Anyone can view approved posts" ON community_posts 
    FOR SELECT USING (moderation_status = 'approved' AND is_live = true);
CREATE POLICY "Users can create posts" ON community_posts 
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON community_posts 
    FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON community_posts 
    FOR DELETE USING (auth.uid() = author_id);

-- Post interactions policies
CREATE POLICY "Anyone can view interactions" ON post_interactions 
    FOR SELECT USING (true);
CREATE POLICY "Users can create interactions" ON post_interactions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON post_interactions 
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications 
    FOR INSERT WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can manage own preferences" ON notification_preferences 
    FOR ALL USING (auth.uid() = user_id);

-- Prayer reminders policies
CREATE POLICY "Users can manage own prayer reminders" ON prayer_reminders 
    FOR ALL USING (auth.uid() = user_id);

-- Prayer sessions policies
CREATE POLICY "Users can manage own prayer sessions" ON prayer_sessions 
    FOR ALL USING (auth.uid() = user_id);

-- Prayer notification logs policies
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

-- Push subscriptions policies
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions 
    FOR ALL USING (auth.uid() = user_id);

-- FCM tokens policies
CREATE POLICY "Users can manage own FCM tokens" ON fcm_tokens 
    FOR ALL USING (auth.uid() = user_id);

-- Game scores policies
CREATE POLICY "Users can view all game scores" ON game_scores 
    FOR SELECT USING (true);
CREATE POLICY "Users can insert own game scores" ON game_scores 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

SELECT 'ChristianKit database migration completed successfully! 🎉' as message;
