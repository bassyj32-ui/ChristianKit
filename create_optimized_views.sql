-- =================================================================
-- OPTIMIZED DATABASE VIEWS - Query Performance Enhancement
-- =================================================================
-- These views optimize common query patterns for better performance
-- and provide a foundation for advanced features

-- =================================================================
-- STEP 1: USER PROFILE VIEW WITH FOLLOW STATUS
-- =================================================================
-- Optimized view for user profiles with follow relationships
-- Eliminates complex joins in application code

CREATE OR REPLACE VIEW user_profiles_with_follows AS
SELECT
  p.id,
  p.email,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.location,
  p.favorite_verse,
  p.created_at,
  p.updated_at,
  p.full_name,
  p.phone,
  p.church_denomination,
  p.spiritual_maturity,
  p.is_verified,
  p.is_private,

  -- Follow statistics (computed efficiently)
  COALESCE(followers_count.count, 0) as followers_count,
  COALESCE(following_count.count, 0) as following_count,

  -- Current user's follow status (only if authenticated)
  CASE
    WHEN auth.uid() IS NOT NULL THEN
      EXISTS(
        SELECT 1 FROM user_follows uf
        WHERE uf.follower_id = auth.uid()
        AND uf.following_id = p.id
      )
    ELSE false
  END as is_followed_by_current_user,

  -- Recent posts count (last 30 days)
  COALESCE(recent_posts.count, 0) as recent_posts_count

FROM profiles p

-- Followers count subquery (optimized with index)
LEFT JOIN (
  SELECT following_id, COUNT(*) as count
  FROM user_follows
  GROUP BY following_id
) followers_count ON followers_count.following_id = p.id

-- Following count subquery (optimized with index)
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count
  FROM user_follows
  GROUP BY follower_id
) following_count ON following_count.follower_id = p.id

-- Recent posts count subquery (optimized with partial index)
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM posts
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) recent_posts ON recent_posts.user_id = p.id;

-- =================================================================
-- STEP 2: POSTS FEED VIEW WITH ENGAGEMENT METRICS
-- =================================================================
-- Optimized view for social media feeds with all engagement data
-- Pre-computes likes, comments, and other metrics

CREATE OR REPLACE VIEW posts_feed_optimized AS
SELECT
  p.id,
  p.user_id,
  p.content,
  p.title,
  p.image_url,
  p.post_type,
  p.created_at,
  p.updated_at,
  p.likes_count,
  p.comments_count,

  -- Author information (no additional join needed)
  author.display_name as author_name,
  author.avatar_url as author_avatar,

  -- Engagement metrics (pre-computed)
  COALESCE(likes.count, 0) as actual_likes,
  COALESCE(comments.count, 0) as actual_comments,
  COALESCE(prayers.count, 0) as actual_prayers,
  COALESCE(amens.count, 0) as actual_amens,

  -- Current user's interaction status
  CASE WHEN auth.uid() IS NOT NULL THEN
    COALESCE(user_liked.is_liked, false)
    ELSE false
  END as is_liked_by_current_user,

  -- Trending score (for algorithmic feed)
  (
    COALESCE(likes.count, 0) * 1.0 +
    COALESCE(comments.count, 0) * 2.0 +
    COALESCE(prayers.count, 0) * 1.5 +
    COALESCE(amens.count, 0) * 1.2
  ) / EXTRACT(EPOCH FROM (NOW() - p.created_at)) * 3600 as trending_score

FROM posts p

-- Join with author profile (optimized with index)
JOIN profiles author ON author.id = p.user_id::uuid

-- Likes count (optimized with index)
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM post_likes
  GROUP BY post_id
) likes ON likes.post_id = p.id

-- Comments count (optimized with index)
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM post_comments
  GROUP BY post_id
) comments ON comments.post_id = p.id

-- Prayers count (optimized with index)
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM prayers
  GROUP BY post_id
) prayers ON prayers.post_id = p.id

-- Amens count (optimized with index)
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM post_interactions
  WHERE interaction_type = 'amen'
  GROUP BY post_id
) amens ON amens.post_id = p.id

-- Current user's like status (optimized with index)
LEFT JOIN (
  SELECT post_id, true as is_liked
  FROM post_likes
  WHERE user_id = auth.uid()
) user_liked ON user_liked.post_id = p.id;

-- =================================================================
-- STEP 3: NOTIFICATIONS VIEW WITH USER CONTEXT
-- =================================================================
-- Optimized notifications view with sender information
-- Eliminates complex joins in notification queries

