# 🚀 ChristianKit Automation Setup Guide

## 🎯 **What We've Built**

Your ChristianKit app now has **fully automated email and daily reminder services** that will:

✅ **Send welcome emails** when users sign up  
✅ **Send daily prayer reminders** at 9:00 AM  
✅ **Send daily Bible reading reminders**  
✅ **Send daily meditation reminders**  
✅ **Track all email and reminder activities**  
✅ **Manage user preferences** for notifications  

## 🚀 **Step-by-Step Setup**

### **Step 1: Run Database Setup Script**

1. **Go to your Supabase Dashboard** → [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project** (ID: `hrznuhcwdjnpasfnqqwp`)
3. **Navigate to SQL Editor**
4. **Copy and paste** the entire contents of `scripts/automation-tables.sql`
5. **Click Run** to create all automation tables

### **Step 2: Deploy Edge Function**

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Deploy the reminder function**:
   ```bash
   supabase functions deploy send-daily-reminders
   ```

### **Step 3: Set Up Cron Job (Daily Reminders)**

1. **Go to Supabase Dashboard** → **Database** → **Functions**
2. **Find your `send-daily-reminders` function**
3. **Set up a cron job** to run it daily at 9:00 AM UTC

**Cron Expression**: `0 9 * * *` (runs daily at 9:00 AM)

### **Step 4: Configure Environment Variables**

1. **In Supabase Dashboard** → **Settings** → **Edge Functions**
2. **Add these environment variables**:
   - `RESEND_API_KEY` = Your Resend API key
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key

## 🔧 **How It Works**

### **Email Automation Flow:**

1. **User signs up** → Welcome email sent automatically
2. **Daily at 9:00 AM** → Prayer reminders sent to all users
3. **User achievements** → Celebration emails sent
4. **Weekly reports** → Progress summaries sent

### **Reminder Automation Flow:**

1. **User signs up** → Default reminder schedule created (9:00 AM daily)
2. **Daily cron job** → Checks all active users
3. **Sends reminders** → Based on user preferences and schedules
4. **Logs everything** → Tracks delivery status and errors

## 🧪 **Testing the Automation**

### **Test 1: Welcome Email**
1. **Sign out** of your app
2. **Sign in again** with a new account
3. **Check your email** for welcome message
4. **Check Supabase** → `email_triggers` table

### **Test 2: Daily Reminders**
1. **Wait for 9:00 AM UTC** (or manually trigger the function)
2. **Check your email** for daily prayer reminder
3. **Check Supabase** → `reminder_logs` table

### **Test 3: Manual Function Test**
1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Find `send-daily-reminders`**
3. **Click "Invoke"** to test manually
4. **Check logs** for success/error messages

## 📊 **Monitoring & Analytics**

### **Check Email Status:**
```sql
-- View all email triggers
SELECT * FROM email_triggers ORDER BY created_at DESC;

-- Check email success rates
SELECT trigger_type, status, COUNT(*) 
FROM email_triggers 
GROUP BY trigger_type, status;
```

### **Check Reminder Status:**
```sql
-- View reminder schedules
SELECT * FROM reminder_schedules WHERE is_active = true;

-- Check reminder delivery logs
SELECT * FROM reminder_logs ORDER BY created_at DESC;
```

### **Check User Preferences:**
```sql
-- View user email preferences
SELECT * FROM user_email_preferences;

-- View user reminder schedules
SELECT * FROM reminder_schedules;
```

## 🎯 **Pro Features Integration**

### **Free Users:**
- ✅ **Welcome email** on signup
- ✅ **Daily prayer reminder** at 9:00 AM
- ✅ **Basic email preferences**

### **Pro Users:**
- ✅ **All free features**
- ✅ **Custom reminder times**
- ✅ **Multiple reminder types**
- ✅ **Advanced email templates**
- ✅ **Priority support**

## 🚨 **Troubleshooting**

### **Issue: Emails not sending**
- **Check Resend API key** in environment variables
- **Verify email service** is working
- **Check email triggers table** for errors

### **Issue: Reminders not working**
- **Verify cron job** is set up correctly
- **Check Edge Function** logs
- **Ensure reminder schedules** exist for users

### **Issue: Function deployment fails**
- **Check Supabase CLI** is installed and logged in
- **Verify project link** is correct
- **Check function code** for syntax errors

## 🔍 **Expected Results**

After setup, you should see:

✅ **New users get welcome emails** automatically  
✅ **Daily reminders sent** at 9:00 AM UTC  
✅ **Email triggers logged** in database  
✅ **Reminder logs tracked** for all deliveries  
✅ **User preferences stored** and respected  
✅ **Pro features working** based on subscription  

## 🎉 **Success Indicators**

1. **Welcome emails** arrive in user inboxes
2. **Daily reminders** sent at scheduled times
3. **Database tables populated** with automation data
4. **Edge function logs** show successful runs
5. **No error messages** in Supabase logs

## 🔄 **Next Steps**

1. **Test locally** - Sign up new users and check emails
2. **Deploy to production** - Push changes to GitHub
3. **Set up cron job** - Schedule daily reminder function
4. **Monitor performance** - Check delivery rates and user engagement
5. **Optimize timing** - Adjust reminder times based on user activity

## 📞 **Need Help?**

If you encounter issues:
1. **Check Supabase logs** for error messages
2. **Verify environment variables** are set correctly
3. **Test Edge Function** manually first
4. **Check database tables** exist and have data
5. **Monitor email delivery** in Resend dashboard

---

**🎯 Your ChristianKit app now has enterprise-level automation! Users will receive personalized emails and reminders automatically, significantly improving engagement and user experience.**

**The automation will work 24/7, sending the right messages to the right users at the right times!** 🚀

