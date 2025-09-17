import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { AuthButton } from './AuthButton'
import UserProfileModal from './UserProfileModal'
import UserSearch from './UserSearch'
import UserDiscoverySidebar from './UserDiscoverySidebar'
import NotificationCenter from './NotificationCenter'
import { 
  getTrendingPostsWithCache, 
  createPost, 
  addPostInteraction, 
  addPrayer, 
  subscribeToCommunityUpdates,
  searchPosts,
  getTrendingHashtags,
  type CommunityPost,
  type Prayer,
  type PaginationCursor,
  type RealtimeSubscription
} from '../services/communityService'

// Fallback seed content for when database is unavailable
const getFallbackPosts = (): CommunityPost[] => [
  {
    id: '1',
    author_id: 'user1',
    author_name: 'Sarah M.',
    author_avatar: '👩‍🦰',
    author_handle: '@sarahm',
    content: 'Just finished my morning prayer session with ChristianKit. The guided meditation really helped me focus on God\'s presence today. Feeling so blessed! 🙏✨',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    amens_count: 12,
    loves_count: 8,
    prayers_count: 3,
    category: 'prayer',
    hashtags: ['Prayer', 'SpiritualGrowth', 'GodIsGood'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '2',
    author_id: 'user2',
    author_name: 'Pastor David',
    author_avatar: '👨‍🦳',
    author_handle: '@pastordavid',
    content: 'Sharing today\'s Bible verse that really spoke to me: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." - Joshua 1:9',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    amens_count: 24,
    loves_count: 18,
    prayers_count: 7,
    category: 'bible_study',
    hashtags: ['BibleStudy', 'Encouragement', 'Joshua1:9'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '3',
    author_id: 'user3',
    author_name: 'Maria L.',
    author_avatar: '👩‍💼',
    author_handle: '@marial',
    content: 'Grateful for this community of believers. Your prayers and encouragement have been such a blessing during this difficult season. God is faithful! 💙',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    amens_count: 15,
    loves_count: 22,
    prayers_count: 9,
    category: 'general',
    hashtags: ['Gratitude', 'Community', 'GodIsFaithful'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '4',
    author_id: 'user4',
    author_name: 'Michael R.',
    author_avatar: '👨‍🎓',
    author_handle: '@michaelr',
    content: 'Starting a new Bible reading plan today. Excited to dive deeper into God\'s Word and grow in my faith journey. Anyone else reading through the New Testament?',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    amens_count: 8,
    loves_count: 6,
    prayers_count: 2,
    category: 'bible_study',
    hashtags: ['BibleReading', 'NewTestament', 'FaithJourney'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '5',
    author_id: 'user5',
    author_name: 'Jennifer K.',
    author_avatar: '👩‍🏫',
    author_handle: '@jenniferk',
    content: 'Prayer request: Please pray for my family as we navigate some challenging decisions. We trust God\'s plan and timing. Thank you for your support! 🙏',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    amens_count: 31,
    loves_count: 19,
    prayers_count: 15,
    category: 'prayer',
    hashtags: ['PrayerRequest', 'Family', 'TrustInGod'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '6',
    author_id: 'user6',
    author_name: 'Robert T.',
    author_avatar: '👨‍🔧',
    author_handle: '@robertt',
    content: 'Meditation on Psalm 23 today: "The Lord is my shepherd, I lack nothing." What a beautiful reminder of God\'s provision and care. He truly is our Good Shepherd.',
    created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    amens_count: 19,
    loves_count: 14,
    prayers_count: 5,
    category: 'worship',
    hashtags: ['Psalm23', 'Meditation', 'GoodShepherd'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '7',
    author_id: 'user7',
    author_name: 'Amanda S.',
    author_avatar: '👩‍⚕️',
    author_handle: '@amandas',
    content: 'Celebrating 30 days of consistent prayer! ChristianKit has been such a blessing in helping me build this spiritual discipline. God is good! 🎉',
    created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    amens_count: 27,
    loves_count: 21,
    prayers_count: 8,
    category: 'prayer',
    hashtags: ['Milestone', 'Consistency', 'SpiritualDiscipline'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '8',
    author_id: 'user8',
    author_name: 'Thomas W.',
    author_avatar: '👨‍💻',
    author_handle: '@thomasw',
    content: 'Reflecting on Romans 8:28 today: "And we know that in all things God works for the good of those who love him." Even in trials, God is working for our good.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    amens_count: 16,
    loves_count: 12,
    prayers_count: 4,
    category: 'bible_study',
    hashtags: ['Romans8:28', 'Reflection', 'GodsPlan'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '9',
    author_id: 'user9',
    author_name: 'Lisa P.',
    author_avatar: '👩‍🎨',
    author_handle: '@lisap',
    content: 'Morning gratitude: Thankful for God\'s grace, my family\'s health, and this amazing community of believers. What are you grateful for today?',
    created_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    amens_count: 11,
    loves_count: 9,
    prayers_count: 3,
    category: 'general',
    hashtags: ['Gratitude', 'Morning', 'Community'],
    is_live: true,
    moderation_status: 'approved'
  },
  {
    id: '10',
    author_id: 'user10',
    author_name: 'Daniel H.',
    author_avatar: '👨‍🎤',
    author_handle: '@danielh',
    content: 'Prayer answered! After months of job searching, I received an offer today. God\'s timing is perfect. Thank you to everyone who prayed with me! 🙌',
    created_at: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    amens_count: 35,
    loves_count: 28,
    prayers_count: 12,
    category: 'testimony',
    hashtags: ['PrayerAnswered', 'Job', 'GodsTiming'],
    is_live: true,
    moderation_status: 'approved'
  }
]

export const CommunityPage: React.FC = () => {
  const { user } = useSupabaseAuth()
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [newPostComment, setNewPostComment] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [contentFilter, setContentFilter] = useState<'all' | 'prayer' | 'bible_study' | 'testimony'>('all')
  const [showModerationTools, setShowModerationTools] = useState(false)
  const [currentCursor, setCurrentCursor] = useState<PaginationCursor | undefined>(undefined)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [feedType, setFeedType] = useState<'all' | 'following' | 'trending'>('all')
  const [followedUsers, setFollowedUsers] = useState<string[]>([])
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now())
  const [replyChains, setReplyChains] = useState<{[key: string]: CommunityPost[]}>({})
  const [showReplies, setShowReplies] = useState<{[key: string]: boolean}>({})
  const [mentions, setMentions] = useState<string[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [realtimeSubscription, setRealtimeSubscription] = useState<RealtimeSubscription | null>(null)
  const [trendingHashtags, setTrendingHashtags] = useState<Array<{tag: string, count: number}>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const POSTS_PER_PAGE = 20

  useEffect(() => {
    loadCommunityData()
    loadFollowedUsers()
    loadTrendingHashtags()
    
    // Set up real-time subscriptions
    if (user) {
      setupRealtimeSubscriptions()
    }
    
    return () => {
      // Cleanup real-time subscriptions
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe()
      }
    }
  }, [user])

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        if (hasMorePosts && !isLoadingMore) {
          loadMorePosts()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMorePosts, isLoadingMore, currentCursor])

  // Auto-refresh trending hashtags every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadTrendingHashtags()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  const loadCommunityData = async (isRetry = false) => {
    try {
      setIsLoading(true)
      setError(null)
      setCurrentCursor(undefined) // Reset cursor for fresh load
      
      const result = await getTrendingPostsWithCache({ 
        limit: POSTS_PER_PAGE,
        feedType,
        userId: user?.id,
        useCache: !isRetry
      })
      
      setCommunityPosts(result.data)
      setCurrentCursor(result.pagination.nextCursor)
      setHasMorePosts(result.pagination.hasNextPage)
      setRetryCount(0) // Reset retry count on success
      
      console.log('✅ Loaded community data:', {
        posts: result.data.length,
        hasNextPage: result.pagination.hasNextPage,
        feedType
      })
    } catch (error) {
      console.error('❌ Error loading community data:', error)
      if (isRetry) {
        setError('Unable to load community posts. Please check your connection.')
      } else {
        // Load fallback content on first error
        setCommunityPosts(getFallbackPosts())
        setError('Using offline content. Some features may be limited.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadMorePosts = async () => {
    if (!currentCursor || isLoadingMore) return
    
    try {
      setIsLoadingMore(true)
      
      const result = await getTrendingPostsWithCache({ 
        limit: POSTS_PER_PAGE,
        cursor: currentCursor,
        feedType,
        userId: user?.id
      })
      
      setCommunityPosts(prev => [...prev, ...result.data])
      setCurrentCursor(result.pagination.nextCursor)
      setHasMorePosts(result.pagination.hasNextPage)
      
      console.log('✅ Loaded more posts:', {
        newPosts: result.data.length,
        totalPosts: communityPosts.length + result.data.length,
        hasNextPage: result.pagination.hasNextPage
      })
    } catch (error) {
      console.error('❌ Error loading more posts:', error)
      setError('Failed to load more posts. Please try again.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const loadTrendingHashtags = async () => {
    try {
      const hashtags = await getTrendingHashtags(10)
      setTrendingHashtags(hashtags)
      console.log('✅ Loaded trending hashtags:', hashtags.length)
    } catch (error) {
      console.error('❌ Error loading trending hashtags:', error)
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (!user) return

    const subscription = subscribeToCommunityUpdates(
      // onNewPost
      (newPost) => {
        console.log('🆕 New post received via real-time:', newPost)
        setCommunityPosts(prev => [newPost, ...prev])
        
        // Show notification for new posts from other users
        if (newPost.author_id !== user.id) {
          // You can add a toast notification here
          console.log('📢 New post from', newPost.author_name)
        }
      },
      // onPostUpdate
      (updatedPost) => {
        console.log('🔄 Post updated via real-time:', updatedPost)
        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === updatedPost.id ? updatedPost : post
          )
        )
      },
      // onPostDelete
      (postId) => {
        console.log('🗑️ Post deleted via real-time:', postId)
        setCommunityPosts(prev => prev.filter(post => post.id !== postId))
      }
    )

    if (subscription) {
      setRealtimeSubscription(subscription)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    loadCommunityData(true)
  }

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return

    try {
      setIsCreatingPost(true)
      
      const newPost = await createPost({
        content: newPostContent.trim(),
        category: 'general',
        hashtags: []
      })

      if (newPost) {
        setNewPostContent('')
        await loadCommunityData(false)
        // Show success feedback without alert
      } else {
        throw new Error('Post creation failed')
      }
    } catch (error) {
      // Handle error gracefully without console logs
      setNewPostContent('') // Clear content on error
    } finally {
      setIsCreatingPost(false)
    }
  }


  const handleAmenPost = async (postId: string) => {
    if (!user) return

    try {
      const success = await addPostInteraction(postId, 'amen')
      if (success) {
        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, amens_count: (post.amens_count || 0) + 1 }
              : post
          )
        )
      }
    } catch (error) {
      // Handle error silently - user feedback through UI state
    }
  }

  const handleLovePost = async (postId: string) => {
    if (!user) return

    try {
      const success = await addPostInteraction(postId, 'love')
      if (success) {
        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, loves_count: (post.loves_count || 0) + 1 }
              : post
          )
        )
      }
    } catch (error) {
      // Handle error silently - user feedback through UI state
    }
  }

  const handleAddPrayer = async (postId: string) => {
    if (!user || !newPostComment.trim()) return

    try {
      const prayer = await addPrayer(postId, newPostComment.trim())
      if (prayer) {
        // Add to reply chain
        const newReply: CommunityPost = {
          id: `reply_${Date.now()}`,
          author_id: user.id,
          author_name: user.user_metadata?.full_name || 'You',
          author_avatar: user.user_metadata?.avatar_url ? '🖼️' : '👤',
          author_handle: `@${user.email?.split('@')[0] || 'user'}`,
          content: newPostComment.trim(),
          created_at: new Date().toISOString(),
          amens_count: 0,
          loves_count: 0,
          prayers_count: 0,
          category: 'prayer',
          hashtags: [],
          is_live: true,
          moderation_status: 'approved'
        }

        setReplyChains(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newReply]
        }))

        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, prayers_count: (post.prayers_count || 0) + 1 }
              : post
          )
        )
        setNewPostComment('')
        setShowCommentInput(null)
      }
    } catch (error) {
      // Handle error silently - user feedback through UI state
      setNewPostComment('')
      setShowCommentInput(null)
    }
  }

  const toggleReplies = (postId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Mention system functions
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex)
    return matches ? matches.map(match => match.substring(1)) : []
  }

  const highlightMentions = (text: string): JSX.Element => {
    const parts = text.split(/(@\w+)/g)
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.substring(1)
            return (
              <span 
                key={index} 
                onClick={() => handleMentionClick(username)}
                className="text-blue-400 font-medium hover:text-blue-300 cursor-pointer"
              >
                {part}
              </span>
            )
          }
          return part
        })}
      </>
    )
  }

  const handleMentionClick = (username: string) => {
    setSelectedUser(username)
    setShowUserModal(true)
  }

  const handleReportPost = (postId: string) => {
    // Simple reporting - in production this would send to moderation system
    if (window.confirm('Report this post for inappropriate content?')) {
      // TODO: Implement actual reporting system
      alert('Thank you for your report. We will review this content.')
    }
  }

  const filterPosts = (posts: CommunityPost[]) => {
    // First apply algorithm feed (following/trending/all)
    const algorithmPosts = getAlgorithmFeed(posts)
    
    // Then apply content filter
    if (contentFilter === 'all') return algorithmPosts
    return algorithmPosts.filter(post => post.category === contentFilter)
  }

  const handleModeratePost = (postId: string, action: 'approve' | 'reject' | 'delete') => {
    if (window.confirm(`Are you sure you want to ${action} this post?`)) {
      // TODO: Implement actual moderation system
      setCommunityPosts(prev => prev.filter(post => post.id !== postId))
      alert(`Post ${action}d successfully.`)
    }
  }

  // Simple caching mechanism
  const getCachedPosts = (): CommunityPost[] | null => {
    try {
      const cached = localStorage.getItem('christiankit_community_posts')
      if (cached) {
        const data = JSON.parse(cached)
        // Check if cache is less than 5 minutes old
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          return data.posts
        }
      }
    } catch (error) {
      // Ignore cache errors
    }
    return null
  }

  const setCachedPosts = (posts: CommunityPost[]) => {
    try {
      localStorage.setItem('christiankit_community_posts', JSON.stringify({
        posts,
        timestamp: Date.now()
      }))
    } catch (error) {
      // Ignore cache errors
    }
  }

  // Follow system functions
  const loadFollowedUsers = () => {
    try {
      const followed = localStorage.getItem('christiankit_followed_users')
      if (followed) {
        setFollowedUsers(JSON.parse(followed))
      }
    } catch (error) {
      // Ignore errors
    }
  }

  const toggleFollow = (userId: string) => {
    const newFollowed = followedUsers.includes(userId)
      ? followedUsers.filter(id => id !== userId)
      : [...followedUsers, userId]
    
    setFollowedUsers(newFollowed)
    localStorage.setItem('christiankit_followed_users', JSON.stringify(newFollowed))
  }

  const refreshFeed = async () => {
    setLastRefresh(Date.now())
    await loadCommunityData(false)
  }

  const handleFeedTypeChange = async (newFeedType: 'all' | 'following' | 'trending') => {
    setFeedType(newFeedType)
    await loadCommunityData(false)
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchQuery('')
      setIsSearching(false)
      await loadCommunityData(false)
      return
    }

    try {
      setIsSearching(true)
      setSearchQuery(query)
      
      const result = await searchPosts(query, {
        limit: POSTS_PER_PAGE,
        category: contentFilter !== 'all' ? contentFilter : undefined,
        userId: user?.id
      })
      
      setCommunityPosts(result.data)
      setCurrentCursor(undefined)
      setHasMorePosts(false) // Search results don't support pagination yet
      
      console.log('✅ Search results:', result.data.length)
    } catch (error) {
      console.error('❌ Search error:', error)
      setError('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Algorithm feed mixing following + trending
  const getAlgorithmFeed = (posts: CommunityPost[]) => {
    if (feedType === 'following') {
      return posts.filter(post => followedUsers.includes(post.author_id))
    } else if (feedType === 'trending') {
      return posts.sort((a, b) => (b.amens_count + b.loves_count + b.prayers_count) - (a.amens_count + a.loves_count + a.prayers_count))
    } else {
      // Mix following + trending for 'all' feed
      const followingPosts = posts.filter(post => followedUsers.includes(post.author_id))
      const trendingPosts = posts.filter(post => !followedUsers.includes(post.author_id))
        .sort((a, b) => (b.amens_count + b.loves_count + b.prayers_count) - (a.amens_count + a.loves_count + a.prayers_count))
      
      return [...followingPosts, ...trendingPosts]
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    if (timestamp === 'Just now') return 'Just now'
    
    const now = new Date()
    const postTime = new Date(timestamp)
    const diff = now.getTime() - postTime.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return postTime.toLocaleDateString()
  }

  const openUserProfile = (userId: string) => {
    setSelectedUserId(userId)
    setShowProfileModal(true)
  }

  const closeUserProfile = () => {
    setSelectedUserId(null)
    setShowProfileModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Osmo Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header - Enhanced with Search and Notifications */}
      <div className="relative z-10 bg-black/20 backdrop-blur-2xl border-b border-yellow-400/20">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Title Section - Simplified */}
            <div className="text-center lg:text-left">
              <h1 className="text-xl sm:text-2xl font-bold mb-1 text-white">
                Community
              </h1>
              <p className="text-slate-400 text-sm">
                Share your faith journey
              </p>
            </div>

            {/* Search and Notifications */}
            <div className="flex items-center space-x-4">
              {/* User Search */}
              <div className="flex-1 lg:w-80">
                <UserSearch 
                  onUserSelect={openUserProfile}
                  className="w-full"
                />
              </div>

              {/* Notification Center */}
              <NotificationCenter 
                onUserSelect={openUserProfile}
                onPostSelect={(postId) => {
                  // Scroll to post or handle post selection
                  // Implementation for post navigation
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Main Feed */}
          <div className="flex-1 max-w-4xl">
        
        {/* Simple Post Creation - Mobile Optimized */}
        {!user ? (
          <div className="bg-black/30 backdrop-blur-2xl border border-yellow-400/20 rounded-3xl p-6 sm:p-8 text-center mb-6 sm:mb-8 shadow-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-2xl sm:text-3xl mx-auto mb-4 shadow-2xl">
              🔐
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">Sign In to Share Your Faith</h3>
            <p className="text-slate-300 text-sm sm:text-base mb-6">Join the community to share your prayers and encouragement</p>
            <AuthButton />
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl hover:border-yellow-400/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              {/* User Avatar - Enhanced */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center text-black text-xl shadow-lg ring-2 ring-yellow-400/20">
                  {user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{user?.user_metadata?.display_name?.[0] || user.email?.[0] || '👤'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Post Form - Simplified */}
              <div className="flex-1">
                <div className="mb-3">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your faith journey, prayers, or encouragement..."
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm min-h-[80px] transition-all duration-300"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">{newPostContent.length}/500</span>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim() || isCreatingPost}
                      className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2 rounded-lg font-medium text-sm hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingPost ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Status Indicator */}
        {realtimeSubscription && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-green-300 text-sm font-medium">Live updates active</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-red-400 text-sm">⚠️</span>
                </div>
                <div>
                  <p className="text-red-300 font-medium text-sm">Connection Issue</p>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                disabled={isLoading}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded text-xs font-medium transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Search Results Indicator */}
        {searchQuery && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400 text-sm">🔍</span>
                <p className="text-blue-300 text-sm font-medium">
                  Search results for "{searchQuery}"
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setIsSearching(false)
                  loadCommunityData(false)
                }}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Feed Type Selector - Twitter-like */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Feed</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshFeed}
                className="text-xs text-slate-400 hover:text-yellow-400 transition-colors duration-200"
              >
                🔄 Refresh
              </button>
              {user && (
                <button
                  onClick={() => setShowModerationTools(!showModerationTools)}
                  className="text-xs text-slate-400 hover:text-yellow-400 transition-colors duration-200"
                >
                  {showModerationTools ? 'Hide' : 'Show'} Mod Tools
                </button>
              )}
            </div>
          </div>
          
          {/* Feed Type Tabs */}
          <div className="flex space-x-1 mb-3 bg-white/5 rounded-lg p-1">
            {[
              { key: 'all', label: 'For You', icon: '🌟' },
              { key: 'following', label: 'Following', icon: '👥' },
              { key: 'trending', label: 'Trending', icon: '🔥' }
            ].map((feed) => (
              <button
                key={feed.key}
                onClick={() => handleFeedTypeChange(feed.key as any)}
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  feedType === feed.key
                    ? 'bg-yellow-400/20 text-yellow-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{feed.icon}</span>
                <span>{feed.label}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts, hashtags, or users..."
                value={searchQuery}
                onChange={(e) => {
                  const query = e.target.value
                  setSearchQuery(query)
                  // Debounce search
                  clearTimeout((window as any).searchTimeout)
                  ;(window as any).searchTimeout = setTimeout(() => {
                    handleSearch(query)
                  }, 500)
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                ) : (
                  <span className="text-slate-400">🔍</span>
                )}
              </div>
            </div>
          </div>

          {/* Trending Hashtags */}
          {trendingHashtags.length > 0 && !searchQuery && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">🔥 Trending</h4>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.slice(0, 5).map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => handleSearch(`#${tag}`)}
                    className="px-3 py-1 bg-yellow-400/10 text-yellow-300 rounded-full text-xs font-medium hover:bg-yellow-400/20 transition-all duration-200"
                  >
                    #{tag} ({count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All', icon: '📝' },
              { key: 'prayer', label: 'Prayers', icon: '🙏' },
              { key: 'bible_study', label: 'Bible', icon: '📖' },
              { key: 'testimony', label: 'Testimonies', icon: '✨' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setContentFilter(filter.key as any)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  contentFilter === filter.key
                    ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Posts Feed - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {/* Skeleton Loading */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-start space-x-4 mb-5">
                    <div className="w-14 h-14 bg-white/10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-white/10 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
                    <div className="h-10 bg-white/10 rounded-xl w-20"></div>
                    <div className="h-10 bg-white/10 rounded-xl w-20"></div>
                    <div className="h-10 bg-white/10 rounded-xl w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : communityPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-400/20">
                <span className="text-2xl">✝️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">No posts yet</h3>
              <p className="text-slate-300">Be the first to share your faith journey!</p>
            </div>
          ) : (
            filterPosts(communityPosts).map((post, index) => (
              <div 
                key={post.id} 
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 mb-4 hover:bg-white/10 transition-all duration-300"
              >
                {/* Post Header - Twitter-like */}
                <div className="flex items-start space-x-3 mb-3">
                    <button
                      onClick={() => openUserProfile(post.author_id)}
                    className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold hover:scale-105 transition-transform duration-200"
                    >
                      {post.author_avatar}
                    </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openUserProfile(post.author_id)}
                          className="font-medium text-white text-sm truncate hover:text-yellow-300 transition-colors duration-200"
                      >
                        {post.author_name}
                      </button>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-400">{formatTimestamp(post.created_at)}</span>
                      </div>
                      
                      {/* Follow Button */}
                      {user && post.author_id !== user.id && (
                        <button
                          onClick={() => toggleFollow(post.author_id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            followedUsers.includes(post.author_id)
                              ? 'bg-slate-600 text-white hover:bg-slate-700'
                              : 'bg-yellow-400 text-black hover:bg-yellow-500'
                          }`}
                        >
                          {followedUsers.includes(post.author_id) ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Post Content - With Mentions */}
                <div className="text-sm mb-4 leading-relaxed text-slate-100">
                  <p className="whitespace-pre-wrap">{highlightMentions(post.content)}</p>
                </div>
                
                {/* Post Actions - Twitter-like */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleAmenPost(post.id)}
                      className="flex items-center space-x-1 text-slate-400 hover:text-blue-400 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px] justify-center touch-manipulation"
                    >
                      <span className="text-base">🙏</span>
                      <span className="text-sm font-medium">{post.amens_count || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => handleLovePost(post.id)}
                      className="flex items-center space-x-1 text-slate-400 hover:text-red-400 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px] justify-center touch-manipulation"
                    >
                      <span className="text-base">❤️</span>
                      <span className="text-sm font-medium">{post.loves_count || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                      className="flex items-center space-x-1 text-slate-400 hover:text-green-400 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px] justify-center touch-manipulation"
                    >
                      <span className="text-base">💬</span>
                      <span className="text-sm font-medium">{post.prayers_count || 0}</span>
                    </button>

                    {/* Show Replies Button */}
                    {replyChains[post.id] && replyChains[post.id].length > 0 && (
                      <button
                        onClick={() => toggleReplies(post.id)}
                        className="flex items-center space-x-1 text-slate-400 hover:text-purple-400 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px] justify-center touch-manipulation"
                      >
                        <span className="text-base">💭</span>
                        <span className="text-sm font-medium">{replyChains[post.id].length}</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Report Button - Mobile Friendly */}
                  <button
                    onClick={() => handleReportPost(post.id)}
                    className="text-slate-400 hover:text-red-400 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  >
                    <span className="text-sm">⚠️</span>
                  </button>
                </div>

                {/* Moderation Tools - Admin Only */}
                {showModerationTools && user && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">Moderation:</span>
                      <button
                        onClick={() => handleModeratePost(post.id, 'approve')}
                        className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs hover:bg-green-500/30 transition-colors duration-200"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleModeratePost(post.id, 'reject')}
                        className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs hover:bg-yellow-500/30 transition-colors duration-200"
                      >
                        ✗ Reject
                      </button>
                      <button
                        onClick={() => handleModeratePost(post.id, 'delete')}
                        className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs hover:bg-red-500/30 transition-colors duration-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Reply Thread - Twitter-like */}
                {showReplies[post.id] && replyChains[post.id] && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="space-y-3">
                      {replyChains[post.id].map((reply, replyIndex) => (
                        <div key={reply.id} className="flex items-start space-x-2 pl-4 border-l-2 border-white/10">
                          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-xs flex-shrink-0">
                            {reply.author_avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-white">{reply.author_name}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-400">{formatTimestamp(reply.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">{highlightMentions(reply.content)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Comment Input - Simplified */}
                {showCommentInput === post.id && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-xs flex-shrink-0">
                        {user?.user_metadata?.display_name?.[0] || user?.email?.[0] || '👤'}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newPostComment}
                            onChange={(e) => setNewPostComment(e.target.value)}
                          placeholder="Share your prayers..."
                          className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 resize-none text-sm"
                          rows={2}
                          maxLength={200}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-400">{newPostComment.length}/200</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setShowCommentInput(null)
                                  setNewPostComment('')
                                }}
                              className="text-xs text-slate-400 hover:text-white transition-colors duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddPrayer(post.id)}
                                disabled={!newPostComment.trim()}
                              className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                              Pray
                              </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Infinite Scroll Loading Indicator */}
        {isLoadingMore && (
          <div className="text-center mt-6 mb-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium">
              📄 Loading more posts...
        </div>
          </div>
        )}
          </div>

          {/* Discovery Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="sticky top-8">
              <UserDiscoverySidebar 
                onUserSelect={openUserProfile}
                className="space-y-6"
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showProfileModal}
          onClose={closeUserProfile}
          currentUserId={user?.id}
        />
      )}

      {/* User Mention Modal - Simple */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">User Profile</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">
                👤
              </div>
              <h4 className="text-white font-medium text-lg mb-2">@{selectedUser}</h4>
              <p className="text-slate-400 text-sm mb-4">Christian believer</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    toggleFollow(selectedUser)
                    setShowUserModal(false)
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    followedUsers.includes(selectedUser)
                      ? 'bg-slate-600 text-white hover:bg-slate-700'
                      : 'bg-yellow-400 text-black hover:bg-yellow-500'
                  }`}
                >
                  {followedUsers.includes(selectedUser) ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
