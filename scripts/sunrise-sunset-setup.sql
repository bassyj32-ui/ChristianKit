-- Sunrise/Sunset Prayer Timing Setup for ChristianKit
-- This script creates the necessary database tables and policies for location-based prayer timing

-- Create user_locations table
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DECIMAL(11, 8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  city TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  location_accuracy DECIMAL(5, 2), -- in meters
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_coordinates ON user_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_locations_timezone ON user_locations(timezone);
CREATE INDEX IF NOT EXISTS idx_user_locations_active ON user_locations(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_user_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_locations_updated_at ON user_locations;
CREATE TRIGGER update_user_locations_updated_at
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_locations_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own location
DROP POLICY IF EXISTS "Users can view their own location" ON user_locations;
CREATE POLICY "Users can view their own location"
  ON user_locations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own location
DROP POLICY IF EXISTS "Users can insert their own location" ON user_locations;
CREATE POLICY "Users can insert their own location"
  ON user_locations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own location
DROP POLICY IF EXISTS "Users can update their own location" ON user_locations;
CREATE POLICY "Users can update their own location"
  ON user_locations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all locations (for prayer timing calculations)
DROP POLICY IF EXISTS "Service role can manage all user locations" ON user_locations;
CREATE POLICY "Service role can manage all user locations"
  ON user_locations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create prayer_times table for storing calculated prayer times
CREATE TABLE IF NOT EXISTS prayer_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  prayer_type TEXT NOT NULL CHECK (prayer_type IN ('morning', 'sunrise', 'midmorning', 'noon', 'midafternoon', 'sunset', 'evening', 'compline')),
  prayer_name TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  actual_time TIME,
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for prayer_times
CREATE INDEX IF NOT EXISTS idx_prayer_times_user_id ON prayer_times(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_times_date ON prayer_times(date);
CREATE INDEX IF NOT EXISTS idx_prayer_times_type ON prayer_times(prayer_type);
CREATE INDEX IF NOT EXISTS idx_prayer_times_scheduled_time ON prayer_times(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_prayer_times_completed ON prayer_times(is_completed);

-- Create unique constraint for user, date, and prayer type
ALTER TABLE prayer_times ADD CONSTRAINT unique_user_prayer_date 
  UNIQUE (user_id, date, prayer_type);

-- Enable RLS for prayer_times
ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prayer_times
-- Users can view their own prayer times
DROP POLICY IF EXISTS "Users can view their own prayer times" ON prayer_times;
CREATE POLICY "Users can view their own prayer times"
  ON prayer_times
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own prayer times (mark as completed)
DROP POLICY IF EXISTS "Users can update their own prayer times" ON prayer_times;
CREATE POLICY "Users can update their own prayer times"
  ON prayer_times
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all prayer times
DROP POLICY IF EXISTS "Service role can manage all prayer times" ON prayer_times;
CREATE POLICY "Service role can manage all prayer times"
  ON prayer_times
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger for prayer_times
CREATE OR REPLACE FUNCTION update_prayer_times_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for prayer_times updated_at
DROP TRIGGER IF EXISTS update_prayer_times_updated_at ON prayer_times;
CREATE TRIGGER update_prayer_times_updated_at
  BEFORE UPDATE ON prayer_times
  FOR EACH ROW
  EXECUTE FUNCTION update_prayer_times_updated_at();

-- Create prayer_preferences table for user prayer timing preferences
CREATE TABLE IF NOT EXISTS prayer_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  use_sunrise_sunset BOOLEAN DEFAULT true,
  custom_morning_time TIME DEFAULT '06:00:00',
  custom_evening_time TIME DEFAULT '18:00:00',
  prayer_reminder_tolerance INTEGER DEFAULT 15, -- minutes before/after prayer time
  enable_ancient_traditions BOOLEAN DEFAULT true,
  enable_gregorian_chants BOOLEAN DEFAULT false,
  enable_whispered_scripture BOOLEAN DEFAULT true,
  enable_gentle_bells BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '06:00:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for prayer_preferences
CREATE OR REPLACE FUNCTION update_prayer_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for prayer_preferences updated_at
DROP TRIGGER IF EXISTS update_prayer_preferences_updated_at ON prayer_preferences;
CREATE TRIGGER update_prayer_preferences_updated_at
  BEFORE UPDATE ON prayer_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_prayer_preferences_updated_at();

-- Enable RLS for prayer_preferences
ALTER TABLE prayer_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prayer_preferences
-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view their own prayer preferences" ON prayer_preferences;
CREATE POLICY "Users can view their own prayer preferences"
  ON prayer_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert their own prayer preferences" ON prayer_preferences;
CREATE POLICY "Users can insert their own prayer preferences"
  ON prayer_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update their own prayer preferences" ON prayer_preferences;
CREATE POLICY "Users can update their own prayer preferences"
  ON prayer_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all preferences
DROP POLICY IF EXISTS "Service role can manage all prayer preferences" ON prayer_preferences;
CREATE POLICY "Service role can manage all prayer preferences"
  ON prayer_preferences
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert default prayer preferences for existing users
INSERT INTO prayer_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM prayer_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Create a view for active prayer times with user info
CREATE OR REPLACE VIEW active_prayer_times AS
SELECT 
  pt.id,
  pt.user_id,
  pt.date,
  pt.prayer_type,
  pt.prayer_name,
  pt.scheduled_time,
  pt.actual_time,
  pt.is_completed,
  pt.is_active,
  ul.latitude,
  ul.longitude,
  ul.timezone,
  ul.city,
  ul.country,
  pp.use_sunrise_sunset,
  pp.prayer_reminder_tolerance,
  pp.enable_ancient_traditions,
  pp.enable_gregorian_chants,
  pp.enable_whispered_scripture,
  pp.enable_gentle_bells
FROM prayer_times pt
JOIN user_locations ul ON pt.user_id = ul.user_id
LEFT JOIN prayer_preferences pp ON pt.user_id = pp.user_id
WHERE pt.is_active = true AND ul.is_active = true;

-- Create function to get next prayer time for a user
CREATE OR REPLACE FUNCTION get_next_prayer_time(user_uuid UUID)
RETURNS TABLE (
  prayer_id UUID,
  prayer_type TEXT,
  prayer_name TEXT,
  scheduled_time TIME,
  minutes_until INTEGER,
  is_today BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.prayer_type,
    pt.prayer_name,
    pt.scheduled_time,
    EXTRACT(EPOCH FROM (pt.scheduled_time - CURRENT_TIME)) / 60 AS minutes_until,
    pt.date = CURRENT_DATE AS is_today
  FROM prayer_times pt
  WHERE pt.user_id = user_uuid 
    AND pt.is_active = true
    AND (
      (pt.date = CURRENT_DATE AND pt.scheduled_time > CURRENT_TIME) OR
      (pt.date > CURRENT_DATE)
    )
  ORDER BY pt.date ASC, pt.scheduled_time ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_next_prayer_time(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_prayer_time(UUID) TO service_role;

-- Create function to mark prayer as completed
CREATE OR REPLACE FUNCTION mark_prayer_completed(prayer_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prayer_exists BOOLEAN;
BEGIN
  -- Check if prayer exists and belongs to current user
  SELECT EXISTS(
    SELECT 1 FROM prayer_times 
    WHERE id = prayer_uuid AND user_id = auth.uid()
  ) INTO prayer_exists;
  
  IF NOT prayer_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Update prayer time
  UPDATE prayer_times 
  SET 
    is_completed = true,
    actual_time = CURRENT_TIME,
    updated_at = NOW()
  WHERE id = prayer_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION mark_prayer_completed(UUID) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON prayer_times TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON prayer_preferences TO authenticated;
GRANT SELECT ON active_prayer_times TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_prayer_time(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_prayer_completed(UUID) TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON user_locations TO service_role;
GRANT ALL ON prayer_times TO service_role;
GRANT ALL ON prayer_preferences TO service_role;
GRANT SELECT ON active_prayer_times TO service_role;

-- Log the setup completion (commented out since system_logs table doesn't exist yet)
-- INSERT INTO system_logs (event_type, details) 
-- VALUES (
--   'sunrise_sunset_setup',
--   jsonb_build_object(
--     'timestamp', NOW(),
--     'version', '1.0.0',
--     'tables_created', ARRAY['user_locations', 'prayer_times', 'prayer_preferences'],
--     'policies_created', 12,
--     'functions_created', 3,
--     'view_created', 'active_prayer_times',
--     'features', ARRAY['sunrise_sunset_timing', 'ancient_prayer_traditions', 'location_based_timing']
--   )
-- ) ON CONFLICT DO NOTHING;

-- Output completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Sunrise/Sunset Prayer Timing setup completed successfully!';
  RAISE NOTICE '🌅 Tables created: user_locations, prayer_times, prayer_preferences';
  RAISE NOTICE '🔐 RLS policies configured for security';
  RAISE NOTICE '👥 View created: active_prayer_times';
  RAISE NOTICE '⚙️ Functions created: get_next_prayer_time, mark_prayer_completed';
  RAISE NOTICE '🚀 Your app now supports ancient prayer traditions with modern timing!';
  RAISE NOTICE '📱 Users can sync with local sunrise/sunset for authentic prayer times!';
END $$;
