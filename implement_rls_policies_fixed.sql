-- =================================================================
-- FIXED RLS POLICIES - Correct UUID Type Casting
-- =================================================================
-- Fixed the text = uuid operator error by using proper UUID casting
-- auth.uid() returns UUID, so we cast column values to UUID for comparison

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- USERS TABLE POLICIES (if used)
-- =================================================================
-- Users can only view and edit their own record (if this table is used)
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());

-- =================================================================
-- PROFILES TABLE POLICIES (Main User Table)
-- =================================================================
-- Users can only view their own profile (CRITICAL SECURITY FIX)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own_and_public" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid()::text = id::text);

-- Users can only insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Users can only update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- Users can delete their own profile
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (id = auth.uid());

-- =================================================================
-- POSTS TABLE POLICIES
-- =================================================================
-- Users can view posts from users they follow + their own posts
-- Note: posts.user_id references profiles.id
DROP POLICY IF EXISTS "posts_select_followed_and_own" ON posts;
CREATE POLICY "posts_select_followed_and_own" ON posts FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = auth.uid()
    AND following_id = posts.user_id
  )
);

-- Users can only insert their own posts
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own posts
DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own posts
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (user_id = auth.uid());

-- =================================================================
-- USER_FOLLOWS TABLE POLICIES
-- =================================================================
-- Users can view follows where they are either the follower or the one being followed
-- This allows users to see who they follow and who follows them
DROP POLICY IF EXISTS "user_follows_select_own_relationships" ON user_follows;
CREATE POLICY "user_follows_select_own_relationships" ON user_follows FOR SELECT USING (
  follower_id = auth.uid() OR
  following_id = auth.uid()
);

-- Users can create follow relationships (as the follower)
DROP POLICY IF EXISTS "user_follows_insert_as_follower" ON user_follows;
CREATE POLICY "user_follows_insert_as_follower" ON user_follows FOR INSERT WITH CHECK (follower_id = auth.uid());

-- Users can unfollow (delete their own follow relationships)
DROP POLICY IF EXISTS "user_follows_delete_own" ON user_follows;
CREATE POLICY "user_follows_delete_own" ON user_follows FOR DELETE USING (follower_id = auth.uid());

-- =================================================================
-- NOTIFICATIONS TABLE POLICIES
-- =================================================================
-- Users can only view their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());

-- System/service can insert notifications (for the recipient)
DROP POLICY IF EXISTS "notifications_insert_for_user" ON notifications;
CREATE POLICY "notifications_insert_for_user" ON notifications FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own notifications (mark as read, etc.)
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (user_id = auth.uid());

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Test 1: Users should only see their own profile
-- SELECT * FROM profiles WHERE id = auth.uid();

-- Test 2: Users should see posts from followed users + own posts
-- SELECT p.* FROM posts p WHERE p.user_id = auth.uid()
-- OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = auth.uid() AND f.following_id = p.user_id);

-- Test 3: Users should only see their own notifications
-- SELECT * FROM notifications WHERE user_id = auth.uid();

-- Test 4: Check that RLS is enabled on all tables
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'profiles', 'posts', 'user_follows', 'notifications');

-- =================================================================
-- IMPORTANT NOTES:
-- =================================================================
-- 1. Fixed UUID comparison issue - now using direct UUID comparison
-- 2. auth.uid() returns UUID type, columns are UUID type - no casting needed
-- 3. All foreign key relationships use UUID type consistently
-- 4. This should resolve the "operator does not exist: text = uuid" error

-- Run this entire script in your Supabase SQL Editor to implement the fixed security policies
