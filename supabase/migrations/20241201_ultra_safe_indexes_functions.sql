-- ================================================================
-- CHRISTIANKIT ULTRA SAFE INDEXES AND FUNCTIONS
-- Only creates indexes for basic columns that definitely exist
-- ================================================================

-- ================================================================
-- CREATE BASIC INDEXES ONLY
-- ================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Follow relationship indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

-- Post interactions indexes
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON post_interactions(user_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Prayer system indexes
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_user_id ON prayer_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);

-- Push notification indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- Game scores indexes
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);

-- ================================================================
-- CREATE ESSENTIAL FUNCTIONS
-- ================================================================

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update interaction counts on community posts
CREATE OR REPLACE FUNCTION public.update_post_interaction_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET 
      amens_count = CASE WHEN NEW.interaction_type = 'amen' THEN amens_count + 1 ELSE amens_count END,
      loves_count = CASE WHEN NEW.interaction_type = 'love' THEN loves_count + 1 ELSE loves_count END,
      prayers_count = CASE WHEN NEW.interaction_type = 'prayer' THEN prayers_count + 1 ELSE prayers_count END,
      updated_at = NOW()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET 
      amens_count = CASE WHEN OLD.interaction_type = 'amen' THEN GREATEST(amens_count - 1, 0) ELSE amens_count END,
      loves_count = CASE WHEN OLD.interaction_type = 'love' THEN GREATEST(loves_count - 1, 0) ELSE loves_count END,
      prayers_count = CASE WHEN OLD.interaction_type = 'prayer' THEN GREATEST(prayers_count - 1, 0) ELSE prayers_count END,
      updated_at = NOW()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for interaction counts
DROP TRIGGER IF EXISTS post_interaction_counts_trigger ON post_interactions;
CREATE TRIGGER post_interaction_counts_trigger
  AFTER INSERT OR DELETE ON post_interactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_post_interaction_counts();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at 
  BEFORE UPDATE ON community_posts 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prayer_reminders_updated_at ON prayer_reminders;
CREATE TRIGGER update_prayer_reminders_updated_at 
  BEFORE UPDATE ON prayer_reminders 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

SELECT 'ChristianKit basic indexes and functions added successfully! ⚡' as message;
