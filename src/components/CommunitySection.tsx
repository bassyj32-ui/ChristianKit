import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { cloudDataService } from '../services/cloudDataService'

interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: number
  likes: string[]
  comments: Comment[]
  hashtags: string[]
  type: 'prayer' | 'bible' | 'meditation' | 'general'
  isPublic: boolean
}

interface Comment {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: number
  likes: string[]
}

// Sample initial posts
const initialPosts: CommunityPost[] = [
  {
    id: '1',
    authorId: 'user1',
    authorName: 'Sarah M.',
    authorAvatar: '👩‍🦰',
    content: 'Just finished my morning prayer session with ChristianKit. The guided meditation really helped me focus on God\'s presence today. Feeling so blessed! 🙏✨',
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    likes: ['user2', 'user3'],
    comments: [
      {
        id: 'c1',
        authorId: 'user2',
        authorName: 'Pastor David',
        authorAvatar: '👨‍🦳',
        content: 'Beautiful! Keep up the great work on your spiritual journey.',
        timestamp: Date.now() - 1 * 60 * 60 * 1000,
        likes: ['user1']
      }
    ],
    hashtags: ['Prayer', 'SpiritualGrowth', 'GodIsGood'],
    type: 'prayer',
    isPublic: true
  },
  {
    id: '2',
    authorId: 'user2',
    authorName: 'Pastor David',
    authorAvatar: '👨‍🦳',
    content: 'Sharing today\'s Bible verse that really spoke to me: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." - Joshua 1:9',
    timestamp: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
    likes: ['user1', 'user3', 'user4'],
    comments: [],
    hashtags: ['BibleStudy', 'Encouragement', 'Joshua1:9'],
    type: 'bible',
    isPublic: true
  }
]

