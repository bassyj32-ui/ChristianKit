import React, { useState, useEffect } from 'react'
import { OsmoCard, OsmoGradientText, OsmoSectionHeader, OsmoButton } from '../theme/osmoComponents'
import { useCommunityStore } from '../store/communityStore'
import { PostCard } from './community/PostCard'
import { PostCreation } from './community/PostCreation'
import { FeedControls } from './community/FeedControls'
import { DailyBibleVerseSidebar } from './DailyBibleVerseSidebar'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { CommunityPost } from '../store/communityStore'
import { useAppStore, useCommunityShares, usePrayerSessions } from '../store/appStore'
import { colorUtils } from '../theme/colors'

const CommunityPage = () => {
  const { user } = useSupabaseAuth()
  const { setActiveTab } = useAppStore()
  const communityShares = useCommunityShares()
  const prayerSessions = usePrayerSessions()
  const { isOnline, offlineQueue } = useCommunityStore()
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
  }

  // Handle user click
  const handleUserClick = (userId: string) => {
    handleNavigateToProfile(userId)
  }

  // Handle load more posts
  const handleLoadMore = async () => {
    if (!isLoadingMore && hasMorePosts) {
      await loadMorePosts()
    }
  }

  // Filter posts based on current filter settings
  const filteredPosts = posts

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Daily Bible Verse Sidebar - Desktop Only */}
      <DailyBibleVerseSidebar />

      {/* Header */}
      <div className="border-b border-gray-800 bg-black">
        <div className="w-full px-3 sm:px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Community</h1>
            <FeedControls />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl mx-auto">
        {/* Post Creation */}
        <PostCreation />

        {/* Loading State */}
        {isLoading && posts.length === 0 && (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-yellow-500"></div>
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

        {/* Load More Button */}
        {hasMorePosts && !isLoading && filteredPosts.length > 0 && (
          <div className="p-3 sm:p-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-200 disabled:opacity-50 touch-manipulation active:scale-95 shadow-lg w-full sm:w-auto"
            >
              {isLoadingMore ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-black"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Load More Posts'
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <OsmoCard className="p-4 sm:p-6 mb-4 sm:mb-6 border-red-500/20">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <OsmoGradientText className="text-lg sm:text-xl font-bold mb-2">
                Connection Issue
              </OsmoGradientText>
              <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">{error}</p>
              <OsmoButton
                onClick={() => {
                  useCommunityStore.getState().reset()
                  loadPosts(true)
                }}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base touch-manipulation"
              >
                Try Again
              </OsmoButton>
            </div>
          </OsmoCard>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && !error && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              {user ? 'No Posts Yet' : 'Welcome to Community'}
            </h3>
            <p className="text-gray-500 text-sm mb-3">
              {user ? 'Be the first to share something!' : 'Sign in to start sharing your faith journey'}
            </p>
            {!user && (
              <OsmoButton className="px-4 py-2 text-sm">
                Sign In
              </OsmoButton>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityPage
export { CommunityPage }