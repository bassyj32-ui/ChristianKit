import React, { useState } from 'react'
import { CommunityPost, useCommunityStore } from '../../store/communityStore'

interface ReplyModalProps {
  post: CommunityPost | null
  onClose: () => void
}

export const ReplyModal: React.FC<ReplyModalProps> = ({ post, onClose }) => {
  const { addReply } = useCommunityStore()
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!post) return null

  const handleSubmit = async () => {
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    const success = await addReply(post.id, replyContent)
    
    if (success) {
      setReplyContent('')
      onClose()
    }
    
    setIsSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Reply to {post.author_name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Original Post */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
              {post.author_profile_image ? (
                <img 
                  src={post.author_profile_image} 
                  alt={post.author_name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                '✝️'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-bold text-white text-sm">{post.author_name}</span>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-500 text-sm">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-white text-sm leading-relaxed">{post.content}</p>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
              👤
            </div>
            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your prayer or encouragement..."
                className="w-full p-3 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm leading-relaxed border border-gray-800 rounded-lg"
                rows={3}
                maxLength={280}
              />
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">
                  {replyContent.length}/280
                </span>
                
                <button
                  onClick={handleSubmit}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-1.5 rounded-full font-bold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

