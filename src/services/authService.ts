import { supabase } from '../utils/supabase'
import { useAppStore } from '../store/appStore'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  isAuthenticated: boolean
}

class AuthService {
  private currentUser: AuthUser | null = null

  // Initialize authentication
  async initialize(): Promise<AuthUser | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return null
      }

      if (session?.user) {
        // Ensure profile record exists
        await this.ensureProfileExists(session.user)
        
        const user = this.transformUser(session.user)
        this.currentUser = user
        useAppStore.getState().setUser(user)
        return user
      }

      return null
    } catch (error) {
      console.error('Auth initialization error:', error)
      return null
    }
  }

  // Ensure profile record exists for user with enhanced error handling
  private async ensureProfileExists(user: any): Promise<void> {
    try {
      // First check if profile exists (using maybeSingle to avoid errors)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      // If there's a real database error (not just "no rows found"), log it
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking profile existence:', checkError)
        return
      }

      // If profile already exists, we're good
      if (existingProfile) {
        // Profile already exists for user
        return
      }

      // Only create profile if it doesn't exist
      // Use only the columns that definitely exist in the database
      const profileData = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url
      }

      const { error } = await supabase
        .from('profiles')
        .insert(profileData)

      if (error) {
        console.error('❌ Error creating profile:', {
          code: error.code,
          message: error.message,
          userId: user.id
        })

        // Specific error handling
        if (error.code === '23505') {
          // Profile already exists (race condition)
        } else if (error.code === '42P01') {
          console.error('❌ Profiles table does not exist')
        } else {
          console.error('❌ Unexpected profile creation error:', error.message)
        }
      } else {
        // Profile record created successfully for user
      }

    } catch (error) {
      console.error('❌ Error ensuring profile exists:', error)
      // Don't throw - let the signup continue even if profile creation fails
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<AuthUser | null> {
    try {
      useAppStore.getState().setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Google sign-in error:', error)
        throw error
      }

      // The actual user data will be available after redirect
      return null
    } catch (error) {
      console.error('Sign-in error:', error)
      throw error
    } finally {
      useAppStore.getState().setLoading(false)
    }
  }

  // Sign in with email
  async signInWithEmail(email: string, password: string): Promise<AuthUser | null> {
    try {
      useAppStore.getState().setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Email sign-in error:', error)
        throw error
      }

      if (data.user) {
        const user = this.transformUser(data.user)
        this.currentUser = user
        useAppStore.getState().setUser(user)
        return user
      }

      return null
    } catch (error) {
      console.error('Sign-in error:', error)
      throw error
    } finally {
      useAppStore.getState().setLoading(false)
    }
  }

  // Sign up with email
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser | null> {
    try {
      useAppStore.getState().setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      })

      if (error) {
        console.error('Sign-up error:', error)
        throw error
      }

      if (data.user) {
        const user = this.transformUser(data.user)
        this.currentUser = user
        useAppStore.getState().setUser(user)
        return user
      }

      return null
    } catch (error) {
      console.error('Sign-up error:', error)
      throw error
    } finally {
      useAppStore.getState().setLoading(false)
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      useAppStore.getState().setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign-out error:', error)
        throw error
      }

      this.currentUser = null
      useAppStore.getState().setUser(null)
      useAppStore.getState().clearAllData()
    } catch (error) {
      console.error('Sign-out error:', error)
      throw error
    } finally {
      useAppStore.getState().setLoading(false)
    }
  }

  // Handle auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const user = this.transformUser(session.user)
          this.currentUser = user
          useAppStore.getState().setUser(user)
          callback(user)
        } else {
          this.currentUser = null
          useAppStore.getState().setUser(null)
          callback(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser?.isAuthenticated
  }

  // Transform Supabase user to our AuthUser format
  private transformUser(supabaseUser: any): AuthUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      isAuthenticated: true
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        throw error
      }
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  // Update user profile
  async updateProfile(updates: {
    displayName?: string
    avatarUrl?: string
    bio?: string
    favoriteVerse?: string
    location?: string
    customLinks?: Array<{title: string, url: string}>
    bannerImage?: string
    profileImage?: string
  }): Promise<AuthUser | null> {
    try {
      useAppStore.getState().setLoading(true)
      
      // Update auth user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) {
        console.error('Profile update error:', error)
        throw error
      }

      // Also update the profiles table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            display_name: updates.displayName,
            avatar_url: updates.avatarUrl,
            bio: updates.bio,
            favorite_verse: updates.favoriteVerse,
            location: updates.location,
            custom_links: updates.customLinks,
            banner_image: updates.bannerImage,
            profile_image: updates.profileImage,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile table update error:', profileError)
          // Don't throw here, as the auth update succeeded
        }

        const user = this.transformUser(data.user)
        this.currentUser = user
        useAppStore.getState().setUser(user)
        return user
      }

      return null
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    } finally {
      useAppStore.getState().setLoading(false)
    }
  }
}

export const authService = new AuthService()
