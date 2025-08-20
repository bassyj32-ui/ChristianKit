# Supabase OAuth Setup Guide

## Fixing the "404 not found" OAuth Error

The error you're experiencing is because the OAuth redirect URLs in your Supabase project don't match the URLs your app is using.

## Step 1: Configure Supabase OAuth Redirect URLs

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Authentication Settings**
   - Go to **Authentication** → **URL Configuration**
   - Or go to **Settings** → **Auth** → **URL Configuration**

3. **Add Redirect URLs**
   Add these URLs to the **Redirect URLs** field:

   ```
   http://localhost:5173/
   http://localhost:5173/auth/callback
   https://your-domain.com/
   https://your-domain.com/auth/callback
   ```

   Replace `your-domain.com` with your actual domain (e.g., `christiankit.vercel.app`)

4. **Save the Configuration**
   - Click **Save** to apply the changes

## Step 2: Configure Google OAuth (if using Google Sign-In)

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Select your project

2. **Navigate to OAuth 2.0 Client IDs**
   - Go to **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID for your web application

3. **Add Authorized Redirect URIs**
   Add these URIs to the **Authorized redirect URIs**:

   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

   Replace `your-project-ref` with your actual Supabase project reference.

## Step 3: Test the Configuration

1. **Clear your browser cache and cookies**
2. **Try signing in again**
3. **Check the browser console for any errors**

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**
   - Make sure the redirect URL in your Supabase dashboard exactly matches what your app is using
   - Check for trailing slashes and protocol (http vs https)

2. **"OAuth client not found" error**
   - Verify your Google OAuth client ID is correct
   - Make sure the redirect URI in Google Cloud Console matches your Supabase callback URL

3. **"404 not found" error**
   - This usually means the redirect URL isn't configured in Supabase
   - Double-check the redirect URLs in your Supabase dashboard

### Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Debug Mode

To debug OAuth issues, check the browser console for detailed error messages. The app now includes better error handling and logging.

## Alternative: Use Root URL Only

If you continue having issues with the `/auth/callback` route, you can simplify by using only the root URL:

1. **Update Supabase redirect URLs** to only include:
   ```
   http://localhost:5173/
   https://your-domain.com/
   ```

2. **The app will handle OAuth callbacks on the main page** and clean up the URL automatically.

## Support

If you're still experiencing issues:
1. Check the browser console for specific error messages
2. Verify all URLs are correctly configured in both Supabase and Google Cloud Console
3. Make sure your environment variables are set correctly
4. Try the simplified root URL approach
