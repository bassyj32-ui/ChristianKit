import { supabase } from '../utils/supabase'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  bio?: string
  location?: string
  favorite_verse?: string
  phone?: string
  church_denomination?: string
  spiritual_maturity?: string
  is_verified?: boolean
  is_private?: boolean
  created_at: string
  updated_at: string
  // Legacy fields for backward compatibility
  full_name?: string
}

export interface UserSession {
  id: string
  user_id: string
  activity_type: 'prayer' | 'bible' | 'meditation' | 'journal'
  duration_minutes: number
  completed: boolean
  completed_duration?: number
  session_date: string
  created_at: string
  updated_at: string
  notes?: string
}

export class UserService {
  private supabase = supabase

  /**
   * Get current user profile with enhanced error handling
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    if (!this.supabase) {
      console.error('❌ Supabase client not initialized')
      return null
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return null
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return await this.createDefaultProfile(user)
        }
        console.error('❌ Error fetching user profile:', {
          code: error.code,
          message: error.message,
          userId: user.id
        })
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in getCurrentUserProfile:', error)
      return null
    }
  }

  /**
   * Create default profile for new users
   */
  private async createDefaultProfile(user: User): Promise<UserProfile | null> {
    try {
      // Check if profile already exists first
      const { data: existingProfile, error: checkError } = await this.supabase!
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      // If profile exists, return it
      if (existingProfile) {
        const { data: profile } = await this.supabase!
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        return profile
      }

      // If there's a database error (not just "no profile found"), log it
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking profile existence:', checkError)
        return null
      }

      // Create default profile only if it doesn't exist
      const defaultProfile: Partial<UserProfile> = {
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase!
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single()

      if (error) {
        // Handle race condition where profile was created by trigger between check and insert
        if (error.code === '23505') {
          const { data: profile } = await this.supabase!
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          return profile
        }

        console.error('❌ Error creating default profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in createDefaultProfile:', error)
      return null
    }
  }

  /**
   * Create or update user profile with enhanced error handling
   */
  async upsertUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!this.supabase) {
      console.error('❌ Supabase client not initialized')
      return null
    }

    try {
      // Ensure required fields are present
      if (!profile.id) {
        console.error('❌ Profile ID is required for upsert')
        return null
      }

      const profileData = {
        ...profile,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        console.error('❌ Error upserting user profile:', {
          code: error.code,
          message: error.message,
          profileId: profile.id
        })

        // Provide specific error messages
        if (error.code === '23505') {
          console.error('❌ Profile already exists with different data')
        } else if (error.code === '42P01') {
          console.error('❌ Profiles table does not exist')
        } else if (error.code === '42703') {
          console.error('❌ Invalid column in profile data')
        }

        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in upsertUserProfile:', error)
      return null
    }
  }

  /**
   * Create a new user session
   */
  async createUserSession(session: Omit<UserSession, 'id' | 'created_at' | 'updated_at'>): Promise<UserSession | null> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available')
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert(session)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating user session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in createUserSession:', error)
      return null
    }
  }

  /**
   * Get user sessions for a specific activity type
   */
  async getUserSessions(activityType: UserSession['activity_type'], limit = 50): Promise<UserSession[]> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available')
      return []
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching user sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Error in getUserSessions:', error)
      return []
    }
  }

  /**
   * Update user session
   */
  async updateUserSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession | null> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available')
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating user session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in updateUserSession:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.supabase) return false
    
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('❌ Error checking authentication:', error)
      return false
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.supabase) return null

    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('❌ Error getting current user:', error)
      return null
    }
  }

  /**
   * Get user profile by ID with enhanced error handling
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!this.supabase) {
      console.error('❌ Supabase client not initialized')
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('❌ Error fetching user profile:', {
          code: error.code,
          message: error.message,
          userId
        })
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error)
      return null
    }
  }

  /**
   * Update user profile with validation
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    if (!this.supabase) {
      console.error('❌ Supabase client not initialized')
      return false
    }

    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('❌ Error updating user profile:', {
          code: error.code,
          message: error.message,
          userId,
          updates
        })
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Error in updateUserProfile:', error)
      return false
    }
  }

  /**
   * Search users by display name with pagination
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    if (!this.supabase) {
      console.error('❌ Supabase client not initialized')
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', `%${query}%`)
        .limit(limit)

      if (error) {
        console.error('❌ Error searching users:', {
          code: error.code,
          message: error.message,
          query
        })
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Error in searchUsers:', error)
      return []
    }
  }

  /**
   * Upload profile image (placeholder - would need storage integration)
   */
  async uploadProfileImage(userId: string, imageData: string): Promise<string | null> {
    try {
      // This would typically upload to Supabase Storage
      // For now, just update the profile with the base64 data
      const success = await this.updateUserProfile(userId, { avatar_url: imageData })

      if (success) {
        return imageData
      }

      return null
    } catch (error) {
      console.error('❌ Error uploading profile image:', error)
      return null
    }
  }

  /**
   * Check if user profile exists
   */
  async profileExists(userId: string): Promise<boolean> {
    if (!this.supabase) {
      return false
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking profile existence:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('❌ Error in profileExists:', error)
      return false
    }
  }
}

// Export singleton instance
export const userService = new UserService()
