// AuthService - Now properly integrated with Supabase
// Provides backward compatibility for existing code

import { supabase } from '../utils/supabase'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  isAuthenticated: boolean
}

export const authService = {
  async initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url,
          isAuthenticated: true
        }
      }
      return null
    } catch (error) {
      console.error('Auth service initialization failed:', error)
      return null
    }
  },

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      return { data, error }
    } catch (error) {
      console.error('Google sign in failed:', error)
      return { data: null, error }
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out failed:', error)
      return { error }
    }
  },

  getCurrentUser() {
    try {
      const { data: { session } } = supabase.auth.getSession()
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url,
          isAuthenticated: true
        }
      }
      return null
    } catch (error) {
      console.error('Get current user failed:', error)
      return null
    }
  },

  isAuthenticated() {
    try {
      const { data: { session } } = supabase.auth.getSession()
      return !!session?.user
    } catch (error) {
      console.error('Auth check failed:', error)
      return false
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = {
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url,
          isAuthenticated: true
        }
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}
