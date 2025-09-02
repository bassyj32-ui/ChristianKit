-- 🚀 ChristianKit Performance & Security Updates
-- Run this in your Supabase Dashboard → SQL Editor after the main setup

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create rate_limits table for rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time BIGINT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Step 3: Create moderation_logs table for content moderation audit trail
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_preview TEXT NOT NULL,
  content_length INTEGER NOT NULL,
  is_approved BOOLEAN NOT NULL,
  moderation_reason TEXT,
  confidence_score DECIMAL(3,2) NOT NULL,
  flags TEXT[] NOT NULL DEFAULT '{}',
  requires_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create cache_metrics table for monitoring cache performance
CREATE TABLE IF NOT EXISTS cache_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL,
  cache_category TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  miss_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_author_id ON moderation_logs(author_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_is_approved ON moderation_logs(is_approved);
CREATE INDEX IF NOT EXISTS idx_cache_metrics_cache_key ON cache_metrics(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_metrics_category ON cache_metrics(cache_category);

-- Step 6: Enable Row Level Security on new tables
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_metrics ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for rate_limits
CREATE POLICY "Users can view their own rate limits" ON rate_limits
  FOR SELECT USING (
    key LIKE 'post_create:%' AND 
    key LIKE '%' || auth.uid()::text || '%'
  );

CREATE POLICY "System can manage all rate limits" ON rate_limits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND auth.jwt() ->> 'role' IN ('service_role','admin')
    )
  );

-- Step 8: Create RLS policies for moderation_logs
CREATE POLICY "Users can view their own moderation logs" ON moderation_logs
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all moderation logs" ON moderation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND auth.jwt() ->> 'role' IN ('service_role','admin')
    )
  );

CREATE POLICY "System can insert moderation logs" ON moderation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND auth.jwt() ->> 'role' IN ('service_role','admin')
    )
  );

-- Step 9: Create RLS policies for cache_metrics
CREATE POLICY "Admins can view cache metrics" ON cache_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND auth.jwt() ->> 'role' IN ('service_role','admin')
    )
  );

CREATE POLICY "System can manage cache metrics" ON cache_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND auth.jwt() ->> 'role' IN ('service_role','admin')
    )
  );

