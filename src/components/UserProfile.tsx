import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { 
  getUserProfile, 
  updateUserProfile, 
  uploadAvatar,
  type UserProfile,
  type ProfileUpdateData
} from '../services/userProfileService'

export const UserProfile: React.FC = () => {
  const { user, signOut } = useSupabaseAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editData, setEditData] = useState<ProfileUpdateData>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const userProfile = await getUserProfile(user.id)
      if (userProfile) {
        setProfile(userProfile)
        setEditData({
          display_name: userProfile.display_name,
          handle: userProfile.handle,
          bio: userProfile.bio,
          location: userProfile.location,
          website: userProfile.website
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    
    try {
      setIsLoading(true)
      const success = await updateUserProfile(editData)
      if (success) {
        await loadProfile()
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    
    try {
      setIsUploading(true)
      const avatarUrl = await uploadAvatar(avatarFile)
      if (avatarUrl) {
        await loadProfile()
        setAvatarFile(null)
        setAvatarPreview(null)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCancelEdit = () => {
    setEditData({
      display_name: profile?.display_name || '',
      handle: profile?.handle || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      website: profile?.website || ''
    })
    setIsEditing(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-[var(--text-secondary)]">You need to be signed in to view your profile.</p>
        </div>
      </div>
    )
  }

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--spiritual-purple)] bg-clip-text text-transparent mb-4">
            Your Profile
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">Manage your Christian community presence</p>
        </div>

        {/* Profile Card */}
        <div className="bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-8 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Avatar & Basic Info */}
            <div className="lg:col-span-1">
              <div className="text-center">
                {/* Avatar Section */}
                <div className="relative mb-6">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[var(--accent-primary)] to-[var(--spiritual-purple)] rounded-full flex items-center justify-center text-white text-4xl shadow-2xl">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{profile?.display_name?.[0] || user.email?.[0] || '👤'}</span>
                    )}
                  </div>
                  
                  {/* Avatar Upload */}
                  <div className="mt-4 space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="block w-full bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl px-4 py-2 text-center cursor-pointer hover:bg-[var(--accent-primary)]/10 transition-all duration-300"
                    >
                      📷 Change Avatar
                    </label>
                    
                    {avatarFile && (
                      <button
                        onClick={handleAvatarUpload}
                        disabled={isUploading}
                        className="w-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white px-4 py-2 rounded-xl font-semibold hover:from-[var(--accent-secondary)] hover:to-[var(--accent-primary)] transition-all duration-300 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          '💾 Save Avatar'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Basic Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--accent-primary)]">{profile?.post_count || 0}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--spiritual-blue)]">{profile?.follower_count || 0}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--spiritual-green)]">{profile?.following_count || 0}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Following</div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={signOut}
                  className="w-full bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all duration-300"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>

            {/* Right Column - Profile Details */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl text-[var(--text-tertiary)] cursor-not-allowed"
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Display Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.display_name || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <div className="p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl">
                      {profile?.display_name || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Handle */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Handle *
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-[var(--text-secondary)]">@</span>
                      <input
                        type="text"
                        value={editData.handle || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, handle: e.target.value }))}
                        className="flex-1 p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                        placeholder="username"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl">
                      @{profile?.handle || 'not-set'}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editData.bio || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="w-full p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                      placeholder="Tell us about yourself and your faith journey..."
                    />
                  ) : (
                    <div className="p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl min-h-[60px]">
                      {profile?.bio || 'No bio yet'}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.location || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      placeholder="City, Country"
                    />
                  ) : (
                    <div className="p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl">
                      {profile?.location || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editData.website || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <div className="p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl">
                      {profile?.website ? (
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[var(--accent-primary)] hover:underline"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white px-6 py-3 rounded-xl font-semibold hover:from-[var(--accent-secondary)] hover:to-[var(--accent-primary)] transition-all duration-300 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          '💾 Save Changes'
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-[var(--glass-medium)] border border-[var(--glass-border)] text-[var(--text-primary)] px-6 py-3 rounded-xl font-semibold hover:bg-[var(--accent-primary)]/10 transition-all duration-300"
                      >
                        ❌ Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white px-6 py-3 rounded-xl font-semibold hover:from-[var(--accent-secondary)] hover:to-[var(--accent-primary)] transition-all duration-300"
                    >
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
