import { create } from 'zustand'
import { supabase } from '../utils/supabase'
import { logger, logUserAction, logDatabaseOperation } from '../utils/logger'
import { metrics, trackUserAction, trackDatabaseOperation } from '../utils/metrics'
import { getOptimizedCommunityPosts, getOptimizedUserInteractions, getOptimizedFollowedUsers } from '../utils/database'
import { communityRateLimitMiddleware, checkCommunityRateLimit } from '../utils/rateLimit'

// Offline cache and queue interfaces
interface CachedPost {
  id: string
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface OfflinePost {
  id: string
  content: string
  category: string
  timestamp: number
  retryCount: number
  userId: string
  mediaData?: { media_url?: string; media_type?: string }
}

// Types
export interface CommunityPost {
  id: string
  author_id: string
  author_name: string
  author_avatar: string
  author_handle?: string
  author_profile_image?: string
  content: string
  created_at: string
  amens_count: number
  loves_count: number
  prayers_count: number
  post_type: 'post' | 'prayer_request' | 'encouragement' | 'testimony' | 'prayer_share'
  is_live: boolean
  moderation_status: 'approved' | 'pending' | 'rejected'
  hashtags?: string[]
  replies?: CommunityPost[]
  parent_id?: string
  // Prayer request specific fields
  is_prayer_request?: boolean
  prayer_category?: 'healing' | 'guidance' | 'strength' | 'family' | 'other'
  is_answered?: boolean
  answered_at?: string
  // Encouragement specific fields
  encouragement_type?: 'scripture' | 'prayer' | 'word' | 'prophecy'
  target_user_id?: string
  // Progress integration
  linked_session_id?: string
  session_type?: 'prayer' | 'bible' | 'meditation'
  // Media fields
  media_url?: string
  media_type?: string
}

// Prayer Request interface
export interface PrayerRequest {
  id: string
  author_id: string
  author_name: string
  author_profile_image?: string
  title: string
  description: string
  category: 'healing' | 'guidance' | 'strength' | 'family' | 'other'
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  is_answered: boolean
  answered_at?: string
  answered_by?: string
  prayers_count: number
  created_at: string
  updated_at: string
  is_public: boolean
  linked_session_id?: string
}

// Spiritual Encouragement interface
export interface SpiritualEncouragement {
  id: string
  author_id: string
  author_name: string
  author_profile_image?: string
  target_user_id?: string
  encouragement_type: 'scripture' | 'prayer' | 'word' | 'prophecy'
  title: string
  content: string
  scripture_reference?: string
  is_anonymous: boolean
  created_at: string
  likes_count: number
  linked_session_id?: string
  session_type?: 'prayer' | 'bible' | 'meditation'
}

// User Journey integration
export interface SpiritualJourneyPost {
  id: string
  user_id: string
  post_id: string
  post_type: 'prayer_request' | 'encouragement' | 'prayer_share'
  session_id?: string
  session_type?: 'prayer' | 'bible' | 'meditation'
  duration_minutes?: number
  created_at: string
  impact_score?: number // How much this affected their journey
  notes?: string
}

export interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  bio?: string
  email?: string
}

export interface RateLimit {
  posts: { count: number; resetTime: number }
  interactions: { count: number; resetTime: number }
  follows: { count: number; resetTime: number }
}

interface CommunityState {
  // Data
  posts: CommunityPost[]
  followedUsers: string[]
  userProfiles: Map<string, UserProfile>

  // New Features
  prayerRequests: PrayerRequest[]
  spiritualEncouragements: SpiritualEncouragement[]
  userJourneyPosts: SpiritualJourneyPost[]
  
  // UI State
  isLoading: boolean
  isLoadingMore: boolean
  isCreatingPost: boolean
  error: string | null
  hasMorePosts: boolean
  currentCursor?: string
  
  // Feed Settings
  contentFilter: 'all' | 'following'
  
  // Rate Limiting
  rateLimits: RateLimit

  // Offline Support
  isOnline: boolean
  offlineQueue: OfflinePost[]
  cache: Map<string, CachedPost>
  
