import { supabase } from '../utils/supabase'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
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
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available')
      return null
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('❌ Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in getCurrentUserProfile:', error)
      return null
    }
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available')
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert(profile, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        console.error('❌ Error upserting user profile:', error)
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
}

// Export singleton instance
export const userService = new UserService()
