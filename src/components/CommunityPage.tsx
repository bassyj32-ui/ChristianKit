import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { ProFeatureGate } from './ProFeatureGate'
import { AuthButton } from './AuthButton'
import { 
  getTrendingPosts, 
  createPost, 
  addPostInteraction, 
  addPrayer, 
  getPostPrayers,
  getTrendingHashtags,
  subscribeToPosts,
  subscribeToInteractions,
  subscribeToPrayers,
  type CommunityPost,
  type Prayer
} from '../services/communityService'

// Using types from communityService instead of local interfaces

// Encouraging phrases and Bible verses
const encouragingPhrases = [
  "God is with you always! 🙏",
  "You are loved beyond measure! ❤️",
  "Trust in the Lord with all your heart! ✝️",
  "His grace is sufficient! ✨",
  "You are fearfully and wonderfully made! 🌟",
  "God has a plan for you! 🎯",
  "Be strong and courageous! 💪",
  "His mercies are new every morning! 🌅",
  "You are blessed and highly favored! 🙌",
  "God is working all things for good! 🔥"
]

const bibleVerses = [
  { verse: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
  { verse: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord." },
  { verse: "Psalm 23:1", text: "The Lord is my shepherd, I shall not want." },
  { verse: "Romans 8:28", text: "And we know that all things work together for good." },
  { verse: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength." }
]

export const CommunityPage: React.FC = () => {
  const { user } = useSupabaseAuth()
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<CommunityPost['category']>('general')
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [newPostComment, setNewPostComment] = useState('')
  const [selectedEncouragingPhrase, setSelectedEncouragingPhrase] = useState('')
  const [selectedBibleVerse, setSelectedBibleVerse] = useState('')
  const [liveUsers, setLiveUsers] = useState(47) // Simulated live users
  const [activePrayerSessions, setActivePrayerSessions] = useState(12) // Simulated live prayer sessions
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)

  useEffect(() => {
    loadCommunityData()
    
    // Add real-time subscriptions for live updates
    const postsSubscription = subscribeToPosts((payload) => {
      console.log('Post updated:', payload)
      // Refresh posts when they change
      loadCommunityData()
    })
    
    const interactionsSubscription = subscribeToInteractions((payload) => {
      console.log('Interaction updated:', payload)
      // Refresh posts when interactions change
      loadCommunityData()
    })
    
    const prayersSubscription = subscribeToPrayers((payload) => {
      console.log('Prayer updated:', payload)
      // Refresh posts when prayers change
      loadCommunityData()
    })
    
    // Simulate live activity indicators (can be replaced with real data later)
    const interval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1)
      setActivePrayerSessions(prev => prev + Math.floor(Math.random() * 2) - 1)
    }, 5000)
    
    return () => {
      postsSubscription?.unsubscribe()
      interactionsSubscription?.unsubscribe()
      prayersSubscription?.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadCommunityData = async () => {
    try {
      setIsLoading(true)
      // Load real posts from Supabase
      const posts = await getTrendingPosts(10)
      
      // Format posts with author info if not already present
      const formattedPosts = posts.map(post => ({
        ...post,
        author_name: post.author_name || 'Anonymous',
        author_avatar: post.author_avatar || '👤',
        author_handle: post.author_handle || `@user${post.author_id?.slice(0, 8) || 'user'}`
      }))
      
      setCommunityPosts(formattedPosts)
    } catch (error) {
      console.error('Error loading community data:', error)
      // Fallback to empty array if there's an error
      setCommunityPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Post Handlers
  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return

    try {
      setIsCreatingPost(true)
      const hashtags = newPostContent.match(/#\w+/g)?.map(tag => tag.slice(1)) || []
      
      const newPost = await createPost({
        content: newPostContent.trim(),
        category: newPostCategory,
        hashtags
      })

      if (newPost) {
        // Clear the form
        setNewPostContent('')
        setNewPostCategory('general')
        
        // Refresh the posts to show the new one
        await loadCommunityData()
        
        // Show success feedback (you can add a toast notification here)
        console.log('Post created successfully!')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      // You can add error handling UI here
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleAmenPost = async (postId: string) => {
    if (!user) return

    try {
      const success = await addPostInteraction(postId, 'amen')
      if (success) {
        // Update local state
        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, amens_count: post.amens_count + 1 }
              : post
          )
        )
      } else {
        // Remove amen
        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, amens_count: Math.max(0, post.amens_count - 1) }
              : post
          )
        )
      }
    } catch (error) {
      console.error('Error handling amen:', error)
    }
  }

  const handleLovePost = async (postId: string) => {
    if (!user) return

    try {
      const success = await addPostInteraction(postId, 'love')
      if (success) {
        // Update local state
        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, loves_count: post.loves_count + 1 }
              : post
          )
        )
      } else {
        // Remove love
        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, loves_count: Math.max(0, post.loves_count - 1) }
              : post
          )
        )
      }
    } catch (error) {
      console.error('Error handling love:', error)
    }
  }

  const handleAddPrayer = async (postId: string) => {
    if (!user || !newPostComment.trim()) return

    try {
      const prayer = await addPrayer(postId, newPostComment.trim())
      if (prayer) {
        // Update local state
        setCommunityPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, prayers_count: post.prayers_count + 1 }
              : post
          )
        )

        setNewPostComment('')
        setShowCommentInput(null)
      }
    } catch (error) {
      console.error('Error adding prayer:', error)
    }
  }



  const addEncouragingPhrase = () => {
    if (selectedEncouragingPhrase) {
      setNewPostContent(prev => prev + ' ' + selectedEncouragingPhrase)
      setSelectedEncouragingPhrase('')
    }
  }

  const addBibleVerse = () => {
    if (selectedBibleVerse) {
      setNewPostContent(prev => prev + ' ' + selectedBibleVerse)
      setSelectedBibleVerse('')
    }
  }

  const getPostCategoryIcon = (category: string) => {
    switch (category) {
      case 'prayer': return '✝️'
      case 'bible_study': return '📖'
      case 'worship': return '🎵'
      case 'testimony': return '✨'
      case 'encouragement': return '💪'
      default: return '💭'
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden">
      
      {/* Background with spiritual patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] pointer-events-none">
        {/* Subtle gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/2 via-transparent to-[var(--spiritual-purple)]/2"></div>
        
        {/* Floating spiritual elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[var(--spiritual-blue)] rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-[var(--spiritual-purple)] rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-[var(--spiritual-green)] rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-8 px-4">
        
                 {/* Header with Live Indicators */}
         <div className="max-w-7xl mx-auto mb-8">
           <div className="bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-6 shadow-xl">
             {/* Top Bar with Auth */}
             <div className="flex justify-between items-center mb-6">
               <div className="text-left">
                 <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--spiritual-purple)] bg-clip-text text-transparent">
                   Christian Community
                 </h1>
                 <p className="text-[var(--text-secondary)] text-sm sm:text-base">Connect, encourage, and grow together in faith</p>
               </div>
               <AuthButton />
             </div>
             
             <div className="text-center mb-6">
               <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--spiritual-purple)] rounded-full flex items-center justify-center shadow-2xl">
                 <span className="text-white text-2xl sm:text-3xl">✝️</span>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
                 Welcome to Your Faith Community
               </h2>
               
               {/* Refresh Button */}
               <button
                 onClick={loadCommunityData}
                 disabled={isLoading}
                 className="mt-4 px-4 py-2 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300 disabled:opacity-50"
               >
                 {isLoading ? (
                   <span className="flex items-center">
                     <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mr-2"></div>
                     Refreshing...
                   </span>
                 ) : (
                   <span className="flex items-center">
                     <span className="mr-2">🔄</span>
                     Refresh Posts
                   </span>
                 )}
               </button>
             </div>

            {/* Live Activity Indicators - Mobile Optimized */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-r from-[var(--spiritual-green)]/20 to-[var(--spiritual-blue)]/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-[var(--spiritual-green)]/30">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[var(--spiritual-green)] rounded-full animate-pulse"></div>
                  <span className="text-[var(--spiritual-green)] font-bold text-base sm:text-lg">{liveUsers} are live now</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[var(--spiritual-purple)]/20 to-[var(--spiritual-rose)]/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-[var(--spiritual-purple)]/30">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <span className="text-xl sm:text-2xl">🙏</span>
                  <span className="text-[var(--spiritual-purple)] font-bold text-base sm:text-lg">{activePrayerSessions} active prayer sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed Layout */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Main Feed - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              
                             {/* Post Creation Box - Mobile-First Osmo Style */}
               {!user ? (
                 <div className="bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-8 text-center shadow-xl">
                   <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--spiritual-purple)] rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-2xl">
                     🔐
                   </div>
                   <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Sign In to Share Your Faith</h3>
                   <p className="text-[var(--text-secondary)] mb-6">Join the community to share your prayers, testimonies, and encouragement with fellow believers.</p>
                   <AuthButton />
                 </div>
               ) : (
                 <div className="bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-4 sm:p-6 shadow-xl">
                   <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                     {/* Avatar - Mobile Centered */}
                     <div className="flex justify-center sm:justify-start">
                       <div className="w-16 h-16 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--spiritual-purple)] rounded-full flex items-center justify-center text-white text-xl sm:text-lg shadow-lg overflow-hidden">
                         {user?.user_metadata?.avatar_url ? (
                           <img 
                             src={user.user_metadata.avatar_url} 
                             alt="Profile" 
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <span>{user?.user_metadata?.display_name?.[0] || user.email?.[0] || '👤'}</span>
                         )}
                       </div>
                     </div>
                     <div className="flex-1">
                       {/* User Info */}
                       <div className="mb-3 text-sm text-[var(--text-secondary)]">
                         <span className="font-medium text-[var(--text-primary)]">
                           {user?.user_metadata?.display_name || 'Anonymous'}
                         </span>
                         <span className="mx-2">•</span>
                         <span>@{user?.user_metadata?.display_name?.toLowerCase().replace(/\s+/g, '') || 'user'}</span>
                       </div>
                       
                       {/* Textarea - Mobile Optimized */}
                       <textarea
                         value={newPostContent}
                         onChange={(e) => setNewPostContent(e.target.value)}
                         placeholder="What's on your heart today? Share your faith journey..."
                         className="w-full p-4 sm:p-4 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-2xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-base sm:text-lg min-h-[120px] sm:min-h-[100px]"
                         rows={3}
                       />
                    
                    {/* Encouraging Tools - Mobile Stacked */}
                    <div className="space-y-3">
                      {/* Encouraging Phrases - Full Width Mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <select
                          value={selectedEncouragingPhrase}
                          onChange={(e) => setSelectedEncouragingPhrase(e.target.value)}
                          className="w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-2xl sm:rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                        >
                          <option value="">✨ Add encouraging phrase...</option>
                          {encouragingPhrases.map((phrase, index) => (
                            <option key={index} value={phrase}>{phrase}</option>
                          ))}
                        </select>
                        <button
                          onClick={addEncouragingPhrase}
                          disabled={!selectedEncouragingPhrase}
                          className="w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 bg-[var(--spiritual-green)]/20 border border-[var(--spiritual-green)]/30 rounded-2xl sm:rounded-xl text-[var(--spiritual-green)] text-sm font-medium hover:bg-[var(--spiritual-green)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          ✨ Add Phrase
                        </button>
                      </div>

                      {/* Bible Verses - Full Width Mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <select
                          value={selectedBibleVerse}
                          onChange={(e) => setSelectedBibleVerse(e.target.value)}
                          className="w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-2xl sm:rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                        >
                          <option value="">📖 Add Bible verse...</option>
                          {bibleVerses.map((verse, index) => (
                            <option key={index} value={`"${verse.text}" - ${verse.verse}`}>"{verse.text}" - {verse.verse}</option>
                          ))}
                        </select>
                        <button
                          onClick={addBibleVerse}
                          disabled={!selectedBibleVerse}
                          className="w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 bg-[var(--spiritual-blue)]/20 border border-[var(--spiritual-blue)]/30 rounded-2xl sm:rounded-xl text-[var(--spiritual-blue)] text-sm font-medium hover:bg-[var(--spiritual-blue)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          📖 Add Verse
                        </button>
                      </div>
                    </div>

                    {/* Bottom Actions - Mobile Stacked */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 sm:pt-4 sm:border-t sm:border-[var(--glass-border)]">
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value as CommunityPost['category'])}
                        className="w-full sm:w-auto px-4 py-3 sm:px-4 sm:py-2 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-2xl sm:rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      >
                        <option value="general">💭 General</option>
                        <option value="prayer">✝️ Prayer</option>
                        <option value="bible_study">📖 Bible Study</option>
                        <option value="worship">🎵 Worship</option>
                        <option value="testimony">✨ Testimony</option>
                        <option value="encouragement">💪 Encouragement</option>
                      </select>
                                             <button
                         onClick={handleCreatePost}
                         disabled={!newPostContent.trim() || isCreatingPost}
                         className="w-full sm:w-auto bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-inverse)] px-8 py-4 sm:px-6 sm:py-3 rounded-2xl font-bold text-lg sm:text-base hover:from-[var(--accent-secondary)] hover:to-[var(--accent-primary)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                       >
                         {isCreatingPost ? (
                           <>
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                             Creating...
                           </>
                         ) : (
                           '✝️ Share Your Faith'
                         )}
                       </button>
                    </div>
                  </div>
                </div>
              </div>
               )}

               {/* Posts Feed */}
               <div className="space-y-6">
                 {isLoading ? (
                   <div className="text-center py-12">
                     <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-[var(--text-secondary)]">Loading posts...</p>
                   </div>
                 ) : communityPosts.length === 0 ? (
                   <div className="text-center py-12">
                     <div className="w-16 h-16 bg-[var(--glass-medium)] rounded-full flex items-center justify-center mx-auto mb-4">
                       <span className="text-2xl">✝️</span>
                     </div>
                     <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No posts yet</h3>
                     <p className="text-[var(--text-secondary)]">Be the first to share your faith journey!</p>
                   </div>
                 ) : (
                   communityPosts.map((post) => (
                  <div key={post.id} className="bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-6 shadow-xl hover:border-[var(--accent-primary)]/30 transition-all duration-300">
                    
                                         {/* Live Indicator */}
                     {post.is_live && (
                       <div className="flex items-center space-x-2 mb-4">
                         <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                         <span className="text-red-400 text-sm font-medium">🔴 LIVE NOW</span>
                       </div>
                     )}

                     <div className="flex items-start space-x-4">
                       <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--spiritual-purple)] rounded-full flex items-center justify-center text-white text-lg">
                         {post.author_avatar}
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center space-x-3 mb-3">
                           <h3 className="font-bold text-[var(--text-primary)] text-lg">{post.author_name}</h3>
                           <span className="text-[var(--text-secondary)]">{post.author_handle}</span>
                           <span className="text-[var(--text-tertiary)]">•</span>
                           <span className="text-[var(--text-tertiary)]">{formatTimestamp(post.created_at)}</span>
                           <div className="px-3 py-1 bg-[var(--glass-medium)] rounded-full text-xs text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                             {getPostCategoryIcon(post.category)} {post.category.replace('_', ' ')}
                           </div>
                         </div>
                        
                        <p className="text-[var(--text-primary)] text-lg leading-relaxed mb-4">{post.content}</p>
                        
                        {/* Hashtags */}
                        {post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.hashtags.map((tag) => (
                              <span key={tag} className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] cursor-pointer">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Post Actions - Osmo Style */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                                                         {/* Amen Button */}
                             <button
                               onClick={() => handleAmenPost(post.id)}
                               className="flex items-center space-x-2 transition-all duration-300 group text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                             >
                               <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-[var(--glass-medium)] border border-[var(--glass-border)] group-hover:bg-[var(--accent-primary)]/10">
                                 <span className="text-xl">✝️</span>
                               </div>
                               <span className="text-sm font-medium">{post.amens_count}</span>
                             </button>
                             
                             {/* Prayer Button */}
                             <button
                               onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                               className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-[var(--spiritual-blue)] transition-all duration-300 group"
                             >
                               <div className="w-10 h-10 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-full flex items-center justify-center group-hover:bg-[var(--spiritual-blue)]/10 group-hover:border-[var(--spiritual-blue)]/30 transition-all duration-300">
                                 <span className="text-xl">🙏</span>
                               </div>
                               <span className="text-sm font-medium">{post.prayers_count}</span>
                             </button>
                             
                             {/* Love Button */}
                             <button
                               onClick={() => handleLovePost(post.id)}
                               className="flex items-center space-x-2 transition-all duration-300 group text-[var(--text-secondary)] hover:text-[var(--spiritual-rose)]"
                             >
                               <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-[var(--glass-medium)] border border-[var(--glass-border)] group-hover:bg-[var(--spiritual-rose)]/10">
                                 <span className="text-xl">❤️</span>
                               </div>
                               <span className="text-sm font-medium">{post.loves_count}</span>
                             </button>
                          </div>
                        </div>

                                                 {/* Prayers Section - Using count for now */}
                         {post.prayers_count > 0 && (
                           <div className="mt-6 pt-6 border-t border-[var(--glass-border)]">
                             <h5 className="text-[var(--text-primary)] font-semibold mb-4 flex items-center space-x-2">
                               <span>🙏</span>
                               <span>Prayers & Encouragement ({post.prayers_count})</span>
                             </h5>
                             <div className="text-center py-4 text-[var(--text-secondary)]">
                               <p>Prayers are stored in the database. Click the 🙏 button above to add your prayer!</p>
                             </div>
                           </div>
                         )}

                        {/* Prayer Input */}
                        {showCommentInput === post.id && (
                          <div className="mt-6 pt-6 border-t border-[var(--glass-border)]">
                            <div className="flex space-x-3">
                              <input
                                type="text"
                                placeholder="Add your prayer or encouraging words..."
                                value={newPostComment}
                                onChange={(e) => setNewPostComment(e.target.value)}
                                className="flex-1 p-3 bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-2xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--spiritual-blue)]"
                              />
                              <button
                                onClick={() => handleAddPrayer(post.id)}
                                className="bg-gradient-to-r from-[var(--spiritual-blue)] to-[var(--spiritual-cyan)] text-white px-6 py-3 rounded-2xl font-semibold hover:from-[var(--spiritual-cyan)] hover:to-[var(--spiritual-blue)] transition-all duration-300 shadow-lg"
                              >
                                🙏 Pray
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                                         </div>
                   </div>
                 ))
                 )}
               </div>
            </div>

            {/* Sidebar - Right Side */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Trending Topics - Osmo Style */}
              <div className="bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center space-x-2">
                  <span>🔥</span>
                  <span>Trending in Faith</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { tag: '#MorningPrayer', count: '2.4K posts', trending: true },
                    { tag: '#Psalm23', count: '1.8K posts', trending: true },
                    { tag: '#BibleStudy', count: '3.1K posts', trending: false },
                    { tag: '#Meditation', count: '1.2K posts', trending: false },
                    { tag: '#Gratitude', count: '2.7K posts', trending: true }
                  ].map((topic) => (
                    <div key={topic.tag} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--glass-medium)] transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center space-x-2">
                        {topic.trending && <span className="text-[var(--accent-primary)] text-sm">🔥</span>}
                        <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{topic.tag}</span>
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)]">{topic.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Who to Follow - Osmo Style */}
              <div className="bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center space-x-2">
                  <span>👥</span>
                  <span>Connect with Believers</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Pastor Sarah', handle: '@pastorsarah', avatar: '👩‍🦰', followers: '12.5K' },
                    { name: 'Bible Study Group', handle: '@biblestudy', avatar: '📖', followers: '8.2K' },
                    { name: 'Prayer Warriors', handle: '@prayerwarriors', avatar: '🙏', followers: '15.7K' }
                  ].map((user) => (
                    <div key={user.handle} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--glass-medium)] transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--spiritual-purple)] rounded-full flex items-center justify-center text-white text-sm">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{user.name}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">{user.handle}</div>
                        </div>
                      </div>
                      <button className="text-xs bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white px-3 py-1 rounded-full hover:from-[var(--accent-secondary)] hover:to-[var(--accent-primary)] transition-all duration-300">
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions - Osmo Style */}
              <div className="bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Quick Actions</span>
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-[var(--spiritual-green)] to-[var(--spiritual-emerald)] text-white py-3 rounded-2xl font-semibold hover:from-[var(--spiritual-emerald)] hover:to-[var(--spiritual-green)] transition-all duration-300 shadow-lg">
                    🙏 Join Prayer Group
                  </button>
                  <button className="w-full bg-gradient-to-r from-[var(--spiritual-blue)] to-[var(--spiritual-indigo)] text-white py-3 rounded-2xl font-semibold hover:from-[var(--spiritual-indigo)] hover:to-[var(--spiritual-blue)] transition-all duration-300 shadow-lg">
                    📖 Start Bible Study
                  </button>
                  <button className="w-full bg-gradient-to-r from-[var(--spiritual-purple)] to-[var(--spiritual-violet)] text-white py-3 rounded-2xl font-semibold hover:from-[var(--spiritual-violet)] hover:to-[var(--spiritual-purple)] transition-all duration-300 shadow-lg">
                    🎵 Worship Together
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Spacing */}
        <div className="h-24 lg:hidden"></div>
      </div>
    </div>
  )
}

export default CommunityPage
