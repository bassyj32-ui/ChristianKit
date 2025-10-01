# 🔔 Notification System Setup Instructions

## ✅ Fixed Migration Ready!

I've created a corrected migration that works with your existing database schema. Here's what to do:

## 📋 Step 1: Run the Corrected Migration

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Fixed Notification System Migration
-- This migration works with existing user_profiles schema that uses 'id' instead of 'user_id'

-- ================================================================
-- 1. USER NOTIFICATION PREFERENCES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferred_time TEXT DEFAULT '09:00', -- Format: "HH:MM"
  timezone TEXT DEFAULT 'UTC',
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  notification_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ================================================================
-- 2. ADD EXPERIENCE_LEVEL TO EXISTING USER_PROFILES TABLE
-- ================================================================
-- Add experience_level column to existing user_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'experience_level'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'));
    END IF;
END $$;

-- ================================================================
-- 3. PUSH SUBSCRIPTIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. NOTIFICATION HISTORY TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'push', 'reminder', 'achievement', 'daily_spiritual_message')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read')),
  metadata JSONB DEFAULT '{}'
);

-- ================================================================
-- 5. PRAYER REMINDERS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS prayer_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  verse TEXT,
  verse_reference TEXT,
  time TEXT NOT NULL, -- Format: "HH:MM"
  days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}', -- Days of week (0=Sunday)
  is_active BOOLEAN DEFAULT TRUE,
  notification_type TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_active ON user_notification_preferences(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_sent_at ON user_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_status ON user_notifications(status);
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_user_id ON prayer_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_active ON prayer_reminders(is_active);

-- ================================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_reminders ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- CREATE RLS POLICIES
-- ================================================================

-- User notification preferences policies
CREATE POLICY "Users can view their own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User notifications policies
CREATE POLICY "Users can view their own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Prayer reminders policies
CREATE POLICY "Users can view their own prayer reminders" ON prayer_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own prayer reminders" ON prayer_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prayer reminders" ON prayer_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer reminders" ON prayer_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- CREATE FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_notification_preferences_updated_at 
  BEFORE UPDATE ON user_notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prayer_reminders_updated_at 
  BEFORE UPDATE ON prayer_reminders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🔑 Step 2: Set Environment Variables

Add these to your `.env` file:

```env
# Push Notification VAPID Keys (Required)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key_here

# Email Service (Optional - for fallbacks)
BREVO_API_KEY=your_brevo_api_key_here
```

## 📱 Step 3: Deploy Edge Functions

```bash
supabase functions deploy daily-notifications
supabase functions deploy send-push-notification
```

## 🧪 Step 4: Test the System

1. **Open your app** and sign in
2. **Go to Settings** → **Notifications**
3. **Click "🧪 Send Test Notification"**

You should now see:
- **Supported: ✅**
- **Permission: granted**
- **Active: ✅**
- **✅ Test notification sent successfully!**

## 🎯 What's Fixed

✅ **Database Schema**: Now works with your existing `user_profiles` table using `id` instead of `user_id`
✅ **Edge Functions**: Updated to query the correct schema
✅ **RealNotificationService**: Fixed to work with existing database structure
✅ **RLS Policies**: Properly configured for your schema
✅ **Error Handling**: Better error messages and fallbacks

The notification system should now work perfectly with your existing database! 🙏

















