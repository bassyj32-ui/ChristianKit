import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { useAppStore } from '../store/appStore'
import {
  OsmoCard,
  OsmoButton,
  OsmoBadge,
  OsmoContainer
} from '../theme/osmoComponents'
import { authService } from '../services/authService'
import { supabase } from '../utils/supabase'
import { 
  getConsistentDefaultProfileImage, 
  getConsistentDefaultBannerImage,
  isDefaultImage,
  getImageAttribution
} from '../utils/defaultImages'

export const UserProfile: React.FC = () => {
  const { user, signOut } = useSupabaseAuth()
  const { userPlan, prayerSessions, bibleSessions, meditationSessions, gameScores } = useAppStore()

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [favoriteVerse, setFavoriteVerse] = useState('')
  const [location, setLocation] = useState('')
  const [customLinks, setCustomLinks] = useState<Array<{title: string, url: string}>>([])
  const [bannerImage, setBannerImage] = useState<string>('')
  const [profileImage, setProfileImage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [savingImage, setSavingImage] = useState<'banner' | 'profile' | null>(null)

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      // First set basic info from auth user
      setDisplayName((user as any).displayName || user.email?.split('@')[0] || 'User')
      setEmail(user.email || '')

      // Then load extended profile data from database
      const { data: profile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.log('No existing profile found, setting up defaults')
        // Use auth metadata as fallback
        setBio((user as any).bio || '')
        setFavoriteVerse((user as any).favoriteVerse || '')
        setLocation((user as any).location || '')
        setCustomLinks((user as any).customLinks || [])
        
        // Set default images for new users
        const defaultProfileImage = getConsistentDefaultProfileImage(user.id)
        const defaultBannerImage = getConsistentDefaultBannerImage(user.id)
        
        setBannerImage(defaultBannerImage.url)
        setProfileImage(defaultProfileImage.url)
        
        // Save default images to database for new users
        try {
          await supabase!.from('profiles').upsert({
            id: user.id,
            email: user.email,
            display_name: (user as any).displayName || user.email?.split('@')[0] || 'User',
            banner_image: defaultBannerImage.url,
            profile_image: defaultProfileImage.url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          console.log('✅ Default images saved for new user')
        } catch (saveError: any) {
          console.error('❌ Error saving default images:', {
            code: saveError?.code,
            message: saveError?.message,
            userId: user.id
          })
          // This is not critical, so we don't show error to user
        }
      } else {
        // Use database profile data
        setBio(profile.bio || '')
        setFavoriteVerse(profile.favorite_verse || '')
        setLocation(profile.location || '')
        setCustomLinks(profile.custom_links || [])
        
        // Use existing images or set defaults if none exist
        if (profile.banner_image) {
          setBannerImage(profile.banner_image)
        } else {
          const defaultBannerImage = getConsistentDefaultBannerImage(user.id)
          setBannerImage(defaultBannerImage.url)
        }
        
        if (profile.profile_image) {
          setProfileImage(profile.profile_image)
        } else {
          const defaultProfileImage = getConsistentDefaultProfileImage(user.id)
          setProfileImage(defaultProfileImage.url)
        }
        
        // Update display name if it exists in profile
        if (profile.display_name) {
          setDisplayName(profile.display_name)
        }
      }
    } catch (error) {
      console.error('❌ Error loading profile:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        userId: user.id
      })

      // Provide specific error feedback
      if ((error as any)?.code === 'PGRST301') {
        console.log('ℹ️ Profiles table does not exist - using auth metadata as fallback')
      } else if ((error as any)?.code === 'PGRST116') {
        console.log('ℹ️ No profile found - will create default profile')
      } else {
        console.log('ℹ️ Using auth metadata as fallback due to error')
      }

      // Fallback to auth metadata
      setBio((user as any).bio || '')
      setFavoriteVerse((user as any).favoriteVerse || '')
      setLocation((user as any).location || '')
      setCustomLinks((user as any).customLinks || [])

      // Set default images on error
      const defaultProfileImage = getConsistentDefaultProfileImage(user.id)
      const defaultBannerImage = getConsistentDefaultBannerImage(user.id)
      setBannerImage(defaultBannerImage.url)
      setProfileImage(defaultProfileImage.url)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) {
      console.error('❌ No user found when saving profile')
      return
    }

    try {
      setLoading(true)

      // Validate required fields
      if (!displayName.trim()) {
        alert('Display name is required.')
        return
      }

      const profileUpdates = {
        displayName: displayName.trim(),
        ...(bio.trim() && { bio: bio.trim() }),
        ...(favoriteVerse.trim() && { favoriteVerse: favoriteVerse.trim() }),
        ...(location.trim() && { location: location.trim() }),
        ...(customLinks.length > 0 && { customLinks: customLinks }),
        ...(bannerImage && { bannerImage: bannerImage }),
        ...(profileImage && { profileImage: profileImage })
      }

      await authService.updateProfile(profileUpdates)

      console.log('✅ Profile saved successfully for user:', user.id)
      setIsEditing(false)
    } catch (error: any) {
      console.error('❌ Failed to update profile:', {
        code: error?.code,
        message: error?.message,
        userId: user.id
      })

      // Provide specific error messages
      let errorMessage = 'Failed to update profile. Please try again.'

      if (error?.code === '23505') {
        errorMessage = 'This display name is already taken. Please choose another one.'
      } else if (error?.code === '42P01') {
        errorMessage = 'Database connection issue. Please check your internet connection.'
      } else if (error?.code === '42703') {
        errorMessage = 'Invalid profile data. Please check your inputs.'
      } else if (error?.message) {
        errorMessage = `Update failed: ${error.message}`
      }

      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Calculate achievements and badges
  const calculateAchievements = () => {
    const totalPrayerTime = prayerSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const totalBibleTime = bibleSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const totalMeditationTime = meditationSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const bestGameScore = gameScores.length > 0 ? Math.max(...gameScores.map(score => score.score)) : 0

    const achievements = []

    // Prayer achievements
    if (totalPrayerTime >= 60) achievements.push({ id: 'prayer-1h', name: 'Prayer Warrior', icon: '🙏', description: 'Prayed for 1 hour total' })
    if (totalPrayerTime >= 300) achievements.push({ id: 'prayer-5h', name: 'Devoted Prayer', icon: '⛪', description: 'Prayed for 5 hours total' })
    if (totalPrayerTime >= 600) achievements.push({ id: 'prayer-10h', name: 'Prayer Champion', icon: '👑', description: 'Prayed for 10 hours total' })

    // Bible achievements
    if (totalBibleTime >= 60) achievements.push({ id: 'bible-1h', name: 'Bible Reader', icon: '📖', description: 'Read Bible for 1 hour total' })
    if (totalBibleTime >= 300) achievements.push({ id: 'bible-5h', name: 'Bible Scholar', icon: '🎓', description: 'Read Bible for 5 hours total' })
    if (totalBibleTime >= 600) achievements.push({ id: 'bible-10h', name: 'Bible Master', icon: '📚', description: 'Read Bible for 10 hours total' })

    // Meditation achievements
    if (totalMeditationTime >= 60) achievements.push({ id: 'meditation-1h', name: 'Peace Seeker', icon: '🧘', description: 'Meditated for 1 hour total' })
    if (totalMeditationTime >= 300) achievements.push({ id: 'meditation-5h', name: 'Zen Master', icon: '🌸', description: 'Meditated for 5 hours total' })

    // Game achievements
    if (bestGameScore >= 100) achievements.push({ id: 'game-100', name: 'Bible Quiz Pro', icon: '🎯', description: 'Scored 100+ in Bible Quest' })
    if (bestGameScore >= 500) achievements.push({ id: 'game-500', name: 'Bible Expert', icon: '🏆', description: 'Scored 500+ in Bible Quest' })

    // Streak achievements
    const currentStreak = calculateCurrentStreak()
    if (currentStreak >= 7) achievements.push({ id: 'streak-7', name: 'Week Warrior', icon: '🔥', description: '7-day spiritual streak' })
    if (currentStreak >= 30) achievements.push({ id: 'streak-30', name: 'Month Master', icon: '⭐', description: '30-day spiritual streak' })

    return achievements
  }

  const calculateCurrentStreak = () => {
    // Simple streak calculation - in real app, this would be more sophisticated
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentSessions = [...prayerSessions, ...bibleSessions, ...meditationSessions]
      .filter(session => new Date((session as any).date || (session as any).createdAt) >= lastWeek)

    return Math.min(recentSessions.length, 30) // Cap at 30 for demo
  }

  const achievements = calculateAchievements()
  const currentStreak = calculateCurrentStreak()

  const addCustomLink = () => {
    setCustomLinks([...customLinks, { title: '', url: '' }])
  }

  const updateCustomLink = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...customLinks]
    updated[index][field] = value
    setCustomLinks(updated)
  }

  const removeCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index))
  }

  const handleImageUpload = (file: File, type: 'banner' | 'profile'): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file size
      const maxSize = type === 'banner' ? 2 * 1024 * 1024 : 1 * 1024 * 1024 // 2MB for banner, 1MB for profile
      if (file.size > maxSize) {
        reject(new Error(`File size must be less than ${type === 'banner' ? '2MB' : '1MB'}`))
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        reject(new Error('Only JPG, PNG, and WebP images are allowed'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        resolve(result)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSavingImage('banner')
    try {
      const base64 = await handleImageUpload(file, 'banner')
      
      // Update local state immediately
      setBannerImage(base64)

      // Auto-save to database
      if (user) {
        // Save to both auth metadata and profiles table
        await Promise.all([
          authService.updateProfile({ bannerImage: base64 }),
          supabase!.from('profiles').upsert({
            id: user.id,
            email: user.email,
            banner_image: base64,
            updated_at: new Date().toISOString()
          })
        ])
        
        console.log('✅ Banner image saved successfully')
      }
    } catch (error: any) {
      console.error('❌ Banner upload error:', {
        code: error?.code,
        message: error?.message,
        userId: user?.id
      })

      // Provide specific error messages
      let errorMessage = 'Failed to upload banner image.'

      if (error instanceof Error) {
        if (error.message.includes('size')) {
          errorMessage = 'Banner image must be less than 2MB.'
        } else if (error.message.includes('type')) {
          errorMessage = 'Only JPG, PNG, and WebP images are allowed.'
        } else if (error.message.includes('read')) {
          errorMessage = 'Failed to read the image file. Please try again.'
        } else {
          errorMessage = error.message
        }
      } else if (error?.code === '42P01') {
        errorMessage = 'Database connection issue. Please check your internet connection.'
      }

      alert(errorMessage)
      // Revert local state on error
      setBannerImage('')
    } finally {
      setSavingImage(null)
    }
  }

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSavingImage('profile')
    try {
      const base64 = await handleImageUpload(file, 'profile')
      
      // Update local state immediately
      setProfileImage(base64)

      // Auto-save to database
      if (user) {
        // Save to both auth metadata and profiles table
        await Promise.all([
          authService.updateProfile({ profileImage: base64 }),
          supabase!.from('profiles').upsert({
            id: user.id,
            email: user.email,
            profile_image: base64,
            updated_at: new Date().toISOString()
          })
        ])
        
        console.log('✅ Profile image saved successfully')
      }
    } catch (error: any) {
      console.error('❌ Profile upload error:', {
        code: error?.code,
        message: error?.message,
        userId: user?.id
      })

      // Provide specific error messages
      let errorMessage = 'Failed to upload profile image.'

      if (error instanceof Error) {
        if (error.message.includes('size')) {
          errorMessage = 'Profile image must be less than 1MB.'
        } else if (error.message.includes('type')) {
          errorMessage = 'Only JPG, PNG, and WebP images are allowed.'
        } else if (error.message.includes('read')) {
          errorMessage = 'Failed to read the image file. Please try again.'
        } else {
          errorMessage = error.message
        }
      } else if (error?.code === '42P01') {
        errorMessage = 'Database connection issue. Please check your internet connection.'
      }

      alert(errorMessage)
      // Revert local state on error
      setProfileImage('')
    } finally {
      setSavingImage(null)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      console.log('✅ User signed out successfully')
    } catch (error: any) {
      console.error('❌ Failed to sign out:', {
        code: error?.code,
        message: error?.message
      })

      // Even if sign out fails, we can still redirect to login
      alert('There was an issue signing out. Please close and reopen the app.')
    }
  }

  // Calculate stats
  const totalPrayerTime = prayerSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
  const totalBibleTime = bibleSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
  const totalMeditationTime = meditationSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
  const bestGameScore = gameScores.length > 0 ? Math.max(...gameScores.map(score => score.score)) : 0

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <OsmoContainer padding={true}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">Profile</h1>
        </div>

        {/* Social Media Style Profile Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          {/* Banner Image */}
          <div className="relative h-48 overflow-hidden">
            {bannerImage ? (
              <>
                <img
                  src={bannerImage}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to gradient if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                          <div class="absolute inset-0 bg-black/20"></div>
                          <div class="absolute inset-0 flex items-center justify-center">
                            <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md mx-4">
                              <p class="text-white text-center font-medium text-lg">"God's will, not mine."</p>
                            </div>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
                {/* Image Attribution for default images */}
                {isDefaultImage(bannerImage) && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {getImageAttribution(bannerImage)}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md mx-4">
                    <p className="text-white text-center font-medium text-lg">
                      "God's will, not mine."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-[var(--bg-primary)] overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to cross emoji if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="text-black text-3xl font-bold">✝️</div>';
                    }
                  }}
                />
              ) : (
                <div className="text-black text-3xl font-bold">
                  ✝️
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="absolute top-4 right-4">
            <OsmoButton
              onClick={() => setIsEditing(true)}
              variant="secondary"
            >
              Edit Profile
            </OsmoButton>
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-16 mb-8">
          <div className="space-y-4">
            {/* Display Name */}
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                {displayName || 'User'}
              </h2>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>

            {/* Handle */}
            <p className="text-[var(--text-secondary)]">@{email.split('@')[0] || 'user'}</p>

            {/* Bio */}
            <p className="text-[var(--text-primary)] text-lg mt-2">
              {bio || 'Welcome to your spiritual journey! 🌟'}
            </p>

            {/* Custom Links */}
            {customLinks.length > 0 && (
              <div className="space-y-2">
                {customLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 text-blue-400">
                    <span>🔗</span>
                    <a
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {link.title || link.url}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 text-[var(--text-secondary)]">
              <span><span className="font-bold text-[var(--text-primary)]">{prayerSessions.length + bibleSessions.length + meditationSessions.length}</span> Sessions</span>
              <span><span className="font-bold text-[var(--text-primary)]">{achievements.length}</span> Achievements</span>
              <span><span className="font-bold text-[var(--text-primary)]">{currentStreak}</span> Day Streak</span>
            </div>

            {/* Favorite Verse */}
            {favoriteVerse && (
              <div className="bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl p-4 mt-4">
                <p className="text-sm text-[var(--text-secondary)] mb-2">Favorite Verse:</p>
                <p className="text-[var(--text-primary)] italic">"{favoriteVerse}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Streak */}
        <OsmoCard className="mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--spiritual-blue)]/5"></div>
          <div className="relative text-center p-6">
            {currentStreak > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    🔥 {currentStreak} Day Streak
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-sm">Amazing consistency! Keep the fire burning.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-16 rounded-2xl overflow-hidden mx-auto shadow-lg">
                  <img
                    src="/assets/illustrations/streak-placeholder.svg"
                    alt="Start Your Streak"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-8 h-8 text-[var(--accent-primary)] flex items-center justify-center mx-auto"><svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"/></svg></div>';
                      }
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Start Your Streak</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-4">Begin your spiritual journey today and build consistency.</p>
                  <OsmoButton variant="primary" size="sm" className="px-6 py-2">
                    Begin Journey
                  </OsmoButton>
                </div>
              </div>
            )}
          </div>
        </OsmoCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Prayer Time */}
          <OsmoCard className="text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/10 to-[var(--spiritual-cyan)]/10"></div>
            <div className="relative p-4">
              {totalPrayerTime > 0 ? (
                <div className="space-y-2">
                  <div className="text-2xl">🙏</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.floor(totalPrayerTime / 60)}h {totalPrayerTime % 60}m</div>
                  <div className="text-sm text-[var(--text-secondary)]">Prayer Time</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-10 rounded-xl overflow-hidden mx-auto shadow-md">
                    <img
                      src="/assets/illustrations/prayer-placeholder.svg"
                      alt="Prayer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-2xl">🙏</div>';
                        }
                      }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">0h</div>
                  <div className="text-sm text-[var(--text-secondary)]">Prayer Time</div>
                </div>
              )}
            </div>
          </OsmoCard>

          {/* Bible Reading */}
          <OsmoCard className="text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/10 to-[var(--spiritual-cyan)]/10"></div>
            <div className="relative p-4">
              {totalBibleTime > 0 ? (
                <div className="space-y-2">
                  <div className="text-2xl">📖</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.floor(totalBibleTime / 60)}h {totalBibleTime % 60}m</div>
                  <div className="text-sm text-[var(--text-secondary)]">Bible Reading</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-10 rounded-xl overflow-hidden mx-auto shadow-md">
                    <img
                      src="/assets/illustrations/bible-placeholder.svg"
                      alt="Bible Reading"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-2xl">📖</div>';
                        }
                      }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">0h</div>
                  <div className="text-sm text-[var(--text-secondary)]">Bible Reading</div>
                </div>
              )}
            </div>
          </OsmoCard>

          {/* Meditation */}
          <OsmoCard className="text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/10 to-[var(--spiritual-cyan)]/10"></div>
            <div className="relative p-4">
              {totalMeditationTime > 0 ? (
                <div className="space-y-2">
                  <div className="text-2xl">🧘</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.floor(totalMeditationTime / 60)}h {totalMeditationTime % 60}m</div>
                  <div className="text-sm text-[var(--text-secondary)]">Meditation</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-10 rounded-xl overflow-hidden mx-auto shadow-md">
                    <img
                      src="/assets/illustrations/meditation-placeholder.svg"
                      alt="Meditation"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-2xl">🧘</div>';
                        }
                      }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">0h</div>
                  <div className="text-sm text-[var(--text-secondary)]">Meditation</div>
                </div>
              )}
            </div>
          </OsmoCard>

          {/* Game Score */}
          <OsmoCard className="text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/10 to-[var(--spiritual-cyan)]/10"></div>
            <div className="relative p-4">
              <div className="space-y-2">
                <div className="text-2xl">🎮</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{bestGameScore}</div>
                <div className="text-sm text-[var(--text-secondary)]">Best Score</div>
              </div>
            </div>
          </OsmoCard>
        </div>

        {/* Achievements Section */}
        <OsmoCard className="mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--spiritual-blue)]/5"></div>
          <div className="relative p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">🏆 Your Achievements</h3>
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.slice(0, 6).map((achievement, index) => (
                  <div key={index} className="bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl p-4 flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{achievement.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--spiritual-blue)]/20 rounded-2xl flex items-center justify-center mx-auto">
                  <div className="text-2xl">🏆</div>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] mb-4">Complete spiritual activities to unlock achievements and track your progress on your faith journey.</p>
                </div>
              </div>
            )}
          </div>
        </OsmoCard>

        {/* Spiritual Journey Timeline */}
        <OsmoCard className="mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/5 to-[var(--spiritual-cyan)]/5"></div>
          <div className="relative p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">📅 Your Journey</h3>
            {prayerSessions.length + bibleSessions.length + meditationSessions.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{prayerSessions.length + bibleSessions.length + meditationSessions.length}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Total Sessions Completed</div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">{prayerSessions.length}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Prayer Sessions</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">{bibleSessions.length}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Bible Sessions</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">{meditationSessions.length}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Meditation Sessions</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--spiritual-blue)]/20 to-[var(--spiritual-cyan)]/20 rounded-2xl flex items-center justify-center mx-auto">
                  <div className="text-2xl">📅</div>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] mb-4">Start tracking your spiritual activities and watch your journey unfold with meaningful milestones.</p>
                </div>
              </div>
            )}
          </div>
        </OsmoCard>

        {/* Sign Out Section */}
        <OsmoCard className="mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Account Actions</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Sign out of your account</p>
                </div>
              </div>
              <OsmoButton
                onClick={handleSignOut}
                variant="secondary"
                className="px-6 py-3 border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-all duration-300"
              >
                Sign Out
              </OsmoButton>
            </div>
          </div>
        </OsmoCard>
      </OsmoContainer>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <OsmoCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Edit Profile</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-8 h-8 bg-[var(--glass-dark)] hover:bg-[var(--glass-light)] border border-[var(--glass-border)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Banner Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                    Banner Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleBannerUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      savingImage === 'banner'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                        : 'border-[var(--glass-border)] hover:border-[var(--accent-primary)]'
                    }`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        {savingImage === 'banner' ? (
                          <svg className="w-6 h-6 text-[var(--accent-primary)] animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                        {savingImage === 'banner' ? 'Saving banner...' : 'Click to upload banner image'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">Max 2MB, JPG/PNG/WebP</p>
                    </div>
                  </div>
                </div>

                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                    Profile Picture
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleProfileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      savingImage === 'profile'
                        ? 'border-[var(--spiritual-blue)] bg-[var(--spiritual-blue)]/5'
                        : 'border-[var(--glass-border)] hover:border-[var(--spiritual-blue)]'
                    }`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-[var(--spiritual-blue)]/20 to-[var(--spiritual-cyan)]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        {savingImage === 'profile' ? (
                          <svg className="w-6 h-6 text-[var(--spiritual-blue)] animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-[var(--spiritual-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                        {savingImage === 'profile' ? 'Saving profile picture...' : 'Click to upload profile picture'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">Max 1MB, JPG/PNG/WebP</p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                      placeholder="Your display name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                      placeholder="Your location"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Favorite Verse
                  </label>
                  <input
                    type="text"
                    value={favoriteVerse}
                    onChange={(e) => setFavoriteVerse(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                    placeholder="Your favorite Bible verse..."
                  />
                </div>

                {/* Custom Links */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-[var(--text-primary)]">
                      Custom Links
                    </label>
                    <button
                      type="button"
                      onClick={addCustomLink}
                      className="px-3 py-1 text-xs bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/80 transition-colors"
                    >
                      Add Link
                    </button>
                  </div>
                  
                  {customLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => updateCustomLink(index, 'title', e.target.value)}
                        placeholder="Link title"
                        className="flex-1 px-3 py-2 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-sm"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomLink(index)}
                        className="px-2 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Reset to Default Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[var(--glass-border)]">
                  <OsmoButton
                    onClick={() => {
                      if (user) {
                        const defaultBannerImage = getConsistentDefaultBannerImage(user.id)
                        setBannerImage(defaultBannerImage.url)
                      }
                    }}
                    variant="secondary"
                    className="flex-1 text-sm"
                  >
                    Reset Banner to Default
                  </OsmoButton>
                  <OsmoButton
                    onClick={() => {
                      if (user) {
                        const defaultProfileImage = getConsistentDefaultProfileImage(user.id)
                        setProfileImage(defaultProfileImage.url)
                      }
                    }}
                    variant="secondary"
                    className="flex-1 text-sm"
                  >
                    Reset Profile to Default
                  </OsmoButton>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <OsmoButton
                    onClick={handleSaveProfile}
                    variant="primary"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </OsmoButton>
                  <OsmoButton
                    onClick={() => setIsEditing(false)}
                    variant="secondary"
                    className="px-6"
                  >
                    Cancel
                  </OsmoButton>
                </div>
              </div>
            </div>
          </OsmoCard>
        </div>
      )}
    </div>
  )
}

export default UserProfile