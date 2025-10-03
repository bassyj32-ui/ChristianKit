import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const process = async () => {
      try {
        if (!supabase) {
          setStatus('Authentication service not available')
          setError('Supabase client not initialized')
          setTimeout(() => window.location.replace('/'), 2000)
          return
        }

        // Parse authentication tokens from URL
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        let access_token = ''
        let refresh_token = ''

        // Try query params first (standard OAuth flow)
        if (urlParams.has('access_token')) {
          access_token = urlParams.get('access_token') || ''
          refresh_token = urlParams.get('refresh_token') || ''
        }
        // Fallback to hash params
        else if (hashParams.has('access_token')) {
          access_token = hashParams.get('access_token') || ''
          refresh_token = hashParams.get('refresh_token') || ''
        }

        if (!access_token || !refresh_token) {
          setStatus('Authentication tokens not found')
          setError('Missing authentication tokens')
          setTimeout(() => window.location.replace('/'), 2000)
          return
        }

        setStatus('Setting up your session...')

        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })

        if (error) {
          console.error('❌ Session setup error:', error)
          setStatus('Session setup failed')
          setError(error.message)
        } else if (data.session) {
          setStatus('Authentication complete! Redirecting...')
          console.log('✅ Authentication successful')
        } else {
          setStatus('Session not created')
          setError('Failed to create session')
        }

      } catch (error) {
        console.error('❌ AuthCallback error:', error)
        setStatus('Authentication error')
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        // Clean URL and redirect to app
        setTimeout(() => {
          window.history.replaceState({}, document.title, '/')
          window.location.replace('/')
        }, 1500)
      }
    }

    process()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Authentication</h2>
        <p className="text-gray-300 mb-4">{status}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">Error: {error}</p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Redirecting in a moment...
        </div>
      </div>
    </div>
  )
}