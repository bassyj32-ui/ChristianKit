# Fix Supabase 404 Errors - Step by Step Guide

## Problem: 404 Errors with Supabase OAuth

The 404 errors you're experiencing are caused by incorrect OAuth redirect URL configuration in your Supabase project. This is a common issue when deploying to Vercel.

## ✅ Step 1: Check Your Current Environment Variables

Based on your `env.example` file, you need to set up these environment variables:

```env
VITE_SUPABASE_URL=https://hrznuhcwdjnpasfnqqwp.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**Action Required:** 
1. Create a `.env` file in your project root
2. Add the above variables with your actual Supabase anon key
3. For Vercel deployment, add these same variables to your Vercel environment settings

## ✅ Step 2: Fix Supabase OAuth Redirect URLs

### 2.1 Go to Your Supabase Dashboard
1. Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (ID: hrznuhcwdjnpasfnqqwp)

### 2.2 Configure Authentication URLs
1. Navigate to **Authentication** → **URL Configuration**
2. Add these URLs to the **Redirect URLs** section:

```
http://localhost:5173/
http://localhost:5173/auth/callback
http://localhost:5173/callback
https://christian-kit.vercel.app/
https://christian-kit.vercel.app/auth/callback
https://christian-kit.vercel.app/callback
```

**Important:** Replace `christian-kit.vercel.app` with your actual Vercel domain.

### 2.3 Set Site URL
Set the **Site URL** to your main domain:
```
https://christian-kit.vercel.app
```

## ✅ Step 3: Configure Google OAuth (If Using Google Sign-In)

### 3.1 In Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID

### 3.2 Add Authorized Redirect URIs
Add this URI to **Authorized redirect URIs**:
```
https://hrznuhcwdjnpasfnqqwp.supabase.co/auth/v1/callback
```

## ✅ Step 4: Update Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your ChristianKit project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `VITE_SUPABASE_URL` = `https://hrznuhcwdjnpasfnqqwp.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_actual_anon_key`

## ✅ Step 5: Redeploy Your Application

After making these changes:
1. Redeploy your Vercel application
2. Clear your browser cache
3. Test the authentication flow

## 🔍 How to Get Your Supabase Anon Key

1. In your Supabase dashboard
2. Go to **Settings** → **API**
3. Copy the **anon/public** key (not the service_role key)

## 🐛 Common Issues and Solutions

### Issue 1: "OAuth client not found"
- **Cause:** Google OAuth client ID not configured properly
- **Solution:** Verify the redirect URI in Google Cloud Console matches your Supabase callback URL

### Issue 2: "redirect_uri_mismatch"
- **Cause:** URL mismatch between your app and Supabase configuration
- **Solution:** Ensure all URLs exactly match (check for trailing slashes)

### Issue 3: Still getting 404 errors
- **Cause:** Environment variables not loaded in production
- **Solution:** Check Vercel environment variables and redeploy

## 🚀 Test Your Configuration

After completing these steps, test with:
1. `npm run dev` locally
2. Try Google sign-in on localhost
3. Deploy to Vercel and test again

## 📞 Need Help?

If you're still getting 404 errors after following these steps:
1. Check browser console for specific error messages
2. Verify all URLs are correctly configured
3. Ensure environment variables are set in both local and production
4. Try clearing all browser data and testing again

---

**Current Status:** Your Supabase URL is configured, but you need to:
1. Add the anon key to your environment variables
2. Configure OAuth redirect URLs in Supabase
3. Set up Google OAuth redirect URIs (if using Google auth)


