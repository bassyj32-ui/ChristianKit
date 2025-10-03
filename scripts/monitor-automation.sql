-- Monitor Daily Automation Performance
-- Run these queries in Supabase SQL Editor to check automation status

-- 1. Check if cron jobs are active and scheduled correctly
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    database,
    username,
    command
FROM cron.job 
WHERE jobname LIKE 'daily-notifications%'
ORDER BY jobname;

-- 2. Check recent cron job executions
SELECT 
    jr.jobid,
    j.jobname,
    jr.runid,
    jr.job_pid,
    jr.database,
    jr.username,
    jr.command,
    jr.status,
    jr.return_message,
    jr.start_time,
    jr.end_time,
    EXTRACT(EPOCH FROM (jr.end_time - jr.start_time)) as duration_seconds
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname LIKE 'daily-notifications%'
ORDER BY jr.start_time DESC
LIMIT 20;

-- 3. Check automation logs (if you've added logging to your function)
SELECT 
    job_type,
    run_time,
    users_processed,
    notifications_sent,
    errors,
    ROUND(
        CASE 
            WHEN (notifications_sent + errors) > 0 
            THEN (notifications_sent::numeric / (notifications_sent + errors)) * 100 
            ELSE 0 
        END, 2
    ) as success_rate_percent,
    metadata
FROM automation_logs 
WHERE job_type = 'daily_notifications'
ORDER BY run_time DESC
LIMIT 10;

-- 4. Daily summary of notifications sent
SELECT 
    DATE(run_time) as date,
    COUNT(*) as automation_runs,
    SUM(users_processed) as total_users_processed,
    SUM(notifications_sent) as total_notifications_sent,
    SUM(errors) as total_errors,
    ROUND(
        AVG(
            CASE 
                WHEN (notifications_sent + errors) > 0 
                THEN (notifications_sent::numeric / (notifications_sent + errors)) * 100 
                ELSE 0 
            END
        ), 2
    ) as avg_success_rate_percent
FROM automation_logs 
WHERE job_type = 'daily_notifications'
  AND run_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE(run_time)
ORDER BY date DESC;

-- 5. Check for failed cron job runs
SELECT 
    jr.jobid,
    j.jobname,
    jr.status,
    jr.return_message,
    jr.start_time,
    jr.command
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname LIKE 'daily-notifications%'
  AND jr.status != 'succeeded'
ORDER BY jr.start_time DESC
LIMIT 10;

-- 6. Check user notification preferences to understand potential reach
SELECT 
    COUNT(*) as total_users_with_preferences,
    COUNT(CASE WHEN daily_spiritual_messages = true THEN 1 END) as users_with_daily_enabled,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN daily_spiritual_messages = true AND is_active = true THEN 1 END) as eligible_for_notifications,
    ROUND(
        (COUNT(CASE WHEN daily_spiritual_messages = true AND is_active = true THEN 1 END)::numeric / 
         COUNT(*)::numeric) * 100, 2
    ) as eligible_percentage
FROM user_notification_preferences;

-- 7. Recent notifications sent to users
SELECT 
    n.user_id,
    n.notification_type,
    n.title,
    n.status,
    n.created_at,
    up.experience_level
FROM user_notifications n
JOIN user_profiles up ON up.id = n.user_id
WHERE n.notification_type = 'daily_spiritual_message'
  AND n.created_at >= NOW() - INTERVAL '7 days'
ORDER BY n.created_at DESC
LIMIT 20;





















