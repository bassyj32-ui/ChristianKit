import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { ProFeatureGate } from './ProFeatureGate'

interface PrayerRequest {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  title: string
  description: string
  category: 'health' | 'family' | 'spiritual_growth' | 'work' | 'relationships' | 'other'
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent'
  prayerCount: number
  comments: PrayerComment[]
  createdAt: string
  isAnswered: boolean
}

interface PrayerComment {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: string
}

interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  authorHandle: string
  content: string
  hashtags: string[]
  category: 'prayer' | 'bible_study' | 'worship' | 'testimony' | 'encouragement' | 'general'
  likes: string[]
  comments: PostComment[]
  reposts: string[]
  timestamp: string
}

interface PostComment {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: string
  likes: string[]
}

export const CommunityPage: React.FC = () => {
  const { user } = useSupabaseAuth()
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  
  // Prayer Request States
  const [showPrayerForm, setShowPrayerForm] = useState(false)
  const [newPrayerRequest, setNewPrayerRequest] = useState({
    title: '',
    description: '',
    category: 'spiritual_growth' as PrayerRequest['category'],
    urgencyLevel: 'medium' as PrayerRequest['urgencyLevel']
  })
  const [newComment, setNewComment] = useState('')
  const [activeCommentInput, setActiveCommentInput] = useState<string | null>(null)

  // Community Post States
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<CommunityPost['category']>('general')
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [newPostComment, setNewPostComment] = useState('')

  useEffect(() => {
    loadPrayerRequests()
    loadCommunityData()
  }, [])

  const loadPrayerRequests = async () => {
    try {
      const samplePrayerRequests: PrayerRequest[] = [
        {
          id: '1',
          authorId: 'user1',
          authorName: 'Sarah M.',
          authorAvatar: '👩‍🦰',
          title: 'Prayer for Healing',
          description: 'Please pray for my recovery from surgery. I\'m trusting in God\'s healing power and your prayers.',
          category: 'health',
          urgencyLevel: 'high',
          prayerCount: 23,
          comments: [
            {
              id: 'c1',
              authorId: 'user2',
              authorName: 'Pastor David',
              authorAvatar: '👨‍🦳',
              content: 'Praying for your complete healing, Sarah. "By His wounds we are healed." - Isaiah 53:5',
              timestamp: '2 hours ago'
            }
          ],
          createdAt: '2024-01-20',
          isAnswered: false
        }
      ]
      
      setPrayerRequests(samplePrayerRequests)
    } catch (error) {
      console.error('Error loading prayer requests:', error)
    }
  }

  const loadCommunityData = async () => {
    try {
      const samplePosts: CommunityPost[] = [
        {
          id: '1',
          authorId: 'user1',
          authorName: 'Sarah M.',
          authorAvatar: '👩‍🦰',
          authorHandle: '@sarahfaith',
          content: 'Just finished my morning prayer session with ChristianKit. The guided meditation really helped me focus on God\'s presence today. Feeling so blessed! 🙏✨ #MorningPrayer #SpiritualGrowth #GodIsGood',
          hashtags: ['MorningPrayer', 'SpiritualGrowth', 'GodIsGood'],
          category: 'prayer',
          likes: ['user2', 'user3'],
          comments: [
            {
              id: 'c1',
              authorId: 'user2',
              authorName: 'Pastor David',
              authorAvatar: '👨‍🦳',
              content: 'Beautiful! Keep up the great work on your spiritual journey.',
              timestamp: '2 hours ago',
              likes: ['user1']
            }
          ],
          reposts: [],
          timestamp: '2 hours ago'
        }
      ]

      setCommunityPosts(samplePosts)
    } catch (error) {
      console.error('Error loading community data:', error)
    }
  }

  // Prayer Request Handlers
  const handleCreatePrayerRequest = async () => {
    if (!user || !newPrayerRequest.title.trim() || !newPrayerRequest.description.trim()) return

    const prayerRequest: PrayerRequest = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.user_metadata?.display_name || 'Anonymous',
      authorAvatar: user.user_metadata?.avatar_url || '👤',
      title: newPrayerRequest.title.trim(),
      description: newPrayerRequest.description.trim(),
      category: newPrayerRequest.category,
      urgencyLevel: newPrayerRequest.urgencyLevel,
      prayerCount: 0,
      comments: [],
      createdAt: new Date().toLocaleDateString(),
      isAnswered: false
    }

    setPrayerRequests(prev => [prayerRequest, ...prev])
    setNewPrayerRequest({ title: '', description: '', category: 'spiritual_growth', urgencyLevel: 'medium' })
    setShowPrayerForm(false)
  }

  const handlePrayForRequest = async (requestId: string) => {
    if (!user) return

    setPrayerRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? { ...request, prayerCount: request.prayerCount + 1 }
          : request
      )
    )
  }

  const handleAddComment = async (requestId: string) => {
    if (!user || !newComment.trim()) return

    const comment: PrayerComment = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.user_metadata?.display_name || 'Anonymous',
      authorAvatar: user.user_metadata?.avatar_url || '👤',
      content: newComment.trim(),
      timestamp: 'Just now'
    }

    setPrayerRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? { ...request, comments: [...request.comments, comment] }
          : request
      )
    )

    setNewComment('')
    setActiveCommentInput(null)
  }

  // Community Post Handlers
  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return

    const hashtags = newPostContent.match(/#\w+/g)?.map(tag => tag.slice(1)) || []
    
    const post: CommunityPost = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.user_metadata?.display_name || 'Anonymous',
      authorAvatar: user.user_metadata?.avatar_url || '👤',
      authorHandle: `@${user.user_metadata?.display_name?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
      content: newPostContent.trim(),
      hashtags,
      category: newPostCategory,
      likes: [],
      comments: [],
      reposts: [],
      timestamp: 'Just now'
    }

    setCommunityPosts(prev => [post, ...prev])
    setNewPostContent('')
    setNewPostCategory('general')
  }

  const handleLikePost = async (postId: string) => {
    if (!user) return

    setCommunityPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: post.likes.includes(user.id) 
                ? post.likes.filter(id => id !== user.id)
                : [...post.likes, user.id]
            }
          : post
      )
    )
  }

  const handleAddPostComment = async (postId: string) => {
    if (!user || !newPostComment.trim()) return

    const comment: PostComment = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.user_metadata?.display_name || 'Anonymous',
      authorAvatar: user.user_metadata?.avatar_url || '👤',
      content: newPostComment.trim(),
      timestamp: 'Just now',
      likes: []
    }

    setCommunityPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    )

    setNewPostComment('')
    setShowCommentInput(null)
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-400 bg-red-900/20'
      case 'high': return 'text-orange-400 bg-orange-900/20'
      case 'medium': return 'text-yellow-400 bg-yellow-900/20'
      case 'low': return 'text-green-400 bg-green-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return '🏥'
      case 'family': return '👨‍👩‍👧‍👦'
      case 'spiritual_growth': return '🙏'
      case 'work': return '💼'
      case 'relationships': return '❤️'
      default: return '🙏'
    }
  }

  const getPostCategoryIcon = (category: string) => {
    switch (category) {
      case 'prayer': return '🙏'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black py-8 px-4">
      {/* Floating Prayer Request Board - At the Top */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-purple-900/80 via-pink-900/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/30">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-white text-3xl">🙏</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Community Prayer Board</h2>
            <p className="text-purple-200 text-lg">Lift each other up in prayer and faith</p>
          </div>

          {/* Prayer Request Form - Pro Users Only */}
          <ProFeatureGate feature="communityPrayerRequests">
            <div className="mb-6">
              <button
                onClick={() => setShowPrayerForm(!showPrayerForm)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
              >
                {showPrayerForm ? 'Cancel' : '+ Post Prayer Request'}
              </button>
            </div>

            {showPrayerForm && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Share Your Prayer Request</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Prayer Request Title"
                    value={newPrayerRequest.title}
                    onChange={(e) => setNewPrayerRequest(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <textarea
                    placeholder="Describe your prayer request..."
                    value={newPrayerRequest.description}
                    onChange={(e) => setNewPrayerRequest(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newPrayerRequest.category}
                      onChange={(e) => setNewPrayerRequest(prev => ({ ...prev, category: e.target.value as PrayerRequest['category'] }))}
                      className="p-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="spiritual_growth">Spiritual Growth</option>
                      <option value="health">Health</option>
                      <option value="family">Family</option>
                      <option value="work">Work</option>
                      <option value="relationships">Relationships</option>
                      <option value="other">Other</option>
                    </select>
                    <select
                      value={newPrayerRequest.urgencyLevel}
                      onChange={(e) => setNewPrayerRequest(prev => ({ ...prev, urgencyLevel: e.target.value as PrayerRequest['urgencyLevel'] }))}
                      className="p-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="low">Low Urgency</option>
                      <option value="medium">Medium Urgency</option>
                      <option value="high">High Urgency</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreatePrayerRequest}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
                  >
                    Post Prayer Request
                  </button>
                </div>
              </div>
            )}
          </ProFeatureGate>

          {/* Prayer Requests List */}
          <div className="space-y-4">
            {prayerRequests.map((request) => (
              <div key={request.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-lg">
                      {request.authorAvatar}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{request.title}</h4>
                      <p className="text-purple-200 text-sm">by {request.authorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                      {request.urgencyLevel.charAt(0).toUpperCase() + request.urgencyLevel.slice(1)}
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                      {getCategoryIcon(request.category)} {request.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <p className="text-purple-100 mb-4">{request.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handlePrayForRequest(request.id)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                    >
                      <span>🙏</span>
                      <span>I Prayed ({request.prayerCount})</span>
                    </button>
                    <button
                      onClick={() => setActiveCommentInput(activeCommentInput === request.id ? null : request.id)}
                      className="flex items-center space-x-2 text-purple-200 hover:text-white transition-colors"
                    >
                      <span>💬</span>
                      <span>Comment</span>
                    </button>
                  </div>
                  <span className="text-purple-300 text-sm">{request.createdAt}</span>
                </div>

                {/* Comments Section */}
                {request.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <h5 className="text-white font-semibold mb-3">Encouraging Comments:</h5>
                    <div className="space-y-3">
                      {request.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-3 p-3 bg-white/10 rounded-xl">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm">
                            {comment.authorAvatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-white">{comment.authorName}</span>
                              <span className="text-xs text-purple-300">{comment.timestamp}</span>
                            </div>
                            <p className="text-purple-100 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comment Input */}
                {activeCommentInput === request.id && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="Leave an encouraging comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <button
                        onClick={() => handleAddComment(request.id)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X/Twitter Style Community Layout */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Creation Box */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-neutral-800">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-lg">
                  {user?.user_metadata?.avatar_url || '👤'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your heart today? Share your faith journey..."
                    className="w-full p-4 bg-transparent border-none text-gray-100 placeholder-gray-400 resize-none focus:outline-none text-lg"
                    rows={3}
                  />
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-700">
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value as CommunityPost['category'])}
                      className="px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="general">💭 General</option>
                      <option value="prayer">🙏 Prayer</option>
                      <option value="bible_study">📖 Bible Study</option>
                      <option value="worship">🎵 Worship</option>
                      <option value="testimony">✨ Testimony</option>
                      <option value="encouragement">💪 Encouragement</option>
                    </select>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim()}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {communityPosts.map((post) => (
                <div key={post.id} className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-neutral-800 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-lg">
                      {post.authorAvatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold text-gray-100">{post.authorName}</h3>
                        <span className="text-gray-400">{post.authorHandle}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500">{formatTimestamp(post.timestamp)}</span>
                        <span className="px-2 py-1 bg-neutral-800 rounded-full text-xs text-emerald-400">
                          {getPostCategoryIcon(post.category)} {post.category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-200 text-lg leading-relaxed mb-3">{post.content}</p>
                      
                      {/* Hashtags */}
                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.hashtags.map((tag) => (
                            <span key={tag} className="text-emerald-400 hover:text-emerald-300 cursor-pointer">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center space-x-2 transition-all duration-200 ${
                              post.likes.includes(user?.id || '') 
                                ? 'text-red-500' 
                                : 'text-gray-500 hover:text-red-400'
                            }`}
                          >
                            <span className="text-xl">{post.likes.includes(user?.id || '') ? '❤️' : '🤍'}</span>
                            <span className="text-sm font-medium">{post.likes.length}</span>
                          </button>
                          
                          <button
                            onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-emerald-400 transition-colors"
                          >
                            <span className="text-xl">💬</span>
                            <span className="text-sm font-medium">{post.comments.length}</span>
                          </button>
                          
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-emerald-400 transition-colors">
                            <span className="text-xl">🔄</span>
                            <span className="text-sm font-medium">{post.reposts.length}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {post.comments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-700">
                          <div className="space-y-3">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex items-start space-x-3 p-3 bg-neutral-800/50 rounded-xl">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm">
                                  {comment.authorAvatar}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-gray-300">{comment.authorName}</span>
                                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                                  </div>
                                  <p className="text-gray-200 text-sm">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comment Input */}
                      {showCommentInput === post.id && (
                        <div className="mt-4 pt-4 border-t border-neutral-700">
                          <div className="flex space-x-3">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={newPostComment}
                              onChange={(e) => setNewPostComment(e.target.value)}
                              className="flex-1 p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleAddPostComment(post.id)}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200"
                            >
                              Comment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trending Topics */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Trending Topics</h3>
              <div className="space-y-3">
                {[
                  { tag: '#MorningPrayer', count: '2.4K posts', trending: true },
                  { tag: '#Psalm23', count: '1.8K posts', trending: true },
                  { tag: '#BibleStudy', count: '3.1K posts', trending: false },
                  { tag: '#Meditation', count: '1.2K posts', trending: false },
                  { tag: '#Gratitude', count: '2.7K posts', trending: true }
                ].map((topic) => (
                  <div key={topic.tag} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-2">
                      {topic.trending && <span className="text-red-500 text-sm">🔥</span>}
                      <span className="text-sm font-medium text-gray-100">{topic.tag}</span>
                    </div>
                    <span className="text-xs text-gray-500">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Who to Follow */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Who to Follow</h3>
              <div className="space-y-3">
                {[
                  { name: 'Pastor Sarah', handle: '@pastorsarah', avatar: '👩‍🦰', followers: '12.5K' },
                  { name: 'Bible Study Group', handle: '@biblestudy', avatar: '📖', followers: '8.2K' },
                  { name: 'Prayer Warriors', handle: '@prayerwarriors', avatar: '🙏', followers: '15.7K' }
                ].map((user) => (
                  <div key={user.handle} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-100">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.handle}</div>
                      </div>
                    </div>
                    <button className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full hover:bg-emerald-600 transition-colors">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200">
                  🙏 Join Prayer Group
                </button>
                <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200">
                  📖 Start Bible Study
                </button>
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
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
  )
}

export default CommunityPage
