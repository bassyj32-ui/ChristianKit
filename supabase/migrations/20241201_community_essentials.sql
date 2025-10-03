-- COMMUNITY SYSTEM ESSENTIAL FIXES
-- Minimal migration to get community features working
-- Run this in Supabase SQL Editor

-- 1. Create the essential community tables
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('post', 'prayer_request', 'encouragement', 'testimony', 'prayer_share')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_live BOOLEAN DEFAULT true,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'pending', 'rejected')),

  -- Engagement counts
  amens_count INTEGER DEFAULT 0,
  loves_count INTEGER DEFAULT 0,
  prayers_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,

  -- For threading
  parent_id UUID REFERENCES community_posts(id),

  -- Validation
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT author_name_not_empty CHECK (length(trim(author_name)) > 0)
);

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent self-follows and duplicates
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('amen', 'love', 'prayer')),
  created_at TIMESTAMP DEFAULT NOW(),

  -- One interaction per user per post per type
  CONSTRAINT unique_interaction UNIQUE (post_id, user_id, interaction_type)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_live ON community_posts(is_live);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_parent ON community_posts(parent_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_post_interactions_post ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user ON post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_type ON post_interactions(interaction_type);

-- 3. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_community_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_community_updated_at_column();

-- 4. Create function to update interaction counts automatically
CREATE OR REPLACE FUNCTION update_post_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update amens_count
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'amen' THEN
    UPDATE community_posts
    SET amens_count = amens_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.interaction_type = 'amen' THEN
    UPDATE community_posts
    SET amens_count = GREATEST(0, amens_count - 1)
    WHERE id = OLD.post_id;
  END IF;

  -- Update loves_count
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'love' THEN
    UPDATE community_posts
    SET loves_count = loves_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.interaction_type = 'love' THEN
    UPDATE community_posts
    SET loves_count = GREATEST(0, loves_count - 1)
    WHERE id = OLD.post_id;
  END IF;

  -- Update prayers_count
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'prayer' THEN
    UPDATE community_posts
    SET prayers_count = prayers_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.interaction_type = 'prayer' THEN
    UPDATE community_posts
    SET prayers_count = GREATEST(0, prayers_count - 1)
    WHERE id = OLD.post_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_interaction_counts_trigger
  AFTER INSERT OR DELETE ON post_interactions
  FOR EACH ROW EXECUTE FUNCTION update_post_interaction_counts();

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_interactions TO authenticated;

GRANT ALL ON community_posts TO service_role;
GRANT ALL ON user_follows TO service_role;
GRANT ALL ON post_interactions TO service_role;

-- 6. Insert sample data for testing
INSERT INTO community_posts (author_id, author_name, author_avatar, content, post_type)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Community Guide', '👨‍💼', 'Welcome to the ChristianKit community! Share your faith journey and connect with others on their spiritual path. 🙏✨', 'post'),
  ('00000000-0000-0000-0000-000000000002', 'Prayer Warrior', '🙏', 'Please pray for healing for my family member who is going through a difficult illness. Your prayers mean so much! 💙', 'prayer_request')
ON CONFLICT DO NOTHING;

-- 7. CREATE PROFILES TABLE FOR AUTHENTICATION
-- Create the missing profiles table (simple approach)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  website VARCHAR(255),
  favorite_verse TEXT,
  custom_links JSONB,
  banner_image TEXT,
  profile_image TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (these will be skipped if they already exist)
DO $$
BEGIN
    CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create trigger function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- 8. Verification
DO $$
DECLARE
  community_posts_count INTEGER;
  user_follows_count INTEGER;
  post_interactions_count INTEGER;
  profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO community_posts_count FROM community_posts;
  SELECT COUNT(*) INTO user_follows_count FROM user_follows;
  SELECT COUNT(*) INTO post_interactions_count FROM post_interactions;
  SELECT COUNT(*) INTO profiles_count FROM profiles;

  RAISE NOTICE '✅ Community system setup complete!';
  RAISE NOTICE '📊 Current data:';
  RAISE NOTICE '- Community posts: %', community_posts_count;
  RAISE NOTICE '- User follows: %', user_follows_count;
  RAISE NOTICE '- Post interactions: %', post_interactions_count;
  RAISE NOTICE '- User profiles: %', profiles_count;

  RAISE NOTICE '🎯 Your community features are now ready to use!';
  RAISE NOTICE '📋 Next: Deploy your app and test the community features';
END $$;
