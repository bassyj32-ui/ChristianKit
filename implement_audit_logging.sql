-- =================================================================
-- AUDIT LOGGING SYSTEM - Compliance & Security Monitoring
-- =================================================================
-- This creates a comprehensive audit trail for all database changes
-- Essential for compliance, debugging, and security monitoring

-- =================================================================
-- STEP 1: CREATE AUDIT LOGS TABLE
-- =================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID, -- References auth.users(id) when available
  session_id TEXT, -- For tracking user sessions
  ip_address INET, -- For security monitoring
  user_agent TEXT, -- For debugging
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Add constraints for data integrity
  CONSTRAINT audit_logs_table_record_not_null CHECK (table_name IS NOT NULL AND record_id IS NOT NULL),
  CONSTRAINT audit_logs_operation_not_null CHECK (operation IS NOT NULL)
);

-- =================================================================
-- STEP 2: CREATE INDEXES FOR AUDIT PERFORMANCE
-- =================================================================

-- Primary lookup patterns for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_user ON audit_logs(table_name, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);

-- Partial indexes for specific operations (most common)
-- Note: Removed NOW() from index predicate as it requires IMMUTABLE functions
-- For time-based filtering, use WHERE clauses in queries instead of partial indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_changes ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_operations ON audit_logs(operation, created_at DESC);

-- =================================================================
-- STEP 3: CREATE AUDIT TRIGGER FUNCTION
-- =================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_session_id TEXT;
  current_ip INET;
  current_ua TEXT;
BEGIN
  -- Get current user context (safe defaults if not available)
  current_user_id := COALESCE(auth.uid(), NULL);
  current_session_id := COALESCE(current_setting('app.current_session_id', true), NULL);
  current_ip := COALESCE(inet(current_setting('request.headers.cf-connecting-ip', true)), NULL);
  current_ua := COALESCE(current_setting('request.headers.user-agent', true), NULL);

  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, record_id, operation, new_data, user_id,
      session_id, ip_address, user_agent
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), current_user_id,
      current_session_id, current_ip, current_ua
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, operation, old_data, new_data, user_id,
      session_id, ip_address, user_agent
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user_id,
      current_session_id, current_ip, current_ua
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, operation, old_data, user_id,
      session_id, ip_address, user_agent
    ) VALUES (
      TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), current_user_id,
      current_session_id, current_ip, current_ua
    );
    RETURN OLD;

  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 4: APPLY AUDIT TRIGGERS TO ALL TABLES
-- =================================================================

-- Profiles table (user data - most critical)
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Posts table (content - important for moderation)
DROP TRIGGER IF EXISTS audit_posts_trigger ON posts;
CREATE TRIGGER audit_posts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- User follows table (social relationships)
DROP TRIGGER IF EXISTS audit_user_follows_trigger ON user_follows;
CREATE TRIGGER audit_user_follows_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Notifications table (user communications)
DROP TRIGGER IF EXISTS audit_notifications_trigger ON notifications;
CREATE TRIGGER audit_notifications_trigger
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Users table (if used for auth)
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =================================================================
-- STEP 5: CREATE AUDIT HELPER FUNCTIONS
-- =================================================================

