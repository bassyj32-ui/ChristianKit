import React, { useState } from 'react'
import { CommunityPost, useCommunityStore } from '../../store/communityStore'

interface PostCardProps {
  post: CommunityPost
  onUserClick: (userId: string) => void
  onReplyClick: (postId: string) => void
  showReplies?: boolean
  isReply?: boolean
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onUserClick, 
  onReplyClick,
  showReplies = false,
  isReply = false 
}) => {
  const { addInteraction, followedUsers, toggleFollow } = useCommunityStore()
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const formatTimestamp = (timestamp: string): string => {
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

  const highlightMentions = (text: string): JSX.Element => {
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
  }

  const handleFollow = async () => {
    setIsFollowLoading(true)
    await toggleFollow(post.author_id)
    setIsFollowLoading(false)
  }

  const isFollowing = followedUsers.includes(post.author_id)

  return (
    <div className={`bg-black border-b border-gray-800 p-3 sm:p-4 md:p-6 hover:bg-gray-900/30 transition-colors duration-200 touch-manipulation ${isReply ? 'pl-6 sm:pl-8 md:pl-12' : ''}`}>
      {/* Post Header */}
      <div className="flex items-start space-x-3 mb-3">
        <button
          onClick={() => onUserClick(post.author_id)}
          className={`${isReply ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-full flex items-center justify-center text-sm font-medium hover:opacity-80 active:scale-95 transition-all duration-200 flex-shrink-0 overflow-hidden bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg border-2 border-black touch-manipulation`}
        >
          {post.author_profile_image ? (
            <img 
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUserClick(post.author_id)}
                className="font-bold text-white text-sm sm:text-base hover:underline transition-colors duration-200 flex items-center gap-1"
              >
                {post.author_name}
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </button>
              <span className="text-gray-500 text-sm sm:text-base">•</span>
              <span className="text-gray-500 text-sm sm:text-base">{formatTimestamp(post.created_at)}</span>
            </div>
            
            {/* Follow Button - Mobile Optimized */}
            {!isReply && (
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 disabled:opacity-50 touch-manipulation active:scale-95 ${
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
      
      {/* Post Content */}
      <div className={`${isReply ? 'text-sm' : 'text-sm sm:text-base'} mb-4 sm:mb-5 leading-relaxed text-white`}>
        <p className="whitespace-pre-wrap">{highlightMentions(post.content)}</p>
      </div>
      
      {/* Post Actions - Mobile Optimized */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
        <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-8">
          <button
            onClick={() => onReplyClick(post.id)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 active:text-blue-500 transition-colors duration-200 touch-manipulation p-1 rounded"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            <span className="text-sm font-medium">{post.prayers_count || 0}</span>
          </button>
          
          <button
            onClick={() => addInteraction(post.id, 'amen')}
            className="flex items-center space-x-2 text-gray-500 hover:text-yellow-500 active:text-yellow-600 transition-colors duration-200 touch-manipulation p-1 rounded"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-sm font-medium">{post.amens_count || 0}</span>
          </button>
          
          <button
            onClick={() => addInteraction(post.id, 'love')}
            className="flex items-center space-x-2 text-gray-500 hover:text-pink-500 active:text-pink-600 transition-colors duration-200 touch-manipulation p-1 rounded"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-sm font-medium">{post.loves_count || 0}</span>
          </button>

          <button className="hidden sm:flex items-center space-x-2 text-gray-500 hover:text-blue-500 active:text-blue-600 transition-colors duration-200 touch-manipulation p-1 rounded">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Replies */}
      {showReplies && post.replies && post.replies.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="space-y-3">
            {post.replies.map((reply) => (
              <PostCard
                key={reply.id}
                post={reply}
                onUserClick={onUserClick}
                onReplyClick={onReplyClick}
                isReply={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
