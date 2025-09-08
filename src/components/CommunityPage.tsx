import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { AuthButton } from './AuthButton'
import UserProfileModal from './UserProfileModal'
import UserSearch from './UserSearch'
import UserDiscoverySidebar from './UserDiscoverySidebar'
import NotificationCenter from './NotificationCenter'
import { 
  getTrendingPosts, 
  createPost, 
  addPostInteraction, 
  addPrayer, 
  testDatabaseConnection,
  type CommunityPost,
  type Prayer
} from '../services/communityService'

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

  useEffect(() => {
    loadCommunityData()
  }, [])

  const loadCommunityData = async () => {
    try {
      setIsLoading(true)
      const result = await getTrendingPosts({ limit: 20 })
      
      const formattedPosts = result.data.map((post: CommunityPost) => ({
        ...post,
        author_name: post.author_name || 'Anonymous',
        author_avatar: post.author_avatar || '👤',
        author_handle: post.author_handle || `@user${post.author_id?.slice(0, 8) || 'user'}`
      }))
      
      setCommunityPosts(formattedPosts)
    } catch (error) {
      console.error('Error loading community data:', error)
      setCommunityPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return

    try {
      setIsCreatingPost(true)
      console.log('🚀 Starting post creation...')
      
      const newPost = await createPost({
        content: newPostContent.trim(),
        category: 'general',
        hashtags: []
      })

      if (newPost) {
        console.log('✅ Post created successfully:', newPost)
        setNewPostContent('')
        await loadCommunityData()
        alert('Post created successfully! 🎉')
      } else {
        console.error('❌ Post creation returned null')
        alert('Failed to create post. Check console for details.')
      }
    } catch (error) {
      console.error('❌ Error creating post:', error)
      alert(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleTestPost = async () => {
    if (!user) return
    
    try {
      console.log('🧪 Testing post creation...')
      
      const testPost = await createPost({
        content: 'This is a test post to check if the database is working! 🧪',
        category: 'general',
        hashtags: []
      }, user) // Pass the current user
      
      if (testPost) {
        console.log('✅ Test post successful:', testPost)
        alert('Test post created! Database is working.')
        await loadCommunityData()
      } else {
        console.error('❌ Test post failed')
        alert('Test post failed. Check console for details.')
      }
    } catch (error) {
      console.error('❌ Test post error:', error)
      alert(`Test post error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testDatabaseConnectionLocal = async () => {
    try {
      console.log('🔧 Testing database connection...')
      const result = await testDatabaseConnection()
      
      if (result.success) {
        console.log('✅ Database test successful:', result.message)
        alert(`Database test successful! ${result.message}`)
      } else {
        console.error('❌ Database test failed:', result.message)
        alert(`Database test failed: ${result.message}`)
      }
    } catch (error) {
      console.error('❌ Database test error:', error)
      alert(`Database test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      console.error('Error handling amen:', error)
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
      console.error('Error handling love:', error)
    }
  }

  const handleAddPrayer = async (postId: string) => {
    if (!user || !newPostComment.trim()) return

    try {
      const prayer = await addPrayer(postId, newPostComment.trim())
      if (prayer) {
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
      console.error('Error adding prayer:', error)
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
            {/* Title Section */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                ✝️ Christian Community
              </h1>
              <p className="text-slate-300 text-sm sm:text-lg">
                Connect, encourage, and grow together in faith
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
                  console.log('Navigate to post:', postId);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Enhanced Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:py-8">
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
              
              {/* Post Form - Enhanced */}
              <div className="flex-1">
                <div className="mb-4">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your heart today? Share your faith journey, prayers, or encouragement..."
                    className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-lg min-h-[120px] transition-all duration-300"
                    rows={4}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                        <svg className="w-5 h-5 text-slate-400 hover:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-slate-400">Photo</span>
                      </button>
                      <button className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                        <span className="text-lg">📖</span>
                        <span className="text-sm text-slate-400">Bible Verse</span>
                      </button>
                    </div>
                    <span className="text-xs text-slate-400">{newPostContent.length}/1000</span>
                  </div>
                </div>
                
                {/* Action Buttons - Enhanced */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  {/* Debug Buttons - Hidden in production */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleTestPost}
                      className="hidden sm:flex items-center space-x-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-blue-500/30"
                    >
                      <span>🧪</span>
                      <span>Test</span>
                    </button>
                    
                    <button
                      onClick={testDatabaseConnectionLocal}
                      className="hidden sm:flex items-center space-x-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-green-500/30"
                    >
                      <span>🔧</span>
                      <span>DB</span>
                    </button>
                  </div>
                  
                  {/* Post Button - Enhanced */}
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || isCreatingPost}
                    className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black px-8 py-3 rounded-xl font-bold text-lg hover:from-amber-500 hover:via-orange-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5"
                  >
                    {isCreatingPost ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Sharing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>✝️</span>
                        <span>Share Your Faith</span>
                        <span>✨</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
            communityPosts.map((post, index) => (
              <div 
                key={post.id} 
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl hover:shadow-yellow-400/10 transition-all duration-500 hover:border-yellow-400/30 hover:bg-white/10 transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Post Header - Enhanced */}
                <div className="flex items-start space-x-4 mb-5">
                  <div className="relative">
                    <button
                      onClick={() => openUserProfile(post.author_id)}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center text-black text-base sm:text-lg shadow-lg ring-2 ring-yellow-400/20 group-hover:ring-yellow-400/40 transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      {post.author_avatar}
                    </button>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <button
                        onClick={() => openUserProfile(post.author_id)}
                        className="font-bold text-white text-base sm:text-lg truncate hover:text-yellow-300 transition-colors duration-300 cursor-pointer"
                      >
                        {post.author_name}
                      </button>
                      <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{formatTimestamp(post.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="px-2 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                        <span className="text-xs text-yellow-300 font-medium">Believer</span>
                      </div>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 hover:bg-white/10 rounded-lg">
                    <svg className="w-5 h-5 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                  </button>
                </div>
                
                {/* Post Content - Enhanced */}
                <div className="text-base sm:text-lg mb-6 leading-relaxed text-slate-100 group-hover:text-white transition-colors duration-300">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                </div>
                
                {/* Post Actions - Enhanced */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleAmenPost(post.id)}
                      className="group/btn flex items-center space-x-2 bg-white/5 hover:bg-blue-500/20 px-4 py-2.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <span className="text-lg group-hover/btn:scale-110 transition-transform duration-300">🙏</span>
                      <span className="text-sm font-medium text-slate-300 group-hover/btn:text-blue-300">{post.amens_count || 0}</span>
                      <span className="text-xs text-slate-400 group-hover/btn:text-blue-400 hidden sm:block">Amen</span>
                    </button>
                    
                    <button
                      onClick={() => handleLovePost(post.id)}
                      className="group/btn flex items-center space-x-2 bg-white/5 hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-red-400/40 hover:shadow-lg hover:shadow-red-500/20"
                    >
                      <span className="text-lg group-hover/btn:scale-110 transition-transform duration-300">❤️</span>
                      <span className="text-sm font-medium text-slate-300 group-hover/btn:text-red-300">{post.loves_count || 0}</span>
                      <span className="text-xs text-slate-400 group-hover/btn:text-red-400 hidden sm:block">Love</span>
                    </button>
                    
                    <button
                      onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                      className="group/btn flex items-center space-x-2 bg-white/5 hover:bg-green-500/20 px-4 py-2.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-green-400/40 hover:shadow-lg hover:shadow-green-500/20"
                    >
                      <span className="text-lg group-hover/btn:scale-110 transition-transform duration-300">💬</span>
                      <span className="text-sm font-medium text-slate-300 group-hover/btn:text-green-300">{post.prayers_count || 0}</span>
                      <span className="text-xs text-slate-400 group-hover/btn:text-green-400 hidden sm:block">Pray</span>
                    </button>
                  </div>
                  
                  {/* Share Button */}
                  <button className="group/share p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300">
                    <svg className="w-5 h-5 text-slate-400 group-hover/share:text-yellow-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>
                
                {/* Comment Input - Enhanced */}
                {showCommentInput === post.id && (
                  <div className="mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-sm flex-shrink-0">
                          {user?.user_metadata?.avatar_url ? (
                            <img 
                              src={user.user_metadata.avatar_url} 
                              alt="Your avatar" 
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span>{user?.user_metadata?.display_name?.[0] || user?.email?.[0] || '👤'}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newPostComment}
                            onChange={(e) => setNewPostComment(e.target.value)}
                            placeholder="Share your prayers and encouragement..."
                            className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 resize-none"
                            rows={3}
                          />
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                                <svg className="w-4 h-4 text-slate-400 hover:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14L17 4M9 9v6M15 9v6" />
                                </svg>
                              </button>
                              <span className="text-xs text-slate-400">{newPostComment.length}/500</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setShowCommentInput(null)
                                  setNewPostComment('')
                                }}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddPrayer(post.id)}
                                disabled={!newPostComment.trim()}
                                className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                Send Prayer
                              </button>
                            </div>
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
        
        {/* Refresh Button - Mobile Centered */}
        <div className="text-center mt-8 mb-8">
          <button
            onClick={loadCommunityData}
            disabled={isLoading}
            className="bg-black/30 backdrop-blur-2xl border border-yellow-400/20 text-white px-6 py-3 rounded-2xl hover:bg-yellow-400/10 hover:border-yellow-400/40 transition-all duration-300 disabled:opacity-50 shadow-xl"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refresh Posts'}
          </button>
        </div>
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
    </div>
  )
}
