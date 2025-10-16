-- 🚀 ChristianKit - Fix Missing Tables and Storage
-- Run this in your Supabase Dashboard → SQL Editor

-- =================================================================
-- STEP 1: CREATE MISSING TABLES
-- =================================================================

-- Create prayer_requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'answered', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(100) NOT NULL CHECK (project_type IN ('bible_study', 'prayer_group', 'community_service', 'personal_growth')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(50) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  notifications JSONB DEFAULT '{}',
  privacy JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_reminders table
CREATE TABLE IF NOT EXISTS daily_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type VARCHAR(100) NOT NULL CHECK (reminder_type IN ('prayer', 'bible_study', 'meditation', 'journal', 'gratitude')),
  time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- =================================================================

-- Enable RLS on all new tables
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reminders ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- STEP 3: CREATE RLS POLICIES
-- =================================================================

-- Prayer requests policies
CREATE POLICY "Users can view public prayer requests" ON prayer_requests
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own prayer requests" ON prayer_requests
  FOR ALL USING (user_id = auth.uid());

-- Projects policies
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (user_id = auth.uid());

-- Settings policies
CREATE POLICY "Users can manage their own settings" ON settings
  FOR ALL USING (user_id = auth.uid());

-- Daily reminders policies
CREATE POLICY "Users can manage their own reminders" ON daily_reminders
  FOR ALL USING (user_id = auth.uid());

-- =================================================================
-- STEP 4: CREATE STORAGE BUCKET
-- =================================================================

-- Create user-media bucket (this is what your code expects)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-media',
  'user-media',
  true, -- Public read access
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =================================================================
-- STEP 5: CREATE STORAGE POLICIES FOR USER-MEDIA
-- =================================================================

-- User-media bucket policies
CREATE POLICY "User media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-media');

CREATE POLICY "Users can upload to user-media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their user-media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their user-media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-media'
    AND auth.role() = 'authenticated'
  );

-- =================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

-- Prayer requests indexes
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_public ON prayer_requests(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status, created_at DESC);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type, created_at DESC);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Daily reminders indexes
CREATE INDEX IF NOT EXISTS idx_daily_reminders_user_id ON daily_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reminders_active ON daily_reminders(user_id, is_active, time);

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Check that all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('prayer_requests', 'projects', 'settings', 'daily_reminders')
ORDER BY table_name;

-- Check that user-media bucket was created
SELECT name as bucket_name, public, file_size_limit
FROM storage.buckets
WHERE name = 'user-media';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('prayer_requests', 'projects', 'settings', 'daily_reminders')
ORDER BY tablename, policyname;

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
-- If you see this message, all tables and storage have been set up successfully!
-- Your ChristianKit app should now work properly with Supabase.
