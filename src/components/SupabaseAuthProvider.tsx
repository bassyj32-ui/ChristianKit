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

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('🔄 Auth state changed:', _event, session?.user?.email)
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
      console.warn('Supabase not available for sign in')
      return
    }
    
    try {
      // Use current location for redirect (works for both localhost and Vercel)
      const currentOrigin = window.location.origin
      console.log('🔐 Signing in with Google, redirect to:', `${currentOrigin}/auth/callback`)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentOrigin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
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