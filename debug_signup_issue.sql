-- ================================================================
-- DEBUG NEW USER SIGNUP ISSUE
-- ================================================================

-- 1. Check current profiles table structure
SELECT 'Current profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Test the handle_new_user function manually
SELECT 'Testing handle_new_user function...' as info;

-- 3. Check if there are any existing profiles
SELECT 'Existing profiles count:' as info, COUNT(*) as count FROM public.profiles;

-- 4. Check auth.users table structure (what the trigger receives)
SELECT 'Auth users table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 5. Check recent auth.users entries
SELECT 'Recent auth.users entries:' as info;
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;















