// src/pages/AuthCallback.tsx
import { useEffect } from 'react'
import { supabase } from '../utils/supabase'

export default function AuthCallback() {
  useEffect(() => {
    const process = async () => {
      try {
        if (!supabase) {
          window.location.replace('/')
          return
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        if (hashParams.has('access_token')) {
          const access_token = hashParams.get('access_token') || ''
          const refresh_token = hashParams.get('refresh_token') || ''
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token })
          }
        }
      } finally {
        // Clean URL and go home
        window.history.replaceState({}, document.title, '/')
        window.location.replace('/')
      }
    }
    process()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <p>Signing you in...</p>
    </div>
  )
}