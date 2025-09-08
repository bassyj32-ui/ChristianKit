-- ================================================================
-- CHRISTIANKIT ADD FOREIGN KEYS
-- Run this AFTER the basic tables are created
-- ================================================================

-- ================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ================================================================

-- Profiles table foreign key
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User follows table foreign keys
ALTER TABLE user_follows ADD CONSTRAINT user_follows_follower_id_fkey 
  FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_follows ADD CONSTRAINT user_follows_following_id_fkey 
  FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint for user follows
ALTER TABLE user_follows ADD CONSTRAINT user_follows_unique 
  UNIQUE(follower_id, following_id);

-- Community posts table foreign key
ALTER TABLE community_posts ADD CONSTRAINT community_posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Post interactions table foreign keys
ALTER TABLE post_interactions ADD CONSTRAINT post_interactions_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE;
ALTER TABLE post_interactions ADD CONSTRAINT post_interactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint for post interactions
ALTER TABLE post_interactions ADD CONSTRAINT post_interactions_unique 
  UNIQUE(post_id, user_id, interaction_type);

-- Notifications table foreign key
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notification preferences table foreign key
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Prayer reminders table foreign key
ALTER TABLE prayer_reminders ADD CONSTRAINT prayer_reminders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Prayer sessions table foreign keys
ALTER TABLE prayer_sessions ADD CONSTRAINT prayer_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE prayer_sessions ADD CONSTRAINT prayer_sessions_reminder_id_fkey 
  FOREIGN KEY (reminder_id) REFERENCES prayer_reminders(id) ON DELETE SET NULL;

-- Prayer notification logs table foreign key
ALTER TABLE prayer_notification_logs ADD CONSTRAINT prayer_notification_logs_reminder_id_fkey 
  FOREIGN KEY (reminder_id) REFERENCES prayer_reminders(id) ON DELETE CASCADE;

-- Push subscriptions table foreign key
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint for push subscriptions
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_unique 
  UNIQUE(user_id);

-- FCM tokens table foreign key
ALTER TABLE fcm_tokens ADD CONSTRAINT fcm_tokens_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint for FCM tokens
ALTER TABLE fcm_tokens ADD CONSTRAINT fcm_tokens_unique 
  UNIQUE(user_id);

-- Game scores table foreign key
ALTER TABLE game_scores ADD CONSTRAINT game_scores_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

SELECT 'ChristianKit foreign keys added successfully! 🔗' as message;
