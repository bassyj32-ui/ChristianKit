-- Community System Database Schema for ChristianKit
-- Comprehensive schema supporting posts, prayer requests, encouragements, follows, and interactions

-- User Follows table - tracks following relationships between users
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
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('amen', 'love', 'prayer')),
  created_at TIMESTAMP DEFAULT NOW(),

  -- One interaction per user per post per type
  CONSTRAINT unique_interaction UNIQUE (post_id, user_id, interaction_type)
);

-- Community Posts table - main posts, prayer requests, encouragements, etc.
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

  -- Prayer request specific fields
  prayer_category TEXT CHECK (prayer_category IN ('healing', 'guidance', 'strength', 'family', 'other')),
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  is_prayer_request BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  answered_at TIMESTAMP,
  answered_by UUID REFERENCES profiles(id),

  -- Encouragement specific fields
  encouragement_type TEXT CHECK (encouragement_type IN ('scripture', 'prayer', 'word', 'prophecy')),
  target_user_id UUID REFERENCES profiles(id),
  scripture_reference TEXT,
  is_anonymous BOOLEAN DEFAULT false,

  -- Progress/session integration
  linked_session_id UUID,
  session_type TEXT CHECK (session_type IN ('prayer', 'bible', 'meditation')),
  duration_minutes INTEGER,
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 5),

  -- Metadata
  hashtags TEXT[],
  parent_id UUID REFERENCES community_posts(id), -- For replies/threading
  is_public BOOLEAN DEFAULT true,

  -- Engagement counts
  amens_count INTEGER DEFAULT 0,
  loves_count INTEGER DEFAULT 0,
  prayers_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,

  -- Validation constraints
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT author_name_not_empty CHECK (length(trim(author_name)) > 0)
);

-- Notification Templates (already exists in notification_schema.sql)
-- User Notifications Log (already exists in notification_schema.sql)

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at);

CREATE INDEX IF NOT EXISTS idx_post_interactions_post ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user ON post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_type ON post_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_post_interactions_created_at ON post_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_live ON community_posts(is_live);
CREATE INDEX IF NOT EXISTS idx_community_posts_moderation ON community_posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_parent ON community_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_session ON community_posts(linked_session_id);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_community_posts_prayer_requests ON community_posts(is_prayer_request) WHERE is_prayer_request = true;
CREATE INDEX IF NOT EXISTS idx_community_posts_encouragements ON community_posts(post_type) WHERE post_type = 'encouragement';
CREATE INDEX IF NOT EXISTS idx_community_posts_unanswered_prayers ON community_posts(is_answered) WHERE is_answered = false;

-- Full-text search index for post content
CREATE INDEX IF NOT EXISTS idx_community_posts_content_search ON community_posts USING gin(to_tsvector('english', content));

-- GIN index for hashtags array
CREATE INDEX IF NOT EXISTS idx_community_posts_hashtags ON community_posts USING gin(hashtags);

-- Create triggers for updated_at timestamps
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

-- Function to update post interaction counts
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

-- Function to get posts with interaction counts and author info
CREATE OR REPLACE FUNCTION get_community_posts_with_details(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL,
  p_post_type TEXT DEFAULT NULL
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
  is_live BOOLEAN,
  moderation_status TEXT,
  prayer_category TEXT,
  urgency TEXT,
  is_prayer_request BOOLEAN,
  is_answered BOOLEAN,
  encouragement_type TEXT,
  scripture_reference TEXT,
  is_anonymous BOOLEAN,
  hashtags TEXT[],
  parent_id UUID,
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
    cp.is_live,
    cp.moderation_status,
    cp.prayer_category,
    cp.urgency,
    cp.is_prayer_request,
    cp.is_answered,
    cp.encouragement_type,
    cp.scripture_reference,
    cp.is_anonymous,
    cp.hashtags,
    cp.parent_id,
    p.avatar_url as author_profile_image
  FROM community_posts cp
  LEFT JOIN profiles p ON p.id = cp.author_id
  WHERE
    cp.is_live = true
    AND cp.moderation_status = 'approved'
    AND (p_user_id IS NULL OR cp.author_id = p_user_id)
    AND (p_post_type IS NULL OR cp.post_type = p_post_type)
  ORDER BY cp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's followed users
CREATE OR REPLACE FUNCTION get_followed_users(p_user_id UUID)
RETURNS TABLE(following_id UUID, following_name TEXT, following_avatar TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uf.following_id,
    p.display_name as following_name,
    p.avatar_url as following_avatar
  FROM user_follows uf
  JOIN profiles p ON p.id = uf.following_id
  WHERE uf.follower_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's interactions on posts
CREATE OR REPLACE FUNCTION get_user_post_interactions(p_user_id UUID, p_post_id UUID DEFAULT NULL)
RETURNS TABLE(post_id UUID, interaction_type TEXT, created_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.post_id,
    pi.interaction_type,
    pi.created_at
  FROM post_interactions pi
  WHERE pi.user_id = p_user_id
    AND (p_post_id IS NULL OR pi.post_id = p_post_id);
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional)
-- This can be removed in production
INSERT INTO community_posts (author_id, author_name, author_avatar, content, post_type, is_prayer_request, prayer_category, hashtags)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test User', '👤', 'Welcome to the ChristianKit community! Share your faith journey with others. 🙏', 'post', false, null, ARRAY['welcome', 'community', 'faith']),
  ('00000000-0000-0000-0000-000000000002', 'Prayer Warrior', '🙏', 'Please pray for my family as we go through some challenging times. We need strength and guidance.', 'prayer_request', true, 'family', ARRAY['prayer', 'family', 'strength'])
ON CONFLICT DO NOTHING;

-- Comments on the schema
COMMENT ON TABLE community_posts IS 'Main table for all community posts including prayer requests, encouragements, testimonies, and regular posts';
COMMENT ON TABLE user_follows IS 'Tracks following relationships between users for personalized feeds';
COMMENT ON TABLE post_interactions IS 'Tracks user interactions (amens, loves, prayers) on posts';

COMMENT ON COLUMN community_posts.post_type IS 'Type of post: post, prayer_request, encouragement, testimony, prayer_share';
COMMENT ON COLUMN community_posts.moderation_status IS 'Content moderation status: approved, pending, rejected';
COMMENT ON COLUMN community_posts.is_prayer_request IS 'Whether this post is specifically a prayer request';
COMMENT ON COLUMN community_posts.encouragement_type IS 'Type of encouragement: scripture, prayer, word, prophecy';
COMMENT ON COLUMN community_posts.impact_score IS 'User-rated impact of this post on their spiritual journey (1-5)';

-- Grant permissions for authenticated users and service role
GRANT SELECT, INSERT, UPDATE, DELETE ON community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_interactions TO authenticated;

GRANT ALL ON community_posts TO service_role;
GRANT ALL ON user_follows TO service_role;
GRANT ALL ON post_interactions TO service_role;
