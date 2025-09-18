import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { supabase } from '../utils/supabase'
import { AuthButton } from './AuthButton'
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
  const navigate = useNavigate()
  const { user } = useSupabaseAuth()
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [newPostComment, setNewPostComment] = useState('')
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
    
    // Ensure user has a profile record
    if (user) {
      ensureUserProfile()
      setupRealtimeSubscriptions()
    }
    
    return () => {
      // Cleanup real-time subscriptions
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe()
      }
    }
  }, [user])

  // Ensure user has a profile record
  const ensureUserProfile = async () => {
    if (!user || !supabase) return
    
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile record
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            display_name: (user as any).displayName || user.email?.split('@')[0] || 'User',
            avatar_url: (user as any).avatarUrl,
            bio: (user as any).bio,
            favorite_verse: (user as any).favoriteVerse,
            location: (user as any).location,
            custom_links: (user as any).customLinks || [],
            banner_image: (user as any).bannerImage,
            profile_image: (user as any).profileImage
          })

        if (error) {
          console.error('Error creating profile:', error)
        } else {
          console.log('✅ Profile record created for user:', user.id)
        }
      } else if (!existingProfile.display_name) {
        // Update profile with display name if missing
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: (user as any).displayName || user.email?.split('@')[0] || 'User',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) {
          console.error('Error updating profile:', error)
        } else {
          console.log('✅ Profile record updated for user:', user.id)
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error)
    }
  }

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
        feedType,
        firstPost: result.data[0] ? {
          id: result.data[0].id,
          author_name: result.data[0].author_name,
          author_handle: result.data[0].author_handle
        } : null
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
          author_name: (user as any).displayName || user.email?.split('@')[0] || user.id.slice(0, 8),
          author_avatar: user.user_metadata?.avatar_url ? '🖼️' : '👤',
          author_handle: `@${user.email?.split('@')[0] || user.id.slice(0, 8)}`,
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
                className="text-blue-500 font-medium hover:text-blue-400 cursor-pointer transition-colors duration-200"
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
    // Navigate to the profile page instead of opening modal
    navigate('/profile')
  }


  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - Clean X-style */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-white">Community</h1>
              <p className="text-gray-500 text-sm">Share your faith journey</p>
            </div>


            {/* Search */}
            <div className="flex-1 max-w-md ml-8">
                <UserSearch 
                  onUserSelect={openUserProfile}
                  className="w-full"
                />
              </div>

            {/* Notifications */}
            <div className="ml-4">
              <NotificationCenter 
                onUserSelect={openUserProfile}
                onPostSelect={(postId) => {
                  // Scroll to post or handle post selection
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - X-style single column */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        {/* Post Creation - Compact X-style */}
        {!user ? (
          <div className="bg-black border-b border-gray-800 p-4 text-center">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg mx-auto mb-3">
              ✝️
            </div>
            <h3 className="text-base font-bold mb-1 text-white">Sign In to Share Your Faith</h3>
            <p className="text-gray-500 text-sm mb-4">Join the community to share your prayers and encouragement</p>
            <AuthButton />
          </div>
        ) : (
          <div className="bg-black border-b border-gray-800 p-3">
            <div className="flex items-start space-x-3">
              {/* User Avatar - Compact */}
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-medium flex-shrink-0">
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
              
              {/* Post Form - Compact */}
              <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your heart today?"
                  className="w-full p-3 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-lg min-h-[80px] leading-relaxed"
                    rows={3}
                    maxLength={500}
                  />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-3">
                    {/* Christian-themed icons - Compact */}
                    <button className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                    <button className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </button>
                    <button className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim() || isCreatingPost}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-1.5 rounded-full font-bold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingPost ? 'Posting...' : 'Post'}
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show more posts link - X-style */}
        {communityPosts.length > 0 && (
          <div className="bg-black border-b border-gray-800 p-4 text-center">
            <button className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors duration-200">
              Show {communityPosts.length + 100} posts
              </button>
          </div>
        )}

        {/* Feed Controls - Exact X-style */}
        <div className="mb-0">
          {/* Feed Type Tabs - X-style */}
          <div className="flex border-b border-gray-800">
            {[
              { key: 'all', label: 'For you' },
              { key: 'following', label: 'Following' }
            ].map((feed) => (
              <button
                key={feed.key}
                onClick={() => handleFeedTypeChange(feed.key as any)}
                className={`flex-1 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors duration-200 relative ${
                  feedType === feed.key
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {feed.label}
                {feedType === feed.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

        </div>

        {/* Posts Feed - Clean X-style */}
        <div className="space-y-0">
          {isLoading ? (
            <div className="space-y-0">
              {/* Skeleton Loading - X-style */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-black border-b border-gray-800 p-4 animate-pulse">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center space-x-8 pt-3">
                    <div className="h-5 bg-gray-700 rounded w-12"></div>
                    <div className="h-5 bg-gray-700 rounded w-12"></div>
                    <div className="h-5 bg-gray-700 rounded w-12"></div>
                    <div className="h-5 bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : communityPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✝️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">No posts yet</h3>
              <p className="text-gray-500">Be the first to share your faith journey!</p>
            </div>
          ) : (
            filterPosts(communityPosts).map((post, index) => (
              <div 
                key={post.id} 
                className="bg-black border-b border-gray-800 p-4 sm:p-6 hover:bg-gray-900/30 transition-colors duration-200"
              >
                {/* Post Header - Mobile Responsive */}
                <div className="flex items-start space-x-3 mb-3">
                  <button
                    onClick={() => openUserProfile(post.author_id)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-medium hover:opacity-80 transition-opacity duration-200 flex-shrink-0 overflow-hidden bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg border-2 border-[var(--bg-primary)]"
                  >
                    {post.author_profile_image ? (
                      <img 
                        src={post.author_profile_image} 
                        alt={post.author_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-black text-lg sm:text-xl font-bold">
                        ✝️
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openUserProfile(post.author_id)}
                          className="font-bold text-white text-sm sm:text-base hover:underline transition-colors duration-200 flex items-center gap-1"
                      >
                        {post.author_name}
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </button>
                        <span className="text-gray-500 text-sm sm:text-base">•</span>
                        <span className="text-gray-500 text-sm sm:text-base">{formatTimestamp(post.created_at)}</span>
                      </div>
                      
                      {/* Follow Button - Hidden on mobile */}
                      {user && post.author_id !== user.id && (
                        <button
                          onClick={() => toggleFollow(post.author_id)}
                          className={`hidden sm:block px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 ${
                            followedUsers.includes(post.author_id)
                              ? 'bg-gray-700 text-white hover:bg-gray-600'
                              : 'bg-white text-black hover:bg-gray-200'
                          }`}
                        >
                          {followedUsers.includes(post.author_id) ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Post Content - Mobile Responsive */}
                <div className="text-sm sm:text-base mb-4 sm:mb-5 leading-relaxed text-white">
                  <p className="whitespace-pre-wrap">{highlightMentions(post.content)}</p>
                </div>
                
                {/* Post Actions - Mobile Responsive */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                  <div className="flex items-center space-x-6 sm:space-x-8">
                    <button
                      onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                      className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                      </svg>
                      <span className="text-sm">{post.prayers_count || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => handleAmenPost(post.id)}
                      className="flex items-center space-x-2 text-gray-500 hover:text-yellow-500 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                      </svg>
                      <span className="text-sm">{post.amens_count || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => handleLovePost(post.id)}
                      className="flex items-center space-x-2 text-gray-500 hover:text-pink-500 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span className="text-sm">{post.loves_count || 0}</span>
                    </button>

                    <button className="hidden sm:flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                      </svg>
                      <span className="text-sm">{Math.floor(Math.random() * 1000) + 100}</span>
                    </button>

                    <button className="hidden sm:block text-gray-500 hover:text-blue-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </button>

                    <button className="hidden sm:block text-gray-500 hover:text-blue-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                      </svg>
                  </button>
                  </div>
                </div>

                {/* Moderation Tools - Admin Only */}
                {showModerationTools && user && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Moderation:</span>
                      <button
                        onClick={() => handleModeratePost(post.id, 'approve')}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors duration-200"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleModeratePost(post.id, 'reject')}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 transition-colors duration-200"
                      >
                        ✗ Reject
                      </button>
                      <button
                        onClick={() => handleModeratePost(post.id, 'delete')}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors duration-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Reply Thread - Clean X-style */}
                {showReplies[post.id] && replyChains[post.id] && (
                  <div className="mt-4 pt-3 border-t border-gray-800">
                    <div className="space-y-3">
                      {replyChains[post.id].map((reply, replyIndex) => (
                        <div key={reply.id} className="flex items-start space-x-3 pl-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-xs flex-shrink-0 overflow-hidden shadow-md border border-[var(--bg-primary)]">
                            {reply.author_profile_image ? (
                              <img 
                                src={reply.author_profile_image} 
                                alt={reply.author_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-black text-sm font-bold">
                                ✝️
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-white flex items-center gap-1">
                                {reply.author_name}
                                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </span>
                              <span className="text-gray-500 text-sm">•</span>
                              <span className="text-gray-500 text-sm">{formatTimestamp(reply.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{highlightMentions(reply.content)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Comment Input - Clean X-style */}
                {showCommentInput === post.id && (
                  <div className="mt-4 pt-3 border-t border-gray-800">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                        {user?.user_metadata?.display_name?.[0] || user?.email?.[0] || '👤'}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newPostComment}
                            onChange={(e) => setNewPostComment(e.target.value)}
                          placeholder="Share your prayers..."
                          className="w-full p-3 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-sm leading-relaxed"
                          rows={2}
                          maxLength={200}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{newPostComment.length}/200</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setShowCommentInput(null)
                                  setNewPostComment('')
                                }}
                              className="text-xs text-gray-500 hover:text-white transition-colors duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddPrayer(post.id)}
                                disabled={!newPostComment.trim()}
                              className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="text-center py-8">
            <div className="bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
              📄 Loading more posts...
        </div>
          </div>
        )}
      </div>


      {/* User Mention Modal - Clean X-style */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">User Profile</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-white transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                👤
              </div>
              <h4 className="text-white font-medium text-lg mb-2">@{selectedUser}</h4>
              <p className="text-gray-500 text-sm mb-4">Christian believer</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    toggleFollow(selectedUser)
                    setShowUserModal(false)
                  }}
                  className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
                    followedUsers.includes(selectedUser)
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {followedUsers.includes(selectedUser) ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors duration-200"
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
