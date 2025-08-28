# 🌅 Sunrise/Sunset Prayer Timing Setup Guide

## 🚀 **Overview**

The Sunrise/Sunset Prayer feature connects users with ancient Christian prayer traditions by automatically calculating prayer times based on their local sunrise and sunset. This creates an authentic, location-based prayer experience that follows centuries-old traditions.

## ✨ **Features**

- **🌅 Location-based timing** - Prayer times sync with local sunrise/sunset
- **⛪ Ancient traditions** - Lauds, Terce, Sext, None, Vespers, Compline
- **📱 Real-time updates** - Current time and next prayer display
- **🌍 Automatic geolocation** - Browser-based location detection
- **⏰ Smart notifications** - Reminders at optimal prayer times
- **📚 Biblical references** - Scripture for each prayer tradition

## 🔧 **Required Setup**

### **1. Environment Variables**

Add these to your `.env` file:

```bash
# Sunrise/Sunset API (Free, no key required)
# Uses: https://api.sunrise-sunset.org/

# Timezone API (Optional - for better timezone detection)
VITE_TIMEZONE_API_KEY=your_timezone_db_key_here

# Geocoding API (Optional - for city/country names)
VITE_OPENCAGE_API_KEY=your_opencage_key_here
```

#### **API Services:**

- **Sunrise/Sunset API**: Free, no key required
- **TimezoneDB**: Free tier available at [timezonedb.com](https://timezonedb.com/)
- **OpenCage**: Free tier available at [opencagedata.com](https://opencagedata.com/)

### **2. Database Setup**

Run the SQL script in your Supabase database:

```bash
# Copy and paste the contents of:
scripts/sunrise-sunset-setup.sql
```

This creates:
- `user_locations` - Store user coordinates and timezone
- `prayer_times` - Daily prayer schedule for each user
- `prayer_preferences` - User preferences for prayer timing
- `active_prayer_times` - View combining all prayer data

### **3. Component Integration**

Add the component to your main app:

```tsx
import SunriseSunsetPrayer from './components/SunriseSunsetPrayer';

// In your main component or page:
<SunriseSunsetPrayer />
```

## 📱 **How It Works**

### **Prayer Time Calculation**

1. **User enables location** - Browser geolocation or manual input
2. **Get coordinates** - Latitude/longitude from user's location
3. **Fetch sunrise/sunset** - From free API based on coordinates
4. **Calculate prayer times** - Using ancient tradition offsets:
   - **Morning Prayer (Lauds)**: 30 min before sunrise
   - **Sunrise Prayer**: At sunrise
   - **Mid-Morning (Terce)**: 3 hours after sunrise
   - **Noon Prayer (Sext)**: 6 hours after sunrise
   - **Mid-Afternoon (None)**: 9 hours after sunrise
   - **Evening Prayer (Vespers)**: At sunset
   - **Evening Prayer**: 30 min after sunset
   - **Night Prayer (Compline)**: 2 hours after sunset

### **Location Detection**

- **Primary**: Browser geolocation API
- **Fallback**: Manual location input
- **Timezone**: Automatic detection from coordinates
- **City/Country**: Reverse geocoding (if API key provided)

## 🎨 **UI Components**

### **Main Display**
- **Header**: Current time, location, next prayer countdown
- **Sunrise/Sunset Cards**: Beautiful gradient cards with times
- **Prayer Schedule**: Grid of all daily prayer times
- **Ancient Traditions**: Educational information about prayer history
- **Location Settings**: Update location and preferences

### **Interactive Elements**
- **Location Enable**: One-click location permission
- **Prayer Start**: Button appears when it's prayer time
- **Real-time Updates**: Countdown timers and current prayer highlighting
- **Responsive Design**: Works on all device sizes

## 🔐 **Privacy & Security**

- **Location data** is stored securely in Supabase
- **No third-party tracking** - Only used for prayer timing
- **User control** - Can disable location at any time
- **Data encryption** - All location data is encrypted in transit

## 🚀 **Advanced Features**

### **Custom Prayer Times**
Users can override sunrise/sunset timing with custom times:
- Custom morning prayer time
- Custom evening prayer time
- Prayer reminder tolerance (minutes before/after)

### **Quiet Hours**
- Set quiet hours when notifications won't be sent
- Default: 10 PM - 6 AM
- Respects user's sleep schedule

### **Sound Preferences**
- Enable/disable different notification sounds
- Gregorian chants (optional)
- Whispered scripture
- Gentle bells

## 📊 **Database Schema**

### **user_locations**
```sql
- user_id (UUID, primary key)
- latitude (DECIMAL)
- longitude (DECIMAL)
- timezone (TEXT)
- city (TEXT, optional)
- country (TEXT, optional)
- is_active (BOOLEAN)
```

### **prayer_times**
```sql
- user_id (UUID)
- date (DATE)
- prayer_type (TEXT)
- scheduled_time (TIME)
- is_completed (BOOLEAN)
- is_active (BOOLEAN)
```

### **prayer_preferences**
```sql
- user_id (UUID)
- use_sunrise_sunset (BOOLEAN)
- custom_morning_time (TIME)
- custom_evening_time (TIME)
- enable_ancient_traditions (BOOLEAN)
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Location Permission Denied**
   - Check browser settings
   - Ensure HTTPS is enabled (required for geolocation)
   - Try refreshing the page

2. **Prayer Times Not Loading**
   - Verify database tables are created
   - Check browser console for errors
   - Ensure location is enabled

3. **Timezone Issues**
   - Verify timezone API key is set
   - Check fallback timezone calculation
   - Test with different locations

### **Debug Mode**

Enable console logging to see detailed information:
```typescript
// In sunriseSunsetService.ts
console.log('Location data:', location);
console.log('Sunrise/sunset data:', sunriseData);
console.log('Calculated prayer times:', prayerTimes);
```

## 🌟 **Future Enhancements**

### **Planned Features**
1. **Sacred Sound Library** - Custom prayer sounds
2. **Streak Notifications** - Celebrate prayer consistency
3. **Missed You Messages** - Gentle reminders for inactive users
4. **Seasonal Adjustments** - Account for daylight saving time
5. **Prayer Communities** - Share prayer times with groups

### **API Integrations**
- **Weather API** - Adjust prayer times for weather conditions
- **Astronomical API** - More precise celestial timing
- **Cultural API** - Local prayer traditions and customs

## 📚 **Resources**

### **Ancient Prayer Traditions**
- **Lauds**: Morning praise and thanksgiving
- **Terce**: Third hour prayer for guidance
- **Sext**: Sixth hour prayer for devotion
- **None**: Ninth hour prayer for reflection
- **Vespers**: Evening praise and thanksgiving
- **Compline**: Night prayer for peace

### **Biblical References**
- Psalm 5:3 - Morning prayer
- Psalm 19:2 - Sunrise praise
- Psalm 55:17 - Three times daily prayer
- Psalm 141:2 - Evening sacrifice
- Psalm 4:8 - Evening peace

## 🎯 **Getting Started**

1. **Set up environment variables**
2. **Run database SQL script**
3. **Import component into your app**
4. **Test with location permission**
5. **Customize prayer preferences**
6. **Enjoy authentic prayer timing!**

---

**Your ChristianKit now supports ancient prayer traditions with modern technology!** 🙏✨

Users can connect with centuries-old prayer practices while staying perfectly synced with their local daylight cycles.