-- Step 10: Create function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE reset_time < EXTRACT(EPOCH FROM NOW()) * 1000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create function to get rate limit statistics
CREATE OR REPLACE FUNCTION get_rate_limit_stats()
RETURNS TABLE(
  total_keys BIGINT,
  active_keys BIGINT,
  expired_keys BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_keys,
    COUNT(*) FILTER (WHERE reset_time >= EXTRACT(EPOCH FROM NOW()) * 1000) as active_keys,
    COUNT(*) FILTER (WHERE reset_time < EXTRACT(EPOCH FROM NOW()) * 1000) as expired_keys
  FROM rate_limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create function to get moderation statistics
CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS TABLE(
  total_posts BIGINT,
  approved_posts BIGINT,
  flagged_posts BIGINT,
  blocked_posts BIGINT,
  review_required BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_posts,
    COUNT(*) FILTER (WHERE is_approved = true) as approved_posts,
    COUNT(*) FILTER (WHERE array_length(flags, 1) > 0) as flagged_posts,
    COUNT(*) FILTER (WHERE is_approved = false) as blocked_posts,
    COUNT(*) FILTER (WHERE requires_review = true) as review_required
  FROM moderation_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Create function to get cache performance metrics
CREATE OR REPLACE FUNCTION get_cache_performance()
RETURNS TABLE(
  category TEXT,
  total_requests BIGINT,
  hit_rate DECIMAL(5,2),
  avg_response_time_ms DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cache_category as category,
    (hit_count + miss_count) as total_requests,
    CASE 
      WHEN (hit_count + miss_count) > 0 
      THEN ROUND((hit_count::DECIMAL / (hit_count + miss_count) * 100), 2)
      ELSE 0 
    END as hit_rate,
    0 as avg_response_time_ms -- Placeholder for future implementation
  FROM cache_metrics
  GROUP BY cache_category, hit_count, miss_count
  ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Try to enable cron extension and create scheduled jobs
DO $$
BEGIN
  -- Check if cron extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Enable cron extension
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    
    -- Create scheduled job to clean up expired rate limits (runs every hour)
    PERFORM cron.schedule(
      'cleanup-expired-rate-limits',
      '0 * * * *', -- Every hour
      'SELECT cleanup_expired_rate_limits();'
    );
    
    -- Create scheduled job to clean up old moderation logs (runs daily)
    PERFORM cron.schedule(
      'cleanup-old-moderation-logs',
      '0 2 * * *', -- Daily at 2 AM
      'DELETE FROM moderation_logs WHERE created_at < NOW() - INTERVAL ''30 days'';'
    );
    
    -- Create scheduled job to clean up old cache metrics (runs daily)
    PERFORM cron.schedule(
      'cleanup-old-cache-metrics',
      '0 3 * * *', -- Daily at 3 AM
      'DELETE FROM cache_metrics WHERE last_accessed < NOW() - INTERVAL ''7 days'';'
    );
    
    RAISE NOTICE 'Cron extension enabled and scheduled jobs created successfully!';
  ELSE
    RAISE NOTICE 'Cron extension not available. Manual cleanup functions created instead.';
    RAISE NOTICE 'To enable automatic cleanup, contact your Supabase admin to enable the pg_cron extension.';
  END IF;
END $$;

-- Step 15: Create manual cleanup functions (fallback when cron is not available)
CREATE OR REPLACE FUNCTION manual_cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits 
  WHERE reset_time < EXTRACT(EPOCH FROM NOW()) * 1000;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION manual_cleanup_old_moderation_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM moderation_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION manual_cleanup_old_cache_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache_metrics 
  WHERE last_accessed < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 16: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON rate_limits TO anon, authenticated;
GRANT ALL ON moderation_logs TO anon, authenticated;
GRANT ALL ON cache_metrics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_moderation_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cache_performance() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION manual_cleanup_expired_rate_limits() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION manual_cleanup_old_moderation_logs() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION manual_cleanup_old_cache_metrics() TO anon, authenticated;

-- Step 17: Insert sample data for testing (optional)
-- Uncomment the lines below if you want to test with sample data

-- INSERT INTO cache_metrics (cache_key, cache_category, hit_count, miss_count)
-- VALUES 
--   ('trending_posts:20:first', 'trending_posts', 150, 25),
--   ('posts:1:20:all:all', 'posts', 89, 12),
--   ('user_profile:123', 'user_profile', 45, 5);

-- Step 18: Verify setup
SELECT 
  'rate_limits' as table_name,
  COUNT(*) as row_count
FROM rate_limits
UNION ALL
SELECT 
  'moderation_logs' as table_name,
  COUNT(*) as row_count
FROM moderation_logs
UNION ALL
SELECT 
  'cache_metrics' as table_name,
  COUNT(*) as row_count
FROM cache_metrics;

-- Step 19: Test functions
SELECT 'Rate limit stats:' as test_type;
SELECT * FROM get_rate_limit_stats();

SELECT 'Moderation stats:' as test_type;
SELECT * FROM get_moderation_stats();

SELECT 'Cache performance:' as test_type;
SELECT * FROM get_cache_performance();

-- Step 20: Show manual cleanup instructions
SELECT 
  'Manual Cleanup Instructions' as info,
  'If cron extension is not available, run these functions manually:' as description
UNION ALL
SELECT 
  'Clean expired rate limits:',
  'SELECT manual_cleanup_expired_rate_limits();'
UNION ALL
SELECT 
  'Clean old moderation logs:',
  'SELECT manual_cleanup_old_moderation_logs();'
UNION ALL
SELECT 
  'Clean old cache metrics:',
  'SELECT manual_cleanup_old_cache_metrics();';

-- ✅ Performance & Security updates complete!
-- Your ChristianKit app now has:
-- - Rate limiting to prevent spam
-- - Content moderation with audit trail
-- - Cache performance monitoring
-- - Automatic cleanup jobs (if cron extension is available)
-- - Manual cleanup functions (fallback)
-- - Enhanced security policies
