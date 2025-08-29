import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { AuthButton } from './AuthButton'
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

  useEffect(() => {
    loadCommunityData()
  }, [])

  const loadCommunityData = async () => {
    try {
      setIsLoading(true)
      const posts = await getTrendingPosts(20)
      
      const formattedPosts = posts.map(post => ({
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Osmo Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header - Mobile First */}
      <div className="relative z-10 bg-black/20 backdrop-blur-2xl border-b border-yellow-400/20">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              ✝️ Christian Community
            </h1>
            <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto">
              Connect, encourage, and grow together in faith
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 sm:py-8">
        
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
          <div className="bg-black/30 backdrop-blur-2xl border border-yellow-400/20 rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              {/* User Avatar - Mobile Centered */}
              <div className="flex justify-center sm:justify-start">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-lg sm:text-xl shadow-lg">
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
              </div>
              
              {/* Post Form - Full Width Mobile */}
              <div className="flex-1 w-full">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your heart today? Share your faith journey..."
                  className="w-full p-3 sm:p-4 bg-black/20 border border-yellow-400/30 rounded-2xl text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-base sm:text-lg min-h-[100px] sm:min-h-[120px] transition-all duration-300"
                  rows={3}
                />
                
                {/* Action Buttons - Mobile Stacked */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 mt-4">
                  {/* Debug Buttons - Mobile Full Width */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <button
                      onClick={handleTestPost}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg"
                    >
                      🧪 Test Post
                    </button>
                    
                    <button
                      onClick={testDatabaseConnectionLocal}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg"
                    >
                      🔧 Test DB
                    </button>
                  </div>
                  
                  {/* Post Button - Mobile Full Width */}
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || isCreatingPost}
                    className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    {isCreatingPost ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
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

        {/* Posts Feed - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Loading posts...</p>
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
            communityPosts.map((post) => (
              <div key={post.id} className="bg-black/30 backdrop-blur-2xl border border-yellow-400/20 rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-yellow-400/40">
                {/* Post Header - Mobile Optimized */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-sm sm:text-base shadow-lg">
                    {post.author_avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm sm:text-base truncate">{post.author_name}</div>
                    <div className="text-xs sm:text-sm text-slate-400">{formatTimestamp(post.created_at)}</div>
                  </div>
                </div>
                
                {/* Post Content - Mobile Optimized */}
                <div className="text-base sm:text-lg mb-4 leading-relaxed text-slate-200">
                  {post.content}
                </div>
                
                {/* Post Actions - Mobile Optimized */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <button
                      onClick={() => handleAmenPost(post.id)}
                      className="flex items-center space-x-2 bg-black/20 hover:bg-yellow-400/20 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 border border-yellow-400/20 hover:border-yellow-400/40"
                    >
                      <span className="text-sm sm:text-base">🙏</span>
                      <span className="text-xs sm:text-sm text-slate-300">{post.amens_count || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => handleLovePost(post.id)}
                      className="flex items-center space-x-2 bg-black/20 hover:bg-yellow-400/20 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 border border-yellow-400/20 hover:border-yellow-400/40"
                    >
                      <span className="text-sm sm:text-base">❤️</span>
                      <span className="text-xs sm:text-sm text-slate-300">{post.loves_count || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                      className="flex items-center space-x-2 bg-black/20 hover:bg-yellow-400/20 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 border border-yellow-400/20 hover:border-yellow-400/40"
                    >
                      <span className="text-sm sm:text-base">💬</span>
                      <span className="text-xs sm:text-sm text-slate-300">{post.prayers_count || 0}</span>
                    </button>
                  </div>
                </div>
                
                {/* Comment Input - Mobile Optimized */}
                {showCommentInput === post.id && (
                  <div className="mt-4 pt-4 border-t border-yellow-400/20">
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <input
                        type="text"
                        value={newPostComment}
                        onChange={(e) => setNewPostComment(e.target.value)}
                        placeholder="Add a prayer or comment..."
                        className="flex-1 p-3 bg-black/20 border border-yellow-400/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                      />
                      <button
                        onClick={() => handleAddPrayer(post.id)}
                        disabled={!newPostComment.trim()}
                        className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-xl font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 shadow-lg"
                      >
                        Send
                      </button>
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
    </div>
  )
}
