-- ================================================================
-- CHRISTIANKIT BASIC TABLES - NO FOREIGN KEYS
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. PROFILES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  favorite_verse TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 2. USER FOLLOWS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 3. COMMUNITY POSTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  author_name TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  hashtags TEXT[] DEFAULT '{}',
  amens_count INTEGER DEFAULT 0,
  loves_count INTEGER DEFAULT 0,
  prayers_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT true,
  moderation_status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. POST INTERACTIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 5. NOTIFICATIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 6. NOTIFICATION PREFERENCES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY,
  follows BOOLEAN DEFAULT TRUE,
  interactions BOOLEAN DEFAULT TRUE,
  prayer_reminders BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 7. PRAYER REMINDERS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  verse TEXT,
  verse_reference TEXT,
  time TEXT NOT NULL,
  days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}',
  is_active BOOLEAN DEFAULT TRUE,
  notification_type TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 8. PRAYER SESSIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  source TEXT DEFAULT 'manual',
  prayer_type TEXT DEFAULT 'personal',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 9. PRAYER NOTIFICATION LOGS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 10. PUSH SUBSCRIPTIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 11. FCM TOKENS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fcm_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 12. GAME SCORES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

SELECT 'ChristianKit basic tables created successfully! 🎉' as message;
