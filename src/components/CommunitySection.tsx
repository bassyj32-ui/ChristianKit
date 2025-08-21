import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { supabase } from '../utils/supabase'
import { cloudDataService } from '../services/cloudDataService'
import { CommunityPrayerRequests } from './CommunityPrayerRequests'
import { ProFeatureGate } from './ProFeatureGate'

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
  const { user } = useSupabaseAuth()
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

  const handleLike = async (postId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('post_likes')
        .upsert({ 
          post_id: postId, 
          user_id: user.id 
        })
      
      if (error) throw error
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes: [...post.likes, user.id] }
            : post
        )
      )
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleUnlike = async (postId: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes.filter(id => id !== user.id) }
            : post
        )
      )
    } catch (error) {
      console.error('Error unliking post:', error)
    }
  }

  const handleComment = async (postId: string) => {
    if (!user || !newComment.trim()) return
    
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        })
      
      if (error) throw error
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                comments: [...post.comments, {
                  id: data[0].id,
                  authorId: user.id,
                  authorName: user.user_metadata?.display_name || 'User',
                  authorAvatar: user.user_metadata?.avatar_url || '👤',
                  content: newComment.trim(),
                  timestamp: Date.now(),
                  likes: []
                }]
              }
            : post
        )
      )
      
      setNewComment('')
      setShowCommentInput(null)
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const isLiked = (postId: string) => {
    return user ? posts.find(post => post.id === postId)?.likes.includes(user.id) : false
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    const hashtags = extractHashtags(newPostContent)
    const newPost: CommunityPost = {
      id: Date.now().toString(),
      content: newPostContent,
      authorId: user.id,
      authorName: user.user_metadata?.display_name || 'Anonymous',
      authorAvatar: user.user_metadata?.avatar_url || '👤',
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
      authorId: user.id,
      authorName: user.user_metadata?.display_name || 'Anonymous',
      authorAvatar: user.user_metadata?.avatar_url || '👤',
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
            authorName: user.user_metadata?.display_name || 'Anonymous',
            authorAvatar: user.user_metadata?.avatar_url || '👤',
            timestamp: post.timestamp?.toDate?.()?.getTime() || Date.now(),
            likes: post.likes || [],
            comments: post.comments?.map(comment => ({
              id: comment.id,
              content: comment.content,
              authorId: comment.authorId,
              authorName: user.user_metadata?.display_name || 'Anonymous',
              authorAvatar: user.user_metadata?.avatar_url || '👤',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black py-8 px-4">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 mb-8">
        <div className="bg-gradient-to-r from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-xl border-b-2 border-gray-600/50 shadow-2xl">
          <div className="flex items-center justify-between py-4 px-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-white font-semibold hover:text-amber-300 transition-colors duration-300"
              >
                🏠 Home
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.location.href = '/subscription'}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-amber-500 hover:to-orange-500 transition-all duration-300 border border-amber-500/30"
              >
                Pro
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        
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
                              isLiked(post.id) ? 'text-green-500' : 'text-gray-500 hover:text-green-400'
                            }`}
                          >
                            <span className="text-lg">{isLiked(post.id) ? '❤️' : '🤍'}</span>
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
                              onClick={() => handleComment(post.id)}
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

        {/* Community Prayer Requests - Unified Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-white text-3xl">🙏</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-3">
            Community Prayer & Support
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Share prayer requests, encourage others, and grow together in faith
          </p>
          
          <CommunityPrayerRequests />
        </div>

        {/* Mobile Bottom Spacing */}
        <div className="h-24 lg:hidden"></div>
      </div>

      {/* Mobile Navigation Tabs - Floating Glass Tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-6">
        <div className="flex items-center space-x-4">
          {/* Weekly Analysis Tab */}
          <button
            onClick={() => window.location.href = '/weekly-analysis'}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-20 bg-gradient-to-br from-amber-400/10 to-orange-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-amber-400/30 border border-amber-300/20">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400/30 to-orange-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-amber-400/40 border border-amber-300/30 mb-2">
                <svg className="w-5 h-5 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-amber-100 group-hover:text-amber-50 transition-colors duration-300 tracking-wide">Analysis</span>
            </div>
          </button>
          
          {/* Prayer Tab */}
          <button
            onClick={() => window.location.href = '/prayer'}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/30 border border-blue-300/20">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-indigo-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/40 border border-blue-300/30 mb-2">
                <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300 tracking-wide">Prayer</span>
            </div>
          </button>
          
          {/* Community Tab */}
          <button
            onClick={() => window.location.href = '/community'}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-20 bg-gradient-to-br from-emerald-400/10 to-teal-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/30 border border-emerald-300/20">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/30 to-teal-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/40 border border-emerald-300/30 mb-2">
                <svg className="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-100 group-hover:text-emerald-50 transition-colors duration-300 tracking-wide">Community</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
