import React, { useState } from 'react'
import { useCommunityStore } from '../../store/communityStore'
import { useSupabaseAuth } from '../SupabaseAuthProvider'
import { AuthButton } from '../AuthButton'

export const PostCreation: React.FC = () => {
  const { user } = useSupabaseAuth()
  const { createPost, isCreatingPost, error } = useCommunityStore()
  const [content, setContent] = useState('')

  const handleSubmit = async () => {
    if (!content.trim() || isCreatingPost) return
    
    const success = await createPost(content)
    if (success) {
      setContent('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (content.trim() && !isCreatingPost) {
        handleSubmit()
      }
    }
  }

  if (!user) {
    return (
      <div className="bg-black border-b border-gray-800 p-4 text-center">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg mx-auto mb-3">
          ✝️
        </div>
        <h3 className="text-base font-bold mb-1 text-white">Sign In to Share Your Faith</h3>
        <p className="text-gray-500 text-sm mb-4">Join the community to share your prayers and encouragement</p>
        <AuthButton />
      </div>
    )
  }

  return (
    <div className="bg-black border-b border-gray-800 p-3">
      <div className="flex items-start space-x-3">
        {/* User Avatar */}
        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-medium flex-shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span>{user?.user_metadata?.display_name?.[0] || user.email?.[0] || '👤'}</span>
          )}
        </div>
        
        {/* Post Form */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your heart today?"
            className="w-full p-3 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-lg min-h-[50px] leading-relaxed"
            rows={2}
            maxLength={500}
          />
          
          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm mb-2">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-3">
              {/* Christian-themed icons */}
              <button className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
              <button className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </button>
              <button className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
              
              {/* Character Count */}
              <span className="text-xs text-gray-500 ml-2">
                {content.length}/500
              </span>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isCreatingPost}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-1.5 rounded-full font-bold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingPost ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

