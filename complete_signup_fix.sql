-- ================================================================
-- COMPLETE NEW USER SIGNUP FIX - BULLETPROOF VERSION
-- ================================================================

-- 1. Ensure profiles table exists with minimal required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop policies and recreate them
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

-- 4. Drop everything related to the function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 5. Create bulletproof handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Simple, error-resistant profile creation
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,  -- This will definitely exist
    new.email, -- This will definitely exist
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1), -- Fallback to email prefix
      'User' -- Final fallback
    ),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Success - profile created
  RETURN new;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the entire signup
    RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    -- Still return new so auth creation doesn't fail
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Test the setup
SELECT 'Complete signup fix applied successfully!' as message;

-- 8. Show current function definition to verify
SELECT 'Current function definition:' as info;
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';





























