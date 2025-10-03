import React, { useState, useCallback, useMemo, memo } from 'react'
import { CommunityPost, useCommunityStore } from '../../store/communityStore'
import { useSupabaseAuth } from '../SupabaseAuthProvider'
import { ShareModal } from '../ShareModal'

// Optimized lazy image component
const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = memo(({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
})

interface PostCardProps {
  post: CommunityPost
  onUserClick: (userId: string) => void
  onReplyClick?: (postId: string) => void
  onNavigateToProfile: (userId: string) => void
  showReplies?: boolean
  isReply?: boolean
}

export const PostCard: React.FC<PostCardProps> = memo(({
  post,
  onUserClick,
  onReplyClick,
  onNavigateToProfile,
  showReplies = false,
  isReply = false
}) => {
  const { addInteraction, followedUsers, toggleFollow, addReply } = useCommunityStore()
  const { user } = useSupabaseAuth()
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Memoized functions to prevent re-creation on every render
  const formatTimestamp = useCallback((timestamp: string): string => {
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
  }, [])

  const highlightMentions = useCallback((text: string): JSX.Element => {
    const parts = text.split(/(@\w+)/g)
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.substring(1)
            return (
              <span
                key={index}
                onClick={() => onUserClick(username)}
                className="text-blue-500 font-medium hover:text-blue-400 cursor-pointer transition-colors duration-200"
              >
                {part}
              </span>
            )
          }
          return part
        })}
      </>
    )
  }, [onUserClick])

  // Memoized values
  const isFollowing = useMemo(() => followedUsers.includes(post.author_id), [followedUsers, post.author_id])

  // Event handlers with memoization
  const handleFollow = useCallback(async () => {
    setIsFollowLoading(true)
    await toggleFollow(post.author_id)
    setIsFollowLoading(false)
  }, [toggleFollow, post.author_id])

  const handleUserClick = useCallback(() => {
    // Navigate to user profile page
    window.location.href = `/profile/${post.author_id}`
  }, [post.author_id])

  const handleReplyClick = useCallback(() => {
    setShowReplyBox(!showReplyBox)
  }, [showReplyBox])

  const handleSharePost = useCallback(() => {
    setShowShareModal(true)
  }, [])

  const handleReply = useCallback(async () => {
    if (!replyContent.trim() || isSubmittingReply || !user) return

    setIsSubmittingReply(true)
    const success = await addReply(post.id, replyContent)

    if (success) {
      setReplyContent('')
      setShowReplyBox(false)
    }

    setIsSubmittingReply(false)
  }, [replyContent, isSubmittingReply, user, addReply, post.id])

  // Optimized sub-components
  const PostHeader = memo(() => (
    <div className="flex items-start space-x-3 mb-3 w-full">
      <button
        onClick={handleUserClick}
        className={`${isReply ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-full flex items-center justify-center text-sm font-medium hover:opacity-80 active:scale-95 transition-all duration-200 flex-shrink-0 overflow-hidden bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg border-2 border-black touch-manipulation`}
      >
        {post.author_profile_image ? (
          <LazyImage
            src={post.author_profile_image}
            alt={post.author_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-black text-base sm:text-lg md:text-xl font-bold">
            ✝️
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 min-w-0">
            <button
              onClick={handleUserClick}
              className="font-bold text-white text-sm sm:text-base hover:underline transition-colors duration-200 flex items-center gap-1 truncate"
            >
              <span className="truncate">{post.author_name}</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
            </button>
            <span className="text-gray-500 text-sm sm:text-base flex-shrink-0">•</span>
            <span className="text-gray-500 text-sm sm:text-base">{formatTimestamp(post.created_at)}</span>
          </div>

          {!isReply && (
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 disabled:opacity-50 touch-manipulation active:scale-95 whitespace-nowrap ${
                isFollowing
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-yellow-500 text-black hover:bg-yellow-400'
              }`}
            >
              {isFollowLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
            </button>
          )}
        </div>
      </div>
    </div>
  ))

  const PostActions = memo(() => (
    <div className="flex items-center justify-between pt-3 border-t border-gray-800/50 w-full">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={handleReplyClick}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-400 active:text-blue-500 transition-colors duration-200 touch-manipulation p-1 rounded"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          <span className="text-xs sm:text-sm font-medium">{post.replies ? post.replies.length : 0}</span>
        </button>

        <button
          onClick={() => addInteraction(post.id, 'amen')}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-yellow-500 active:text-yellow-600 transition-colors duration-200 touch-manipulation p-1 rounded"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className="text-xs sm:text-sm font-medium">{post.amens_count || 0}</span>
        </button>

        <button
          onClick={() => addInteraction(post.id, 'love')}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-pink-500 active:text-pink-600 transition-colors duration-200 touch-manipulation p-1 rounded"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span className="text-xs sm:text-sm font-medium">{post.loves_count || 0}</span>
        </button>

        <button
          onClick={() => addInteraction(post.id, 'prayer')}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-purple-500 active:text-purple-600 transition-colors duration-200 touch-manipulation p-1 rounded"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span className="text-xs sm:text-sm font-medium">{post.prayers_count || 0}</span>
        </button>

        <button
          onClick={handleSharePost}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-500 active:text-blue-600 transition-colors duration-200 touch-manipulation p-1 rounded"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
        </button>
      </div>
    </div>
  ))

  const ReplyBox = memo(() => (
    showReplyBox && user && (
      <div className="mt-4 pt-3 border-t border-gray-800/50 w-full">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your prayer or encouragement..."
              className="w-full p-3 bg-gray-900 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm leading-relaxed border border-gray-700 rounded-lg touch-manipulation"
              rows={2}
              maxLength={280}
            />

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {replyContent.length}/280
              </span>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowReplyBox(false)}
                  className="px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors duration-200 touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmittingReply}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-1.5 rounded-full font-bold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {isSubmittingReply ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  ))

  const RepliesList = memo(() => (
    showReplies && post.replies && post.replies.length > 0 && (
      <div className="mt-4 pt-3 border-t border-gray-800/50 w-full">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-400">
            {post.replies.length} {post.replies.length === 1 ? 'Reply' : 'Replies'}
          </h4>
        </div>
        <div className="space-y-3">
          {post.replies.map((reply) => (
            <div key={reply.id} className="relative">
              {/* Threading line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700/30"></div>
              <PostCard
                post={reply}
                onUserClick={onUserClick}
                onReplyClick={onReplyClick}
                onNavigateToProfile={onNavigateToProfile}
                isReply={true}
              />
            </div>
          ))}
        </div>
      </div>
    )
  ))

  return (
    <div className={`bg-black border-b border-gray-800 p-3 sm:p-4 hover:bg-gray-900/30 transition-colors duration-200 touch-manipulation w-full ${isReply ? 'pl-6 sm:pl-8' : ''}`}>
      <PostHeader />

      {/* Post Content */}
      <div className={`${isReply ? 'text-sm' : 'text-sm sm:text-base'} mb-4 sm:mb-5 leading-relaxed text-white break-words`}>
        <p className="whitespace-pre-wrap">{highlightMentions(post.content)}</p>
      </div>

      <PostActions />
      <ReplyBox />
      <RepliesList />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postContent={post.content}
        postAuthor={post.author_name}
        postId={post.id}
      />
    </div>
  )
})
