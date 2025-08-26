# 🎯 Google Analytics 4 (GA4) Setup Guide for ChristianKit

## 📋 Overview
This guide will walk you through setting up Google Analytics 4 for ChristianKit to track user behavior, conversions, and subscription metrics.

## 🚀 **Step 1: Create GA4 Account**

### 1.1 Go to Google Analytics
- Visit [analytics.google.com](https://analytics.google.com)
- Sign in with your Google account
- Click **"Start measuring"**

### 1.2 Set Up Account
- **Account name**: `ChristianKit` (or your company name)
- Click **"Next"**

### 1.3 Set Up Property
- **Property name**: `ChristianKit Web App`
- **Reporting time zone**: Choose your location (e.g., `America/New_York`)
- **Currency**: `USD` (since you charge in USD)
- Click **"Next"**

### 1.4 Business Details
- **Industry category**: `Technology` → `Software`
- **Business size**: `Small business` (or appropriate size)
- **Business objectives**: Select all that apply:
  - ✅ **Generate leads**
  - ✅ **Drive online sales**
  - ✅ **Understand users**
  - ✅ **Optimize user experience**
- Click **"Next"**

### 1.5 Data Stream Setup
- **Platform**: `Web`
- **Website URL**: `https://yourdomain.com` (or `http://localhost:3000` for development)
- **Stream name**: `ChristianKit Main Website`
- Click **"Create stream"**

## 🔑 **Step 2: Get Your Measurement ID**

After creating the stream, you'll see a **Measurement ID** that looks like: `G-XXXXXXXXXX`

**⚠️ IMPORTANT: Copy this ID - you'll need it for the next steps!**

## 🔧 **Step 3: Configure Environment Variables**

### 3.1 Update Your `.env` File
Add this line to your `.env` file:

```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Replace `G-XXXXXXXXXX` with your actual Measurement ID from Step 2.**

### 3.2 Verify Configuration
Make sure your `env.example` file also has this variable for reference.

## 🎯 **Step 4: Configure GA4 Goals & Conversions**

### 4.1 Go to GA4 Admin
- In your GA4 dashboard, click the gear icon (⚙️) in the bottom left
- Click **"Events"** under **"Configure"**

### 4.2 Create Custom Events
Click **"Create Event"** and create these events:

#### Subscription Started
- **Event name**: `subscription_started`
- **Parameter**: `plan` (string)
- **Trigger**: When user clicks subscription button

#### Subscription Completed
- **Event name**: `subscription_completed`
- **Parameter**: `plan` (string), `value` (number)
- **Trigger**: When subscription payment succeeds

#### Feature Usage
- **Event name**: `feature_used`
- **Parameter**: `feature_name` (string), `action` (string)
- **Trigger**: When user uses Pro features

#### Prayer Session
- **Event name**: `prayer_session_completed`
- **Parameter**: `duration` (number), `type` (string)
- **Trigger**: When prayer timer completes

### 4.3 Mark as Conversions
- Go back to **"Events"**
- Click the toggle next to each event to mark it as a **conversion**

## 💰 **Step 5: Set Up E-commerce Tracking**

### 5.1 Enable Enhanced E-commerce
- Go to **"Admin"** → **"Data Streams"**
- Click on your web stream
- Click **"Configure"** → **"Enhanced measurement"**
- Enable **"E-commerce"**

### 5.2 Configure Subscription Products
In your GA4 dashboard, go to **"Configure"** → **"Custom definitions"**:

#### Product Parameters
- **Parameter name**: `subscription_plan`
- **Scope**: `Event`
- **Description**: `Type of subscription plan`

- **Parameter name**: `subscription_value`
- **Scope**: `Event`
- **Description**: `Subscription price`

## 📊 **Step 6: Set Up Custom Dimensions**

### 6.1 User Properties
Go to **"Configure"** → **"Custom definitions"** → **"User properties"**:

- **Property name**: `user_type`
- **Description**: `Free or Pro user`
- **Scope**: `User`

- **Property name**: `has_subscription`
- **Description**: `Whether user has active subscription`
- **Scope**: `User`

### 6.2 Event Parameters
Under **"Event parameters"**:

- **Parameter name**: `feature_name`
- **Description**: `Name of the feature being used`
- **Scope**: `Event`

- **Parameter name**: `session_duration`
- **Description**: `Duration of prayer/meditation session`
- **Scope**: `Event`

## 🔍 **Step 7: Test Your Setup**

### 7.1 Real-time Reports
- Go to **"Reports"** → **"Realtime"**
- Open your ChristianKit app in another tab
- Perform some actions (navigate, use features)
- Check if events appear in real-time

### 7.2 Debug View
- Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
- Enable debug mode
- Check browser console for GA4 debug messages

## 📱 **Step 8: Mobile App Tracking (Future)**

When you create a mobile app version:

1. **Create new data stream** for mobile app
2. **Install Firebase SDK** for mobile analytics
3. **Link Firebase** to GA4 property
4. **Track cross-platform** user behavior

## 🎯 **Step 9: Create Custom Reports**

### 9.1 User Engagement Report
- **Metrics**: Active users, engagement rate, session duration
- **Dimensions**: User type, subscription status
- **Time period**: Last 30 days

### 9.2 Conversion Funnel Report
- **Steps**: 
  1. Page view (subscription page)
  2. Subscription started
  3. Subscription completed
- **Goal**: Track conversion rate from free to Pro

### 9.3 Feature Usage Report
- **Metrics**: Event count, unique users
- **Dimensions**: Feature name, user type
- **Insight**: Which Pro features are most valuable

## 🔧 **Step 10: Advanced Configuration**

### 10.1 Enhanced Measurement
Enable these features in **"Data Streams"** → **"Enhanced measurement"**:

- ✅ **Page views**
- ✅ **Scrolls**
- ✅ **Outbound clicks**
- ✅ **Site search**
- ✅ **Video engagement**
- ✅ **File downloads**

### 10.2 Data Retention
- Go to **"Admin"** → **"Data Settings"** → **"Data Retention"**
- Set **"User and event data retention"** to **26 months**
- Set **"Reset on new activity"** to **ON**

### 10.3 Data Filters
Create filters to exclude:
- **Internal traffic** (your IP addresses)
- **Bot traffic**
- **Development environment** (localhost)

## 📈 **Step 11: Key Metrics to Monitor**

### 11.1 User Acquisition
- **Traffic sources**: Where users come from
- **Campaign performance**: Marketing campaign effectiveness
- **Geographic data**: User locations

### 11.2 User Engagement
- **Session duration**: How long users stay
- **Pages per session**: How many pages they view
- **Bounce rate**: Single-page sessions

### 11.3 Conversion Metrics
- **Free to Pro conversion rate**: Target 5-15%
- **Subscription revenue**: Monthly recurring revenue
- **Churn rate**: Subscription cancellations

### 11.4 Feature Performance
- **Most used features**: What users love
- **Feature adoption**: Pro feature usage rates
- **User satisfaction**: Session duration by feature

## 🚨 **Step 12: Troubleshooting**

### 12.1 Common Issues

#### No Data Appearing
- ✅ Check Measurement ID is correct
- ✅ Verify environment variables are loaded
- ✅ Check browser console for errors
- ✅ Ensure GA4 is initialized before tracking

#### Events Not Tracking
- ✅ Verify event names match GA4 configuration
- ✅ Check if events are marked as conversions
- ✅ Ensure proper event parameters

#### Real-time Data Missing
- ✅ Check if ad blockers are enabled
- ✅ Verify GA4 property is active
- ✅ Check data stream configuration

### 12.2 Debug Commands
Add these to your browser console to test:

```javascript
// Check if GA4 is loaded
console.log(window.gtag);

// Test event tracking
gtag('event', 'test_event', {
  event_category: 'test',
  event_label: 'debug'
});
```

## 📚 **Step 13: Resources & Support**

### 13.1 Official Documentation
- [GA4 Setup Guide](https://support.google.com/analytics/answer/10089681)
- [GA4 Events Guide](https://support.google.com/analytics/answer/10085872)
- [GA4 E-commerce Guide](https://support.google.com/analytics/answer/1009612)

### 13.2 Community Support
- [Google Analytics Community](https://support.google.com/analytics/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-analytics-4)
- [Reddit r/analytics](https://www.reddit.com/r/analytics/)

## 🎯 **Next Steps After Setup**

1. **Wait 24-48 hours** for data to populate
2. **Review real-time reports** to verify tracking
3. **Set up automated reports** for key metrics
4. **Create custom dashboards** for your team
5. **Set up alerts** for important changes
6. **Integrate with other tools** (Google Ads, Search Console)

## ✅ **Setup Checklist**

- [ ] GA4 account created
- [ ] Property configured
- [ ] Data stream set up
- [ ] Measurement ID copied
- [ ] Environment variables updated
- [ ] Custom events created
- [ ] Conversions marked
- [ ] E-commerce enabled
- [ ] Custom dimensions configured
- [ ] Real-time tracking verified
- [ ] Debug mode tested
- [ ] First events tracked

---

**🎉 Congratulations!** You've successfully set up Google Analytics 4 for ChristianKit. 

**Need help?** Check the troubleshooting section or refer to Google's official documentation. Your analytics data will start appearing within 24-48 hours!
