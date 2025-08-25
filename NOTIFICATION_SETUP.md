# 🔔 ChristianKit Notification System Setup

## 📋 **Prerequisites**
- Supabase project with Edge Functions enabled
- Resend account (or SendGrid/AWS SES) for email sending
- Supabase CLI installed

## 🚀 **Step-by-Step Implementation**

### **1. Deploy Database Migration**
```bash
# Run the notification tables migration
supabase db push
```

### **2. Deploy Edge Functions**
```bash
# Deploy the notification functions
supabase functions deploy send-daily-reminder
supabase functions deploy send-email
```

### **3. Set Environment Variables**
In your Supabase Dashboard → Settings → Edge Functions:

```env
# Email Provider (Choose one)
RESEND_API_KEY=your_resend_api_key_here
# OR
SENDGRID_API_KEY=your_sendgrid_api_key_here
# OR
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Supabase (auto-configured)
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **4. Set Up Resend (Recommended)**

1. **Get Your Resend API Key**
   - Go to [Resend.com](https://resend.com)
   - Sign in to your account
   - Go to API Keys section
   - Copy your API key (starts with `re_`)

2. **Add to Supabase Environment Variables**
   - Go to Supabase Dashboard → Settings → Edge Functions
   - Add new environment variable:
     - **Name**: `RESEND_API_KEY`
     - **Value**: `re_your_api_key_here` (paste your Resend API key)

3. **Verify Domain (Optional)**
   - In Resend dashboard, you can add your domain for better deliverability
   - For testing, you can use the default Resend domain

### **5. Set Up Cron Job for Daily Reminders**

In Supabase Dashboard → Database → Functions:

```sql
-- Create a cron job that runs daily at 9 AM UTC
SELECT cron.schedule(
  'daily-spiritual-reminders',
  '0 9 * * *',
  'SELECT net.http_post(
    url:=''https://your-project.supabase.co/functions/v1/send-daily-reminder'',
    headers:=''{"Authorization": "Bearer your-service-role-key", "Content-Type": "application/json"}'',
    body:=''{}''
  );'
);
```

### **6. Test the System**

1. **Test Email Function**
```bash
# Test the send-email function
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>",
    "text": "Test"
  }'
```

2. **Test Daily Reminder**
```bash
# Manually trigger daily reminder
curl -X POST https://your-project.supabase.co/functions/v1/send-daily-reminder \
  -H "Authorization: Bearer your-anon-key"
```

## 🔧 **Configuration Options**

### **Email Templates**
You can customize email templates in the Edge Functions:

- **Daily Reminder**: `supabase/functions/send-daily-reminder/index.ts`
- **Achievement Notifications**: Database trigger automatically creates these
- **Test Emails**: `ProgressService.sendTestEmail()`

### **Notification Preferences**
Users can set:
- **Email Enabled**: On/Off
- **Push Enabled**: On/Off (for future mobile app)
- **Preferred Time**: When to send daily reminders
- **Intensity**: Gentle, Motivating, Aggressive
- **Frequency**: Daily, Twice Daily, Hourly

### **Personalization**
The system personalizes messages based on:
- User's recent activity
- Achievement progress
- Goal completion status
- Preferred intensity level

## 📊 **Monitoring & Analytics**

### **Check Notification Status**
```sql
-- View all notifications
SELECT * FROM user_notifications ORDER BY sent_at DESC;

-- Check notification preferences
SELECT * FROM user_notification_preferences;

-- View failed notifications
SELECT * FROM user_notifications WHERE status = 'failed';
```

### **Email Provider Analytics**
- **SendGrid**: Dashboard shows delivery rates, bounces, etc.
- **AWS SES**: CloudWatch metrics for email delivery

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Emails Not Sending**
   - Check SendGrid API key is correct
   - Verify sender domain is verified
   - Check Supabase Edge Function logs

2. **Daily Reminders Not Working**
   - Verify cron job is scheduled correctly
   - Check Edge Function logs for errors
   - Ensure users have notification preferences set

3. **Database Errors**
   - Run `supabase db reset` to ensure migrations are applied
   - Check RLS policies are correct

### **Debug Commands**
```bash
# Check Edge Function logs
supabase functions logs send-daily-reminder
supabase functions logs send-email

# Test database connection
supabase db reset

# Deploy all functions
supabase functions deploy
```

## 🎯 **Next Steps**

1. **Mobile Push Notifications** - Add Firebase/OneSignal integration
2. **Advanced Scheduling** - Timezone support, custom schedules
3. **Email Templates** - Beautiful HTML templates with branding
4. **Analytics Dashboard** - Track notification engagement
5. **A/B Testing** - Test different message styles

## 📞 **Support**

If you encounter issues:
1. Check Supabase Edge Function logs
2. Verify environment variables are set correctly
3. Test with a simple email first
4. Check SendGrid/AWS SES dashboard for delivery issues

---

**🎉 Your notification system is now ready!** Users will receive personalized daily reminders and achievement notifications based on their preferences.
