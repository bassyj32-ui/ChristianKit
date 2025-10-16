-- =================================================================
-- PERFORMANCE INDEXES - Critical for Database Performance
-- =================================================================
-- These indexes will dramatically improve query performance
-- Based on common access patterns in social media applications

-- =================================================================
-- PROFILES TABLE INDEXES
-- =================================================================
-- Email lookups (login, search)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Display name searches (user search, mentions)
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Profile lookup by ID (most common operation)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Created date for sorting (newest users first)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- =================================================================
-- POSTS TABLE INDEXES
-- =================================================================
-- Author lookup (get user's posts)
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Created date for sorting (newest posts first)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Updated date for sorting (recently updated posts)
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC);

-- Post type filtering (if you filter by post type)
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);

-- Composite index for feed queries (user posts ordered by date)
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- =================================================================
-- USER_FOLLOWS TABLE INDEXES
-- =================================================================
-- Follower relationships (who follows whom)
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);

-- Following relationships (whom does user follow)
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Composite index for follow status checks
CREATE INDEX IF NOT EXISTS idx_user_follows_both ON user_follows(follower_id, following_id);

-- Created date for sorting (newest follows first)
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at DESC);

-- =================================================================
-- NOTIFICATIONS TABLE INDEXES
-- =================================================================
-- User notifications (get user's notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Created date for sorting (newest notifications first)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Unread notifications (most important for UX)
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE read = false;

-- Notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Composite index for notification queries with pagination
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type, created_at DESC);

-- =================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =================================================================
-- Posts with likes/comments count (for sorting popular posts)
-- Note: Only create these if you have these columns
-- CREATE INDEX IF NOT EXISTS idx_posts_likes ON posts(likes_count DESC);
-- CREATE INDEX IF NOT EXISTS idx_posts_comments ON posts(comments_count DESC);

-- User search optimization (if you implement user search)
-- CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin(to_tsvector('english', display_name || ' ' || COALESCE(bio, '')));

-- =================================================================
-- INDEX USAGE VERIFICATION
-- =================================================================

-- After creating indexes, you can verify they're being used with:
-- EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = 'some-uuid';
-- EXPLAIN ANALYZE SELECT * FROM notifications WHERE user_id = 'some-uuid' AND read = false;

-- Check which indexes exist:
-- SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- =================================================================
-- PERFORMANCE TIPS
-- =================================================================
-- 1. Indexes improve read performance but slow down writes (INSERT/UPDATE/DELETE)
-- 2. Only create indexes on columns that are frequently queried
-- 3. Consider partial indexes (WHERE clauses) for better performance
-- 4. Monitor index usage and remove unused indexes
-- 5. For very large tables, consider table partitioning

-- Run this entire script in your Supabase SQL Editor










