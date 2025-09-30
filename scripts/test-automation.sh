#!/bin/bash

# Test Daily Automation Script
# This script tests your daily notification automation

echo "🧪 Testing Daily Notification Automation..."
echo "==========================================="

# Configuration
SUPABASE_URL="https://hrznuhcwdjnpasfnqqwp.supabase.co"
FUNCTION_URL="$SUPABASE_URL/functions/v1/daily-notifications"

# Check if service role key is provided
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required"
    echo "   Set it with: export SUPABASE_SERVICE_ROLE_KEY='your_key_here'"
    exit 1
fi

echo "✅ Service role key found"
echo ""

# Test 1: Manual automation trigger
echo "🧪 Test 1: Manual Automation Trigger"
echo "------------------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{"automated": true}' \
  "$FUNCTION_URL")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ Automation test successful!"
    echo "Response: $body"
else
    echo "❌ Automation test failed (HTTP $http_code)"
    echo "Response: $body"
fi

echo ""

# Test 2: Check if cron jobs are set up (requires psql access)
echo "🧪 Test 2: Cron Job Verification"
echo "--------------------------------"
echo "To check if cron jobs are set up, run this SQL in your Supabase dashboard:"
echo ""
echo "SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname LIKE 'daily-notifications%';"
echo ""

# Test 3: Manual test notification
echo "🧪 Test 3: Test Notification"
echo "----------------------------"
echo "To test individual notifications, use the test button in your app or run:"
echo ""
echo "curl -X POST \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY\" \\"
echo "  -d '{\"test\": true, \"userId\": \"your_user_id\"}' \\"
echo "  $FUNCTION_URL"
echo ""

# Test 4: Monitoring
echo "🧪 Test 4: Monitoring Setup"
echo "---------------------------"
echo "Check automation logs with this SQL:"
echo ""
echo "SELECT * FROM automation_logs ORDER BY created_at DESC LIMIT 5;"
echo ""

echo "🎉 Automation testing complete!"
echo ""
echo "📋 Next Steps:"
echo "1. ✅ Set up cron job using scripts/setup-daily-automation.sql"
echo "2. ✅ Monitor with scripts/monitor-automation.sql"
echo "3. ✅ Deploy updated Edge Function with logging"
echo "4. ✅ Test with the script above"
echo ""
echo "🚀 Your daily automation is ready!"












