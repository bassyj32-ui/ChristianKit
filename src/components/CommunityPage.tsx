import React, { useState, useEffect } from 'react'
import { OsmoCard, OsmoGradientText, OsmoSectionHeader, OsmoButton } from '../theme/osmoComponents'
import { useCommunityStore } from '../store/communityStore'
import { PostCard } from './community/PostCard'
import { PostCreation } from './community/PostCreation'
import { FeedControls } from './community/FeedControls'
import { BibleVersesSidebar } from './BibleVersesSidebar'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { CommunityPost } from '../store/communityStore'
import { useAppStore } from '../store/appStore'

const CommunityPage = () => {
  const { user } = useSupabaseAuth()
  const { setActiveTab } = useAppStore()
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

  // Initialize community data
  useEffect(() => {
    loadPosts(true)
    
    return () => {
      reset()
    }
  }, [loadPosts, reset])

  // Handle user profile navigation
  const handleNavigateToProfile = (userId: string) => {
    // Navigate to the profile page
    setActiveTab('profile')
    // You might want to store the selected user ID in app store for profile page to use
  }

  // Handle user click (for mentions, etc.)
  const handleUserClick = (userId: string) => {
    handleNavigateToProfile(userId)
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="p-4">
            <div className="text-center">
              <OsmoGradientText className="text-2xl font-bold">
                Community
              </OsmoGradientText>
            </div>
          </div>
          <div className="max-w-2xl mx-auto">
            <FeedControls />
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex gap-8 justify-center">
          {/* Main Feed */}
          <div className="w-full max-w-2xl">
        {/* Post Creation */}
        <PostCreation />

        {/* Error Display - Osmo Style */}
        {error && (
          <OsmoCard className="p-6 mb-6 border-red-500/20 m-3 sm:m-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <OsmoGradientText className="text-xl font-bold mb-2">
                Connection Issue
              </OsmoGradientText>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
              <OsmoButton 
                onClick={() => {
                  useCommunityStore.getState().reset()
                  loadPosts(true)
                }}
                className="px-6 py-2"
              >
                Try Again
              </OsmoButton>
            </div>
          </OsmoCard>
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
              onNavigateToProfile={handleNavigateToProfile}
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
                
          </div>

          {/* Right Sidebar - Desktop Only */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <BibleVersesSidebar />
          </div>
        </div>

        {/* Community Stats - Mobile Only */}
        <div className="lg:hidden p-4 border-t border-gray-800 bg-gray-900/20">
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

    </div>
  )
}

export default CommunityPage
export { CommunityPage }
