import React, { useState, useEffect } from 'react'
import { ProFeatureGate } from './ProFeatureGate'
import { useSupabaseAuth } from './SupabaseAuthProvider'

interface PrayerRequest {
  id: string
  title: string
  description: string
  category: 'health' | 'family' | 'work' | 'spiritual' | 'other'
  isAnonymous: boolean
  authorName?: string
  authorId: string
  createdAt: string
  prayedCount: number
  hasPrayed: boolean
  isUrgent: boolean
  tags: string[]
  updates?: PrayerUpdate[]
}

interface PrayerUpdate {
  id: string
  content: string
  createdAt: string
  type: 'update' | 'answer' | 'request'
}

interface CommunityPrayerRequestsProps {
  compact?: boolean
  maxVisible?: number
}

export const CommunityPrayerRequests: React.FC<CommunityPrayerRequestsProps> = ({
  compact = false,
  maxVisible = 10
}) => {
  const { user } = useSupabaseAuth()
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'urgent' | 'most-prayed'>('recent')
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'spiritual' as PrayerRequest['category'],
    isAnonymous: false,
    isUrgent: false,
    tags: [] as string[]
  })

  useEffect(() => {
    loadPrayerRequests()
  }, [selectedCategory, sortBy])

  const loadPrayerRequests = async () => {
    setIsLoading(true)
    try {
      // Generate mock data for demo
      const mockRequests = generateMockPrayerRequests()
      setPrayerRequests(mockRequests)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading prayer requests:', error)
      setIsLoading(false)
    }
  }

  const generateMockPrayerRequests = (): PrayerRequest[] => {
    const requests = [
      {
        id: '1',
        title: 'Healing for my grandmother',
        description: 'Please pray for my grandmother who is recovering from surgery. She\'s been struggling with complications.',
        category: 'health' as const,
        isAnonymous: false,
        authorName: 'Sarah M.',
        authorId: 'user1',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        prayedCount: 23,
        hasPrayed: false,
        isUrgent: true,
        tags: ['healing', 'surgery', 'family'],
        updates: [
          {
            id: 'u1',
            content: 'Thank you all for your prayers. The doctors say she\'s responding well to treatment!',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            type: 'update'
          }
        ]
      },
      {
        id: '2',
        title: 'Wisdom for a difficult decision',
        description: 'I\'m facing a major career change and need God\'s guidance. Please pray for clarity and peace.',
        category: 'work' as const,
        isAnonymous: true,
        authorId: 'user2',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        prayedCount: 15,
        hasPrayed: true,
        isUrgent: false,
        tags: ['guidance', 'career', 'decision'],
      },
      {
        id: '3',
        title: 'Strength for my marriage',
        description: 'My spouse and I are going through a rough patch. Please pray for healing, understanding, and renewed love.',
        category: 'family' as const,
        isAnonymous: true,
        authorId: 'user3',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        prayedCount: 31,
        hasPrayed: false,
        isUrgent: false,
        tags: ['marriage', 'healing', 'relationship'],
      },
      {
        id: '4',
        title: 'Growing closer to God',
        description: 'I feel distant from God lately. Please pray that I would seek Him wholeheartedly and find joy in His presence again.',
        category: 'spiritual' as const,
        isAnonymous: false,
        authorName: 'Michael K.',
        authorId: 'user4',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        prayedCount: 42,
        hasPrayed: true,
        isUrgent: false,
        tags: ['spiritual growth', 'relationship with God'],
      },
      {
        id: '5',
        title: 'Job interview tomorrow',
        description: 'I have an important job interview tomorrow that could change my family\'s financial situation. Please pray for favor and confidence.',
        category: 'work' as const,
        isAnonymous: false,
        authorName: 'Jennifer L.',
        authorId: 'user5',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        prayedCount: 18,
        hasPrayed: false,
        isUrgent: true,
        tags: ['job', 'interview', 'provision'],
      }
    ]

    // Filter by category
    let filtered = selectedCategory === 'all' 
      ? requests 
      : requests.filter(req => req.category === selectedCategory)

    // Sort
    switch (sortBy) {
      case 'urgent':
        filtered = filtered.sort((a, b) => {
          if (a.isUrgent && !b.isUrgent) return -1
          if (!a.isUrgent && b.isUrgent) return 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        break
      case 'most-prayed':
        filtered = filtered.sort((a, b) => b.prayedCount - a.prayedCount)
        break
      case 'recent':
      default:
        filtered = filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    }

    return filtered.slice(0, maxVisible)
  }

  const handlePray = async (requestId: string) => {
    try {
      // Update prayer count and mark as prayed
      setPrayerRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, prayedCount: req.prayedCount + 1, hasPrayed: true }
            : req
        )
      )

      // Show encouragement notification
      // Prayed for request
      
    } catch (error) {
      console.error('Error recording prayer:', error)
    }
  }

  const handleCreateRequest = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) return

    try {
      const request: PrayerRequest = {
        id: Date.now().toString(),
        ...newRequest,
        authorId: user?.id || 'anonymous',
        authorName: newRequest.isAnonymous ? undefined : user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        createdAt: new Date().toISOString(),
        prayedCount: 0,
        hasPrayed: false
      }

      setPrayerRequests(prev => [request, ...prev])
      setNewRequest({
        title: '',
        description: '',
        category: 'spiritual',
        isAnonymous: false,
        isUrgent: false,
        tags: []
      })
      setShowCreateForm(false)

    } catch (error) {
      console.error('Error creating prayer request:', error)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'health': return '🙏'
      case 'family': return '👨‍👩‍👧‍👦'
      case 'work': return '💼'
      case 'spiritual': return '✝️'
      case 'other': return '💛'
      default: return '🙏'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return 'from-red-400/20 to-pink-500/30'
      case 'family': return 'from-blue-400/20 to-cyan-500/30'
      case 'work': return 'from-green-400/20 to-emerald-500/30'
      case 'spiritual': return 'from-purple-400/20 to-indigo-500/30'
      case 'other': return 'from-amber-400/20 to-orange-500/30'
      default: return 'from-gray-400/20 to-slate-500/30'
    }
  }

  if (isLoading) {
    return (
      <ProFeatureGate feature="communityPrayerRequests">
        <div className="osmo-card animate-pulse">
          <div className="h-6 bg-[var(--glass-medium)] rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-[var(--glass-medium)] rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-[var(--glass-medium)] rounded"></div>
        </div>
      </ProFeatureGate>
    )
  }

  return (
    <ProFeatureGate feature="communityPrayerRequests">
      <div className={`osmo-card ${compact ? 'max-w-md' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🙏</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Prayer Requests</h3>
              <p className="text-slate-300 text-sm">Community support & encouragement</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
          >
            + Request Prayer
          </button>
        </div>

        {/* Controls */}
        {!compact && (
          <div className="flex flex-wrap gap-2 mb-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="health">Health</option>
              <option value="family">Family</option>
              <option value="work">Work</option>
              <option value="spiritual">Spiritual</option>
              <option value="other">Other</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="recent">Most Recent</option>
              <option value="urgent">Urgent First</option>
              <option value="most-prayed">Most Prayed For</option>
            </select>
          </div>
        )}

        {/* Prayer Requests List */}
        <div className="space-y-4 mb-6">
          {prayerRequests.map((request) => (
            <div
              key={request.id}
              className={`bg-gradient-to-br ${getCategoryColor(request.category)} backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryEmoji(request.category)}</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {request.title}
                      {request.isUrgent && (
                        <span className="ml-2 bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs border border-red-400/30">
                          Urgent
                        </span>
                      )}
                    </h4>
                    <p className="text-slate-300 text-xs">
                      by {request.isAnonymous ? 'Anonymous' : request.authorName} • {getTimeAgo(request.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{request.prayedCount}</div>
                  <div className="text-xs text-slate-400">prayers</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-200 text-sm leading-relaxed mb-3">
                {request.description}
              </p>

              {/* Tags */}
              {request.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {request.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-white/10 backdrop-blur-sm text-white/80 px-2 py-1 rounded-full text-xs border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Updates */}
              {request.updates && request.updates.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-400 mb-1">Latest Update:</p>
                  <p className="text-slate-200 text-sm">
                    {request.updates[request.updates.length - 1].content}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePray(request.id)}
                  disabled={request.hasPrayed}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    request.hasPrayed
                      ? 'bg-green-500/20 text-green-300 border border-green-400/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:border-white/30'
                  }`}
                >
                  <span>{request.hasPrayed ? '✓' : '🙏'}</span>
                  <span>{request.hasPrayed ? 'Prayed' : 'I Prayed'}</span>
                </button>

                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <button className="hover:text-white transition-colors">Share</button>
                  <span>•</span>
                  <button className="hover:text-white transition-colors">Follow</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Prayer Request Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-[var(--glass-dark)] flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-gray-600/30 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Share a Prayer Request</h3>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateRequest(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief summary of your prayer request"
                    className="w-full p-3 border border-gray-600 rounded-xl bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Please share more details about what you'd like prayer for..."
                    rows={4}
                    className="w-full p-3 border border-gray-600 rounded-xl resize-none bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newRequest.category}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full p-3 border border-gray-600 rounded-xl bg-slate-700 text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="spiritual">Spiritual</option>
                    <option value="health">Health</option>
                    <option value="family">Family</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRequest.isAnonymous}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-300">Post anonymously</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRequest.isUrgent}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, isUrgent: e.target.checked }))}
                      className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-300">Urgent</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 px-4 bg-slate-600 text-slate-200 rounded-xl font-semibold hover:bg-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newRequest.title.trim() || !newRequest.description.trim()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Share Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pro badge */}
        <div className="flex justify-center">
          <span className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-sm text-amber-200 px-3 py-1 rounded-full text-xs font-medium border border-amber-400/30">
            ⭐ Pro Feature
          </span>
        </div>
      </div>
    </ProFeatureGate>
  )
}
