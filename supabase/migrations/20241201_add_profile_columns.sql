-- ================================================================
-- ADD MISSING PROFILE COLUMNS
-- ================================================================

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS custom_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS banner_image TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create index on custom_links for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_custom_links ON profiles USING GIN (custom_links);

-- Update existing profiles to have default values
UPDATE profiles 
SET custom_links = '[]'::jsonb 
WHERE custom_links IS NULL;

SELECT 'Profile columns added successfully! 🎉' as message;
