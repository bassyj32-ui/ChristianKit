import { supabase } from '../utils/supabase'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  display_name: string
  handle: string
  avatar_url: string
  bio: string
  location: string
  website: string
  created_at: string
  updated_at: string
  is_verified: boolean
  follower_count: number
  following_count: number
  post_count: number
}

export interface ProfileUpdateData {
  display_name?: string
  handle?: string
  bio?: string
  location?: string
  website?: string
}

// Get user profile by ID
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return null
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return profile
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// Get current user's profile
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return null
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return await getUserProfile(user.id)
  } catch (error) {
    console.error('Error fetching current user profile:', error)
    return null
  }
}

// Update user profile
export const updateUserProfile = async (profileData: ProfileUpdateData): Promise<boolean> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return false
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating user profile:', error)
    return false
  }
}

// Upload avatar image
export const uploadAvatar = async (file: File): Promise<string | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return null
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile with new avatar URL
    await updateUserProfile({ avatar_url: publicUrl })

    return publicUrl
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return null
  }
}

// Search users by handle or display name
export const searchUsers = async (query: string, limit: number = 10): Promise<UserProfile[]> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return []
    }

    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit)

    if (error) throw error
    return profiles || []
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}

// Follow a user
export const followUser = async (userIdToFollow: string): Promise<boolean> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return false
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('followers')
      .select()
      .eq('follower_id', user.id)
      .eq('following_id', userIdToFollow)
      .single()

    if (existingFollow) {
      // Unfollow
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userIdToFollow)

      // Update follower counts
      await supabase.rpc('decrement_follower_count', { user_id: userIdToFollow })
      await supabase.rpc('decrement_following_count', { user_id: user.id })

      return false
    } else {
      // Follow
      await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: userIdToFollow
        })

      // Update follower counts
      await supabase.rpc('increment_follower_count', { user_id: userIdToFollow })
      await supabase.rpc('increment_following_count', { user_id: user.id })

      return true
    }
  } catch (error) {
    console.error('Error following/unfollowing user:', error)
    return false
  }
}

// Get user's followers
export const getUserFollowers = async (userId: string, limit: number = 20): Promise<UserProfile[]> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return []
    }

    const { data: followers, error } = await supabase
      .from('followers')
      .select(`
        follower_id,
        user_profiles!followers_follower_id_fkey(*)
      `)
      .eq('following_id', userId)
      .limit(limit)

    if (error) throw error
    return (followers || []).map(f => f.user_profiles).filter(Boolean)
  } catch (error) {
    console.error('Error fetching followers:', error)
    return []
  }
}

// Get user's following
export const getUserFollowing = async (userId: string, limit: number = 20): Promise<UserProfile[]> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return []
    }

    const { data: following, error } = await supabase
      .from('followers')
      .select(`
        following_id,
        user_profiles!followers_following_id_fkey(*)
      `)
      .eq('follower_id', userId)
      .limit(limit)

    if (error) throw error
    return (following || []).map(f => f.user_profiles).filter(Boolean)
  } catch (error) {
    console.error('Error fetching following:', error)
    return []
  }
}

// Check if current user is following another user
export const isFollowingUser = async (userIdToCheck: string): Promise<boolean> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return false
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: follow } = await supabase
      .from('followers')
      .select()
      .eq('follower_id', user.id)
      .eq('following_id', userIdToCheck)
      .single()

    return !!follow
  } catch (error) {
    console.error('Error checking follow status:', error)
    return false
  }
}
