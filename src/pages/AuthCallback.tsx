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

        console.log('🔐 AuthCallback: Processing OAuth callback...')
        console.log('🔐 Current URL:', window.location.href)

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        console.log('🔐 Hash params:', Object.fromEntries(hashParams))

        if (hashParams.has('access_token')) {
          const access_token = hashParams.get('access_token') || ''
          const refresh_token = hashParams.get('refresh_token') || ''
          
          if (access_token && refresh_token) {
            setStatus('Setting up your session...')
            await supabase.auth.setSession({ access_token, refresh_token })
            console.log('✅ Session set successfully')
            setStatus('Authentication complete! Redirecting...')
          }
        } else {
          console.log('⚠️ No access token found in callback')
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