  // Actions
  loadPosts: (refresh?: boolean) => Promise<void>
  loadMorePosts: () => Promise<void>
  createPost: (content: string, postType?: 'post' | 'prayer_request' | 'encouragement' | 'testimony' | 'prayer_share', options?: {
    prayerCategory?: string
    encouragementType?: string
    targetUserId?: string
    linkedSessionId?: string
    sessionType?: string
  }) => Promise<boolean>
  toggleFollow: (userId: string) => Promise<boolean>
  addInteraction: (postId: string, type: 'amen' | 'love' | 'prayer') => Promise<boolean>
  addReply: (postId: string, content: string) => Promise<boolean>
  setContentFilter: (filter: 'all' | 'following') => void
  loadFollowedUsers: () => Promise<void>
  checkRateLimit: (type: 'posts' | 'interactions' | 'follows') => boolean
  getUserProfile: (userId: string) => Promise<UserProfile | null>
  reset: () => void

  // New Feature Actions
  createPrayerRequest: (request: Omit<PrayerRequest, 'id' | 'author_name' | 'author_profile_image' | 'created_at' | 'updated_at' | 'prayers_count'>) => Promise<boolean>
  createEncouragement: (encouragement: Omit<SpiritualEncouragement, 'id' | 'author_name' | 'author_profile_image' | 'created_at' | 'likes_count'>) => Promise<boolean>
  likeEncouragement: (encouragementId: string) => Promise<boolean>
  markPrayerAnswered: (prayerId: string, answerDetails?: string) => Promise<boolean>
  addPrayerToRequest: (prayerId: string) => Promise<boolean>
  linkPostToJourney: (postId: string, sessionId?: string, sessionType?: string, duration?: number, impactScore?: number, notes?: string) => Promise<boolean>
  loadPrayerRequests: () => Promise<void>
  loadEncouragements: () => Promise<void>
  loadUserJourney: (userId?: string) => Promise<void>

  // Offline Actions
  syncOfflineQueue: () => Promise<void>
  addToOfflineQueue: (post: Omit<OfflinePost, 'id' | 'timestamp' | 'retryCount'>) => void
  clearOfflineQueue: () => void
  updateOnlineStatus: (isOnline: boolean) => void
}

