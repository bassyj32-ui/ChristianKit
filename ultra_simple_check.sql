-- Ultra simple check
SELECT 'profiles table exists' as check_name, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') as result;

SELECT 'trigger exists' as check_name,
       EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') as result;















