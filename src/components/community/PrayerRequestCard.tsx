import React, { useState } from 'react'
import { PrayerRequest, useCommunityStore } from '../../store/communityStore'
import { useSupabaseAuth } from '../SupabaseAuthProvider'
// spiritualColors not available, using theme colors directly

interface PrayerRequestCardProps {
  prayerRequest: PrayerRequest
  onUserClick: (userId: string) => void
}

export const PrayerRequestCard: React.FC<PrayerRequestCardProps> = ({
  prayerRequest,
  onUserClick
}) => {
  const { user } = useSupabaseAuth()
  const { addPrayerToRequest, markPrayerAnswered } = useCommunityStore()
  const [isPraying, setIsPraying] = useState(false)
  const [isMarkingAnswered, setIsMarkingAnswered] = useState(false)

  const handlePray = async () => {
    setIsPraying(true)
    await addPrayerToRequest(prayerRequest.id)
    setIsPraying(false)
  }

  const handleMarkAnswered = async () => {
    setIsMarkingAnswered(true)
    await markPrayerAnswered(prayerRequest.id)
    setIsMarkingAnswered(false)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'healing': return spiritualColors.love.primary
      case 'guidance': return spiritualColors.prayer.primary
      case 'strength': return spiritualColors.amen.primary
      case 'family': return spiritualColors.community.primary
      default: return spiritualColors.faith.primary
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return spiritualColors.love.primary
      case 'high': return spiritualColors.warning.primary
      case 'medium': return spiritualColors.info.primary
      case 'low': return spiritualColors.amen.primary
      default: return spiritualColors.faith.primary
    }
  }

  return (
    <div className="bg-black border border-gray-800 rounded-lg p-4 hover:bg-gray-900/30 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onUserClick(prayerRequest.author_id)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
            style={{ backgroundColor: spiritualColors.faith.primary, color: 'black' }}
          >
            {prayerRequest.author_profile_image ? (
              <img
                src={prayerRequest.author_profile_image}
                alt={prayerRequest.author_name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span>{prayerRequest.author_name[0]}</span>
            )}
          </button>
          <div>
            <button
              onClick={() => onUserClick(prayerRequest.author_id)}
              className="font-bold text-white text-sm hover:underline"
            >
              {prayerRequest.author_name}
            </button>
            <div className="text-xs text-gray-500">
              {new Date(prayerRequest.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: getCategoryColor(prayerRequest.category) + '20',
              color: getCategoryColor(prayerRequest.category)
            }}
          >
            {prayerRequest.category}
          </span>
          <span
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: getUrgencyColor(prayerRequest.urgency) + '20',
              color: getUrgencyColor(prayerRequest.urgency)
            }}
          >
            {prayerRequest.urgency}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-2">{prayerRequest.title}</h3>
        <p className="text-gray-300 leading-relaxed">{prayerRequest.description}</p>
      </div>

      {/* Status */}
      {prayerRequest.is_answered && (
        <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-green-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-sm font-medium">Prayer answered!</span>
            {prayerRequest.answered_at && (
              <span className="text-xs text-gray-500">
                {new Date(prayerRequest.answered_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePray}
            disabled={isPraying}
            className="flex items-center space-x-2 text-sm transition-colors duration-200"
            style={{ color: spiritualColors.prayer.secondary }}
            onMouseEnter={(e) => e.currentTarget.style.color = spiritualColors.prayer.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = spiritualColors.prayer.secondary}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>{isPraying ? 'Praying...' : `Pray (${prayerRequest.prayers_count})`}</span>
          </button>

          {user?.id === prayerRequest.author_id && (
            <button
              onClick={handleMarkAnswered}
              disabled={isMarkingAnswered || prayerRequest.is_answered}
              className="flex items-center space-x-2 text-sm transition-colors duration-200"
              style={{
                color: prayerRequest.is_answered ? spiritualColors.amen.secondary : spiritualColors.amen.primary
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>{isMarkingAnswered ? 'Marking...' : prayerRequest.is_answered ? 'Answered' : 'Mark Answered'}</span>
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {prayerRequest.is_public ? 'Public' : 'Private'}
        </div>
      </div>
    </div>
  )
}


