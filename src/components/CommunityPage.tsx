import React, { useState, useEffect } from 'react'
import { OsmoCard, OsmoGradientText, OsmoSectionHeader } from '../theme/osmoComponents'
import { useCommunityStore } from '../store/communityStore'
import { PostCard } from './community/PostCard'
import { PostCreation } from './community/PostCreation'
import { FeedControls } from './community/FeedControls'
import { ReplyModal } from './community/ReplyModal'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { CommunityPost } from '../store/communityStore'

const CommunityPage = () => {
  const { user } = useSupabaseAuth()
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMorePosts,
    error,
    loadPosts,
    loadMorePosts,
    reset
  } = useCommunityStore()

  const [selectedPostForReply, setSelectedPostForReply] = useState<CommunityPost | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Initialize community data
  useEffect(() => {
    loadPosts(true)
    
    return () => {
      reset()
    }
  }, [loadPosts, reset])

  // Handle user click
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setShowUserModal(true)
  }

  // Handle reply click
  const handleReplyClick = (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (post) {
      setSelectedPostForReply(post)
    }
  }

  // Handle load more posts
  const handleLoadMore = async () => {
    if (!isLoadingMore && hasMorePosts) {
      await loadMorePosts()
    }
  }

  // Posts are now filtered in the store, so we just use them directly
  const filteredPosts = posts

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-2xl mx-auto">
          <div className="p-4">
            <div className="text-center">
              <OsmoGradientText className="text-2xl font-bold">
                Community
              </OsmoGradientText>
            </div>
          </div>
          <FeedControls />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {/* Post Creation */}
        <PostCreation />

        {/* Error Display - Mobile Optimized */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 m-3 sm:m-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-red-400 text-sm leading-relaxed">{error}</p>
                <button 
                  onClick={() => {
                    useCommunityStore.getState().reset()
                    loadPosts(true)
                  }}
                  className="mt-2 text-red-300 hover:text-red-200 text-xs underline touch-manipulation"
                >
                  Try Again
                    </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && posts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="divide-y divide-gray-800">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUserClick={handleUserClick}
              onReplyClick={handleReplyClick}
              showReplies={true}
            />
          ))}
        </div>

        {/* Load More Button - Mobile Optimized */}
        {hasMorePosts && !isLoading && filteredPosts.length > 0 && (
          <div className="p-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black px-6 py-3 rounded-full font-bold transition-all duration-200 disabled:opacity-50 touch-manipulation active:scale-95 shadow-lg"
            >
              {isLoadingMore ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Loading...</span>
            </div>
          ) : (
                'Load More Posts'
                    )}
                  </button>
                  </div>
                )}

        {/* Empty State */}
        {!isLoading && filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✝️</div>
            <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-6">Be the first to share something with the community!</p>
            {!user && (
              <div className="text-center">
                <p className="text-gray-500 mb-4">Sign in to start sharing your faith journey</p>
                              </div>
                            )}
                  </div>
                )}
                
        {/* Community Stats */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-500">{posts.length}</div>
              <div className="text-xs text-gray-500">Posts</div>
                        </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {posts.reduce((sum, post) => sum + post.prayers_count, 0)}
                          </div>
              <div className="text-xs text-gray-500">Prayers</div>
                        </div>
            <div>
              <div className="text-2xl font-bold text-pink-500">
                {posts.reduce((sum, post) => sum + post.loves_count, 0)}
                      </div>
              <div className="text-xs text-gray-500">Loves</div>
                    </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {posts.reduce((sum, post) => sum + post.amens_count, 0)}
              </div>
              <div className="text-xs text-gray-500">Amens</div>
        </div>
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedPostForReply && (
        <ReplyModal
          post={selectedPostForReply}
          onClose={() => setSelectedPostForReply(null)}
        />
      )}

      {/* User Profile Modal (placeholder) */}
      {showUserModal && selectedUserId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <OsmoCard className="w-full max-w-md">
            <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">User Profile</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-white transition-colors duration-200"
              >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
              </button>
            </div>
            
            <div className="text-center">
                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">
                👤
              </div>
                <h4 className="text-xl font-bold text-white mb-2">User Profile</h4>
                <p className="text-gray-400 text-sm mb-4">Profile details will be loaded from Supabase</p>
              
              <div className="flex space-x-3">
                  <button className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-2 px-4 rounded-lg font-bold transition-colors duration-200">
                    Follow
                </button>
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold transition-colors duration-200">
                    Message
                </button>
                </div>
              </div>
            </div>
          </OsmoCard>
        </div>
      )}
    </div>
  )
}

export default CommunityPage
export { CommunityPage }
