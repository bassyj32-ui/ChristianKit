import React, { useState, useEffect } from 'react'

interface CommunityPost {
  id: number
  author: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  comments: number
  isLiked: boolean
}

const mockPosts: CommunityPost[] = [
  {
    id: 1,
    author: 'Sarah M.',
    avatar: '👩‍🦰',
    content: 'Just finished my morning prayer session with ChristianKit. The guided meditation really helped me focus on God\'s presence today. Feeling so blessed! 🙏✨',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 8,
    isLiked: false
  },
  {
    id: 2,
    author: 'Pastor David',
    avatar: '👨‍🦳',
    content: 'Sharing today\'s Bible verse that really spoke to me: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." - Joshua 1:9',
    timestamp: '4 hours ago',
    likes: 42,
    comments: 15,
    isLiked: true
  },
  {
    id: 3,
    author: 'Maria L.',
    avatar: '👩‍🦱',
    content: 'Started my spiritual journey 30 days ago and I can already feel the difference. ChristianKit has been my daily companion. Anyone else on a similar path? 💕',
    timestamp: '6 hours ago',
    likes: 18,
    comments: 12,
    isLiked: false
  },
  {
    id: 4,
    author: 'Prayer Warriors',
    avatar: '🙏',
    content: 'Join us tonight for our weekly prayer meeting! We\'ll be praying for our community, families, and anyone who needs spiritual support. All are welcome! 🙌',
    timestamp: '8 hours ago',
    likes: 67,
    comments: 23,
    isLiked: false
  }
]

export const CommunitySection: React.FC = () => {
  const [animateIn, setAnimateIn] = useState(false)
  const [hoveredPost, setHoveredPost] = useState<number | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>(mockPosts)
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'following'>('trending')

  useEffect(() => {
    setAnimateIn(true)
  }, [])

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ))
  }

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
        
        {/* Top Bar with Pro Badge */}
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-neutral-800 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">👥</span>
              <span className="text-sm font-medium text-gray-300">Join the conversation</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              <span>⭐</span>
              <span>Pro Feature</span>
              <span>•</span>
              <span>Free for 2 weeks</span>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">🚧</span>
            <span className="text-xl font-bold text-yellow-400">Community Features Coming Soon!</span>
            <span className="text-2xl">🚧</span>
          </div>
          <p className="text-yellow-300 text-sm">
            This is a preview of our upcoming community features. The posts below are examples to show you what's coming!
          </p>
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
                      {post.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-100 text-sm">{post.author}</h3>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{post.timestamp}</span>
                        </div>
                        <button className="text-gray-400 hover:text-gray-300 transition-colors">
                          <span className="text-lg">⋯</span>
                        </button>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed mb-3">{post.content}</p>
                      
                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {['#Prayer', '#SpiritualGrowth', '#GodIsGood'].map((tag) => (
                          <span key={tag} className="text-xs text-green-500 hover:text-green-400 cursor-pointer">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-1 transition-all duration-200 ${
                              post.isLiked ? 'text-green-500' : 'text-gray-500 hover:text-green-400'
                            }`}
                          >
                            <span className="text-lg">{post.isLiked ? '❤️' : '🤍'}</span>
                            <span className="text-xs font-medium">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-green-400 transition-colors">
                            <span className="text-lg">💬</span>
                            <span className="text-xs font-medium">{post.comments}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-green-400 transition-colors">
                            <span className="text-lg">🔄</span>
                            <span className="text-xs font-medium">Share</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-green-400 transition-colors">
                            <span className="text-lg">📤</span>
                          </button>
                        </div>
                      </div>
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
          
        {/* Create Post Section - Moved to Bottom */}
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-green-800 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              👤
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Share what God is doing in your life... (Pro feature - Start your free trial to post)"
                className="w-full p-4 border border-green-700 bg-neutral-900 text-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                disabled
              />
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 cursor-not-allowed" disabled>
                    📷
                  </button>
                  <button className="p-2 text-gray-400 cursor-not-allowed" disabled>
                    📖
                  </button>
                  <button className="p-2 text-gray-400 cursor-not-allowed" disabled>
                    🙏
                  </button>
                </div>
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                  Upgrade to Post
                </button>
              </div>
            </div>
          </div>
        </div>

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