-- Function to get audit history for a specific record
CREATE OR REPLACE FUNCTION get_record_audit_history(
  target_table TEXT,
  target_record_id UUID
) RETURNS TABLE (
  operation TEXT,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.operation,
    al.old_data,
    al.new_data,
    al.user_id,
    al.created_at
  FROM audit_logs al
  WHERE al.table_name = target_table
    AND al.record_id = target_record_id
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit history for a user
CREATE OR REPLACE FUNCTION get_user_audit_history(
  target_user_id UUID,
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  table_name TEXT,
  record_id UUID,
  operation TEXT,
  created_at TIMESTAMPTZ,
  changes_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.table_name,
    al.record_id,
    al.operation,
    al.created_at,
    CASE
      WHEN al.operation = 'INSERT' THEN 'Created record'
      WHEN al.operation = 'DELETE' THEN 'Deleted record'
      WHEN al.operation = 'UPDATE' THEN
        'Updated: ' || (
          SELECT string_agg(key, ', ')
          FROM jsonb_object_keys(al.new_data) key
          WHERE al.old_data ? key AND al.old_data->key != al.new_data->key
        )
      ELSE 'Unknown operation'
    END as changes_summary
  FROM audit_logs al
  WHERE al.user_id = target_user_id
    AND al.created_at >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activity summary
CREATE OR REPLACE FUNCTION get_recent_activity_summary(
  hours_back INTEGER DEFAULT 24
) RETURNS TABLE (
  table_name TEXT,
  operation_count BIGINT,
  unique_users BIGINT,
  sample_records BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.table_name,
    COUNT(*) as operation_count,
    COUNT(DISTINCT al.user_id) as unique_users,
    COUNT(DISTINCT al.record_id) as sample_records
  FROM audit_logs al
  WHERE al.created_at >= NOW() - INTERVAL '1 hour' * hours_back
  GROUP BY al.table_name
  ORDER BY operation_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 6: CREATE AUDIT CLEANUP FUNCTION
-- =================================================================

-- Function to clean old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  days_to_keep INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 7: CREATE AUDIT VIEWS FOR EASY MONITORING
-- =================================================================

-- View for recent user activities (last 7 days)
CREATE OR REPLACE VIEW recent_user_activities AS
SELECT
  al.user_id,
  p.display_name as user_name,
  al.table_name,
  al.operation,
  al.record_id,
  al.created_at,
  CASE
    WHEN al.operation = 'INSERT' THEN 'Created'
    WHEN al.operation = 'UPDATE' THEN 'Modified'
    WHEN al.operation = 'DELETE' THEN 'Deleted'
    ELSE al.operation
  END as action_type
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id::text = p.id::text
WHERE al.created_at >= NOW() - INTERVAL '7 days'
  AND al.user_id IS NOT NULL
ORDER BY al.created_at DESC;

-- View for security monitoring (failed operations, unusual patterns)
CREATE OR REPLACE VIEW security_monitoring AS
SELECT
  al.user_id,
  p.display_name,
  al.table_name,
  al.operation,
  COUNT(*) as operation_count,
  MIN(al.created_at) as first_seen,
  MAX(al.created_at) as last_seen
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id::text = p.id::text
WHERE al.created_at >= NOW() - INTERVAL '1 day'
GROUP BY al.user_id, p.display_name, al.table_name, al.operation
HAVING COUNT(*) > 10 -- Flag high-frequency operations
ORDER BY operation_count DESC;

-- =================================================================
-- STEP 8: SET UP AUTOMATIC CLEANUP (Optional)
-- =================================================================

-- Create a function that can be called by a cron job to clean old logs
-- Uncomment the following if you want to set up automatic cleanup:

-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs(90);');

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Test 1: Check that audit_logs table exists and has structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Test 2: Check that triggers are active
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE 'audit_%_trigger';

-- Test 3: Test audit logging with a simple operation
-- INSERT INTO notifications (user_id, type, title, message)
-- VALUES (auth.uid(), 'test', 'Audit Test', 'Testing audit logging');

-- Test 4: View recent audit activity
-- SELECT * FROM recent_user_activities LIMIT 10;

-- =================================================================
-- IMPORTANT NOTES:
-- =================================================================
-- 1. Audit logging provides complete traceability of all database changes
-- 2. The audit_trigger_function captures who, what, when, and how data changed
-- 3. Helper functions make it easy to investigate user activities
-- 4. Regular cleanup prevents the audit table from growing too large
-- 5. Security monitoring view helps identify suspicious patterns
-- 6. All audit functions are SECURITY DEFINER for proper permissions

-- Run this entire script in your Supabase SQL Editor
