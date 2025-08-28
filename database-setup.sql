-- Database Setup for ChristianKit Community Platform
-- This file contains all the necessary tables and functions for user authentication and profiles

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
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

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

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

-- Create indexes for better performance
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

-- Trigger to automatically update post counts
CREATE TRIGGER trigger_update_post_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_count();

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

-- Trigger to automatically update interaction counts
CREATE TRIGGER trigger_update_interaction_count
  AFTER INSERT OR DELETE ON post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_interaction_count();

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

-- Trigger to automatically update prayer counts
CREATE TRIGGER trigger_update_prayer_count
  AFTER INSERT OR DELETE ON prayers
  FOR EACH ROW
  EXECUTE FUNCTION update_prayer_count();

-- Insert some sample data for testing
INSERT INTO user_profiles (id, email, full_name, display_name, handle, bio, location) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'demo@christiankit.com', 'Demo User', 'Demo User', 'demouser', 'This is a demo account for testing purposes.', 'Demo City, Demo Country')
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for avatars
-- Note: This needs to be done through Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a view for trending posts
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

-- Grant access to the view
GRANT SELECT ON trending_posts TO anon, authenticated;
