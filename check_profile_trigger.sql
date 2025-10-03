-- Check if profile creation trigger exists and is working
SELECT 'Profile creation trigger exists:' as check,
       EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') as result;

-- Check recent auth users vs profiles to see if trigger is working
SELECT 'Recent auth users (last 5):' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

SELECT 'Recent profiles (last 5):' as info;
SELECT id, email, display_name, created_at FROM profiles ORDER BY created_at DESC LIMIT 5;

-- Check if handle_new_user function exists
SELECT 'handle_new_user function exists:' as check,
       EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') as result;

-- Check if profiles table exists
SELECT 'profiles table exists:' as check,
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as result;

-- Show profiles table structure
SELECT 'profiles table columns:' as info,
       column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;


