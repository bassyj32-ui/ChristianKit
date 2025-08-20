import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { SimpleLogo } from './SimpleLogo'

export const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 AuthCallback: Processing OAuth callback...')
        console.log('🔄 Current URL:', window.location.href)
        
        if (!supabase) {
          throw new Error('Supabase client not available')
        }

        // Check if we have auth parameters in the hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        if (hashParams.has('access_token')) {
          console.log('🔄 Found access token in hash, processing...')
          
          // Set the session manually from the hash parameters
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (error) {
              console.error('❌ AuthCallback: Session error:', error)
              throw error
            }
            
            if (session) {
              console.log('✅ AuthCallback: Successfully authenticated:', session.user.email)
              setStatus('success')
              
              // Clean up the URL and redirect
              setTimeout(() => {
                window.history.replaceState({}, document.title, '/')
                window.location.href = '/'
              }, 2000)
              return
            }
          }
        }

        // Fallback: Get the session from the URL
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ AuthCallback: Session error:', error)
          throw error
        }

        if (session) {
          console.log('✅ AuthCallback: Successfully authenticated:', session.user.email)
          setStatus('success')
          
          // Redirect to the main app after a short delay
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        } else {
          console.log('⚠️ AuthCallback: No session found, redirecting to login')
          window.location.href = '/'
        }
      } catch (err) {
        console.error('❌ AuthCallback: Error processing callback:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
      }
    }

    handleAuthCallback()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <SimpleLogo size="lg" />
          </div>
          <p className="text-gray-400">Completing sign in...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <SimpleLogo size="lg" />
          </div>
          <p className="text-red-400 mb-4">Sign in failed</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <SimpleLogo size="lg" />
        </div>
        <p className="text-green-400 mb-4">✅ Successfully signed in!</p>
        <p className="text-gray-500 text-sm">Redirecting to ChristianKit...</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
