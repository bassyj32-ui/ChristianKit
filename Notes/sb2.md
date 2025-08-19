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

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const signOut = async () => {
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