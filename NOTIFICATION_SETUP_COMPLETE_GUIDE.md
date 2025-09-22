# 🔔 Complete Notification System Setup Guide

This guide will help you set up the real notification system for ChristianKit that works when the app is closed.

## 📋 Prerequisites

1. **Supabase Project** with Edge Functions enabled
2. **VAPID Keys** for push notifications
3. **Brevo Account** for email fallbacks (optional)
4. **Service Worker** support in your browser

## 🚀 Step 1: Database Setup

Run the notification database migration:

```sql
-- Run this in your Supabase SQL Editor
\i supabase/migrations/20241201_fixed_notification_system.sql
```

This creates:
- `user_notification_preferences` - User notification settings
- `user_profiles` - User profile data
- `push_subscriptions` - Web push subscription data
- `user_notifications` - Notification history
- `prayer_reminders` - Custom prayer reminders

## 🔑 Step 2: Environment Variables

Add these to your `.env` file:

```env
# Push Notification VAPID Keys (Required)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key_here

# Email Service (Optional - for fallbacks)
BREVO_API_KEY=your_brevo_api_key_here

# Supabase Configuration (should already exist)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 🔧 Generate VAPID Keys

You can generate VAPID keys using this online tool:
https://vapidkeys.com/

Or using Node.js:
```bash
npm install web-push
npx web-push generate-vapid-keys
```

## 📱 Step 3: Deploy Edge Functions

Deploy the notification Edge Functions to Supabase:

```bash
# Deploy daily notifications function
supabase functions deploy daily-notifications

# Deploy push notification function
supabase functions deploy send-push-notification
```

## 🔧 Step 4: Set Edge Function Environment Variables

In your Supabase dashboard, go to Edge Functions and set these environment variables:

```env
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
BREVO_API_KEY=your_brevo_api_key_here
```

## 🧪 Step 5: Test the System

1. **Open your app** and sign in
2. **Go to Settings** → **Notifications**
3. **Click "🧪 Send Test Notification"**
4. **Check the browser console** for detailed logs
5. **Check "📊 Check Status"** to see current settings

## 📊 Expected Test Results

### ✅ Success Indicators:
- **Supported: ✅** - Browser supports notifications
- **Permission: granted** - User granted notification permission
- **Active: ✅** - Notifications are enabled in database
- **Test notification sent successfully!**

### ❌ Common Issues:

#### "Failed to send test notification"
**Causes:**
- Missing VAPID keys
- Database tables not created
- Edge functions not deployed
- User not authenticated

**Solutions:**
1. Check environment variables are set
2. Run database migration
3. Deploy Edge Functions
4. Ensure user is signed in

#### "Permission: denied"
**Solutions:**
1. Click browser notification icon in address bar
2. Allow notifications for your site
3. Refresh the page and try again

#### "Active: ❌"
**Solutions:**
1. Enable notifications in app settings
2. Check database has user preferences
3. Run the test again to auto-create preferences

## 🔄 Step 6: Set Up Daily Notifications

### Option A: Manual Cron Job (Recommended)

Add this to your Supabase database as a cron job:

```sql
-- Create daily notification cron job
SELECT cron.schedule(
  'daily-spiritual-reminders',
  '0 9 * * *', -- 9 AM UTC daily
  'SELECT net.http_post(
    url:=''https://your-project.supabase.co/functions/v1/daily-notifications'',
    headers:=''{"Authorization": "Bearer your-service-role-key", "Content-Type": "application/json"}'',
    body:=''{}''
  );'
);
```

### Option B: External Cron Service

Use a service like cron-job.org to call:
```
https://your-project.supabase.co/functions/v1/daily-notifications
```

## 📱 Step 7: Mobile App Integration (Future)

For mobile apps, you'll need:
1. **Firebase Cloud Messaging (FCM)** setup
2. **APNs** for iOS
3. **Push notification certificates**

## 🔍 Troubleshooting

### Check Notification Status
```javascript
// In browser console
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker:', registration);
});

// Check notification permission
console.log('Permission:', Notification.permission);

// Check push subscription
navigator.serviceWorker.ready.then(registration => {
  registration.pushManager.getSubscription().then(sub => {
    console.log('Push Subscription:', sub);
  });
});
```

### Database Queries
```sql
-- Check user notification preferences
SELECT * FROM user_notification_preferences WHERE user_id = 'your-user-id';

-- Check push subscriptions
SELECT * FROM push_subscriptions WHERE user_id = 'your-user-id';

-- Check notification history
SELECT * FROM user_notifications ORDER BY sent_at DESC LIMIT 10;
```

### Edge Function Logs
Check Supabase Edge Function logs for detailed error messages.

## 🎯 Advanced Configuration

### Custom Notification Times
Users can set custom notification times in the app settings.

### Email Fallbacks
If push notifications fail, the system automatically sends email notifications (if enabled).

### Personalization
Notifications are personalized based on:
- User experience level (beginner/intermediate/advanced)
- Time of day (morning/afternoon/evening)
- Recent activity patterns

## 📈 Monitoring

### Key Metrics to Track:
- Notification delivery rate
- User engagement with notifications
- Push subscription health
- Email fallback usage

### Logs to Monitor:
- Edge Function execution logs
- Browser notification permission changes
- Push subscription updates
- User preference changes

## 🔒 Security Considerations

1. **VAPID Keys**: Keep private keys secure
2. **User Data**: All user data is protected by RLS policies
3. **Rate Limiting**: Consider implementing rate limiting for notifications
4. **GDPR Compliance**: Users can disable notifications anytime

## 🎉 Success!

Once everything is set up, your users will receive:
- **Daily spiritual reminders** at their preferred time
- **Personalized messages** based on their experience level
- **Beautiful notifications** with Bible verses
- **Email fallbacks** when push notifications fail
- **Works offline** when the app is closed

The notification system is now ready to help users maintain their spiritual journey! 🙏