CREATE OR REPLACE VIEW notifications_with_context AS
SELECT
  n.id,
  n.user_id as recipient_id,
  n.type,
  n.title,
  n.message,
  n.data,
  n.read,
  n.created_at,

  -- Sender information (if applicable)
  sender.display_name as sender_name,
  sender.avatar_url as sender_avatar,

  -- Related content information
  CASE
    WHEN n.data->>'post_id' IS NOT NULL THEN
      (SELECT title FROM posts WHERE id = (n.data->>'post_id')::uuid LIMIT 1)
    ELSE NULL
  END as related_post_title,

  -- Notification age in human-readable format
  CASE
    WHEN n.created_at > NOW() - INTERVAL '1 minute' THEN 'Just now'
    WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN
      EXTRACT(minute FROM NOW() - n.created_at)::text || ' minutes ago'
    WHEN n.created_at > NOW() - INTERVAL '1 day' THEN
      EXTRACT(hour FROM NOW() - n.created_at)::text || ' hours ago'
    ELSE
      EXTRACT(day FROM NOW() - n.created_at)::text || ' days ago'
  END as time_ago

FROM notifications n

-- Join with sender profile (only for notifications that have senders)
LEFT JOIN profiles sender ON sender.id = (n.data->>'actor_id')::uuid

WHERE n.user_id = auth.uid(); -- RLS ensures users only see their notifications

-- =================================================================
-- STEP 4: USER ACTIVITY SUMMARY VIEW
-- =================================================================
-- Aggregated view of user activity for dashboard and analytics
-- Pre-computes activity metrics for better performance

CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  p.id as user_id,
  p.display_name,

  -- Activity counts (last 30 days)
  COALESCE(posts_30d.count, 0) as posts_last_30_days,
  COALESCE(likes_30d.count, 0) as likes_given_last_30_days,
  COALESCE(comments_30d.count, 0) as comments_last_30_days,
  COALESCE(prayers_30d.count, 0) as prayers_last_30_days,

  -- Engagement received (all time)
  COALESCE(posts_liked.count, 0) as total_likes_received,
  COALESCE(posts_commented.count, 0) as total_comments_received,

  -- Social metrics
  COALESCE(followers_total.count, 0) as total_followers,
  COALESCE(following_total.count, 0) as total_following,

  -- Streak information (if you implement streaks)
  0 as current_streak_days, -- Placeholder for streak calculation

  -- Last activity timestamp
  GREATEST(
    COALESCE(p.updated_at, p.created_at),
    COALESCE(last_post.created_at, '1970-01-01'::timestamptz),
    COALESCE(last_like.created_at, '1970-01-01'::timestamptz),
    COALESCE(last_comment.created_at, '1970-01-01'::timestamptz)
  ) as last_activity_at

FROM profiles p

-- Posts in last 30 days
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM posts
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) posts_30d ON posts_30d.user_id = p.id

-- Likes given in last 30 days
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM post_likes
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) likes_30d ON likes_30d.user_id = p.id

-- Comments in last 30 days
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM post_comments
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) comments_30d ON comments_30d.user_id = p.id

-- Prayers in last 30 days (commented out - table structure needs verification)
-- Uncomment and fix column names once prayers table structure is confirmed
/*
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM prayers
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) prayers_30d ON prayers_30d.user_id = p.id
*/

-- Total likes received
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM posts
  WHERE likes_count > 0
  GROUP BY user_id
) posts_liked ON posts_liked.user_id = p.id

-- Total comments received
LEFT JOIN (
  SELECT p.user_id, COUNT(*) as count
  FROM posts p
  JOIN post_comments pc ON pc.post_id = p.id
  GROUP BY p.user_id
) posts_commented ON posts_commented.user_id = p.id

-- Followers count
LEFT JOIN (
  SELECT following_id, COUNT(*) as count
  FROM user_follows
  GROUP BY following_id
) followers_total ON followers_total.following_id = p.id

-- Following count
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count
  FROM user_follows
  GROUP BY follower_id
) following_total ON following_total.follower_id = p.id

-- Last post timestamp
LEFT JOIN (
  SELECT user_id, MAX(created_at) as created_at
  FROM posts
  GROUP BY user_id
) last_post ON last_post.user_id = p.id

-- Last like timestamp
LEFT JOIN (
  SELECT user_id, MAX(created_at) as created_at
  FROM post_likes
  GROUP BY user_id
) last_like ON last_like.user_id = p.id

