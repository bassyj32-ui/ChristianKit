-- ================================================================
-- COMPREHENSIVE NEW USER SIGNUP DIAGNOSTIC
-- ================================================================

-- 1. Check if profiles table exists and has correct structure
SELECT '1. Profiles table exists:' as check, EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'profiles' AND table_schema = 'public'
) as result;

-- 2. Check profiles table structure
SELECT '2. Profiles table columns:' as info, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if handle_new_user function exists and get its code
SELECT '3. handle_new_user function exists:' as check, EXISTS(
  SELECT 1 FROM information_schema.routines
  WHERE routine_name = 'handle_new_user' AND routine_schema = 'public'
) as result;

SELECT '4. Function definition:' as info, routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- 5. Check if trigger exists
SELECT '5. Trigger exists:' as check, EXISTS(
  SELECT 1 FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created'
) as result;

-- 6. Check RLS policies on profiles table
SELECT '6. RLS policies on profiles:' as info, policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 7. Check if there are any recent errors in auth.users inserts
SELECT '7. Recent auth.users entries (last 3):' as info;
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- 8. Check if profiles were created for recent users
SELECT '8. Recent profiles entries (last 3):' as info;
SELECT id, email, display_name, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 3;

-- 9. Test the function manually (if profiles table exists)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '9. Testing profile creation for user %', test_user_id;
    -- This will show if there are any errors when inserting into profiles
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (test_user_id, 'test@example.com', 'Test User');
    RAISE NOTICE 'Profile creation test successful';
  ELSE
    RAISE NOTICE 'Profiles table does not exist - this is the problem!';
  END IF;
END $$;