export const CommunitySection: React.FC = () => {
  const { user } = useAuth()
  const [animateIn, setAnimateIn] = useState(false)
  const [hoveredPost, setHoveredPost] = useState<string | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'following'>('trending')
  const [newPostContent, setNewPostContent] = useState('')
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    setAnimateIn(true)
  }, [])

  // Helper functions
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return new Date(timestamp).toLocaleDateString()
  }

  const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g
    const matches = content.match(hashtagRegex)
    return matches ? matches.map(tag => tag.slice(1)) : []
  }

  const isLikedByUser = (post: CommunityPost): boolean => {
    return user ? post.likes.includes(user.uid) : false
  }

  const handleLike = async (postId: string) => {
    if (!user) return

    try {
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likes.includes(user.uid)
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(id => id !== user.uid)
              : [...post.likes, user.uid]
          }
        }
        return post
      })

      setPosts(updatedPosts)

      // Update in cloud (we'll implement this later)
      // For now, just update locally
    } catch (error) {
      console.error('Error updating like:', error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    const hashtags = extractHashtags(newPostContent)
    const newPost: CommunityPost = {
      id: Date.now().toString(),
      content: newPostContent,
      authorId: user.uid,
      authorName: user.email?.split('@')[0] || 'Anonymous',
      authorAvatar: user.email?.charAt(0).toUpperCase() || '👤',
      timestamp: Date.now(),
      likes: [],
      comments: [],
      hashtags,
      type: 'general',
      isPublic: true
    }

    try {
      // Save to cloud
      await cloudDataService.saveCommunityPost(user, {
        id: newPost.id,
        content: newPost.content,
        hashtags: newPost.hashtags,
        likes: newPost.likes,
        comments: newPost.comments,
        timestamp: new Date()
      })

      // Update local state
      setPosts(prevPosts => [newPost, ...prevPosts])
      setNewPostContent('')
      setShowCommentInput(null)
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    }
  }

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !user) return

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      authorId: user.uid,
      authorName: user.email?.split('@')[0] || 'Anonymous',
      authorAvatar: user.email?.charAt(0).toUpperCase() || '👤',
      timestamp: Date.now(),
      likes: []
    }

    try {
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, comment]
          }
        }
        return post
      })

      setPosts(updatedPosts)
      setNewComment('')
      setShowCommentInput(null)

      // Update in cloud (we'll implement this later)
      // For now, just update locally
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  // Load posts from cloud on component mount
  useEffect(() => {
    const loadPostsFromCloud = async () => {
      if (!user) return

      try {
        const cloudPosts = await cloudDataService.getCommunityPosts()
        if (cloudPosts.length > 0) {
          // Convert cloud format to local format
          const localPosts = cloudPosts.map(post => ({
            id: post.id,
            content: post.content,
            authorId: post.userId,
            authorName: user.email?.split('@')[0] || 'Anonymous',
            authorAvatar: user.email?.charAt(0).toUpperCase() || '👤',
            timestamp: post.timestamp?.toDate?.()?.getTime() || Date.now(),
            likes: post.likes || [],
            comments: post.comments?.map(comment => ({
              id: comment.id,
              content: comment.content,
              authorId: comment.authorId,
              authorName: user.email?.split('@')[0] || 'Anonymous',
              authorAvatar: user.email?.charAt(0).toUpperCase() || '👤',
              timestamp: comment.timestamp?.toDate?.()?.getTime() || Date.now(),
              likes: []
            })) || [],
            hashtags: post.hashtags || [],
            type: 'general' as const,
            isPublic: true
          }))
          
          setPosts(localPosts)
        }
      } catch (error) {
        console.error('Error loading posts from cloud:', error)
        // Fall back to local posts
      }
    }

    loadPostsFromCloud()
  }, [user])

  const trendingTopics = [
    { tag: '#MorningPrayer', count: '2.4K posts', trending: true },
    { tag: '#Psalm23', count: '1.8K posts', trending: true },
    { tag: '#BibleStudy', count: '3.1K posts', trending: false },
    { tag: '#Meditation', count: '1.2K posts', trending: false },
    { tag: '#Gratitude', count: '2.7K posts', trending: true }
  ]

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Top Bar */}
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-neutral-800 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">👥</span>
              <span className="text-sm font-medium text-gray-300">Christian Community</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              <span>✨</span>
              <span>Live & Active</span>
            </div>
          </div>
        </div>



        {/* X/Twitter Style Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Navigation */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-neutral-800">
              <div className="flex">
                {[
                  { id: 'trending', label: 'Trending', icon: '🔥' },
                  { id: 'latest', label: 'Latest', icon: '⚡' },
                  { id: 'following', label: 'Following', icon: '👥' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className={`bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-neutral-800 transition-all duration-300 transform hover:scale-[1.02] ${
                    animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setHoveredPost(post.id)}
                  onMouseLeave={() => setHoveredPost(null)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {post.authorAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-100 text-sm">{post.authorName}</h3>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</span>
                        </div>
                        <button className="text-gray-400 hover:text-gray-300 transition-colors">
                          <span className="text-lg">⋯</span>
                        </button>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed mb-3">{post.content}</p>
                      
                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.hashtags.map((tag) => (
                          <span key={tag} className="text-xs text-green-500 hover:text-green-400 cursor-pointer">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Comments */}
                      {post.comments.length > 0 && (
                        <div className="bg-neutral-800/50 rounded-xl p-3 mb-3">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex items-start space-x-2 mb-2 last:mb-0">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                                {comment.authorAvatar}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium text-gray-300">{comment.authorName}</span>
                                  <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                                </div>
                                <p className="text-xs text-gray-200">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-1 transition-all duration-200 ${
                              isLikedByUser(post) ? 'text-green-500' : 'text-gray-500 hover:text-green-400'
                            }`}
                          >
                            <span className="text-lg">{isLikedByUser(post) ? '❤️' : '🤍'}</span>
                            <span className="text-xs font-medium">{post.likes.length}</span>
                          </button>
                          <button 
                            onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-green-400 transition-colors"
                          >
                            <span className="text-lg">💬</span>
                            <span className="text-xs font-medium">{post.comments.length}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-green-400 transition-colors">
                            <span className="text-lg">🔄</span>
                            <span className="text-xs font-medium">Share</span>
                          </button>
                        </div>
                      </div>

                      {/* Comment Input */}
                      {showCommentInput === post.id && (
                        <div className="mt-3 p-3 bg-neutral-800/50 rounded-xl">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-lg text-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={2}
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => setShowCommentInput(null)}
                              className="px-3 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Trending Topics */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-neutral-800">
              <h3 className="text-lg font-bold text-gray-100 mb-4">Trending Topics</h3>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
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
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-neutral-800">
              <h3 className="text-lg font-bold text-gray-100 mb-4">Who to Follow</h3>
              <div className="space-y-3">
                {[
                  { name: 'Pastor Sarah', handle: '@pastorsarah', avatar: '👩‍🦰', followers: '12.5K' },
                  { name: 'Bible Study Group', handle: '@biblestudy', avatar: '📖', followers: '8.2K' },
                  { name: 'Prayer Warriors', handle: '@prayerwarriors', avatar: '🙏', followers: '15.7K' }
                ].map((user) => (
                  <div key={user.handle} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-100">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.handle}</div>
                      </div>
                    </div>
                    <button className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Upgrade Section */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-6 shadow-xl border border-purple-800 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">⭐</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-100 mb-2">Join the Community</h3>
            <p className="text-gray-400 mb-4">
              Share your spiritual journey and connect with fellow believers
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                Start Free Trial
              </button>
              <button className="bg-neutral-900 text-gray-100 px-6 py-3 rounded-xl font-medium border-2 border-neutral-700 hover:bg-neutral-800 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
          
        {/* Create Post Section */}
        {user ? (
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-green-800 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.email?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="flex-1">
              <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share what God is doing in your life... Use #hashtags to connect with others!"
                className="w-full p-4 border border-green-700 bg-neutral-900 text-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors" title="Add photo">
                    📷
                  </button>
                    <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors" title="Add Bible verse">
                    📖
                  </button>
                    <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors" title="Add prayer">
                    🙏
                  </button>
                </div>
                  <button 
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      newPostContent.trim() 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                        : 'bg-neutral-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Share Post
                </button>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-3xl p-6 shadow-xl border border-blue-800 mb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">🔐</span>
            </div>
            <h3 className="text-xl font-bold text-gray-100 mb-2">Sign in to Join the Conversation</h3>
            <p className="text-gray-400 mb-4">
              Create posts, like, and comment to connect with fellow believers
            </p>
          </div>
        )}

        {/* Load More Button */}
        <div className="text-center mt-8">
          <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Load More Posts
          </button>
        </div>

        {/* Footer Description */}
        <div className="text-center mt-12">
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Connect with fellow believers and share your spiritual journey
          </p>
          
          {/* Community Header at Bottom */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-white text-4xl">👥</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-100">
              Community
            </h1>
          </div>
        </div>
      </div>
    </div>
  )
}
