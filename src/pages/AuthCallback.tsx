// src/pages/AuthCallback.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    const process = async () => {
      try {
        if (!supabase) {
          setStatus('Authentication service not available')
          setTimeout(() => window.location.replace('/'), 2000)
          return
        }

        // Processing OAuth callback

        // Check both query parameters (standard OAuth flow) and hash parameters
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        // URL and hash params processed

        let access_token = ''
        let refresh_token = ''

        // Try query params first (standard OAuth flow)
        if (urlParams.has('access_token') || urlParams.has('refresh_token')) {
          access_token = urlParams.get('access_token') || ''
          refresh_token = urlParams.get('refresh_token') || ''
          // Found tokens in URL params
        }
        // Fallback to hash params
        else if (hashParams.has('access_token') || hashParams.has('refresh_token')) {
          access_token = hashParams.get('access_token') || ''
          refresh_token = hashParams.get('refresh_token') || ''
          // Found tokens in hash params
        }

        if (access_token && refresh_token) {
          setStatus('Setting up your session...')
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          
          if (error) {
            console.error('❌ Session setup error:', error)
            setStatus('Session setup failed. Redirecting...')
          } else {
            setStatus('Authentication complete! Redirecting...')
          }
        } else {
          setStatus('No authentication data found. Redirecting...')
        }
      } catch (error) {
        console.error('❌ AuthCallback error:', error)
        setStatus('Authentication error. Redirecting...')
      } finally {
        // Clean URL and go home after a short delay
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
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>{status}</p>
      </div>
    </div>
  )
}