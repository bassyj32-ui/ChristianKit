-- ================================================================
-- CHECK AND FIX PROFILE DATA FOR COMMUNITY POSTS
-- ================================================================

-- 1. Check current user's profile data
SELECT 'Current user profile data:' as step;
SELECT 
  id,
  email,
  display_name,
  avatar_url,
  bio,
  created_at
FROM profiles 
WHERE email = 'your-email@example.com'  -- Replace with your actual email
ORDER BY created_at DESC;

-- 2. Check all profiles
SELECT 'All profiles in database:' as step;
SELECT 
  id,
  email,
  display_name,
  avatar_url,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 3. Check community posts and their author data
SELECT 'Community posts with author data:' as step;
SELECT 
  cp.id as post_id,
  cp.author_id,
  cp.content,
  cp.created_at,
  p.display_name,
  p.email,
  CASE 
    WHEN p.display_name IS NOT NULL THEN p.display_name
    WHEN p.email IS NOT NULL THEN split_part(p.email, '@', 1)
    ELSE 'No profile data'
  END as resolved_name
FROM community_posts cp
LEFT JOIN profiles p ON cp.author_id = p.id
ORDER BY cp.created_at DESC
LIMIT 10;

-- 4. Create/update profile for current user (replace with your actual email)
INSERT INTO profiles (id, email, display_name, avatar_url, bio, favorite_verse, location, custom_links, banner_image, profile_image)
VALUES (
  'your-user-id-here',  -- Replace with your actual user ID
  'your-email@example.com',  -- Replace with your actual email
  'baslieljy',  -- Your desired display name
  NULL,
  NULL,
  NULL,
  NULL,
  '[]'::jsonb,
  NULL,
  NULL
)
ON CONFLICT (id) 
DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- 5. Verify the fix
SELECT 'After fix - community posts:' as step;
SELECT 
  cp.id as post_id,
  cp.author_id,
  cp.content,
  p.display_name,
  p.email,
  CASE 
    WHEN p.display_name IS NOT NULL THEN p.display_name
    WHEN p.email IS NOT NULL THEN split_part(p.email, '@', 1)
    ELSE 'No profile data'
  END as resolved_name
FROM community_posts cp
LEFT JOIN profiles p ON cp.author_id = p.id
ORDER BY cp.created_at DESC
LIMIT 5;

SELECT 'Profile fix completed! 🎉' as message;
