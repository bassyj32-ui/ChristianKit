-- Simple check for new user signup issues

-- 1. Check if profiles table exists
SELECT 'profiles table exists:' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
            THEN 'YES' ELSE 'NO' END as result;

-- 2. Check profiles table structure
SELECT 'profiles columns:' as check_type, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if notification_preferences table exists
SELECT 'notification_preferences table exists:' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences' AND table_schema = 'public') 
            THEN 'YES' ELSE 'NO' END as result;

-- 4. Check if handle_new_user function exists
SELECT 'handle_new_user function exists:' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user' AND routine_schema = 'public') 
            THEN 'YES' ELSE 'NO' END as result;

-- 5. Check if trigger exists
SELECT 'on_auth_user_created trigger exists:' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
            THEN 'YES' ELSE 'NO' END as result;

-- 6. Show current handle_new_user function code
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';










