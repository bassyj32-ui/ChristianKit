import React, { useState, useEffect } from 'react'
import { useCommunityStore } from '../store/communityStore'
import { useAppStore } from '../store/appStore'
import { useSupabaseAuth } from './SupabaseAuthProvider'
// spiritualColors not available, using theme colors directly

export const SpiritualJourneyWidget: React.FC = () => {
  const { user } = useSupabaseAuth()
  const { userJourneyPosts, loadUserJourney } = useCommunityStore()
  const { communityShares, prayerSessions } = useAppStore()
  const [journeyStats, setJourneyStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    postsShared: 0,
    prayersOffered: 0,
    encouragementsReceived: 0,
    spiritualGrowthScore: 0
  })

  useEffect(() => {
    if (user) {
      loadUserJourney(user.id)
    }
  }, [user, loadUserJourney])

  useEffect(() => {
    // Calculate spiritual journey statistics
    const totalSessions = prayerSessions.length
    const totalMinutes = prayerSessions.reduce((sum, session) => sum + session.duration, 0)
    const postsShared = communityShares.length
    const prayersOffered = userJourneyPosts.filter(post => post.post_type === 'prayer_request').length
    const encouragementsReceived = userJourneyPosts.filter(post => post.post_type === 'encouragement').length

    // Calculate spiritual growth score based on engagement
    const baseScore = Math.min(totalSessions * 5, 50) // Max 50 from sessions
    const sharingScore = Math.min(postsShared * 10, 30) // Max 30 from sharing
    const prayerScore = Math.min(prayersOffered * 15, 20) // Max 20 from praying for others
    const spiritualGrowthScore = Math.round(baseScore + sharingScore + prayerScore)

    setJourneyStats({
      totalSessions,
      totalMinutes,
      postsShared,
      prayersOffered,
      encouragementsReceived,
      spiritualGrowthScore
    })
  }, [prayerSessions, communityShares, userJourneyPosts])

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return spiritualColors.amen.primary
    if (percentage >= 60) return spiritualColors.faith.primary
    if (percentage >= 40) return spiritualColors.prayer.primary
    return spiritualColors.community.primary
  }

  const getProgressPercentage = (score: number, maxScore: number) => {
    return Math.min((score / maxScore) * 100, 100)
  }

  if (!user) {
    return null
  }

  return (
    <div className="bg-black border border-gray-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span>🛤️</span>
          <span>Your Spiritual Journey</span>
        </h3>
        <div className="text-sm text-gray-400">
          Growth Score
        </div>
      </div>

      {/* Overall Growth Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Spiritual Growth</span>
          <span
            className="text-sm font-bold"
            style={{ color: getProgressColor(getProgressPercentage(journeyStats.spiritualGrowthScore, 100)) }}
          >
            {journeyStats.spiritualGrowthScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${getProgressPercentage(journeyStats.spiritualGrowthScore, 100)}%`,
              backgroundColor: getProgressColor(getProgressPercentage(journeyStats.spiritualGrowthScore, 100))
            }}
          ></div>
        </div>
      </div>

      {/* Journey Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <div className="text-lg sm:text-xl font-bold" style={{ color: spiritualColors.faith.primary }}>
            {journeyStats.totalSessions}
          </div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>

        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <div className="text-lg sm:text-xl font-bold" style={{ color: spiritualColors.prayer.primary }}>
            {Math.round(journeyStats.totalMinutes / 60)}h
          </div>
          <div className="text-xs text-gray-500">Time Invested</div>
        </div>

        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <div className="text-lg sm:text-xl font-bold" style={{ color: spiritualColors.community.primary }}>
            {journeyStats.postsShared}
          </div>
          <div className="text-xs text-gray-500">Shared</div>
        </div>

        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <div className="text-lg sm:text-xl font-bold" style={{ color: spiritualColors.prayer.primary }}>
            {journeyStats.prayersOffered}
          </div>
          <div className="text-xs text-gray-500">Prayers Offered</div>
        </div>

        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <div className="text-lg sm:text-xl font-bold" style={{ color: spiritualColors.love.primary }}>
            {journeyStats.encouragementsReceived}
          </div>
          <div className="text-xs text-gray-500">Encouraged</div>
        </div>

        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
          <div className="text-lg sm:text-xl font-bold" style={{ color: spiritualColors.amen.primary }}>
            {journeyStats.spiritualGrowthScore}
          </div>
          <div className="text-xs text-gray-500">Growth Score</div>
        </div>
      </div>

      {/* Journey Milestones */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-300 mb-2">Journey Milestones</div>

        {journeyStats.totalSessions >= 10 && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-lg">🏆</span>
            <span className="text-gray-300">Consistent Practitioner (10+ sessions)</span>
          </div>
        )}

        {journeyStats.postsShared >= 5 && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-lg">📢</span>
            <span className="text-gray-300">Community Builder (5+ shares)</span>
          </div>
        )}

        {journeyStats.prayersOffered >= 3 && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-lg">🙏</span>
            <span className="text-gray-300">Intercessor (3+ prayers offered)</span>
          </div>
        )}

        {journeyStats.spiritualGrowthScore >= 75 && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-lg">🌟</span>
            <span className="text-gray-300">Spiritual Leader (75+ growth score)</span>
          </div>
        )}

        {journeyStats.totalSessions === 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="text-lg">🌱</span>
            <span>Begin your spiritual journey by completing a session!</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-800">
        <button
          onClick={() => {/* Navigate to prayer timer */}}
          className="flex-1 text-sm px-3 py-2 rounded-lg transition-colors duration-200"
          style={{
            backgroundColor: spiritualColors.faith.light,
            color: spiritualColors.faith.primary,
            border: `1px solid ${spiritualColors.faith.secondary}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = spiritualColors.faith.secondary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = spiritualColors.faith.light
          }}
        >
          Start Session
        </button>

        <button
          onClick={() => {/* Share journey */}}
          className="flex-1 text-sm px-3 py-2 rounded-lg transition-colors duration-200"
          style={{
            backgroundColor: spiritualColors.community.light,
            color: spiritualColors.community.primary,
            border: `1px solid ${spiritualColors.community.secondary}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = spiritualColors.community.secondary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = spiritualColors.community.light
          }}
        >
          Share Journey
        </button>
      </div>
    </div>
  )
}


