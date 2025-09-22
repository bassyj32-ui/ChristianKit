-- Daily Notification Automation Setup
-- Run this in your Supabase SQL Editor

-- Step 1: Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create automation logs table for monitoring
CREATE TABLE IF NOT EXISTS automation_logs (
  id BIGSERIAL PRIMARY KEY,
  job_type TEXT NOT NULL,
  run_time TIMESTAMPTZ DEFAULT NOW(),
  users_processed INTEGER DEFAULT 0,
  notifications_sent INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on automation logs
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for service role
DROP POLICY IF EXISTS "Service role can manage automation logs" ON automation_logs;
CREATE POLICY "Service role can manage automation logs" ON automation_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Step 3: Set your service role key (REPLACE WITH YOUR ACTUAL KEY)
-- Get your service role key from: https://supabase.com/dashboard/project/hrznuhcwdjnpasfnqqwp/settings/api
-- ALTER DATABASE postgres SET app.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_KEY_HERE';

-- Step 4: Create the daily cron job
-- This will run every day at 8:00 AM UTC
SELECT cron.schedule(
    'daily-notifications-christiankit',
    '0 8 * * *',  -- Every day at 8:00 AM UTC
    $$
    SELECT net.http_post(
        url := 'https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
        body := '{"automated": true}'
    );
    $$
);

-- Step 5: Create additional cron jobs for different timezones (optional)
-- 8 AM Eastern Time (1 PM UTC)
SELECT cron.schedule(
    'daily-notifications-est',
    '0 13 * * *',
    $$
    SELECT net.http_post(
        url := 'https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
        body := '{"automated": true, "timezone": "EST"}'
    );
    $$
);

-- 8 AM Pacific Time (4 PM UTC)
SELECT cron.schedule(
    'daily-notifications-pst',
    '0 16 * * *',
    $$
    SELECT net.http_post(
        url := 'https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
        body := '{"automated": true, "timezone": "PST"}'
    );
    $$
);

-- Step 6: Verify cron jobs were created
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job 
WHERE jobname LIKE 'daily-notifications%'
ORDER BY jobname;




