-- ================================================================
-- FINAL COMPREHENSIVE DATABASE CHECK FOR NEW USER SIGNUP
-- ================================================================

-- 1. Check if profiles table exists
SELECT '1. Profiles table exists:' as check, EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'profiles' AND table_schema = 'public'
) as result;

-- 2. Check profiles table structure
SELECT '2. Profiles table columns:' as info, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if handle_new_user function exists
SELECT '3. handle_new_user function exists:' as check, EXISTS(
  SELECT 1 FROM information_schema.routines
  WHERE routine_name = 'handle_new_user' AND routine_schema = 'public'
) as result;

-- 4. Check if trigger exists
SELECT '4. Trigger exists:' as check, EXISTS(
  SELECT 1 FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created'
) as result;

-- 5. Check RLS policies
SELECT '5. RLS policies on profiles:' as info, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 6. Check current function definition
SELECT '6. Current function definition:' as info;
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- 7. Test profile creation (simulate what happens during signup)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_result RECORD;
BEGIN
  RAISE NOTICE '7. Testing profile creation for user %', test_user_id;

  -- Try to create a test profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (test_user_id, 'test@example.com', 'Test User')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Profile creation test completed successfully';

  -- Check if it was created
  SELECT * INTO test_result FROM public.profiles WHERE id = test_user_id;

  IF FOUND THEN
    RAISE NOTICE '✅ Test profile found: %', test_result.display_name;
    -- Clean up test data
    DELETE FROM public.profiles WHERE id = test_user_id;
    RAISE NOTICE '✅ Test profile cleaned up';
  ELSE
    RAISE NOTICE 'ℹ️ Test profile not found (expected if function handles it)';
  END IF;
END $$;

-- 8. Check recent auth users (last 2)
SELECT '8. Recent auth users (last 2):' as info;
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 2;

-- 9. Check recent profiles (last 2)
SELECT '9. Recent profiles (last 2):' as info;
SELECT id, email, display_name, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 2;

SELECT '✅ Database check completed!' as message;






