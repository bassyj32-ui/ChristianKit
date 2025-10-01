-- Community Tables Creation - Essential Schema
-- Run this to create the basic community tables needed for the app to work

-- User Follows table - tracks following relationships
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent self-follows and duplicate follows
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Post Interactions table - tracks amens, loves, prayers on posts
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('amen', 'love', 'prayer')),
  created_at TIMESTAMP DEFAULT NOW(),

  -- One interaction per user per post per type
  CONSTRAINT unique_interaction UNIQUE (post_id, user_id, interaction_type)
);

-- Community Posts table - main posts, prayer requests, etc.
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

  -- Basic engagement counts
  amens_count INTEGER DEFAULT 0,
  loves_count INTEGER DEFAULT 0,
  prayers_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,

  -- For threading (replies)
  parent_id UUID,

  -- Validation constraints
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT author_name_not_empty CHECK (length(trim(author_name)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_post_interactions_post ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user ON post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_type ON post_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_live ON community_posts(is_live);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_parent ON community_posts(parent_id);

-- Create trigger for updated_at timestamps
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

-- Function to update post interaction counts automatically
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

-- Function to update replies count
CREATE OR REPLACE FUNCTION update_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a post with parent_id is created, increment parent's replies_count
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE community_posts
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_id;
  END IF;

  -- When a post with parent_id is deleted, decrement parent's replies_count
  IF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE community_posts
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.parent_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_replies_count_trigger
  AFTER INSERT OR DELETE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_replies_count();

-- Helper function to get posts with author info
CREATE OR REPLACE FUNCTION get_community_posts_with_authors(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  author_id UUID,
  author_name TEXT,
  author_avatar TEXT,
  content TEXT,
  post_type TEXT,
  created_at TIMESTAMP,
  amens_count INTEGER,
  loves_count INTEGER,
  prayers_count INTEGER,
  replies_count INTEGER,
  author_profile_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.author_id,
    cp.author_name,
    cp.author_avatar,
    cp.content,
    cp.post_type,
    cp.created_at,
    cp.amens_count,
    cp.loves_count,
    cp.prayers_count,
    cp.replies_count,
    p.avatar_url as author_profile_image
  FROM community_posts cp
  LEFT JOIN profiles p ON p.id = cp.author_id
  WHERE cp.is_live = true AND cp.moderation_status = 'approved'
  ORDER BY cp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_interactions TO authenticated;

GRANT ALL ON community_posts TO service_role;
GRANT ALL ON user_follows TO service_role;
GRANT ALL ON post_interactions TO service_role;

-- Insert some sample data for testing
INSERT INTO community_posts (author_id, author_name, author_avatar, content, post_type)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Community Admin', '👨‍💼', 'Welcome to the ChristianKit community! Share your faith journey and connect with others on their spiritual path. 🙏✨', 'post'),
  ('00000000-0000-0000-0000-000000000002', 'Prayer Warrior', '🙏', 'Please pray for healing for my family member who is going through a difficult illness. Your prayers mean so much! 💙', 'prayer_request')
ON CONFLICT DO NOTHING;

-- Verification query
DO $$
DECLARE
  community_posts_count INTEGER;
  user_follows_count INTEGER;
  post_interactions_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO community_posts_count FROM community_posts;
  SELECT COUNT(*) INTO user_follows_count FROM user_follows;
  SELECT COUNT(*) INTO post_interactions_count FROM post_interactions;

  RAISE NOTICE '✅ Community tables created successfully!';
  RAISE NOTICE '📊 Initial data:';
  RAISE NOTICE '- Community posts: %', community_posts_count;
  RAISE NOTICE '- User follows: %', user_follows_count;
  RAISE NOTICE '- Post interactions: %', post_interactions_count;

  RAISE NOTICE '🎯 Your community system is now ready to use!';
  RAISE NOTICE '📋 Next: Run your app and test the community features';
END $$;
