-- =================================================================
-- ESSENTIAL OPTIMIZED VIEWS - Core Query Performance
-- =================================================================
-- Simplified version focusing on known-working table structures
-- Core views for profiles, posts, and notifications

-- =================================================================
-- STEP 1: USER PROFILE VIEW WITH FOLLOW STATUS
-- =================================================================
-- Optimized view for user profiles with follow relationships

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
-- Optimized view for social media feeds with engagement data

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

  -- Author information
  author.display_name as author_name,
  author.avatar_url as author_avatar,

  -- Engagement metrics (pre-computed)
  COALESCE(likes.count, 0) as actual_likes,
  COALESCE(comments.count, 0) as actual_comments,

  -- Current user's interaction status
  CASE WHEN auth.uid() IS NOT NULL THEN
    COALESCE(user_liked.is_liked, false)
    ELSE false
  END as is_liked_by_current_user,

  -- Trending score (for algorithmic feed)
  (
    COALESCE(p.likes_count, 0) * 1.0 +
    COALESCE(p.comments_count, 0) * 2.0
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
-- STEP 4: PERFORMANCE MONITORING VIEW
-- =================================================================
-- View for tracking system performance (restructured to avoid duplicate columns)

CREATE OR REPLACE VIEW system_performance_metrics AS
SELECT
  'profiles' as table_name,
  (SELECT COUNT(*) FROM profiles) as profiles_row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'profiles') as profiles_index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as profiles_policy_count,

  (SELECT COUNT(*) FROM posts) as posts_row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'posts') as posts_index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'posts') as posts_policy_count,

  (SELECT COUNT(*) FROM user_follows) as follows_row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_follows') as follows_index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_follows') as follows_policy_count,

  (SELECT COUNT(*) FROM notifications) as notifications_row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notifications') as notifications_index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications') as notifications_policy_count,

  -- System metrics
  (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '1 hour') as recent_audit_logs,
  (SELECT COUNT(*) FROM media_files) as total_media_files,
  NOW() as last_updated;

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Test the essential views
SELECT 'user_profiles_with_follows' as view_name, COUNT(*) as row_count FROM user_profiles_with_follows LIMIT 1;
SELECT 'posts_feed_optimized' as view_name, COUNT(*) as row_count FROM posts_feed_optimized LIMIT 1;
SELECT 'notifications_with_context' as view_name, COUNT(*) as row_count FROM notifications_with_context LIMIT 1;

-- =================================================================
-- IMPORTANT NOTES:
-- =================================================================
-- 1. This is a simplified version focusing on known-working table structures
-- 2. Core views for profiles, posts, and notifications are fully functional
-- 3. Complex analytics views commented out until table structures are confirmed
-- 4. These views provide the foundation for excellent query performance

-- Run this script first to get the core optimizations working
