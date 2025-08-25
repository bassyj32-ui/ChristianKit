-- Add notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  preferred_time TIME DEFAULT '09:00:00',
  intensity TEXT DEFAULT 'motivating' CHECK (intensity IN ('gentle', 'motivating', 'aggressive')),
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'twice_daily', 'hourly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Add notification history table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'push', 'reminder', 'achievement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read')),
  metadata JSONB -- Store additional data like email provider response, etc.
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_sent_at ON user_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_status ON user_notifications(status);

-- Enable Row Level Security
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON user_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to notify when achievement is unlocked
CREATE OR REPLACE FUNCTION notify_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification when achievement is unlocked
  INSERT INTO user_notifications (user_id, notification_type, title, message, metadata)
  VALUES (
    NEW.user_id, 
    'achievement', 
    '🎉 New Achievement Unlocked!', 
    'Congratulations! You earned: ' || NEW.achievement_name,
    jsonb_build_object('achievement_id', NEW.id, 'achievement_type', NEW.achievement_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for achievement notifications
CREATE TRIGGER achievement_notification
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_achievement();
