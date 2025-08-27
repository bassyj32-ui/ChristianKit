import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔐 SupabaseAuthProvider: Initializing...')
    
    // Check if Supabase is available
    if (!supabase) {
      console.warn('⚠️ SupabaseAuthProvider: Supabase client not available. Running in demo mode.')
      setLoading(false)
      return
    }
    
    try {
      // Test Supabase connection first
      console.log('🔐 SupabaseAuthProvider: Testing connection...')
      
      // Get initial session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('❌ Supabase session error:', error)
          setError(error.message)
        } else {
          console.log('✅ Supabase session loaded:', session?.user?.email)
          setSession(session)
          setUser(session?.user ?? null)
        }
        setLoading(false)
      }).catch(err => {
        console.error('❌ Supabase session fetch failed:', err)
        setError(err.message)
        setLoading(false)
      })

      // Handle OAuth callback if present (check both query params and hash)
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      
      if (urlParams.has('access_token') || urlParams.has('error') || 
          hashParams.has('access_token') || hashParams.has('error')) {
        console.log('🔄 SupabaseAuthProvider: Processing OAuth callback...')
        console.log('🔄 URL params:', Object.fromEntries(urlParams))
        console.log('🔄 Hash params:', Object.fromEntries(hashParams))
        // The session will be updated by the auth state change listener
      }

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('🔄 Auth state changed:', _event, session?.user?.email)
        
        // Create user profile when they first sign in
        if (_event === 'SIGNED_IN' && session?.user && supabase) {
          try {
            console.log('👤 Creating user profile for:', session.user.email)
            
            const { error } = await supabase
              .from('user_profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
              }, {
                onConflict: 'id'
              })
            
            if (error) {
              console.error('❌ Profile creation error:', error)
            } else {
              console.log('✅ User profile created/updated successfully')
            }
          } catch (profileError) {
            console.error('❌ Profile creation failed:', profileError)
          }
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } catch (err) {
      console.error('❌ SupabaseAuthProvider initialization failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
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
      // Use current location for redirect (works for both localhost and Vercel)
      const currentOrigin = window.location.origin
      const redirectUrl = `${currentOrigin}/auth/callback`
      console.log('🔐 Signing in with Google, redirect to:', redirectUrl)
      console.log('🔐 Current origin:', currentOrigin)
      console.log('🔐 Full redirect URL:', redirectUrl)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })
      
      if (error) {
        console.error('❌ OAuth sign-in error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          currentOrigin: window.location.origin,
          redirectUrl: redirectUrl
        })
        
        // Provide specific error messages
        if (error.message.includes('redirect_uri_mismatch')) {
          const currentUrl = window.location.origin
          throw new Error(`OAuth redirect URL not configured. Current URL: ${currentUrl}/callback. Please check Supabase settings.`)
        } else if (error.message.includes('invalid_client')) {
          throw new Error('Google OAuth client not configured. Please check Google Cloud Console.')
        } else if (error.message.includes('not found') || error.message.includes('NOT_FOUND')) {
          throw new Error(`OAuth redirect URL not found. Please ensure ${window.location.origin}/callback is configured in Supabase. Current error: ${error.message}`)
        } else {
          throw error
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      // You can add a toast notification here if you have a notification system
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
    loading,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}