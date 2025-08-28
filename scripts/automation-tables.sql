-- 🚀 ChristianKit Automation Tables Setup
-- Run this in your Supabase Dashboard → SQL Editor

-- Step 1: Create email_triggers table for tracking email automation
CREATE TABLE IF NOT EXISTS email_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('welcome', 'prayer_reminder', 'bible_reminder', 'achievement', 'goal_met', 'weekly_report')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Step 2: Create user_email_preferences table for user email settings
CREATE TABLE IF NOT EXISTS user_email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  welcome_emails BOOLEAN DEFAULT true,
  daily_reminders BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT true,
  achievement_emails BOOLEAN DEFAULT true,
  goal_emails BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'UTC',
  preferred_time TIME DEFAULT '09:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create reminder_schedules table for user reminder preferences
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('prayer', 'bible', 'meditation', 'journal')),
  time_of_day TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  days_of_week TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one schedule per user per reminder type
  UNIQUE(user_id, reminder_type)
);

-- Step 4: Create reminder_logs table for tracking reminder delivery
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  delivery_method TEXT NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'push', 'both')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_triggers_user_id ON email_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_triggers_status ON email_triggers(status);
CREATE INDEX IF NOT EXISTS idx_email_triggers_scheduled ON email_triggers(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_user_id ON user_email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_user_id ON reminder_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_active ON reminder_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id ON reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_status ON reminder_logs(status);

-- Step 6: Enable Row Level Security on all tables
ALTER TABLE email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for email_triggers
CREATE POLICY "Users can view their own email triggers" ON email_triggers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email triggers" ON email_triggers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email triggers" ON email_triggers
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 8: Create RLS policies for user_email_preferences
CREATE POLICY "Users can view their own email preferences" ON user_email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences" ON user_email_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" ON user_email_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 9: Create RLS policies for reminder_schedules
CREATE POLICY "Users can view their own reminder schedules" ON reminder_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder schedules" ON reminder_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder schedules" ON reminder_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminder schedules" ON reminder_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create RLS policies for reminder_logs
CREATE POLICY "Users can view their own reminder logs" ON reminder_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder logs" ON reminder_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 11: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 12: Create triggers for updated_at
CREATE TRIGGER update_user_email_preferences_updated_at BEFORE UPDATE ON user_email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_schedules_updated_at BEFORE UPDATE ON reminder_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Insert default email preferences for existing users
INSERT INTO user_email_preferences (user_id, welcome_emails, daily_reminders, weekly_reports, achievement_emails, goal_emails)
SELECT 
  id as user_id,
  true as welcome_emails,
  true as daily_reminders,
  true as weekly_reports,
  true as achievement_emails,
  true as goal_emails
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Step 14: Insert default reminder schedules for existing users
INSERT INTO reminder_schedules (user_id, reminder_type, time_of_day, timezone, is_active, days_of_week)
SELECT 
  id as user_id,
  'prayer' as reminder_type,
  '09:00'::time as time_of_day,
  'UTC' as timezone,
  true as is_active,
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as days_of_week
FROM auth.users
ON CONFLICT (user_id, reminder_type) DO NOTHING;

-- Step 15: Verify setup
SELECT 
  'email_triggers' as table_name,
  COUNT(*) as row_count
FROM email_triggers
UNION ALL
SELECT 
  'user_email_preferences' as table_name,
  COUNT(*) as row_count
FROM user_email_preferences
UNION ALL
SELECT 
  'reminder_schedules' as table_name,
  COUNT(*) as row_count
FROM reminder_schedules
UNION ALL
SELECT 
  'reminder_logs' as table_name,
  COUNT(*) as row_count
FROM reminder_logs;

-- ✅ Automation tables setup complete!
-- Now your email and reminder services can track and manage user preferences!

