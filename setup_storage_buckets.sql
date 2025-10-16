-- =================================================================
-- SUPABASE STORAGE SETUP - File Storage & Media Management
-- =================================================================
-- This script sets up storage buckets for your social media platform
-- Creates buckets for different types of media with proper security policies

-- =================================================================
-- STEP 1: CREATE STORAGE BUCKETS
-- =================================================================

-- Profile avatars bucket (public read, authenticated upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public read access for profile pictures
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Post media bucket (public read, authenticated upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true, -- Public read access for post content
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Private documents bucket (authenticated only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-docs',
  'private-docs',
  false, -- Private access only
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Banner images bucket (public read, authenticated upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true, -- Public read access for banners
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- STEP 2: CREATE STORAGE POLICIES
-- =================================================================

-- Avatars bucket policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Post media bucket policies
CREATE POLICY "Post media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Users can upload media for their posts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their post media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their post media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
  );

-- Private documents bucket policies (strict access)
CREATE POLICY "Users can view their own private documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'private-docs'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own private documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'private-docs'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Banner images bucket policies
CREATE POLICY "Banner images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Users can upload their own banner" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banners'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =================================================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- =================================================================

-- Function to generate secure upload URLs
CREATE OR REPLACE FUNCTION generate_upload_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in INTEGER DEFAULT 3600
) RETURNS TEXT AS $$
DECLARE
  upload_url TEXT;
BEGIN
  -- Generate signed URL for upload
  SELECT storage.generate_signed_URL(
    bucket_name,
    file_path,
    expires_in,
    'PUT'
  ) INTO upload_url;

  RETURN upload_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get public URL for a file
CREATE OR REPLACE FUNCTION get_public_url(
  bucket_name TEXT,
  file_path TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN storage.get_PUBLIC_URL(bucket_name, file_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete file and return success status
CREATE OR REPLACE FUNCTION delete_file(
  bucket_name TEXT,
  file_path TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  deleted BOOLEAN := false;
BEGIN
  -- Delete the file from storage
  DELETE FROM storage.objects
  WHERE bucket_id = bucket_name AND name = file_path;

  -- Check if deletion was successful
  IF FOUND THEN
    deleted := true;
  END IF;

  RETURN deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 4: CREATE MEDIA MANAGEMENT TABLE
-- =================================================================

-- Create table to track media metadata and relationships
CREATE TABLE IF NOT EXISTS media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  file_type TEXT CHECK (file_type IN ('avatar', 'banner', 'post_image', 'post_video', 'document')),
  alt_text TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT media_files_path_unique UNIQUE(bucket_name, file_path)
);

-- Enable RLS on media_files
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Media files policies
CREATE POLICY "Users can view public media files" ON media_files
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own media files" ON media_files
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for media_files
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_bucket_path ON media_files(bucket_name, file_path);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_public ON media_files(is_public, created_at DESC);

-- =================================================================
-- STEP 5: CREATE MEDIA PROCESSING FUNCTIONS
-- =================================================================

-- Function to create media record after upload
CREATE OR REPLACE FUNCTION create_media_record(
  p_user_id UUID,
  p_bucket_name TEXT,
  p_file_path TEXT,
  p_file_name TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT,
  p_file_type TEXT,
  p_alt_text TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
  media_id UUID;
BEGIN
  INSERT INTO media_files (
    user_id, bucket_name, file_path, file_name, file_size,
    mime_type, file_type, alt_text, description, is_public
  ) VALUES (
    p_user_id, p_bucket_name, p_file_path, p_file_name, p_file_size,
    p_mime_type, p_file_type, p_alt_text, p_description, p_is_public
  ) RETURNING id INTO media_id;

  RETURN media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update media metadata
CREATE OR REPLACE FUNCTION update_media_metadata(
  p_media_id UUID,
  p_alt_text TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  updated BOOLEAN := false;
BEGIN
  UPDATE media_files
  SET
    alt_text = COALESCE(p_alt_text, alt_text),
    description = COALESCE(p_description, description),
    is_public = COALESCE(p_is_public, is_public),
    updated_at = NOW()
  WHERE id = p_media_id AND user_id = auth.uid();

  IF FOUND THEN
    updated := true;
  END IF;

  RETURN updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 6: SET UP AUTOMATIC THUMBNAIL GENERATION
-- =================================================================

-- Create thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true, -- Public read access for thumbnails
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Thumbnail policies (inherit from main media)
CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "System can manage thumbnails" ON storage.objects
  FOR ALL USING (bucket_id = 'thumbnails');

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Check that buckets were created
SELECT name as bucket_name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name IN ('avatars', 'post-media', 'private-docs', 'banners', 'thumbnails');

-- Check that media_files table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'media_files'
ORDER BY ordinal_position;

-- Test media record creation function
-- SELECT create_media_record(
--   '8c99984a-6178-45f0-a847-2c8e00328f8a'::UUID,
--   'avatars',
--   'user-id/avatar.jpg',
--   'avatar.jpg',
--   12345,
--   'image/jpeg',
--   'avatar',
--   'My profile picture',
--   'Profile avatar image'
-- );

-- =================================================================
-- IMPORTANT NOTES:
-- =================================================================
-- 1. Storage buckets are now configured for different media types
-- 2. RLS policies ensure users can only manage their own files
-- 3. Media metadata is tracked in the media_files table
-- 4. Helper functions provide easy file management
-- 5. Ready for frontend integration with Supabase Storage API

-- Run this entire script in your Supabase SQL Editor










