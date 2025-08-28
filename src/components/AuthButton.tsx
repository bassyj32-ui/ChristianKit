import React, { useState } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { getCurrentUserProfile } from '../services/userProfileService'
import { UserProfile } from './UserProfile'

export const AuthButton: React.FC = () => {
  const { user, signInWithGoogle, signOut, loading } = useSupabaseAuth()
  const [showProfile, setShowProfile] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  const handleProfileClick = async () => {
    if (!userProfile) {
      const profile = await getCurrentUserProfile()
      setUserProfile(profile)
    }
    setShowProfile(true)
  }

  const handleCloseProfile = () => {
    setShowProfile(false)
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[var(--text-secondary)] text-sm">Loading...</span>
      </div>
    )
  }

  if (user) {
    return (
      <>
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <button
            onClick={handleProfileClick}
            className="flex items-center space-x-2 hover:bg-[var(--glass-medium)] rounded-xl p-2 transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--spiritual-purple)] rounded-full flex items-center justify-center text-white text-sm shadow-lg">
              {userProfile?.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{userProfile?.display_name?.[0] || user.email?.[0] || '👤'}</span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {userProfile?.display_name || user.user_metadata?.display_name || 'User'}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                @{userProfile?.handle || 'user'}
              </div>
            </div>
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">
              ▼
            </span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={signOut}
            className="hidden sm:block bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-sm hover:bg-red-500/30 transition-all duration-300"
          >
            Sign Out
          </button>
        </div>

        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-primary)] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <button
                  onClick={handleCloseProfile}
                  className="absolute top-4 right-4 w-8 h-8 bg-[var(--glass-medium)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors z-10"
                >
                  ✕
                </button>
                <UserProfile />
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white px-6 py-3 rounded-xl font-semibold hover:from-[var(--accent-secondary)] hover:to-[var(--accent-primary)] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <span className="flex items-center space-x-2">
        <span>🔐</span>
        <span>Sign In with Google</span>
      </span>
    </button>
  )
}

export default AuthButton
