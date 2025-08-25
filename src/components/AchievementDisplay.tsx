import React, { useState, useEffect } from 'react'
import { UserAchievement } from '../services/ProgressService'

interface AchievementDisplayProps {
  achievements: UserAchievement[]
  onClose?: () => void
  showNewAchievement?: UserAchievement | null
}

export const AchievementDisplay: React.FC<AchievementDisplayProps> = ({ 
  achievements, 
  onClose,
  showNewAchievement 
}) => {
  const [showPopup, setShowPopup] = useState(false)
  const [newAchievement, setNewAchievement] = useState<UserAchievement | null>(null)

  useEffect(() => {
    if (showNewAchievement) {
      setNewAchievement(showNewAchievement)
      setShowPopup(true)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowPopup(false)
        setNewAchievement(null)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [showNewAchievement])

  if (achievements.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Achievements Yet</h3>
        <p className="text-[var(--text-secondary)]">Complete your spiritual sessions to unlock achievements!</p>
      </div>
    )
  }

  return (
    <>
      {/* Achievement Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="bg-[var(--glass-light)]/10 backdrop-blur-xl rounded-2xl p-4 border border-[var(--glass-border)]/20 hover:border-[var(--glass-border)]/40 transition-all duration-300 hover:scale-105 group cursor-pointer"
            onClick={() => {
              setNewAchievement(achievement)
              setShowPopup(true)
            }}
          >
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {achievement.icon}
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                {achievement.achievement_name}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                {achievement.description}
              </p>
              <div className="text-xs text-[var(--accent-primary)] mt-2">
                {new Date(achievement.unlocked_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Popup */}
      {showPopup && newAchievement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--glass-light)]/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-[var(--glass-border)] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Achievement Icon */}
              <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: '2s' }}>
                {newAchievement.icon}
              </div>
              
              {/* Achievement Details */}
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                {newAchievement.achievement_name}
              </h2>
              
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                {newAchievement.description}
              </p>
              
              {/* Unlock Date */}
              <div className="text-sm text-[var(--accent-primary)] mb-6">
                Unlocked on {new Date(newAchievement.unlocked_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowPopup(false)
                  setNewAchievement(null)
                  onClose?.()
                }}
                className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-inverse)] px-6 py-3 rounded-xl font-semibold hover:from-[var(--accent-primary)]/80 hover:to-[var(--accent-secondary)]/80 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Awesome! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Achievement Notification Component
export const AchievementNotification: React.FC<{ achievement: UserAchievement | null }> = ({ achievement }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (achievement) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement])

  if (!show || !achievement) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white p-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-xl max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="text-3xl animate-bounce" style={{ animationDuration: '1s' }}>
            {achievement.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm mb-1">Achievement Unlocked!</h4>
            <p className="text-xs opacity-90">{achievement.achievement_name}</p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
