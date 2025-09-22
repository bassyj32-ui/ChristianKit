-- Cron Job Setup for Daily Notifications
-- This sets up the cron job to run every hour and trigger daily notifications

-- Enable the pg_cron extension (if not already enabled)
-- Note: This requires superuser privileges and may need to be done by your Supabase admin
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the daily notifications edge function
CREATE OR REPLACE FUNCTION trigger_daily_notifications()
RETURNS void AS $$
DECLARE
  response jsonb;
BEGIN
  -- Call the daily notifications edge function
  SELECT content::jsonb INTO response
  FROM http((
    'POST',
    'https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  ));
  
  -- Log the response
  INSERT INTO notification_logs (user_id, notification_type, title, message, delivery_method, success, error_message)
  VALUES (
    NULL, -- System log
    'cron_trigger',
    'Daily Notifications Cron',
    'Cron job executed: ' || COALESCE(response->>'notifications_sent', '0') || ' notifications sent',
    'system',
    (response->>'success')::boolean,
    response->>'error'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO notification_logs (user_id, notification_type, title, message, delivery_method, success, error_message)
  VALUES (
    NULL,
    'cron_trigger',
    'Daily Notifications Cron Error',
    'Cron job failed',
    'system',
    false,
    SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule the cron job to run every hour
-- Note: This requires the pg_cron extension to be enabled
-- SELECT cron.schedule('daily-notifications', '0 * * * *', 'SELECT trigger_daily_notifications();');

-- Alternative: Create a simpler version that can be called manually or via external cron
CREATE OR REPLACE FUNCTION manual_daily_notifications()
RETURNS jsonb AS $$
DECLARE
  response jsonb;
BEGIN
  -- This function can be called manually or by external cron services
  SELECT content::jsonb INTO response
  FROM http((
    'POST',
    'https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  ));
  
  RETURN response;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_daily_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_daily_notifications() TO authenticated;

-- Create a view to monitor notification status
CREATE OR REPLACE VIEW notification_status AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE push_enabled = true AND is_active = true) as push_enabled_users,
  COUNT(*) FILTER (WHERE email_enabled = true AND is_active = true) as email_enabled_users,
  COUNT(*) FILTER (WHERE last_notification_sent >= CURRENT_DATE) as users_notified_today,
  AVG(notification_count) as avg_notifications_sent
FROM user_notification_preferences;

-- Grant access to the view
GRANT SELECT ON notification_status TO authenticated;

-- Instructions for setting up external cron (if pg_cron is not available):
/*
1. Set up a cron job on your server or use a service like:
   - GitHub Actions (free)
   - Vercel Cron Jobs
   - Railway Cron
   - Heroku Scheduler

2. The cron job should make a POST request to:
   https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications
   
   With headers:
   - Authorization: Bearer YOUR_SERVICE_ROLE_KEY
   - Content-Type: application/json

3. Schedule it to run every hour:
   0 * * * * curl -X POST https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"

4. Or use the manual function:
   SELECT manual_daily_notifications();
*/