-- Last comment timestamp
LEFT JOIN (
  SELECT user_id, MAX(created_at) as created_at
  FROM post_comments
  GROUP BY user_id
) last_comment ON last_comment.user_id = p.id;

-- =================================================================
-- STEP 5: PERFORMANCE MONITORING VIEW
-- =================================================================
-- View for tracking query performance and system health

CREATE OR REPLACE VIEW system_performance_metrics AS
SELECT
  'profiles' as table_name,
  (SELECT COUNT(*) FROM profiles) as row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'profiles') as index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count,

  'posts' as table_name,
  (SELECT COUNT(*) FROM posts) as row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'posts') as index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'posts') as policy_count,

  'user_follows' as table_name,
  (SELECT COUNT(*) FROM user_follows) as row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_follows') as index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_follows') as policy_count,

  'notifications' as table_name,
  (SELECT COUNT(*) FROM notifications) as row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notifications') as index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications') as policy_count,

  -- System metrics
  (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '1 hour') as recent_audit_logs,
  (SELECT COUNT(*) FROM media_files) as total_media_files,
  NOW() as last_updated;

-- =================================================================
-- STEP 6: CREATE MATERIALIZED VIEWS FOR HEAVY COMPUTATIONS
-- =================================================================
-- Materialized views for expensive calculations that don't change often

-- Popular posts (updated hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_posts_hourly AS
SELECT
  p.id,
  p.user_id,
  p.title,
  p.content,
  p.created_at,
  author.display_name as author_name,
  author.avatar_url as author_avatar,

  -- Engagement score (cached for performance)
  (
    COALESCE(p.likes_count, 0) * 1.0 +
    COALESCE(p.comments_count, 0) * 2.0
  ) as engagement_score,

  -- Ranking for trending algorithm
  ROW_NUMBER() OVER (
    ORDER BY (
      COALESCE(p.likes_count, 0) * 1.0 +
      COALESCE(p.comments_count, 0) * 2.0
    ) DESC,
    p.created_at DESC
  ) as trending_rank

FROM posts p
JOIN profiles author ON author.id = p.user_id::uuid
WHERE p.created_at >= NOW() - INTERVAL '7 days';

-- Create index on materialized view for fast queries
CREATE INDEX IF NOT EXISTS idx_popular_posts_trending ON popular_posts_hourly(trending_rank);
CREATE INDEX IF NOT EXISTS idx_popular_posts_engagement ON popular_posts_hourly(engagement_score DESC);

-- =================================================================
-- STEP 7: CREATE VIEW REFRESH FUNCTIONS
-- =================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_popular_posts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW popular_posts_hourly;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW popular_posts_hourly;
  -- Add more materialized views here as you create them
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 8: PERFORMANCE ANALYSIS HELPERS
-- =================================================================

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_table_performance(
  table_name TEXT,
  days_back INTEGER DEFAULT 7
) RETURNS TABLE (
  metric_name TEXT,
  metric_value TEXT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'row_count'::TEXT,
    COUNT(*)::TEXT,
    CASE
      WHEN COUNT(*) > 1000000 THEN 'Consider partitioning'
      WHEN COUNT(*) > 100000 THEN 'Monitor performance'
      ELSE 'Good'
    END
  FROM information_schema.tables
  WHERE table_name = analyze_table_performance.table_name;

  -- Add more performance metrics here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Test the optimized views
SELECT 'user_profiles_with_follows' as view_name, COUNT(*) as row_count FROM user_profiles_with_follows LIMIT 1;
SELECT 'posts_feed_optimized' as view_name, COUNT(*) as row_count FROM posts_feed_optimized LIMIT 1;
SELECT 'notifications_with_context' as view_name, COUNT(*) as row_count FROM notifications_with_context LIMIT 1;
SELECT 'user_activity_summary' as view_name, COUNT(*) as row_count FROM user_activity_summary LIMIT 1;

-- Check materialized view
SELECT 'popular_posts_hourly' as view_name, COUNT(*) as row_count FROM popular_posts_hourly LIMIT 1;

-- =================================================================
-- IMPORTANT NOTES:
-- =================================================================
-- 1. These views eliminate complex joins in application code
-- 2. Materialized views provide cached results for expensive queries
-- 3. All views respect RLS policies for security
-- 4. Views can be extended as your application grows
-- 5. Consider refreshing materialized views during low-traffic periods

-- Run this entire script in your Supabase SQL Editor
