import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { useCommunityStore } from '../store/communityStore'
import { OsmoCard, OsmoButton } from './theme/osmoComponents'

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  bio?: string
  email?: string
  experience_level?: string
  created_at?: string
}

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useSupabaseAuth()
  const { getUserProfile, toggleFollow, followedUsers } = useCommunityStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setError('User not found')
      setIsLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true)

        // Get user profile
        const userProfile = await getUserProfile(userId)
        if (userProfile) {
          setProfile(userProfile)
        } else {
          setError('User not found')
        }

        // Check if current user is following this user
        if (currentUser) {
          setIsFollowing(followedUsers.includes(userId))
        }

        // Get follower/following counts (mock data for now)
        setFollowerCount(0) // Would query user_follows table
        setFollowingCount(0) // Would query user_follows table

      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [userId, currentUser, followedUsers, getUserProfile])

  const handleFollowToggle = async () => {
    if (!currentUser || !userId) return

    const success = await toggleFollow(userId)
    if (success) {
      setIsFollowing(!isFollowing)
      // Update counts (mock for now)
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <OsmoButton onClick={() => navigate('/community')}>
            Back to Community
          </OsmoButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/community')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Community
            </button>
            <h1 className="text-xl font-bold text-white">Profile</h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto p-4">
        <OsmoCard className="p-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-black text-xl font-bold">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                profile.display_name[0]?.toUpperCase() || '👤'
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile.display_name}
              </h2>
              <p className="text-gray-400 mb-3">
                Member since {profile.created_at ? new Date(profile.created_at).getFullYear() : 'Unknown'}
              </p>

              {profile.bio && (
                <p className="text-white/80 mb-4">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{followerCount}</div>
                  <div className="text-gray-400 text-sm">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{followingCount}</div>
                  <div className="text-gray-400 text-sm">Following</div>
                </div>
              </div>

              {/* Follow Button */}
              {currentUser && currentUser.id !== profile.id && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-6 py-2 rounded-full font-bold transition-all duration-200 ${
                    isFollowing
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-amber-500 text-black hover:bg-amber-400'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          {/* Experience Level Badge */}
          {profile.experience_level && (
            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                profile.experience_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                profile.experience_level === 'intermediate' ? 'bg-blue-500/20 text-blue-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)} Journey
              </span>
            </div>
          )}

          {/* Placeholder for user's posts/activities */}
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Community Activity</h3>
            <p className="text-gray-400">
              {currentUser && currentUser.id === profile.id
                ? "Your posts and interactions will appear here"
                : `${profile.display_name}'s posts and interactions will appear here`
              }
            </p>
          </div>
        </OsmoCard>
      </div>
    </div>
  )
}

export default UserProfilePage
















