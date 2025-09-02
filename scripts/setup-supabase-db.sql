-- 🚀 ChristianKit Supabase Database Setup Script
-- Run this in your Supabase Dashboard → SQL Editor

-- Step 1: Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  display_name VARCHAR(100) NOT NULL,
  handle VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0
);

-- Step 2: Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('prayer', 'bible', 'meditation', 'journal')),
  duration_minutes INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_duration INTEGER,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(user_id, activity_type, session_date)
);

-- Step 3: Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  
  UNIQUE(user_id, achievement_type)
);

-- Step 4: Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('prayer', 'bible', 'meditation', 'journal')),
  daily_minutes INTEGER NOT NULL DEFAULT 15,
  weekly_sessions INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, activity_type)
);

-- Step 5: Create community tables

-- Posts table for community posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  hashtags TEXT[],
  amens_count INTEGER DEFAULT 0,
  prayers_count INTEGER DEFAULT 0,
  loves_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT FALSE,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')),
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactions table for amens and loves
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('amen', 'love')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, interaction_type)
);

-- Prayers table for comments
CREATE TABLE IF NOT EXISTS prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  amens_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hashtags table for trending
CREATE TABLE IF NOT EXISTS hashtags (
  id SERIAL PRIMARY KEY,
  tag VARCHAR(100) UNIQUE NOT NULL,
  post_count INTEGER DEFAULT 0,
  last_trending TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Followers table
CREATE TABLE IF NOT EXISTS followers (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_date ON user_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);

-- Community table indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);

CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON post_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_prayers_post_id ON prayers(post_id);
CREATE INDEX IF NOT EXISTS idx_prayers_author_id ON prayers(author_id);

CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Step 7: Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Step 9: Create RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 10: Create RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 11: Create RLS policies for user_goals
CREATE POLICY "Users can view their own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 12: Create RLS policies for community tables

-- RLS Policies for posts
-- Only show approved posts to everyone; authors can see their own pending/rejected
CREATE POLICY "Users can view approved or own posts" ON posts
  FOR SELECT USING (
    moderation_status = 'approved' OR auth.uid() = author_id
  );

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Optional: Admin role can moderate posts
CREATE POLICY "Admins can moderate posts" ON posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND auth.jwt() ->> 'role' IN ('service_role','admin')
    )
  );

-- Rate limiting: function to check per-user post creation within time window
CREATE OR REPLACE FUNCTION can_create_post(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM posts
  WHERE author_id = user_uuid
    AND created_at > NOW() - INTERVAL '1 minute';

  -- Limit: max 3 posts per minute
  RETURN recent_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce rate limit on insert
CREATE OR REPLACE FUNCTION enforce_post_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_create_post(NEW.author_id) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Please wait before creating another post.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_rate_limit ON posts;
CREATE TRIGGER trg_posts_rate_limit
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION enforce_post_rate_limit();

-- RLS Policies for post_interactions
CREATE POLICY "Users can view all interactions" ON post_interactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own interactions" ON post_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON post_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prayers
CREATE POLICY "Users can view all prayers" ON prayers
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own prayers" ON prayers
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own prayers" ON prayers
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own prayers" ON prayers
  FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for hashtags
CREATE POLICY "Users can view all hashtags" ON hashtags
  FOR SELECT USING (true);

-- RLS Policies for followers
CREATE POLICY "Users can view all followers" ON followers
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own follows" ON followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON followers
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 13: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 14: Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 15: Create functions for updating counts

-- Functions for updating follower counts
CREATE OR REPLACE FUNCTION increment_follower_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET follower_count = follower_count + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_follower_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET follower_count = GREATEST(follower_count - 1, 0) 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET following_count = following_count + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET following_count = GREATEST(following_count - 1, 0) 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles 
    SET post_count = post_count + 1 
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles 
    SET post_count = GREATEST(post_count - 1, 0) 
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update interaction counts
CREATE OR REPLACE FUNCTION update_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET 
      amens_count = amens_count + CASE WHEN NEW.interaction_type = 'amen' THEN 1 ELSE 0 END,
      loves_count = loves_count + CASE WHEN NEW.interaction_type = 'love' THEN 1 ELSE 0 END
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET 
      amens_count = GREATEST(amens_count - CASE WHEN OLD.interaction_type = 'amen' THEN 1 ELSE 0 END, 0),
      loves_count = GREATEST(loves_count - CASE WHEN OLD.interaction_type = 'love' THEN 1 ELSE 0 END, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update prayer counts
CREATE OR REPLACE FUNCTION update_prayer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET prayers_count = prayers_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET prayers_count = GREATEST(prayers_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 16: Create triggers for automatic count updates
CREATE TRIGGER trigger_update_post_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_count();

CREATE TRIGGER trigger_update_interaction_count
  AFTER INSERT OR DELETE ON post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_interaction_count();

CREATE TRIGGER trigger_update_prayer_count
  AFTER INSERT OR DELETE ON prayers
  FOR EACH ROW
  EXECUTE FUNCTION update_prayer_count();

-- Step 17: Create a view for trending posts
CREATE OR REPLACE VIEW trending_posts AS
SELECT 
  p.*,
  up.display_name as author_name,
  up.avatar_url as author_avatar,
  up.handle as author_handle,
  (p.amens_count * 3 + p.prayers_count * 2 + p.loves_count) as trending_score
FROM posts p
JOIN user_profiles up ON p.author_id = up.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY trending_score DESC, p.created_at DESC;

-- Step 18: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON trending_posts TO anon, authenticated;

-- Step 19: Insert some sample data for testing (optional)
-- Uncomment the lines below if you want to test with sample data

-- INSERT INTO user_goals (user_id, activity_type, daily_minutes, weekly_sessions)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'prayer', 15, 7),
--   ('00000000-0000-0000-0000-000000000000', 'bible', 20, 5),
--   ('00000000-0000-0000-0000-000000000000', 'meditation', 10, 7);

-- Step 20: Verify setup
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM user_profiles
UNION ALL
SELECT 
  'user_sessions' as table_name,
  COUNT(*) as row_count
FROM user_sessions
UNION ALL
SELECT 
  'user_achievements' as table_name,
  COUNT(*) as row_count
FROM user_achievements
UNION ALL
SELECT 
  'user_goals' as table_name,
  COUNT(*) as row_count
FROM user_goals
UNION ALL
SELECT 
  'posts' as table_name,
  COUNT(*) as row_count
FROM posts
UNION ALL
SELECT 
  'prayers' as table_name,
  COUNT(*) as row_count
FROM prayers
UNION ALL
SELECT 
  'post_interactions' as table_name,
  COUNT(*) as row_count
FROM post_interactions
UNION ALL
SELECT 
  'followers' as table_name,
  COUNT(*) as row_count
FROM followers
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as row_count
FROM notifications;

-- ✅ Database setup complete! 
-- Now users should be able to authenticate, store data, and use community features.
