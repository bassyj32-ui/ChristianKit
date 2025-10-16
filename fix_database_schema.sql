-- =================================================================
-- COMPREHENSIVE DATABASE SCHEMA FIX
-- =================================================================
-- This script fixes the schema mismatch between your app code and database
-- The app expects: user_id columns, but your database uses different structure

-- Based on your app code analysis, here's what needs to be fixed:

-- 1. Add user_id columns to tables that need them
-- 2. Fix followers table structure to match user_follows
-- 3. Ensure all tables have the expected columns
-- 4. Set up proper foreign key relationships

-- =================================================================
-- STEP 1: FIX PROFILES TABLE
-- =================================================================
-- Add any missing columns that the app expects
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS church_denomination TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spiritual_maturity TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- =================================================================
-- STEP 2: FIX POSTS TABLE
-- =================================================================
-- Add user_id column if it doesn't exist (for posts.author_id)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add other expected columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'text';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- =================================================================
-- STEP 3: FIX FOLLOWERS TABLE
-- =================================================================
-- Rename to user_follows to match app expectations
-- First, create the correct table structure
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Copy any existing data from followers table (if it exists and has data)
-- First, check if followers table exists and has data
DO $$
BEGIN
  -- Check if followers table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followers') THEN
    -- Check if followers table has the expected columns
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'followers'
      AND column_name IN ('follower_id', 'following_id')
    ) THEN
      -- Check if followers table has data
      IF EXISTS (SELECT 1 FROM followers LIMIT 1) THEN
        -- Insert data, ignoring duplicates using WHERE NOT EXISTS
        INSERT INTO user_follows (follower_id, following_id, created_at)
        SELECT DISTINCT f.follower_id, f.following_id, COALESCE(f.created_at, NOW())
        FROM followers f
        WHERE f.follower_id IS NOT NULL
          AND f.following_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM user_follows uf
            WHERE uf.follower_id = f.follower_id
              AND uf.following_id = f.following_id
          );
      END IF;
    END IF;
  END IF;
END $$;

-- Drop the old followers table after migration (only if it exists)
DROP TABLE IF EXISTS followers;

-- =================================================================
-- STEP 4: FIX NOTIFICATIONS TABLE
-- =================================================================
-- Ensure notifications table has user_id column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add expected columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- =================================================================
-- STEP 5: ADD USEFUL INDEXES FOR PERFORMANCE
-- =================================================================
-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- User follows table indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- =================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- =================================================================

-- Function to get user profile by auth user ID
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  favorite_verse TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.display_name, p.avatar_url, p.bio, p.location, p.favorite_verse, p.created_at, p.updated_at
  FROM profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower_uuid UUID, following_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = follower_uuid AND following_id = following_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 7: UPDATE EXISTING DATA (if needed)
-- =================================================================

-- If you have existing posts without user_id, you might need to migrate them
-- This depends on your specific data setup

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Check that all tables have the expected structure
SELECT 'profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check posts table
SELECT 'posts' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- Check user_follows table
SELECT 'user_follows' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_follows'
ORDER BY ordinal_position;

-- Check notifications table
SELECT 'notifications' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- =================================================================
-- IMPORTANT NOTES:
-- =================================================================
-- 1. This script fixes the schema to match your app's expectations
-- 2. After running this, your "user_id" errors should be resolved
-- 3. The user_follows table replaces the followers table
-- 4. All foreign keys properly reference profiles.id
-- 5. Indexes are added for better performance

-- Run this entire script in your Supabase SQL Editor
