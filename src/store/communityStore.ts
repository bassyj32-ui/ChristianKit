import { create } from 'zustand'
import { supabase } from '../utils/supabase'

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
  category: 'prayer' | 'bible_study' | 'testimony' | 'worship' | 'general'
  hashtags: string[]
  is_live: boolean
  moderation_status: 'approved' | 'pending' | 'rejected'
  replies?: CommunityPost[]
  parent_id?: string
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
  
  // Actions
  loadPosts: (refresh?: boolean) => Promise<void>
  loadMorePosts: () => Promise<void>
  createPost: (content: string, category?: string) => Promise<boolean>
  toggleFollow: (userId: string) => Promise<boolean>
  addInteraction: (postId: string, type: 'amen' | 'love' | 'prayer') => Promise<boolean>
  addReply: (postId: string, content: string) => Promise<boolean>
  setContentFilter: (filter: 'all' | 'following') => void
  loadFollowedUsers: () => Promise<void>
  checkRateLimit: (type: 'posts' | 'interactions' | 'follows') => boolean
  getUserProfile: (userId: string) => Promise<UserProfile | null>
  reset: () => void
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

  // Load posts with fallback for network issues
  loadPosts: async (refresh = false) => {
    const { contentFilter, followedUsers } = get()
    
    try {
      set({ isLoading: true, error: null })
      
      if (refresh) {
        set({ currentCursor: undefined, hasMorePosts: true })
        // Also load followed users when refreshing
        await get().loadFollowedUsers()
      }

      if (!supabase) {
        console.error('❌ Community Store: Supabase client is null')
        throw new Error('Supabase client not initialized')
      }

      console.log('🔄 Community Store: Attempting to load posts...')
      console.log('🔄 Supabase client exists:', !!supabase)

      // First, let's try a simpler query without joins to test basic connectivity
      let query = supabase
        .from('community_posts')
        .select('*')
        .eq('is_live', true)
        .eq('moderation_status', 'approved')

      // Apply filter based on contentFilter
      if (contentFilter === 'following' && followedUsers.length > 0) {
        query = query.in('author_id', followedUsers)
      }

      console.log('🔄 Executing query...')
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_PAGE)

      console.log('📊 Query result:', { data: data?.length || 0, error })
      if (error) {
        console.error('❌ Query error:', error)
        throw error
      }

      const newPosts = data?.map(formatPost) || []
      
      set({ 
        posts: refresh ? newPosts : [...get().posts, ...newPosts],
        hasMorePosts: newPosts.length === POSTS_PER_PAGE,
        isLoading: false
      })

    } catch (error) {
      console.error('Error loading posts:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Enhanced error handling with specific diagnostics
      let errorMessage = 'Failed to load posts. Please try again.'
      
      if (error && typeof error === 'object') {
        const err = error as any
        
        // Check for specific Supabase error codes
        if (err.code === 'PGRST116') {
          errorMessage = 'No posts found or table is empty.'
        } else if (err.code === 'PGRST301') {
          errorMessage = 'Database table "community_posts" does not exist.'
        } else if (err.code === '42P01') {
          errorMessage = 'Database table "community_posts" not found. Please check your database setup.'
        } else if (err.code === '42703') {
          errorMessage = 'Database column not found. Please check your table structure.'
        } else if (err.message && err.message.includes('JWT')) {
          errorMessage = 'Authentication issue. Please try signing in again.'
        } else if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('ERR_FAILED'))) {
          errorMessage = 'Unable to connect to the community. Please check your network connection.'
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
        .select('*')
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

  createPost: async (content: string, category = 'general') => {
    if (!get().checkRateLimit('posts')) {
      set({ error: 'Rate limit exceeded: 15 posts per day maximum' })
      return false
    }

    try {
      set({ isCreatingPost: true, error: null })

      if (!supabase) {
        throw new Error('Unable to connect to the community. Please check your network connection.')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user profile for author data
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          author_name: profile?.display_name || user.user_metadata?.display_name || 'User',
          author_avatar: profile?.avatar_url || user.user_metadata?.avatar_url || '👤',
          content: content.trim(),
          category,
          hashtags: extractHashtags(content),
          is_live: true,
          moderation_status: 'approved'
        })
        .select('*')
        .single()

      if (error) throw error

      const newPost = formatPost(data)
      set({ 
        posts: [newPost, ...get().posts],
        isCreatingPost: false
      })

      // Update rate limit
      updateRateLimit('posts')
      return true

    } catch (error) {
      console.error('Error creating post:', error)
      set({ error: 'Failed to create post', isCreatingPost: false })
      return false
    }
  },

  toggleFollow: async (userId: string) => {
    if (!get().checkRateLimit('follows')) {
      set({ error: 'Rate limit exceeded: 50 follows per day maximum' })
      return false
    }

    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

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
        updateRateLimit('follows')
      }

      return true

    } catch (error) {
      console.error('Error toggling follow:', error)
      set({ error: 'Failed to update follow status' })
      return false
    }
  },

  addInteraction: async (postId: string, type: 'amen' | 'love' | 'prayer') => {
    if (!get().checkRateLimit('interactions')) {
      set({ error: 'Rate limit exceeded: 25 interactions per minute maximum' })
      return false
    }

    if (!supabase) {
      set({ error: 'Unable to connect to the community. Please check your network connection.' })
      return false
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // Check if interaction already exists
      const { data: existing } = await supabase
        .from('post_interactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('interaction_type', type)
        .single()

      let isAdding = true
      
      if (existing) {
        // Remove interaction (toggle off)
        const { error: deleteError } = await supabase
          .from('post_interactions')
          .delete()
          .eq('id', existing.id)

        if (deleteError) throw deleteError
        isAdding = false
      } else {
        // Add interaction
        const { error: insertError } = await supabase
          .from('post_interactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            interaction_type: type
          })

        if (insertError) throw insertError
      }

      // Update post counts in database
      const countField = `${type}s_count`
      const { data: currentPost } = await supabase
        .from('community_posts')
        .select(countField)
        .eq('id', postId)
        .single()

      if (currentPost) {
        const newCount = isAdding 
          ? ((currentPost as any)[countField] || 0) + 1
          : Math.max(0, ((currentPost as any)[countField] || 1) - 1)

        const { error: updateError } = await supabase
          .from('community_posts')
          .update({ [countField]: newCount })
          .eq('id', postId)

        if (updateError) throw updateError

        // Update local state with the correct count
        set({
          posts: get().posts.map(post =>
            post.id === postId
              ? { ...post, [countField]: newCount }
              : post
          )
        })
      }

      updateRateLimit('interactions')
      return true

    } catch (error) {
      console.error('Error adding interaction:', error)
      set({ error: 'Failed to add interaction' })
      return false
    }
  },

  addReply: async (postId: string, content: string) => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          content: content.trim(),
          category: 'prayer',
          parent_id: postId
        })
        .select('*')
        .single()

      if (error) throw error

      const reply = formatPost(data)
      
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
      console.error('Error adding reply:', error)
      set({ error: 'Failed to add reply' })
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
      }
    })
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
    category: rawPost.category || 'general',
    hashtags: rawPost.hashtags || [],
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
