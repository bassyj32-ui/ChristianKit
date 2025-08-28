# 🔐 Authentication & User Profiles Setup Guide

This guide will help you set up the complete authentication system with user profiles for ChristianKit.

## 🚀 Quick Start

### 1. Environment Variables
Make sure you have these environment variables set in your `.env.local` file:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
Run the SQL commands from `database-setup.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Run the script

### 3. Storage Bucket Setup
Create a storage bucket for user avatars:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `avatars`
3. Set it to public
4. Set the following policy for authenticated users:

```sql
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 🔧 Components Overview

### AuthButton Component
- **Location**: `src/components/AuthButton.tsx`
- **Purpose**: Handles sign-in/sign-out and shows user profile button
- **Features**:
  - Google OAuth sign-in
  - User avatar display
  - Profile modal trigger
  - Sign-out functionality

### UserProfile Component
- **Location**: `src/components/UserProfile.tsx`
- **Purpose**: Full user profile management
- **Features**:
  - Profile editing
  - Avatar upload
  - Bio, location, website management
  - Follower/following counts
  - Post count display

### UserProfileService
- **Location**: `src/services/userProfileService.ts`
- **Purpose**: Backend API calls for user profiles
- **Features**:
  - Profile CRUD operations
  - Avatar upload to Supabase Storage
  - Follow/unfollow functionality
  - User search

## 🎯 Key Features

### 1. Google OAuth Authentication
- Seamless sign-in with Google accounts
- Automatic profile creation on first sign-in
- Secure session management

### 2. User Profiles
- **Display Name**: Public name shown to other users
- **Handle**: Unique @username for mentions
- **Avatar**: Profile picture with upload capability
- **Bio**: Personal description
- **Location**: City/Country
- **Website**: Personal website link

### 3. Social Features
- **Followers/Following**: Track connections
- **Post Counts**: Automatic counting of user posts
- **Interaction Tracking**: Amen, Love, and Prayer counts

### 4. Security
- **Row Level Security (RLS)**: Database-level access control
- **User Isolation**: Users can only modify their own data
- **Secure File Uploads**: Avatar uploads with user validation

## 📱 Usage Examples

### Sign In
```tsx
import { AuthButton } from './components/AuthButton'

function Header() {
  return (
    <header>
      <AuthButton />
    </header>
  )
}
```

### Access User Data
```tsx
import { useSupabaseAuth } from './components/SupabaseAuthProvider'
import { getCurrentUserProfile } from './services/userProfileService'

function MyComponent() {
  const { user } = useSupabaseAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (user) {
      getCurrentUserProfile().then(setProfile)
    }
  }, [user])

  if (!user) return <div>Please sign in</div>
  
  return (
    <div>
      <h1>Welcome, {profile?.display_name}!</h1>
      <p>@{profile?.handle}</p>
    </div>
  )
}
```

### Update Profile
```tsx
import { updateUserProfile } from './services/userProfileService'

const handleSave = async () => {
  const success = await updateUserProfile({
    display_name: 'New Name',
    bio: 'Updated bio',
    location: 'New York, USA'
  })
  
  if (success) {
    console.log('Profile updated!')
  }
}
```

### Upload Avatar
```tsx
import { uploadAvatar } from './services/userProfileService'

const handleAvatarUpload = async (file) => {
  const avatarUrl = await uploadAvatar(file)
  if (avatarUrl) {
    console.log('Avatar uploaded:', avatarUrl)
  }
}
```

## 🗄️ Database Schema

### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  handle VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  website VARCHAR(255),
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Relationships
- **Posts**: `posts.author_id` → `user_profiles.id`
- **Interactions**: `post_interactions.user_id` → `user_profiles.id`
- **Prayers**: `prayers.author_id` → `user_profiles.id`
- **Followers**: `followers.follower_id` and `following_id` → `user_profiles.id`

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only view their own notifications
- Users can only modify their own profiles
- Users can only create posts as themselves
- Public read access for posts and profiles

### Authentication Guards
- Protected routes require authentication
- Profile editing requires user ownership
- File uploads validate user identity

## 🚨 Troubleshooting

### Common Issues

1. **"Supabase client not initialized"**
   - Check environment variables
   - Ensure `.env.local` is in project root
   - Restart development server

2. **"OAuth redirect URL mismatch"**
   - Verify redirect URL in Supabase Auth settings
   - Should be: `https://yourdomain.com/auth/callback`
   - For localhost: `http://localhost:5173/auth/callback`

3. **"Storage bucket not found"**
   - Create `avatars` bucket in Supabase Storage
   - Set bucket to public
   - Apply storage policies

4. **"Permission denied" errors**
   - Check RLS policies are enabled
   - Verify user is authenticated
   - Check table permissions

### Debug Mode
Enable debug logging by adding to your component:

```tsx
useEffect(() => {
  console.log('Current user:', user)
  console.log('User profile:', profile)
}, [user, profile])
```

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set
3. Ensure database schema is properly created
4. Check Supabase dashboard for any service issues

---

**Happy coding! 🙏✨**
