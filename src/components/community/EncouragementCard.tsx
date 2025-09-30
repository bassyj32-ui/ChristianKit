import React, { useState } from 'react'
import { SpiritualEncouragement, useCommunityStore } from '../../store/communityStore'
import { useSupabaseAuth } from '../SupabaseAuthProvider'
// spiritualColors not available, using theme colors directly

interface EncouragementCardProps {
  encouragement: SpiritualEncouragement
  onUserClick: (userId: string) => void
}

export const EncouragementCard: React.FC<EncouragementCardProps> = ({
  encouragement,
  onUserClick
}) => {
  const { user } = useSupabaseAuth()
  const { likeEncouragement } = useCommunityStore()
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    setIsLiking(true)
    await likeEncouragement(encouragement.id)
    setIsLiking(false)
  }

  const getEncouragementTypeColor = (type: string) => {
    switch (type) {
      case 'scripture': return spiritualColors.faith.primary
      case 'prayer': return spiritualColors.prayer.primary
      case 'word': return spiritualColors.amen.primary
      case 'prophecy': return spiritualColors.love.primary
      default: return spiritualColors.community.primary
    }
  }

  const getEncouragementIcon = (type: string) => {
    switch (type) {
      case 'scripture': return '📖'
      case 'prayer': return '🙏'
      case 'word': return '💬'
      case 'prophecy': return '🔮'
      default: return '💝'
    }
  }

  return (
    <div className="bg-black border border-gray-800 rounded-lg p-4 hover:bg-gray-900/30 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onUserClick(encouragement.author_id)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
            style={{ backgroundColor: spiritualColors.faith.primary, color: 'black' }}
          >
            {encouragement.author_profile_image && !encouragement.is_anonymous ? (
              <img
                src={encouragement.author_profile_image}
                alt={encouragement.author_name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span>{encouragement.is_anonymous ? '✨' : encouragement.author_name[0]}</span>
            )}
          </button>
          <div>
            <button
              onClick={() => onUserClick(encouragement.author_id)}
              className="font-bold text-white text-sm hover:underline"
            >
              {encouragement.is_anonymous ? 'Anonymous Encourager' : encouragement.author_name}
            </button>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{getEncouragementIcon(encouragement.encouragement_type)}</span>
              <span>{encouragement.encouragement_type}</span>
              <span>•</span>
              <span>{new Date(encouragement.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: getEncouragementTypeColor(encouragement.encouragement_type) + '20',
              color: getEncouragementTypeColor(encouragement.encouragement_type)
            }}
          >
            {encouragement.encouragement_type}
          </span>
          {encouragement.target_user_id && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-800 text-gray-300">
              Personal
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-2">{encouragement.title}</h3>
        <p className="text-gray-300 leading-relaxed mb-3">{encouragement.content}</p>

        {encouragement.scripture_reference && (
          <div className="p-2 bg-gray-900/50 rounded-lg border-l-4" style={{ borderLeftColor: spiritualColors.faith.primary }}>
            <div className="text-sm font-medium text-gray-200">
              📖 {encouragement.scripture_reference}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center space-x-2 text-sm transition-colors duration-200"
          style={{ color: spiritualColors.love.secondary }}
          onMouseEnter={(e) => e.currentTarget.style.color = spiritualColors.love.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = spiritualColors.love.secondary}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>{isLiking ? 'Liking...' : `Like (${encouragement.likes_count})`}</span>
        </button>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {encouragement.is_anonymous && (
            <span className="flex items-center space-x-1">
              <span>✨</span>
              <span>Anonymous</span>
            </span>
          )}
          {encouragement.linked_session_id && (
            <span className="flex items-center space-x-1">
              <span>🔗</span>
              <span>Linked</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}


