# 🔔 ChristianKit Notification System Setup Guide

## ✅ **What's Now Working**

Your notification system has been completely upgraded with:

- **✅ Service Worker**: Push notifications and background sync
- **✅ Daily Scheduling**: Automatic 9 AM prayer reminders
- **✅ Settings Panel**: User-configurable notification preferences
- **✅ Persistent Storage**: Settings saved to localStorage
- **✅ Test Functionality**: Test notifications button
- **✅ Enhanced UI**: Beautiful settings panel with toggles

## 🔧 **Setup Steps**

### 1. **Get Resend API Key (for Email)**

1. Visit [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

### 2. **Create Environment File**

Create a `.env` file in your project root:

```bash
# Email Service (Resend)
VITE_RESEND_API_KEY=re_BZghbW5b_6sE9ZvjWWYMrqgmmFaErMEo1

# Supabase (if not already set)
VITE_SUPABASE_URL=https://hrznuhcwdjnpasfnqqwp.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note:** The Resend API key is already provided above. Just copy it exactly as shown.

### 3. **Test the System**

1. **Start your app**: `npm run dev`
2. **Enable notifications**: Click the "Enable Prayer Reminders" button
3. **Grant permission**: Allow notifications in your browser
4. **Test notification**: Click "🧪 Test Notification" button
5. **Customize settings**: Adjust urgency level and frequency

## 🚀 **Features**

### **Daily Scheduling**
- **9 AM Prayer Reminder**: Automatic daily notification
- **Smart Timing**: If past 9 AM, schedules for tomorrow
- **Persistent**: Continues working across browser sessions

### **Settings Panel**
- **Push Notifications**: Toggle on/off
- **Email Notifications**: Toggle on/off  
- **Urgency Level**: Gentle → Moderate → Aggressive → Ruthless
- **Frequency**: Hourly → Daily → Constant

### **Service Worker**
- **Push Notifications**: Rich notifications with actions
- **Background Sync**: Works even when app is closed
- **Offline Support**: Caches essential resources

## 📧 **Email System**

### **How It Works**
1. **User Activity Tracking**: Monitors prayer/bible reading
2. **Escalating Urgency**: More missed days = more urgent emails
3. **Beautiful Templates**: HTML emails with spiritual messaging
4. **Smart Scheduling**: Sends emails at optimal times

### **Email Templates**
- **Gentle**: "Your daily spiritual moment awaits"
- **Moderate**: "God is waiting for you to connect"
- **Urgent**: "We miss you! Ready to continue?"
- **Critical**: "Your spiritual journey needs you"

## 🔧 **Troubleshooting**

### **Notifications Not Working?**
1. Check browser permissions
2. Ensure service worker is registered
3. Check console for errors
4. Verify HTTPS (required for notifications)

### **Emails Not Sending?**
1. Verify `VITE_RESEND_API_KEY` is set
2. Check Resend dashboard for delivery status
3. Ensure user has granted email permission
4. Check browser console for API errors

### **Service Worker Issues?**
1. Clear browser cache
2. Check if `/sw.js` file exists in public folder
3. Verify service worker registration in console
4. Try refreshing the page

## 📱 **Mobile Support**

### **Progressive Web App**
- **Install Prompt**: Users can install as app
- **Offline Notifications**: Works without internet
- **Background Sync**: Notifications when app is closed

### **Push Notifications**
- **Rich Actions**: "Pray Now", "Read Bible" buttons
- **Vibration**: Haptic feedback for urgency
- **Icon Support**: Custom notification icons

## 🔮 **Future Enhancements**

### **Planned Features**
- **Supabase Integration**: Store preferences in database
- **Advanced Scheduling**: Custom reminder times
- **Notification Analytics**: Track engagement metrics
- **A/B Testing**: Test different message styles
- **Smart Timing**: AI-powered optimal notification times

### **Advanced Email**
- **Personalization**: User-specific content
- **Streak Protection**: Prevent breaking prayer streaks
- **Community Features**: Group prayer reminders
- **Seasonal Content**: Holiday-specific messages

## 🎯 **Testing Checklist**

- [ ] Notifications permission granted
- [ ] Service worker registered successfully
- [ ] Test notification works
- [ ] Settings panel displays correctly
- [ ] Settings save to localStorage
- [ ] Daily reminder scheduled
- [ ] Email service initialized (with API key)
- [ ] Push notifications work on mobile

## 🆘 **Need Help?**

If you encounter issues:

1. **Check Console**: Look for error messages
2. **Verify Environment**: Ensure API keys are set
3. **Test Permissions**: Check browser notification settings
4. **Clear Cache**: Hard refresh or clear browser data
5. **Check Network**: Ensure HTTPS and service worker access

---

**🎉 Your notification system is now fully functional!** Users will receive beautiful, spiritual reminders that help them maintain their prayer habits and stay connected to God throughout their day.
