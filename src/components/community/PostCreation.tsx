import React, { useState } from 'react'
import { useCommunityStore } from '../../store/communityStore'
import { useSupabaseAuth } from '../SupabaseAuthProvider'
import { AuthButton } from '../AuthButton'
import { PostMediaUpload } from '../MediaUpload'
import { mediaService } from '../../services/mediaService'

export const PostCreation: React.FC = () => {
  const { user } = useSupabaseAuth()
  const { createPost, isCreatingPost, error, isOnline } = useCommunityStore()
  const [content, setContent] = useState('')
  const [postMedia, setPostMedia] = useState('')
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)

  const handleSubmit = async () => {
    if ((!content.trim() && !postMedia) || isCreatingPost) return

    const success = await createPost(content, postMedia ? {
      media_url: postMedia,
      media_type: 'image' // You can detect this based on file type
    } : undefined)

    if (success) {
      setContent('')
      setPostMedia('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if ((content.trim() || postMedia) && !isCreatingPost) {
        handleSubmit()
      }
    }
  }

  const handleMediaUpload = (result: any) => {
    if (result.success && result.data) {
      setPostMedia(result.data.publicUrl)
    }
  }

  const handleRemoveMedia = () => {
    setPostMedia('')
  }

  return (
    <div className="bg-black border-b border-gray-800 p-3 sm:p-4">
      <div className="flex items-start space-x-3">
        {/* User Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-medium flex-shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span>{user?.user_metadata?.display_name?.[0] || user?.email?.[0] || '👤'}</span>
          )}
        </div>

        {/* Post Form */}
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your heart today?"
            className="w-full p-3 bg-gray-900/50 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-base sm:text-lg min-h-[50px] leading-relaxed border border-gray-700 rounded-lg touch-manipulation"
            rows={2}
            maxLength={500}
          />

          {/* Media Upload */}
          <div className="mt-3">
            <PostMediaUpload onUpload={handleMediaUpload} />
          </div>

          {/* Uploaded Media Preview */}
          {postMedia && (
            <div className="mt-3 relative">
              <img
                src={postMedia}
                alt="Post media"
                className="w-full max-h-64 object-cover rounded-lg border border-gray-700"
              />
              <button
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-xs"
                title="Remove media"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm mb-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{content.length}/500</span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Sign in prompt */}
              {!user && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <span>Sign in to post</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={(!content.trim() && !postMedia) || isCreatingPost || !user}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black px-4 sm:px-6 py-2 rounded-full font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95 shadow-lg"
              >
                {isCreatingPost ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {/* Offline indicator */}
          {!isOnline && (
            <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
              <span>📱</span>
              <span>Post will be saved locally and shared when online</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}