# Complete Supabase Setup Guide - What We Did to Fix Everything

## 🎯 Summary
We successfully set up Supabase OAuth authentication with Google Sign-In. The main issues were OAuth redirect URL configuration and Vercel routing - NOT the Supabase integration itself.

---

## 📋 Step-by-Step Setup Process

### 1. **Environment Variables Setup**

#### Local Development (`.env` or `.env.local`):
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Production (Vercel Environment Variables):
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables for "All Environments":
   - `VITE_SUPABASE_URL` = `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_anon_key_here`

**⚠️ Important:** After adding environment variables to Vercel, you MUST redeploy for them to take effect.

---

### 2. **Supabase Dashboard Configuration**

#### 2.1 Get Your Credentials:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (for `VITE_SUPABASE_URL`)
   - **anon/public key** (for `VITE_SUPABASE_ANON_KEY`)

#### 2.2 Configure OAuth Redirect URLs:
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your main domain:
   ```
   https://your-app.vercel.app
   ```
3. Add **Redirect URLs** (all 6 URLs):
   ```
   http://localhost:5173/
   http://localhost:5173/auth/callback
   http://localhost:5173/callback
   https://your-app.vercel.app/
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/callback
   ```
4. **Save changes**

---

### 3. **Google OAuth Configuration** (If using Google Sign-In)

#### 3.1 Google Cloud Console Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Add **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

#### 3.2 Supabase Google Provider Setup:
1. In Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google Client ID and Client Secret
4. **Save configuration**

---

### 4. **Code Implementation**

#### 4.1 Supabase Client (`src/utils/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const auth = supabase?.auth || null
```

#### 4.2 React Router Setup (`src/App.tsx`):
```typescript
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/callback" element={<AuthCallback />} />
      <Route path="/*" element={<AppContent />} />
    </Routes>
  )
}
```

#### 4.3 Auth Provider (`src/components/SupabaseAuthProvider.tsx`):
```typescript
const signInWithGoogle = async () => {
  const currentOrigin = window.location.origin
  const redirectUrl = `${currentOrigin}/auth/callback`
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  })
  
  if (error) throw error
}
```

#### 4.4 Auth Callback Handler (`src/pages/AuthCallback.tsx`):
```typescript
export default function AuthCallback() {
  useEffect(() => {
    const process = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      
      if (hashParams.has('access_token')) {
        const access_token = hashParams.get('access_token') || ''
        const refresh_token = hashParams.get('refresh_token') || ''
        
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
        }
      }
      
      // Redirect back to app
      setTimeout(() => {
        window.history.replaceState({}, document.title, '/')
        window.location.replace('/')
      }, 1500)
    }
    process()
  }, [])

  return <div>Signing you in...</div>
}
```

---

### 5. **Vercel Configuration (CRITICAL FIX)**

#### 5.1 Add `vercel.json` in project root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**⚠️ This was the KEY fix!** Without the rewrites, Vercel returns 404 for `/callback` routes.

---

## 🚨 Common Issues and Solutions

### Issue 1: 404 NOT_FOUND Error
- **Cause:** Missing Vercel rewrites configuration
- **Solution:** Add `rewrites` to `vercel.json` (see above)

### Issue 2: "redirect_uri_mismatch"
- **Cause:** Redirect URLs don't match between Supabase and your app
- **Solution:** Ensure all URLs exactly match (check trailing slashes)

### Issue 3: "OAuth client not found"
- **Cause:** Google OAuth not configured properly
- **Solution:** Add Supabase callback URL to Google Cloud Console

### Issue 4: Environment Variables Not Working
- **Cause:** Variables not set in production or need redeployment
- **Solution:** Set in Vercel dashboard and redeploy

---

## ✅ Testing Checklist

### Local Testing:
- [ ] `npm run dev` starts without errors
- [ ] Google sign-in works on `localhost:5173`
- [ ] No console errors during auth flow
- [ ] User gets redirected back to app after auth

### Production Testing:
- [ ] Environment variables set in Vercel
- [ ] Deployment successful with latest code
- [ ] Google sign-in works on production domain
- [ ] No 404 errors on `/callback` route

---

## 🎯 Key Learnings

1. **Supabase OAuth works perfectly** - the issue was almost always configuration
2. **Vercel rewrites are essential** for client-side routing
3. **Environment variables must be set in both local and production**
4. **OAuth redirect URLs must be exactly configured** in both Supabase and Google
5. **The `/callback` route is handled by React Router**, not a physical file

---

## 🚀 Quick Setup for New Projects

1. Create Supabase project and get credentials
2. Add environment variables (local + Vercel)
3. Configure OAuth redirect URLs in Supabase
4. Set up Google OAuth (if needed)
5. Add Vercel rewrites configuration
6. Implement auth code (copy from this project)
7. Test locally, then deploy and test production

**Remember:** Most "Supabase issues" are actually configuration issues, not code issues!

