-- ================================================================
-- CHRISTIANKIT CRITICAL PERFORMANCE FIXES
-- Week 1-2: Database optimization for 1k-10k users
-- ================================================================

-- Enable necessary extensions for performance
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For array operations

-- ================================================================
-- 1. PERFORMANCE INDEXES
-- ================================================================

-- Community posts performance indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at_desc 
ON community_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_author_id 
ON community_posts(author_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_category 
ON community_posts(category);

CREATE INDEX IF NOT EXISTS idx_community_posts_moderation_status 
ON community_posts(moderation_status);

CREATE INDEX IF NOT EXISTS idx_community_posts_is_live 
ON community_posts(is_live);

-- Composite index for feed queries (most important)
CREATE INDEX IF NOT EXISTS idx_community_posts_feed 
ON community_posts(moderation_status, is_live, created_at DESC) 
WHERE moderation_status = 'approved' AND is_live = true;

-- Engagement score index (amens + loves + prayers)
CREATE INDEX IF NOT EXISTS idx_community_posts_engagement 
ON community_posts((amens_count + loves_count + prayers_count) DESC, created_at DESC);

-- Hashtag search index
CREATE INDEX IF NOT EXISTS idx_community_posts_hashtags 
ON community_posts USING GIN(hashtags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_community_posts_content_search 
ON community_posts USING GIN(to_tsvector('english', content));

-- ================================================================
-- 2. POST INTERACTIONS OPTIMIZATION
-- ================================================================

-- Post interactions indexes
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id 
ON post_interactions(post_id);

CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id 
ON post_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_post_interactions_type 
ON post_interactions(interaction_type);

-- Composite index for user interactions
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_post 
ON post_interactions(user_id, post_id, interaction_type);

-- ================================================================
-- 3. USER FOLLOWS OPTIMIZATION
-- ================================================================

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id 
ON user_follows(follower_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_following_id 
ON user_follows(following_id);

-- Composite index for follow relationships
CREATE INDEX IF NOT EXISTS idx_user_follows_relationship 
ON user_follows(follower_id, following_id);

-- ================================================================
-- 4. PROFILES OPTIMIZATION
-- ================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_display_name 
ON profiles(display_name);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
ON profiles(created_at DESC);

-- ================================================================
-- 5. NOTIFICATIONS OPTIMIZATION
-- ================================================================

-- Notifications indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_read_status 
ON notifications(is_read);

-- ================================================================
-- 6. PERFORMANCE FUNCTIONS
-- ================================================================

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  amens_count INTEGER,
  loves_count INTEGER,
  prayers_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) RETURNS FLOAT AS $$
DECLARE
  time_decay FLOAT;
  engagement FLOAT;
BEGIN
  -- Time decay factor (posts lose relevance over time)
  time_decay := EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600);
  
  -- Engagement calculation (prayers worth more than loves, loves more than amens)
  engagement := (amens_count * 1.0) + (loves_count * 2.0) + (prayers_count * 3.0);
  
  RETURN engagement * time_decay;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get trending posts
CREATE OR REPLACE FUNCTION get_trending_posts(
  limit_count INTEGER DEFAULT 20,
  hours_back INTEGER DEFAULT 24
) RETURNS TABLE (
  id UUID,
  author_id UUID,
  content TEXT,
  category TEXT,
  hashtags TEXT[],
  amens_count INTEGER,
  loves_count INTEGER,
  prayers_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  engagement_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.author_id,
    cp.content,
    cp.category,
    cp.hashtags,
    cp.amens_count,
    cp.loves_count,
    cp.prayers_count,
    cp.created_at,
    calculate_engagement_score(cp.amens_count, cp.loves_count, cp.prayers_count, cp.created_at) as engagement_score
  FROM community_posts cp
  WHERE cp.moderation_status = 'approved'
    AND cp.is_live = true
    AND cp.created_at >= NOW() - INTERVAL '1 hour' * hours_back
  ORDER BY engagement_score DESC, cp.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 7. MATERIALIZED VIEWS FOR PERFORMANCE
-- ================================================================

-- Materialized view for user stats (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT 
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  COUNT(DISTINCT cp.id) as post_count,
  COUNT(DISTINCT uf1.follower_id) as follower_count,
  COUNT(DISTINCT uf2.following_id) as following_count,
  COALESCE(SUM(cp.amens_count + cp.loves_count + cp.prayers_count), 0) as total_engagement,
  MAX(cp.created_at) as last_post_at
FROM profiles p
LEFT JOIN community_posts cp ON p.id = cp.author_id AND cp.moderation_status = 'approved'
LEFT JOIN user_follows uf1 ON p.id = uf1.following_id
LEFT JOIN user_follows uf2 ON p.id = uf2.follower_id
GROUP BY p.id, p.display_name, p.avatar_url;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_follower_count ON user_stats(follower_count DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_stats() RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_stats;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 8. ROW LEVEL SECURITY POLICIES (if not already set)
-- ================================================================

-- Community posts policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_posts' 
    AND policyname = 'Anyone can view approved posts'
  ) THEN
    CREATE POLICY "Anyone can view approved posts" ON community_posts 
      FOR SELECT USING (moderation_status = 'approved' AND is_live = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_posts' 
    AND policyname = 'Users can create posts'
  ) THEN
    CREATE POLICY "Users can create posts" ON community_posts 
      FOR INSERT WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_posts' 
    AND policyname = 'Users can update own posts'
  ) THEN
    CREATE POLICY "Users can update own posts" ON community_posts 
      FOR UPDATE USING (auth.uid() = author_id);
  END IF;
END $$;

-- Post interactions policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'post_interactions' 
    AND policyname = 'Users can manage own interactions'
  ) THEN
    CREATE POLICY "Users can manage own interactions" ON post_interactions 
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- User follows policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_follows' 
    AND policyname = 'Users can manage own follows'
  ) THEN
    CREATE POLICY "Users can manage own follows" ON user_follows 
      FOR ALL USING (auth.uid() = follower_id);
  END IF;
END $$;

-- ================================================================
-- 9. PERFORMANCE MONITORING
-- ================================================================

-- Function to get database performance stats
CREATE OR REPLACE FUNCTION get_performance_stats() RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  index_size TEXT,
  table_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins + n_tup_upd + n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 10. CLEANUP AND MAINTENANCE
-- ================================================================

-- Function to clean up old data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS VOID AS $$
BEGIN
  -- Delete posts older than 1 year that have no engagement
  DELETE FROM community_posts 
  WHERE created_at < NOW() - INTERVAL '1 year'
    AND amens_count = 0 
    AND loves_count = 0 
    AND prayers_count = 0;
    
  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW user_stats;
  
  -- Update table statistics
  ANALYZE community_posts;
  ANALYZE post_interactions;
  ANALYZE user_follows;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Critical performance fixes applied successfully!';
  RAISE NOTICE '📊 Indexes created for optimal query performance';
  RAISE NOTICE '🚀 Functions created for engagement scoring and trending';
  RAISE NOTICE '📈 Materialized views created for user statistics';
  RAISE NOTICE '🔒 RLS policies verified and created';
  RAISE NOTICE '⚡ Database optimized for 1k-10k users';
END $$;


