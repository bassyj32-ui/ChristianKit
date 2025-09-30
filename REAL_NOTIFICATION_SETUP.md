# 🔔 REAL NOTIFICATION SYSTEM SETUP GUIDE

## 🎯 **WHAT WE BUILT**

A **REAL** notification system that actually works when your app is closed and phone is locked! This replaces the fake `setInterval` system with proper server-side scheduling.

## 🏗️ **SYSTEM ARCHITECTURE**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Actions│    │  Supabase Edge   │    │   User Devices  │
│   (Cron Job)    │───▶│   Functions      │───▶│  (Push + Email) │
│   Every Hour    │    │  Daily Notifications│    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 **SETUP STEPS**

### **1. Database Setup**
Run the migration to create the notification tables:
```sql
-- Run this in your Supabase SQL editor
\i supabase/migrations/20241201_real_notification_system.sql
```

### **2. Environment Variables**
Add these to your `.env` file and Supabase secrets:
```env
# Supabase (already have these)
VITE_SUPABASE_URL=https://hrznuhcwdjnpasfnqqwp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# For push notifications (add these)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# For email fallback (add to Supabase secrets)
BREVO_API_KEY=your_brevo_api_key
```

### **3. Deploy Edge Functions**
Deploy the notification functions to Supabase:
```bash
# Deploy daily notifications function
supabase functions deploy daily-notifications

# Deploy push notification function  
supabase functions deploy send-push-notification
```

### **4. Set Up Cron Job**
Choose one of these options:

#### **Option A: GitHub Actions (Recommended - Free)**
1. Go to your GitHub repo → Settings → Secrets
2. Add `SUPABASE_SERVICE_ROLE_KEY` secret
3. The workflow is already created in `.github/workflows/daily-notifications.yml`
4. It will run automatically every hour

#### **Option B: External Cron Service**
Set up a cron job that calls:
```bash
curl -X POST https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### **5. Enable Push Notifications**
1. Go to Supabase Dashboard → Settings → API
2. Enable Push Notifications
3. Generate VAPID keys
4. Add the public key to your `.env` file

## 🧪 **TESTING**

### **Test Button**
I added a test button to your dashboard (bottom-left on desktop). It will:
- ✅ Send a test notification immediately
- ✅ Check your notification status
- ✅ Show if everything is working

### **Manual Testing**
You can also test by calling the function directly:
```bash
curl -X POST https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 📊 **HOW IT WORKS**

### **1. User Setup**
- User completes questionnaire
- System saves preferences to `user_notification_preferences` table
- Push subscription saved to `push_subscriptions` table

### **2. Cron Job**
- Runs every hour via GitHub Actions
- Calls `daily-notifications` Edge Function
- Checks which users should get notifications

### **3. Notification Delivery**
- **Push First**: Tries to send push notification
- **Email Fallback**: If push fails, sends email via Brevo
- **Logs Everything**: All attempts logged to `notification_logs` table

### **4. Personalized Messages**
Messages are personalized based on:
- **Experience Level**: Beginner, Intermediate, Advanced
- **Time of Day**: Morning, Afternoon, Evening
- **Missed Days**: Special messages for users who missed days

## 🎨 **MESSAGE EXAMPLES**

### **Beginner - Morning**
```
🌅 Good Morning, New Friend!
Welcome to your spiritual journey! Start today with gratitude and an open heart.

"This is the day the Lord has made; let us rejoice and be glad in it."
- Psalm 118:24
```

### **Advanced - Evening**
```
⭐ Master's Reflection
Your spiritual maturity is evident. Continue to mentor others in faith.

"The Lord himself goes before you and will be with you; he will never leave you nor forsake you."
- Deuteronomy 31:8
```

## 🔧 **TROUBLESHOOTING**

### **Notifications Not Working?**
1. Check the test button on dashboard
2. Verify environment variables are set
3. Check Supabase logs for errors
4. Ensure cron job is running

### **Push Notifications Not Working?**
1. Check browser notification permission
2. Verify VAPID keys are correct
3. Check service worker is registered
4. Test with the test button

### **Email Fallback Not Working?**
1. Verify Brevo API key is correct
2. Check email is verified in user profile
3. Check Brevo dashboard for delivery status

## 📈 **MONITORING**

### **Check Notification Status**
```sql
-- View notification status
SELECT * FROM notification_status;

-- Check recent notifications
SELECT * FROM notification_logs 
ORDER BY sent_at DESC 
LIMIT 10;

-- Check user preferences
SELECT * FROM user_notification_preferences 
WHERE is_active = true;
```

## 🚀 **WHAT'S DIFFERENT FROM BEFORE**

| **Before (Fake)** | **After (Real)** |
|-------------------|------------------|
| ❌ `setInterval` only works when app is open | ✅ Server-side cron works 24/7 |
| ❌ No push notifications | ✅ Real push notifications |
| ❌ No email fallback | ✅ Brevo email fallback |
| ❌ No personalization | ✅ Personalized by experience level |
| ❌ No timezone support | ✅ Full timezone support |
| ❌ No missed day handling | ✅ Special messages for missed days |

## 🎉 **YOU'RE DONE!**

Your notification system now:
- ✅ **Works when app is closed**
- ✅ **Works when phone is locked**
- ✅ **Sends personalized messages**
- ✅ **Has email fallback**
- ✅ **Respects user timezones**
- ✅ **Handles missed days**
- ✅ **Logs everything for monitoring**

**Test it with the button on your dashboard!** 🧪















