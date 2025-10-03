import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'
import { emailAutomationService } from '../services/emailAutomationService'
import { reminderAutomationService } from '../services/reminderAutomationService'

interface AuthContextType {
  user: User | null
  session: Session | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    
    // Check if Supabase is available
    if (!supabase) {
      console.warn('⚠️ SupabaseAuthProvider: Supabase client not available. Running in demo mode.')
      return
    }
    
    try {
      // Test Supabase connection first
      
      
      // Get initial session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('❌ Supabase session error:', error)
          setError(error.message)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      }).catch(err => {
        console.error('❌ Supabase session fetch failed:', err)
        setError(err.message)
      })

      // Handle OAuth callback if present (check both query params and hash)
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))

      if (urlParams.has('access_token') || urlParams.has('error') ||
          hashParams.has('access_token') || hashParams.has('error')) {
        // The session will be updated by the auth state change listener
        // Clean URL to prevent callback loops
        window.history.replaceState({}, document.title, '/')
      }

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        // Enhanced user onboarding when they first sign in
        if (_event === 'SIGNED_IN' && session?.user && supabase) {
          try {
            // Create or update user profile with complete data
            const profileData = {
              id: session.user.id,
              email: session.user.email,
              display_name: session.user.user_metadata?.full_name ||
                           session.user.user_metadata?.name ||
                           session.user.email?.split('@')[0] ||
                           'User',
              avatar_url: session.user.user_metadata?.avatar_url ||
                         session.user.user_metadata?.picture,
              experience_level: 'beginner', // Default experience level
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            // Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert(profileData, { onConflict: 'id' })

            if (profileError) {
              if (profileError.code !== '23505') { // Ignore duplicate key errors
                console.error('❌ Profile creation error:', profileError)
              }
            } else {
              console.log('✅ User profile created successfully')
            }

            // Create default notification preferences
            const { error: prefsError } = await supabase
              .from('user_notification_preferences')
              .upsert({
                user_id: session.user.id,
                email_enabled: true,
                push_enabled: true,
                prayer_reminders: true,
                community_updates: true,
                daily_motivation: true,
                weekly_progress: false,
                bible_study: true,
                preferred_time: '09:00:00',
                reminder_intensity: 'gentle',
                timezone: 'UTC',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' })

            if (prefsError) {
              if (prefsError.code !== '23505') {
                console.error('❌ Notification preferences creation error:', prefsError)
              }
            } else {
              console.log('✅ Default notification preferences created')
            }

            // Send welcome email (non-blocking)
            if (session.user.email) {
              try {
                await emailAutomationService.sendWelcomeEmail(
                  session.user.id,
                  session.user.email,
                  session.user.user_metadata?.full_name || session.user.user_metadata?.name
                )
                console.log('✅ Welcome email sent')
              } catch (emailError) {
                console.error('❌ Welcome email failed:', emailError)
              }
            }

            // Create default reminder schedule (non-blocking)
            try {
              await reminderAutomationService.createDefaultReminderSchedule(session.user.id)
              console.log('✅ Default reminder schedule created')
            } catch (reminderError) {
              console.error('❌ Reminder schedule creation failed:', reminderError)
            }

          } catch (onboardingError) {
            console.error('❌ User onboarding failed:', onboardingError)
            // Don't block auth flow on onboarding errors
          }
        }

        setSession(session)
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    } catch (err) {
      console.error('❌ SupabaseAuthProvider initialization failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  // Show error if something went wrong
  if (error) {
    console.error('❌ SupabaseAuthProvider Error:', error)
    return (
      <div className="min-h-screen bg-red-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-red-200 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-white text-red-900 px-4 py-2 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // Show demo mode message if Supabase is not available
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold mb-4">🚀 ChristianKit</h1>
          <p className="text-blue-200 mb-4">
            Running in demo mode. Backend features are disabled.
          </p>
          <p className="text-sm text-blue-300 mb-6">
            To enable full features, add Supabase environment variables to your deployment.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-blue-200">
              Required variables:<br/>
              • VITE_SUPABASE_URL<br/>
              • VITE_SUPABASE_ANON_KEY
            </p>
          </div>
        </div>
      </div>
    )
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error('❌ Supabase client is null - environment variables may be missing')
      alert('Authentication service not available. Please check environment configuration.')
      return
    }

    try {
      // Use current location for redirect
      const currentOrigin = window.location.origin
      const redirectUrl = `${currentOrigin}/auth/callback`

      console.log('🔐 Initiating Google OAuth sign-in', { redirectUrl })

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account' // Allow account selection
          }
        }
      })

      if (error) {
        console.error('❌ OAuth sign-in error:', error)

        // Provide user-friendly error messages
        if (error.message.includes('redirect_uri_mismatch')) {
          throw new Error('Google sign-in is not properly configured. Please contact support.')
        } else if (error.message.includes('invalid_client')) {
          throw new Error('Google sign-in is not properly configured. Please contact support.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.')
        } else {
          throw new Error('Sign-in failed. Please try again.')
        }
      }

      console.log('✅ Google OAuth sign-in initiated successfully')
    } catch (error) {
      console.error('❌ Sign-in error:', error)
      alert(`Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const signOut = async () => {
    if (!supabase) {
      console.warn('Supabase not available for sign out')
      return
    }
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    session,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}