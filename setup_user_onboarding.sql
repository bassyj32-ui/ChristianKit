-- =================================================================
-- SIMPLIFIED USER ONBOARDING FOR CHRISTIAN KIT
-- =================================================================
-- Single, clean system for user registration and community access

-- =================================================================
-- STEP 1: CREATE USER REGISTRATION TRIGGER (ONLY SYSTEM NEEDED)
-- =================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile record with display name from metadata or email
  INSERT INTO profiles (
    id,
    email,
    display_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drops existing if present)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =================================================================
-- STEP 2: COMMUNITY POSTS SETUP
-- =================================================================

-- Add required columns if they don't exist
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT true;

-- Update existing posts
UPDATE community_posts SET moderation_status = 'approved' WHERE moderation_status IS NULL;

-- Simple RLS policies (drop complex ones first)
DROP POLICY IF EXISTS "Community posts are publicly readable" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;

-- Simple policies for basic community functionality
CREATE POLICY "Enable read for approved posts" ON community_posts
  FOR SELECT USING (moderation_status = 'approved' AND is_live = true);

CREATE POLICY "Enable insert for authenticated users" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for post authors" ON community_posts
  FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Enable delete for post authors" ON community_posts
  FOR DELETE USING (auth.uid()::text = author_id::text);

-- =================================================================
-- STEP 3: SIMPLE UTILITY FUNCTION (ONLY ONE NEEDED)
-- =================================================================

CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID DEFAULT auth.uid())
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
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- OPTIONAL: CLEAN UP OLD FUNCTIONS (run if you want to remove complexity)
-- =================================================================

-- Uncomment these if you want to remove the old over-engineered functions:
/*
DROP FUNCTION IF EXISTS ensure_user_profile();
DROP FUNCTION IF EXISTS fix_missing_profiles();
DROP FUNCTION IF EXISTS handle_user_login();
DROP FUNCTION IF EXISTS get_user_profile_cached(UUID);
DROP FUNCTION IF EXISTS can_access_community();
*/

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Check profile creation works
SELECT id, email, display_name FROM profiles WHERE id = auth.uid();

-- Check community posts accessible
SELECT COUNT(*) FROM community_posts WHERE moderation_status = 'approved' AND is_live = true;

-- =================================================================
-- SUMMARY:
-- =================================================================
-- ✅ Single trigger handles all new user registration
-- ✅ Simple RLS policies for community posts
-- ✅ One utility function for getting profiles
-- ✅ No conflicting systems or redundant functions
-- ✅ Clean, maintainable codebase

-- Just run this script in Supabase SQL Editor and you're done!