const POSTS_PER_PAGE = 20
const RATE_LIMITS = {
  POSTS_PER_DAY: 15,
  INTERACTIONS_PER_MINUTE: 25,
  FOLLOWS_PER_DAY: 50
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  // Initial State
  posts: [],
  followedUsers: [],
  userProfiles: new Map(),

  // New Features State
  prayerRequests: [],
  spiritualEncouragements: [],
  userJourneyPosts: [],

  isLoading: false,
  isLoadingMore: false,
  isCreatingPost: false,
  error: null,
  hasMorePosts: true,
  currentCursor: undefined,
  contentFilter: 'all',
  rateLimits: {
    posts: { count: 0, resetTime: 0 },
    interactions: { count: 0, resetTime: 0 },
    follows: { count: 0, resetTime: 0 }
  },
  // Offline State
  isOnline: navigator.onLine,
  offlineQueue: JSON.parse(localStorage.getItem('community_offline_queue') || '[]'),
  cache: new Map(),

  // Load posts with caching and offline fallback
  loadPosts: async (refresh = false) => {
    const { contentFilter, followedUsers, cache, isOnline } = get()
    const cacheKey = `posts_${contentFilter}_${followedUsers.join(',')}_${refresh ? 'refresh' : 'append'}`
    
    try {
      set({ isLoading: true, error: null })
      
      if (refresh) {
        set({ currentCursor: undefined, hasMorePosts: true })
        // Also load followed users when refreshing
        await get().loadFollowedUsers()
      }

      // Check cache first (only if not refreshing)
      if (!refresh && cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey)!
        if (Date.now() - cachedData.timestamp < cachedData.ttl) {
          logger.debug('Loading posts from cache', { cacheKey, postCount: cachedData.data.length })
          set({
            posts: cachedData.data,
            hasMorePosts: true, // Assume more posts available when using cache
            isLoading: false
          })
          return
        } else {
          // Cache expired, remove it
          cache.delete(cacheKey)
        }
      }

      // If offline, try to load from localStorage as fallback
      if (!isOnline) {
        logger.info('Offline mode - attempting to load cached posts', { refresh })
        const offlinePosts = localStorage.getItem('community_posts_cache')
        if (offlinePosts) {
          try {
            const parsedPosts = JSON.parse(offlinePosts)
            set({
              posts: refresh ? parsedPosts : [...get().posts, ...parsedPosts],
              hasMorePosts: false,
              isLoading: false,
              error: 'You\'re offline. Showing cached posts. 🔄'
            })
            logger.info('Loaded cached posts from localStorage', { postCount: parsedPosts.length })
            return
          } catch (error) {
            logger.error('Failed to parse offline posts', error as Error)
          }
        }

        set({
          error: 'You\'re offline and no cached posts are available. 📱',
          isLoading: false
        })
        logger.warn('No cached posts available in offline mode')
        return
      }

      if (!supabase) {
        console.error('❌ Community Store: Supabase client is null')
        throw new Error('Supabase client not initialized')
      }

      // Use optimized database query with performance tracking
      const postsResult = await getOptimizedCommunityPosts({
        limit: POSTS_PER_PAGE,
        offset: refresh ? 0 : get().posts.length,
        userId: contentFilter === 'following' ? undefined : undefined,
        postType: undefined,
        includeAuthor: true
      })

      const { data, error } = { data: postsResult, error: null }

      if (error) {
        logger.error('Community posts query failed', error as Error, {
          code: error.code,
          message: error.message,
          refresh
        })

        // Provide more specific error messages
        if (error.code === 'PGRST116') {
          throw new Error('No posts found. Be the first to share! 🙏')
        } else if (error.message?.includes('JWT')) {
          throw new Error('Please sign in again to view community posts 🔐')
        } else if (error.message?.includes('network')) {
          throw new Error('Network connection issue. Trying cached posts... 📡')
        } else {
        throw error
        }
      }

      const newPosts = data?.map(formatPost) || []

      // Cache the results
      cache.set(cacheKey, {
        id: cacheKey,
        data: newPosts,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutes cache
      })

      // Also save to localStorage for offline fallback
      localStorage.setItem('community_posts_cache', JSON.stringify(newPosts))
      
      set({ 
        posts: refresh ? newPosts : [...get().posts, ...newPosts],
        hasMorePosts: newPosts.length === POSTS_PER_PAGE,
        isLoading: false
      })

    } catch (error) {
      console.error('Error loading posts:', error)
      
      // Enhanced error handling with specific diagnostics
      let errorMessage = 'Failed to load community posts. Please try again.'
      
      if (error && typeof error === 'object') {
        const err = error as any
        
        // Check for specific Supabase error codes
        if (err.code === 'PGRST116') {
          errorMessage = 'No posts found. Be the first to share! 🙏'
        } else if (err.code === 'PGRST301') {
          errorMessage = 'Database table "community_posts" does not exist.'
        } else if (err.code === '42P01') {
          errorMessage = 'Database table "community_posts" not found. Please check your database setup.'
        } else if (err.code === '42703') {
          errorMessage = 'Database column not found. Please check your table structure.'
        } else if (err.message && err.message.includes('JWT')) {
          errorMessage = 'Authentication issue. Please try signing in again 🔐'
        } else if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('ERR_FAILED'))) {
          errorMessage = 'Network connection issue. Please check your connection 📡'
        } else if (err.message && err.message.includes('Supabase client not initialized')) {
          errorMessage = 'Database connection not configured. Please check environment variables.'
        } else if (err.message) {
          errorMessage = `Database error: ${err.message}`
        } else {
          errorMessage = 'Unknown database error occurred.'
        }
      }
      
      set({ error: errorMessage, isLoading: false })
      
      // If it's a refresh and we have no posts, keep the error for retry
      if (refresh && get().posts.length === 0) {
        set({ 
          posts: [],
          error: errorMessage,
          isLoading: false
        })
      }
    }
  },

  loadMorePosts: async () => {
    const { hasMorePosts, isLoadingMore, currentCursor } = get()
    
    if (!hasMorePosts || isLoadingMore) return
    
    set({ isLoadingMore: true })
    
    try {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      // Implement cursor-based pagination
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          author_id,
          author_name,
          author_avatar,
          content,
          post_type,
          created_at,
          amens_count,
          loves_count,
          prayers_count,
          replies_count,
          is_live,
          moderation_status
        `)
        .eq('is_live', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .range(get().posts.length, get().posts.length + POSTS_PER_PAGE - 1)

      if (error) throw error

      const newPosts = data?.map(formatPost) || []
      
      set({
        posts: [...get().posts, ...newPosts],
        hasMorePosts: newPosts.length === POSTS_PER_PAGE,
        isLoadingMore: false
      })

    } catch (error) {
      console.error('Error loading more posts:', error)
      set({ error: 'Failed to load more posts', isLoadingMore: false })
    }
  },

  createPost: async (content: string, mediaData?: { media_url?: string; media_type?: string }, category: 'post' | 'prayer_request' | 'encouragement' | 'testimony' | 'prayer_share' = 'post') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ error: 'Please sign in to create posts' })
      return false
    }

    // Use new rate limiting system
    const rateLimitResult = await checkCommunityRateLimit(user.id, 'post')
    if (!rateLimitResult.success) {
      set({ error: rateLimitResult.error || 'Rate limit exceeded' })
      return false
    }

    const { isOnline } = get()
    let currentUser = null

    try {
      set({ isCreatingPost: true, error: null })

      // If offline, add to queue instead of trying to post
      if (!isOnline) {
        if (!supabase) {
          set({ error: 'Please sign in to create posts', isCreatingPost: false })
          return false
        }

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          set({ error: 'Please sign in to create posts', isCreatingPost: false })
          return false
        }

        currentUser = authUser

        get().addToOfflineQueue({
          content: content.trim(),
          category,
          userId: currentUser.id,
          mediaData: mediaData || undefined
        })

        set({
          isCreatingPost: false,
          error: 'Post saved! It will be shared when you\'re back online. 📱'
        })

        // Update rate limit
        updateRateLimit('posts')
        return true
      }

      // Online: Create post normally
      if (!supabase) {
        throw new Error('Unable to connect to the community. Please check your network connection.')
      }

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('User not authenticated')

      currentUser = authUser

      // Get user profile for author data
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', currentUser.id)
        .single()

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          author_name: profile?.display_name || user.user_metadata?.display_name || 'User',
          author_avatar: profile?.avatar_url || user.user_metadata?.avatar_url || '👤',
          content: content.trim(),
          post_type: category,
          is_live: true,
          moderation_status: 'approved',
          ...(mediaData?.media_url && {
            media_url: mediaData.media_url,
            media_type: mediaData.media_type || 'image'
          })
        })
        .select(`
          id,
          author_id,
          author_name,
          author_avatar,
          content,
          post_type,
          media_url,
          media_type,
          created_at,
          amens_count,
          loves_count,
          prayers_count,
          replies_count
        `)
        .single()

      if (error) throw error

      const newPost = formatPost(data)
      set({
        posts: [newPost, ...get().posts],
        isCreatingPost: false
      })

      // Track user action for analytics
      trackUserAction('create_post', currentUser.id, {
        postId: newPost.id,
        postType: category,
        contentLength: content.length
      })

      // Update rate limit
      updateRateLimit('posts')
      return true

    } catch (error) {
      console.error('Error creating post:', error)
      console.error('Error details:', {
        postId: null,
        type: 'create',
        userId: user?.id,
        error: error instanceof Error ? error.message : String(error)
      })
      set({ error: 'Failed to create post', isCreatingPost: false })
      return false
    }
  },

  toggleFollow: async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ error: 'Please sign in to follow users' })
      return false
    }

    // Use new rate limiting system
    const rateLimitResult = await checkCommunityRateLimit(user.id, 'follow')
    if (!rateLimitResult.success) {
      set({ error: rateLimitResult.error || 'Rate limit exceeded' })
      return false
    }

    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    try {
      const { followedUsers } = get()
      const isFollowing = followedUsers.includes(userId)

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)

        if (error) throw error

        set({ followedUsers: followedUsers.filter(id => id !== userId) })

        // Track unfollow action
        trackUserAction('unfollow_user', user.id, { targetUserId: userId })

      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          })

        if (error) throw error

        set({ followedUsers: [...followedUsers, userId] })

        // Track follow action
        trackUserAction('follow_user', user.id, { targetUserId: userId })
      }

      return true

    } catch (error) {
      console.error('Error toggling follow:', error)
      set({ error: 'Failed to update follow status' })
      return false
    }
  },

  addInteraction: async (postId: string, type: 'amen' | 'love' | 'prayer') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ error: 'Please sign in to interact with posts' })
      return false
    }

    // Use new rate limiting system
    const rateLimitResult = await checkCommunityRateLimit(user.id, 'interact')
    if (!rateLimitResult.success) {
      set({ error: rateLimitResult.error || 'Rate limit exceeded' })
      return false
    }

    if (!supabase) {
      set({ error: 'Unable to connect to the community. Please check your network connection.' })
      return false
    }

    let currentUser = null
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      currentUser = authUser
      if (authError || !currentUser) return false

      // Check if interaction already exists
      const { data: existingInteraction } = await supabase
        .from('post_interactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .eq('interaction_type', type)
        .maybeSingle()

      let isAdding = true

      if (existingInteraction) {
        // Remove interaction (toggle off)
        const { error: deleteError } = await supabase
          .from('post_interactions')
          .delete()
          .eq('id', existingInteraction.id)

        if (deleteError) throw deleteError
        isAdding = false
      } else {
        // Add interaction
        const { error: insertError } = await supabase
          .from('post_interactions')
          .insert({
            post_id: postId,
            user_id: currentUser.id,
            interaction_type: type
          })

        if (insertError) throw insertError
      }

      // Update local state - counts will be updated by database triggers
      const countField = `${type}s_count`
      const currentCount = get().posts.find(p => p.id === postId)?.[countField] || 0
      const newCount = isAdding ? currentCount + 1 : Math.max(0, currentCount - 1)

      set({
        posts: get().posts.map(post =>
          post.id === postId
            ? { ...post, [countField]: newCount }
            : post
        )
      })

      // Track interaction for analytics
      trackUserAction(`interact_${type}`, currentUser.id, {
        postId,
        interactionType: type,
        isAdding
      })

      updateRateLimit('interactions')
      return true

    } catch (error) {
      console.error('❌ Error adding interaction:', error)
      console.error('❌ Error details:', {
        postId,
        type,
        userId: currentUser?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      })
      set({ error: `Failed to add ${type} interaction. Please try again.` })
      return false
    }
  },

  addReply: async (postId: string, content: string) => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    let currentUser = null
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      currentUser = authUser
      if (authError || !currentUser) return false

      const { data: replyData, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: currentUser.id,
          author_name: currentUser.user_metadata?.display_name || currentUser.email || 'Anonymous',
          author_avatar: currentUser.user_metadata?.avatar_url || '👤',
          content: content.trim(),
          post_type: 'post',
          parent_id: postId,
          is_live: true,
          moderation_status: 'approved'
        })
        .select(`
          id,
          author_id,
          author_name,
          author_avatar,
          content,
          post_type,
          media_url,
          media_type,
          created_at,
          amens_count,
          loves_count,
          prayers_count,
          replies_count
        `)
        .single()

      if (error) throw error

      const reply = formatPost(replyData)
      
      // Add reply to parent post
      set({
        posts: get().posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              replies: [...(post.replies || []), reply],
              prayers_count: post.prayers_count + 1
            }
          }
          return post
        })
      })

      return true

    } catch (error) {
      console.error('❌ Error adding reply:', error)
      console.error('❌ Error details:', {
        postId,
        content,
        userId: currentUser?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      })
      set({ error: 'Failed to add reply. Please try again.' })
      return false
    }
  },

  setContentFilter: (filter) => {
    set({ contentFilter: filter })
    get().loadPosts(true) // Reload posts when filter changes
  },

  loadFollowedUsers: async () => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (error) throw error

      const followedUserIds = data?.map(follow => follow.following_id) || []
      set({ followedUsers: followedUserIds })

    } catch (error) {
      console.error('Error loading followed users:', error)
    }
  },

  checkRateLimit: (type: 'posts' | 'interactions' | 'follows') => {
    const { rateLimits } = get()
    const now = Date.now()
    
    const limits = {
      posts: { max: RATE_LIMITS.POSTS_PER_DAY, window: 24 * 60 * 60 * 1000 },
      interactions: { max: RATE_LIMITS.INTERACTIONS_PER_MINUTE, window: 60 * 1000 },
      follows: { max: RATE_LIMITS.FOLLOWS_PER_DAY, window: 24 * 60 * 60 * 1000 }
    }
    
    const limit = rateLimits[type]
    const config = limits[type]
    
    // Reset if window has passed
    if (now > limit.resetTime) {
      return true
    }
    
    return limit.count < config.max
  },

  getUserProfile: async (userId: string) => {
    const { userProfiles } = get()
    
    // Return cached profile
    if (userProfiles.has(userId)) {
      return userProfiles.get(userId) || null
    }

    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      const profile: UserProfile = {
        id: data.id,
        display_name: data.display_name || 'User',
        avatar_url: data.avatar_url,
        bio: data.bio,
        email: data.email
      }
      
      // Cache profile
      set({
        userProfiles: new Map(userProfiles.set(userId, profile))
      })
      
      return profile
      
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  },

  reset: () => {
    set({
      posts: [],
      followedUsers: [],
      userProfiles: new Map(),
      isLoading: false,
      isLoadingMore: false,
      isCreatingPost: false,
      error: null,
      hasMorePosts: true,
      currentCursor: undefined,
      contentFilter: 'all',
      rateLimits: {
        posts: { count: 0, resetTime: 0 },
        interactions: { count: 0, resetTime: 0 },
        follows: { count: 0, resetTime: 0 }
      },
      isOnline: navigator.onLine,
      offlineQueue: [],
      cache: new Map()
    })
    // Clear offline queue from localStorage
    localStorage.removeItem('community_offline_queue')
  },

  // Offline Support Methods
  syncOfflineQueue: async () => {
    const { offlineQueue, isOnline } = get()

    if (!isOnline || offlineQueue.length === 0) return

    try {
      set({ isCreatingPost: true, error: null })

      for (const offlinePost of offlineQueue) {
        if (offlinePost.retryCount >= 3) continue // Skip posts that failed 3 times

        try {
          if (!supabase) continue

          const { data: { user } } = await supabase.auth.getUser()
          if (!user) continue

          const { data, error } = await supabase
            .from('community_posts')
            .insert({
              author_id: offlinePost.userId,
              content: offlinePost.content,
              category: offlinePost.category,
              is_live: true,
              moderation_status: 'approved'
            })
            .select('*')
            .single()

          if (!error && data) {
            const newPost = formatPost(data)
            set({
              posts: [newPost, ...get().posts]
            })
          }
        } catch (error) {
          console.error('Failed to sync offline post:', error)
          // Update retry count
          set({
            offlineQueue: get().offlineQueue.map(p =>
              p.id === offlinePost.id
                ? { ...p, retryCount: p.retryCount + 1 }
                : p
            )
          })
        }
      }

      // Remove successfully synced posts from queue
      const remainingQueue = get().offlineQueue.filter(p => p.retryCount >= 3)
      set({ offlineQueue: remainingQueue })
      localStorage.setItem('community_offline_queue', JSON.stringify(remainingQueue))

    } catch (error) {
      console.error('Error syncing offline queue:', error)
      set({ error: 'Failed to sync offline posts' })
    } finally {
      set({ isCreatingPost: false })
    }
  },

  addToOfflineQueue: (post) => {
    const offlinePost: OfflinePost = {
      id: Date.now().toString(),
      content: post.content,
      category: post.category,
      timestamp: Date.now(),
      retryCount: 0,
      userId: post.userId
    }

    const newQueue = [...get().offlineQueue, offlinePost]
    set({ offlineQueue: newQueue })
    localStorage.setItem('community_offline_queue', JSON.stringify(newQueue))
  },

  clearOfflineQueue: () => {
    set({ offlineQueue: [] })
    localStorage.removeItem('community_offline_queue')
  },

  updateOnlineStatus: (isOnline) => {
    set({ isOnline })

    // If coming back online, try to sync offline queue
    if (isOnline) {
      setTimeout(() => get().syncOfflineQueue(), 1000)
    }
  },

  // New Feature Implementations
  createPrayerRequest: async (request) => {
    try {
      set({ isCreatingPost: true, error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        set({ error: 'User not authenticated' })
        return false
      }

      const newRequest: PrayerRequest = {
        id: Date.now().toString(),
        author_id: user.id,
        author_name: user.user_metadata?.display_name || user.email || 'Anonymous',
        author_profile_image: user.user_metadata?.avatar_url,
        title: request.title,
        description: request.description,
        category: request.category,
        urgency: request.urgency,
        is_answered: false,
        prayers_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: request.is_public,
        linked_session_id: request.linked_session_id
      }

      // Add to local state for immediate UI feedback
      set((state) => ({
        prayerRequests: [newRequest, ...state.prayerRequests]
      }))

      // If offline, add to queue
      if (!get().isOnline) {
        get().addToOfflineQueue({
          content: JSON.stringify(newRequest),
          category: 'prayer_request',
          userId: user.id
        })
        return true
      }

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          author_name: user.user_metadata?.display_name || user.email || 'Anonymous',
          author_avatar: user.user_metadata?.avatar_url || '👤',
          content: request.description,
          post_type: 'prayer_request',
          is_live: true,
          moderation_status: 'approved'
        })
        .select(`
          id,
          author_id,
          author_name,
          author_avatar,
          content,
          post_type,
          media_url,
          media_type,
          created_at,
          amens_count,
          loves_count,
          prayers_count,
          replies_count
        `)
        .single();
      if (error) throw error;

      return true
    } catch (error) {
      set({ error: 'Failed to create prayer request' })
      return false
    } finally {
      set({ isCreatingPost: false })
    }
  },

  createEncouragement: async (encouragement) => {
    try {
      set({ isCreatingPost: true, error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        set({ error: 'User not authenticated' })
        return false
      }

      const newEncouragement: SpiritualEncouragement = {
        id: Date.now().toString(),
        author_id: user.id,
        author_name: user.user_metadata?.display_name || user.email || 'Anonymous',
        author_profile_image: user.user_metadata?.avatar_url,
        encouragement_type: encouragement.encouragement_type,
        title: encouragement.title,
        content: encouragement.content,
        scripture_reference: encouragement.scripture_reference,
        is_anonymous: encouragement.is_anonymous,
        created_at: new Date().toISOString(),
        likes_count: 0,
        target_user_id: encouragement.target_user_id,
        linked_session_id: encouragement.linked_session_id,
        session_type: encouragement.session_type
      }

      // Add to local state for immediate UI feedback
      set((state) => ({
        spiritualEncouragements: [newEncouragement, ...state.spiritualEncouragements]
      }))

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          author_name: user.user_metadata?.display_name || user.email || 'Anonymous',
          author_avatar: user.user_metadata?.avatar_url || '👤',
          content: encouragement.content,
          post_type: 'encouragement',
          is_live: true,
          moderation_status: 'approved'
        })
        .select(`
          id,
          author_id,
          author_name,
          author_avatar,
          content,
          post_type,
          media_url,
          media_type,
          created_at,
          amens_count,
          loves_count,
          prayers_count,
          replies_count
        `)
        .single();
      if (error) throw error;

      return true
    } catch (error) {
      set({ error: 'Failed to create encouragement' })
      return false
    } finally {
      set({ isCreatingPost: false })
    }
  },

  likeEncouragement: async (encouragementId) => {
    try {
      set({ error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        set({ error: 'User not authenticated' })
        return false
      }

      // Update local state
      set((state) => ({
        spiritualEncouragements: state.spiritualEncouragements.map(enc =>
          enc.id === encouragementId
            ? { ...enc, likes_count: enc.likes_count + 1 }
            : enc
        )
      }))

      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('community_posts')
        .update({ loves_count: (await supabase.from('community_posts').select('loves_count').eq('id', encouragementId).single()).data?.loves_count + 1 })
        .eq('id', encouragementId);
      if (error) throw error;

      return true
    } catch (error) {
      set({ error: 'Failed to like encouragement' })
      return false
    }
  },

  markPrayerAnswered: async (prayerId, answerDetails) => {
    try {
      set({ error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        set({ error: 'User not authenticated' })
        return false
      }

      // Update local state
      set((state) => ({
        prayerRequests: state.prayerRequests.map(prayer =>
          prayer.id === prayerId
            ? {
                ...prayer,
                is_answered: true,
                answered_at: new Date().toISOString(),
                answered_by: user.id
              }
            : prayer
        )
      }))

      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('community_posts')
        .update({
          is_answered: true,
          answered_at: new Date().toISOString(),
          answered_by: user.id
        })
        .eq('id', prayerId);
      if (error) throw error;

      return true
    } catch (error) {
      set({ error: 'Failed to mark prayer as answered' })
      return false
    }
  },

  addPrayerToRequest: async (prayerId) => {
    try {
      set({ error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        set({ error: 'User not authenticated' })
        return false
      }

      // Update local state
      set((state) => ({
        prayerRequests: state.prayerRequests.map(prayer =>
          prayer.id === prayerId
            ? { ...prayer, prayers_count: prayer.prayers_count + 1 }
            : prayer
        )
      }))

      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('community_posts')
        .update({ prayers_count: (await supabase.from('community_posts').select('prayers_count').eq('id', prayerId).single()).data?.prayers_count + 1 })
        .eq('id', prayerId);
      if (error) throw error;

      return true
    } catch (error) {
      set({ error: 'Failed to add prayer to request' })
      return false
    }
  },

  linkPostToJourney: async (postId, sessionId, sessionType, duration, impactScore, notes) => {
    try {
      set({ error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        set({ error: 'User not authenticated' })
        return false
      }

      const journeyPost: SpiritualJourneyPost = {
        id: Date.now().toString(),
        user_id: user.id,
        post_id: postId,
        post_type: 'prayer_request', // This will be determined by the actual post type
        session_id: sessionId,
        session_type: sessionType as 'prayer' | 'bible' | 'meditation' | undefined,
        duration_minutes: duration,
        created_at: new Date().toISOString(),
        impact_score: impactScore,
        notes: notes
      }

      // Add to local state
      set((state) => ({
        userJourneyPosts: [...state.userJourneyPosts, journeyPost]
      }))

      if (!supabase) throw new Error('Supabase client not initialized');
      const updateData: any = {
        linked_session_id: sessionId,
        duration_minutes: duration,
        impact_score: impactScore,
        notes: notes
      };
      const { error } = await supabase
        .from('community_posts')
        .update(updateData)
        .eq('id', postId);
      if (error) throw error;

      return true
    } catch (error) {
      set({ error: 'Failed to link post to journey' })
      return false
    }
  },

  loadPrayerRequests: async () => {
    try {
      set({ isLoading: true, error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('post_type', 'prayer_request')
        .eq('is_live', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ prayerRequests: data || [] })
    } catch (error) {
      set({ error: 'Failed to load prayer requests' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadEncouragements: async () => {
    try {
      set({ isLoading: true, error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('post_type', 'encouragement')
        .eq('is_live', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ spiritualEncouragements: data || [] })
    } catch (error) {
      set({ error: 'Failed to load encouragements' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadUserJourney: async (userId) => {
    try {
      set({ isLoading: true, error: null })

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        set({ error: 'User not authenticated' })
        return
      }
      const targetUserId = userId || user.id

      if (!targetUserId) {
        set({ error: 'User not authenticated' })
        return
      }

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('author_id', targetUserId)
        .not('linked_session_id', 'is', null) // Filter by linked sessions
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ userJourneyPosts: data || [] })
    } catch (error) {
      set({ error: 'Failed to load user journey' })
    } finally {
      set({ isLoading: false })
    }
  }
}))

// Helper functions
function formatPost(rawPost: any): CommunityPost {
  // Smart fallback: Use profile data if available, otherwise use post data
  const profileName = rawPost.profiles?.display_name
  const profileAvatar = rawPost.profiles?.avatar_url
  const postName = rawPost.author_name
  const postAvatar = rawPost.author_avatar
  
  // Prioritize profile data, fall back to post data, then to defaults
  const displayName = profileName || postName || 'Anonymous User'
  const avatarUrl = profileAvatar || postAvatar || '👤'
  
  return {
    id: rawPost.id,
    author_id: rawPost.author_id,
    author_name: displayName,
    author_avatar: avatarUrl,
    author_profile_image: avatarUrl !== '👤' ? avatarUrl : undefined,
    author_handle: `@${displayName.toLowerCase().replace(/\s+/g, '').slice(0, 15)}`,
    content: rawPost.content || '',
    created_at: rawPost.created_at,
    amens_count: rawPost.amens_count || 0,
    loves_count: rawPost.loves_count || 0,
    prayers_count: rawPost.prayers_count || 0,
    post_type: rawPost.post_type || 'post',
    hashtags: rawPost.hashtags || [], // Note: Add 'hashtags' to CommunityPost interface if needed
    is_live: rawPost.is_live,
    moderation_status: rawPost.moderation_status,
    replies: [],
    parent_id: rawPost.parent_id
  }
}

function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const matches = content.match(hashtagRegex)
  return matches ? matches.map(tag => tag.substring(1)) : []
}

function updateRateLimit(type: 'posts' | 'interactions' | 'follows') {
  const { rateLimits } = useCommunityStore.getState()
  const now = Date.now()
  
  const windows = {
    posts: 24 * 60 * 60 * 1000,
    interactions: 60 * 1000,
    follows: 24 * 60 * 60 * 1000
  }
  
  const currentLimit = rateLimits[type]
  const window = windows[type]
  
  // Reset if window has passed
  if (now > currentLimit.resetTime) {
    useCommunityStore.setState({
      rateLimits: {
        ...rateLimits,
        [type]: { count: 1, resetTime: now + window }
      }
    })
  } else {
    useCommunityStore.setState({
      rateLimits: {
        ...rateLimits,
        [type]: { count: currentLimit.count + 1, resetTime: currentLimit.resetTime }
      }
    })
  }
}
