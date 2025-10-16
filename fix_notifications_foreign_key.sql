-- =================================================================
-- FIX NOTIFICATIONS TABLE FOREIGN KEY CONSTRAINT
-- =================================================================
-- This script fixes the foreign key constraint issue in the notifications table

-- =================================================================
-- STEP 1: CHECK CURRENT NOTIFICATIONS TABLE STRUCTURE
-- =================================================================

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- =================================================================
-- STEP 2: FIX THE USER_ID COLUMN AND CONSTRAINT
-- =================================================================

-- Drop the existing foreign key constraint if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Modify the user_id column to ensure it's UUID type and references profiles(id)
-- First, drop the column if it exists and recreate it properly
ALTER TABLE notifications DROP COLUMN IF EXISTS user_id CASCADE;

-- Add the user_id column with proper UUID type and foreign key constraint
ALTER TABLE notifications ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- =================================================================
-- STEP 3: ENSURE ALL EXPECTED COLUMNS EXIST
-- =================================================================

-- Add any missing columns that the app expects
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- =================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

-- User notifications lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Created date for sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Unread notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- =================================================================
-- STEP 5: TEST THE FIX
-- =================================================================

-- Test 1: Check the table structure
SELECT 'notifications' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Test 2: Try to insert a test notification (this should work now)
-- INSERT INTO notifications (user_id, type, title, message)
-- VALUES ('8c99984a-6178-45f0-a847-2c8e00328f8a', 'test', 'FK Test', 'Testing foreign key fix');

-- =================================================================
-- IMPORTANT NOTES:
-- =================================================================
-- 1. This fixes the "violates foreign key constraint" error
-- 2. The user_id column now properly references profiles(id)
-- 3. All expected columns are present for your app to work
-- 4. Proper indexes are in place for performance

-- Run this entire script in your Supabase SQL Editor










