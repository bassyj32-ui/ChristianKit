-- SAFE COMMUNITY SYSTEM MIGRATION
-- Handles existing tables and adds missing columns safely
-- Run this instead of the previous migration if you encounter column errors

-- 1. Create tables only if they don't exist
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
  parent_id UUID,

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
  post_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('amen', 'love', 'prayer')),
  created_at TIMESTAMP DEFAULT NOW(),

  -- One interaction per user per post per type
  CONSTRAINT unique_interaction UNIQUE (post_id, user_id, interaction_type)
);

-- 2. Add missing columns to existing tables (safe approach)
-- Add post_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'post_type'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN post_type TEXT NOT NULL DEFAULT 'post'
      CHECK (post_type IN ('post', 'prayer_request', 'encouragement', 'testimony', 'prayer_share'));
  END IF;
END $$;

-- Add amens_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'amens_count'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN amens_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add loves_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'loves_count'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN loves_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add prayers_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'prayers_count'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN prayers_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add replies_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'replies_count'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN replies_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add parent_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN parent_id UUID;
  END IF;
END $$;

-- Add moderation_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN moderation_status TEXT DEFAULT 'approved'
      CHECK (moderation_status IN ('approved', 'pending', 'rejected'));
  END IF;
END $$;

-- 3. Create indexes safely (only if they don't exist)
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

-- 4. Create triggers safely
CREATE OR REPLACE FUNCTION update_community_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_community_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_community_posts_updated_at
      BEFORE UPDATE ON community_posts
      FOR EACH ROW EXECUTE FUNCTION update_community_updated_at_column();
  END IF;
END $$;

-- 5. Create function to update interaction counts (safe approach)
CREATE OR REPLACE FUNCTION update_post_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update amens_count
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'amen' THEN
    UPDATE community_posts
    SET amens_count = COALESCE(amens_count, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.interaction_type = 'amen' THEN
    UPDATE community_posts
    SET amens_count = GREATEST(0, COALESCE(amens_count, 0) - 1)
    WHERE id = OLD.post_id;
  END IF;

  -- Update loves_count
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'love' THEN
    UPDATE community_posts
    SET loves_count = COALESCE(loves_count, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.interaction_type = 'love' THEN
    UPDATE community_posts
    SET loves_count = GREATEST(0, COALESCE(loves_count, 0) - 1)
    WHERE id = OLD.post_id;
  END IF;

  -- Update prayers_count
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'prayer' THEN
    UPDATE community_posts
    SET prayers_count = COALESCE(prayers_count, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.interaction_type = 'prayer' THEN
    UPDATE community_posts
    SET prayers_count = GREATEST(0, COALESCE(prayers_count, 0) - 1)
    WHERE id = OLD.post_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_post_interaction_counts_trigger'
  ) THEN
    CREATE TRIGGER update_post_interaction_counts_trigger
      AFTER INSERT OR DELETE ON post_interactions
      FOR EACH ROW EXECUTE FUNCTION update_post_interaction_counts();
  END IF;
END $$;

-- 6. Grant permissions safely
GRANT SELECT, INSERT, UPDATE, DELETE ON community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_interactions TO authenticated;

GRANT ALL ON community_posts TO service_role;
GRANT ALL ON user_follows TO service_role;
GRANT ALL ON post_interactions TO service_role;

-- 7. Insert sample data only if table is empty
INSERT INTO community_posts (author_id, author_name, author_avatar, content, post_type)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'Community Guide',
  '👨‍💼',
  'Welcome to the ChristianKit community! Share your faith journey and connect with others on their spiritual path. 🙏✨',
  'post'
WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE author_id = '00000000-0000-0000-0000-000000000001');

INSERT INTO community_posts (author_id, author_name, author_avatar, content, post_type)
SELECT
  '00000000-0000-0000-0000-000000000002',
  'Prayer Warrior',
  '🙏',
  'Please pray for healing for my family member who is going through a difficult illness. Your prayers mean so much! 💙',
  'prayer_request'
WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE author_id = '00000000-0000-0000-0000-000000000002');

-- 8. Verification
DO $$
DECLARE
  community_posts_count INTEGER;
  user_follows_count INTEGER;
  post_interactions_count INTEGER;
  post_type_exists BOOLEAN;
  amens_count_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO community_posts_count FROM community_posts;
  SELECT COUNT(*) INTO user_follows_count FROM user_follows;
  SELECT COUNT(*) INTO post_interactions_count FROM post_interactions;

  SELECT EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'post_type')
  INTO post_type_exists;

  SELECT EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'amens_count')
  INTO amens_count_exists;

  RAISE NOTICE '✅ Community system migration completed successfully!';
  RAISE NOTICE '📊 Current data:';
  RAISE NOTICE '- Community posts: %', community_posts_count;
  RAISE NOTICE '- User follows: %', user_follows_count;
  RAISE NOTICE '- Post interactions: %', post_interactions_count;

  IF post_type_exists AND amens_count_exists THEN
    RAISE NOTICE '✅ All required columns exist';
  ELSE
    RAISE NOTICE '⚠️ Some columns may be missing - check your table structure';
  END IF;

  RAISE NOTICE '🎯 Your community features are now ready to use!';
  RAISE NOTICE '📋 Next: Deploy your app and test the community features';
END $$;
