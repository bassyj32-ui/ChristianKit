# 🤖 Daily Notification Automation Setup

## 🎯 **Overview**

This guide will help you set up automated daily notifications that run without any manual intervention. Your users will receive personalized spiritual messages every day at their preferred times.

---

## 🚀 **Method 1: Supabase Cron Jobs (Recommended)**

### **Step 1: Create Cron Job in Supabase**

1. **Go to Supabase Dashboard**
2. **Navigate to Database → Extensions**
3. **Enable `pg_cron` extension**
4. **Go to SQL Editor**
5. **Run this SQL to create the cron job**:

```sql
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a daily cron job that runs at 8:00 AM UTC
SELECT cron.schedule(
    'daily-notifications',
    '0 8 * * *',  -- Every day at 8:00 AM UTC
    $$
    SELECT net.http_post(
        url := 'https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
        body := '{"automated": true}'
    );
    $$
);

-- Check if the cron job was created successfully
SELECT * FROM cron.job;
```

### **Step 2: Set Service Role Key**

```sql
-- Set the service role key for the cron job to use
ALTER DATABASE postgres SET app.service_role_key = 'your_supabase_service_role_key_here';
```

### **Step 3: Verify Cron Job**

```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'daily-notifications';

-- Check cron job run history
SELECT * FROM cron.job_run_details WHERE jobid = (
    SELECT jobid FROM cron.job WHERE jobname = 'daily-notifications'
) ORDER BY start_time DESC LIMIT 10;
```

---

## 🚀 **Method 2: GitHub Actions (Alternative)**

Create a GitHub Action that runs daily:

### **Step 1: Create Workflow File**

Create `.github/workflows/daily-notifications.yml`:

```yaml
name: Daily Notifications

on:
  schedule:
    # Run every day at 8:00 AM UTC (adjust as needed)
    - cron: '0 8 * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    
    steps:
    - name: Send Daily Notifications
      run: |
        curl -X POST \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
          -d '{"automated": true}' \
          https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications
      env:
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### **Step 2: Add GitHub Secrets**

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add secret: `SUPABASE_SERVICE_ROLE_KEY`

---

## 🚀 **Method 3: External Cron Service (Easiest)**

### **Option A: cron-job.org**

1. **Go to https://cron-job.org**
2. **Create free account**
3. **Create new cron job**:
   - **Title**: ChristianKit Daily Notifications
   - **URL**: `https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications`
   - **Schedule**: `0 8 * * *` (8 AM daily)
   - **HTTP Method**: POST
   - **Request Body**: `{"automated": true}`
   - **Headers**: 
     ```
     Content-Type: application/json
     Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
     ```

### **Option B: EasyCron.com**

1. **Go to https://www.easycron.com**
2. **Create free account** (25 jobs free)
3. **Create cron job** with same settings as above

---

## 🚀 **Method 4: Vercel Cron (If using Vercel)**

Create `api/cron/daily-notifications.js`:

```javascript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const response = await fetch('https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ automated: true })
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-notifications",
      "schedule": "0 8 * * *"
    }
  ]
}
```

---

## ⚙️ **Timezone Considerations**

### **Multiple Timezone Support**

Update your Edge Function to handle multiple timezones:

```typescript
// Add this to your daily-notifications function
function shouldSendNotificationForTimezone(userTimezone: string, preferredHour: number = 8): boolean {
  const now = new Date();
  const userTime = new Date(now.toLocaleString("en-US", {timeZone: userTimezone}));
  const userHour = userTime.getHours();
  
  // Send if it's within 1 hour of preferred time
  return Math.abs(userHour - preferredHour) <= 1;
}
```

### **Multiple Cron Jobs for Different Timezones**

```sql
-- 8 AM UTC (for GMT users)
SELECT cron.schedule('notifications-utc', '0 8 * * *', $$ /* your function call */ $$);

-- 8 AM EST (1 PM UTC)
SELECT cron.schedule('notifications-est', '0 13 * * *', $$ /* your function call */ $$);

-- 8 AM PST (4 PM UTC)
SELECT cron.schedule('notifications-pst', '0 16 * * *', $$ /* your function call */ $$);
```

---

## 📊 **Monitoring & Logging**

### **Add Monitoring to Your Edge Function**

```typescript
// Add this to your daily-notifications function
async function logAutomationRun(stats: any) {
  await supabase
    .from('automation_logs')
    .insert({
      job_type: 'daily_notifications',
      run_time: new Date().toISOString(),
      users_processed: stats.processed,
      notifications_sent: stats.successful,
      errors: stats.failed,
      metadata: stats
    });
}
```

### **Create Monitoring Table**

```sql
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

-- Add RLS policy
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage automation logs" ON automation_logs
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 🔧 **Testing Your Automation**

### **Manual Test**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"automated": true}' \
  https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications
```

### **Check Logs**

```sql
-- Check recent automation runs
SELECT * FROM automation_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check notification success rate
SELECT 
  DATE(run_time) as date,
  SUM(notifications_sent) as sent,
  SUM(errors) as failed,
  ROUND(SUM(notifications_sent)::numeric / (SUM(notifications_sent) + SUM(errors)) * 100, 2) as success_rate
FROM automation_logs 
WHERE job_type = 'daily_notifications'
GROUP BY DATE(run_time)
ORDER BY date DESC;
```

---

## 🎯 **Recommended Setup**

### **For Production: Supabase Cron (Method 1)**
- ✅ **Most reliable** - runs on your database server
- ✅ **No external dependencies**
- ✅ **Built-in monitoring**
- ✅ **Free with Supabase**

### **For Development: External Service (Method 3)**
- ✅ **Easy to set up**
- ✅ **Good for testing**
- ✅ **Visual monitoring**

---

## 🚀 **Quick Start (Recommended)**

1. **Enable pg_cron in Supabase**
2. **Run the SQL cron job creation script**
3. **Set your service role key**
4. **Test with manual curl**
5. **Monitor logs**

**Your users will now receive daily spiritual messages automatically!** 🎉📱

---

## 📞 **Support**

If you need help:
1. Check Supabase logs
2. Verify cron job is running: `SELECT * FROM cron.job`
3. Test function manually first
4. Check user notification preferences

**Your daily automation is ready to inspire users every day!** ✨





















