# 🔥 Firebase Authentication Setup Guide

## Quick Setup for ChristianKit

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `ChristianKit`
4. Follow the setup wizard

### Step 2: Enable Google Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains (for now, add `localhost`)

### Step 3: Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app
4. Register app with name: `ChristianKit Web`
5. Copy the config object

### Step 4: Create Environment File

Create a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 5: Test Authentication

1. Run `npm run dev`
2. Open http://localhost:5173
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should see the main app interface

## Troubleshooting

**If you see "Configuration Required" error:**
- Make sure your `.env` file exists
- Check that all Firebase config values are correct
- Restart the development server

**If Google sign-in doesn't work:**
- Check that Google provider is enabled in Firebase Console
- Verify your domain is in authorized domains
- Check browser console for errors

## Next Steps

Once authentication is working:
1. Test the prayer timer
2. Test the dashboard
3. Test the community section
4. Add payment integration later

---

**Authentication is now the only focus! 🔐✨**
