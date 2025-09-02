# 🚀 Supabase Database Setup Guide - Fix User Data Storage

## 🎯 **Problem Solved**
Your Supabase authentication was working, but users couldn't store data because:
1. Missing database tables for user data
2. Row Level Security (RLS) policies not configured
3. Authentication callback handling issues
4. No user profile creation on sign-in

## ✅ **What We Fixed**

### 1. **Database Tables Created**
- `user_profiles` - Stores basic user information
- `user_sessions` - Tracks prayer, bible, meditation, and journal sessions
- `user_achievements` - Stores user badges and milestones
- `user_goals` - Tracks daily/weekly goals

### 2. **Authentication Flow Fixed**
- OAuth callback now handles both query parameters and hash parameters
- User profiles automatically created when users first sign in
- Better error handling and logging

### 3. **Data Services Added**
- `UserService` class for all user data operations
- Proper error handling and null checks
- Type-safe interfaces for all data structures

## 🚀 **Step-by-Step Setup**

### **Step 1: Run Database Setup Script**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (ID: `hrznuhcwdjnpasfnqqwp`)
3. Navigate to **SQL Editor**
4. Copy and paste the entire contents of `scripts/setup-supabase-db.sql`
5. Click **Run** to execute the script

### **Step 2: Verify Tables Created**

After running the script, you should see:
- **Core tables**: `user_profiles`, `user_sessions`, `user_achievements`, `user_goals`
- **Community tables**: `posts`, `prayers`, `post_interactions`, `hashtags`, `followers`, `notifications`
- All tables have Row Level Security enabled
- Proper indexes for performance
- RLS policies for data access control
- Automatic triggers for count updates
- Trending posts view

### **Step 3: Test Authentication**

1. Start your development server: `npm run dev`
2. Try signing in with Google
3. Check browser console for authentication logs
4. Verify user profile is created in Supabase

### **Step 4: Test Data Storage**

1. After signing in, try creating a prayer session
2. Check if data appears in the `user_sessions` table
3. Verify RLS policies are working correctly

## 🔧 **Code Changes Made**

### **Files Updated:**
- `src/components/SupabaseAuthProvider.tsx` - Added user profile creation
- `src/pages/AuthCallback.tsx` - Fixed OAuth callback handling
- `src/utils/supabase.ts` - Improved client configuration
- `src/services/userService.ts` - New service for user operations

### **Files Created:**
- `supabase/migrations/003_create_user_profiles.sql` - User profiles table
- `scripts/setup-supabase-db.sql` - Complete database setup script
- `SUPABASE_DATABASE_SETUP.md` - This setup guide

## 🧪 **Testing Your Setup**

### **Test 1: Authentication Flow**
```typescript
// In browser console, after signing in:
console.log('User:', user)
console.log('Session:', session)
```

### **Test 2: User Profile Creation**
```typescript
// Check if profile was created
const profile = await userService.getCurrentUserProfile()
console.log('Profile:', profile)
```

### **Test 3: Data Storage**
```typescript
// Try creating a session
const session = await userService.createUserSession({
  user_id: user.id,
  activity_type: 'prayer',
  duration_minutes: 15,
  completed: true,
  completed_duration: 15,
  session_date: new Date().toISOString().split('T')[0]
})
console.log('Session created:', session)
```

## 🐛 **Troubleshooting**

### **Issue: "Table doesn't exist"**
- Run the database setup script again
- Check if you're in the correct Supabase project

### **Issue: "Permission denied"**
- Verify RLS policies are created
- Check if user is properly authenticated
- Ensure `auth.uid()` matches the user ID

### **Issue: "OAuth callback failed"**
- Check Supabase OAuth redirect URLs configuration
- Verify Google OAuth client settings
- Check browser console for specific error messages

### **Issue: "User profile not created"**
- Check browser console for profile creation errors
- Verify `user_profiles` table exists
- Check RLS policies on the table

## 📊 **Monitoring Data Storage**

### **Check User Profiles:**
```sql
SELECT * FROM user_profiles ORDER BY created_at DESC;
```

### **Check Community Tables:**
```sql
-- Check posts
SELECT COUNT(*) as post_count FROM posts;

-- Check prayers (comments)
SELECT COUNT(*) as prayer_count FROM prayers;

-- Check interactions
SELECT COUNT(*) as interaction_count FROM post_interactions;

-- Check trending posts
SELECT * FROM trending_posts LIMIT 5;
```

### **Check User Sessions:**
```sql
SELECT * FROM user_sessions ORDER BY created_at DESC;
```

### **Check RLS Policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🎉 **Success Indicators**

✅ Users can sign in with Google  
✅ User profiles are automatically created  
✅ Data can be stored in `user_sessions` table  
✅ Row Level Security is working  
✅ No permission errors in console  

## 🔄 **Next Steps**

1. **Test the complete flow** - Sign in and create some data
2. **Monitor Supabase dashboard** - Check tables and user data
3. **Implement additional features** - Use the `UserService` for new functionality
4. **Add data visualization** - Show user progress and achievements

## 📞 **Need Help?**

If you encounter issues:
1. Check browser console for error messages
2. Verify all tables exist in Supabase dashboard
3. Test with a fresh browser session
4. Check Supabase logs for authentication errors

---

**🎯 Your Supabase setup should now work perfectly for storing user data!**
