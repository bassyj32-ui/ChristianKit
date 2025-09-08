-- Notification System Database Schema for ChristianKit

-- FCM Tokens table to store Firebase Cloud Messaging tokens
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Push Subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Notification Preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  prayer_reminders BOOLEAN DEFAULT true,
  community_updates BOOLEAN DEFAULT true,
  daily_motivation BOOLEAN DEFAULT true,
  weekly_progress BOOLEAN DEFAULT false,
  bible_study BOOLEAN DEFAULT true,
  preferred_time TIME DEFAULT '09:00:00',
  reminder_intensity TEXT DEFAULT 'gentle' CHECK (reminder_intensity IN ('gentle', 'motivating', 'aggressive')),
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled Notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('prayer', 'bible', 'meditation', 'journal', 'reminder', 'achievement')),
  data JSON DEFAULT '{}',
  scheduled_for TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Notifications Log
CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('prayer', 'bible', 'meditation', 'journal', 'reminder', 'achievement')),
  data JSON DEFAULT '{}',
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered', 'clicked')),
  delivery_method TEXT DEFAULT 'push' CHECK (delivery_method IN ('push', 'email', 'sms')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('prayer', 'bible', 'meditation', 'journal', 'reminder', 'achievement')),
  variables JSON DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO notification_templates (name, title, body, notification_type, variables) VALUES
('daily_prayer_reminder', '🙏 Prayer Time', 'Hello {{user_name}}! It''s time for your daily prayer session. Take a moment to connect with God.', 'prayer', '{"user_name": "string"}'),
('daily_bible_reminder', '📖 Bible Reading Time', 'Hello {{user_name}}! Ready to dive into God''s Word today?', 'bible', '{"user_name": "string"}'),
('daily_meditation_reminder', '🧘 Meditation Time', 'Hello {{user_name}}! Find peace in God''s presence with your daily meditation.', 'meditation', '{"user_name": "string"}'),
('daily_journal_reminder', '📝 Journaling Time', 'Hello {{user_name}}! Reflect on your spiritual journey today.', 'journal', '{"user_name": "string"}'),
('achievement_unlocked', '🎉 Achievement Unlocked!', 'Congratulations {{user_name}}! You''ve unlocked: {{achievement_name}}', 'achievement', '{"user_name": "string", "achievement_name": "string"}'),
('streak_milestone', '🔥 Streak Milestone!', 'Amazing {{user_name}}! You''ve maintained your {{activity}} streak for {{days}} days!', 'achievement', '{"user_name": "string", "activity": "string", "days": "number"}')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_sent_at ON user_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);

-- Functions for notification management
CREATE OR REPLACE FUNCTION get_user_notification_count(user_id_param TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM user_notifications 
    WHERE user_id = user_id_param AND status = 'sent'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_unread_notification_count(user_id_param TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM user_notifications 
    WHERE user_id = user_id_param AND status = 'sent' AND data->>'read' IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_notifications_updated_at
  BEFORE UPDATE ON scheduled_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE fcm_tokens IS 'Stores Firebase Cloud Messaging tokens for push notifications';
COMMENT ON TABLE push_subscriptions IS 'Stores web push notification subscriptions';
COMMENT ON TABLE user_notification_preferences IS 'User preferences for notification types and timing';
COMMENT ON TABLE scheduled_notifications IS 'Notifications scheduled for future delivery';
COMMENT ON TABLE user_notifications IS 'Log of all notifications sent to users';
COMMENT ON TABLE notification_templates IS 'Reusable notification message templates';
 









