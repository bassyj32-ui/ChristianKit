-- ================================================================
-- CHRISTIANKIT PROFILE DATA DIAGNOSTIC AND FIX SCRIPT
-- This script checks and fixes profile data issues
-- ================================================================

-- 1. Check if profiles table exists and has data
SELECT 'Checking profiles table...' as step;

SELECT 
  COUNT(*) as total_profiles,
  COUNT(display_name) as profiles_with_display_name,
  COUNT(email) as profiles_with_email
FROM profiles;

-- 2. Check if community_posts table exists and has data
SELECT 'Checking community_posts table...' as step;

SELECT 
  COUNT(*) as total_posts,
  COUNT(author_id) as posts_with_author_id
FROM community_posts;

-- 3. Check the join between profiles and community_posts
SELECT 'Checking profile-community join...' as step;

SELECT 
  cp.id as post_id,
  cp.author_id,
  p.display_name,
  p.email,
  CASE 
    WHEN p.display_name IS NOT NULL THEN p.display_name
    WHEN p.email IS NOT NULL THEN split_part(p.email, '@', 1)
    ELSE 'No profile data'
  END as resolved_name
FROM community_posts cp
LEFT JOIN profiles p ON cp.author_id = p.id
LIMIT 10;

-- 4. Fix missing profile records for existing users
SELECT 'Fixing missing profile records...' as step;

INSERT INTO profiles (id, email, display_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Update existing profiles with missing display_name
UPDATE profiles 
SET display_name = COALESCE(
  display_name, 
  split_part(email, '@', 1)
)
WHERE display_name IS NULL AND email IS NOT NULL;

-- 6. Verify the fix
SELECT 'Verifying fix...' as step;

SELECT 
  COUNT(*) as total_profiles,
  COUNT(display_name) as profiles_with_display_name,
  COUNT(email) as profiles_with_email
FROM profiles;

-- 7. Test the join again
SELECT 'Testing join after fix...' as step;

SELECT 
  cp.id as post_id,
  cp.author_id,
  p.display_name,
  p.email,
  CASE 
    WHEN p.display_name IS NOT NULL THEN p.display_name
    WHEN p.email IS NOT NULL THEN split_part(p.email, '@', 1)
    ELSE 'No profile data'
  END as resolved_name
FROM community_posts cp
LEFT JOIN profiles p ON cp.author_id = p.id
LIMIT 10;

SELECT 'Profile data fix completed! 🎉' as message;
