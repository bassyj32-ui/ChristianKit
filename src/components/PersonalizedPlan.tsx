import React, { useState } from 'react'
import { UserPlan } from './UserQuestionnaire'

interface PersonalizedPlanProps {
  plan: UserPlan
  onComplete: () => void
  onCustomize: () => void
  onRetakeQuestionnaire?: () => void
}

export const PersonalizedPlan: React.FC<PersonalizedPlanProps> = ({
  plan,
  onComplete,
  onCustomize,
  onRetakeQuestionnaire
}) => {
  const [userPlan, setUserPlan] = useState<UserPlan>(plan)

  const handleCustomize = () => {
    onCustomize()
  }

  const handleRetakeQuestionnaire = () => {
    if (onRetakeQuestionnaire) {
      onRetakeQuestionnaire()
    }
  }

  const getExperienceEmoji = (level: string) => {
    switch (level) {
      case 'beginner': return '🌱'
      case 'intermediate': return '🌿'
      case 'advanced': return '🌳'
      default: return '🙏'
    }
  }

  const getGoalEmoji = (goal: string) => {
    switch (goal) {
      case 'closer-to-god': return '❤️'
      case 'inner-peace': return '🕊️'
      case 'spiritual-growth': return '🌱'
      case 'guidance': return '🧭'
      default: return '🎯'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Osmosis-inspired Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] pointer-events-none">
        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-yellow-500/5"></div>

        {/* Minimal Glow Effects */}
        <div className="absolute top-1/6 left-1/6 w-64 sm:w-96 h-64 sm:h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/6 right-1/6 w-56 sm:w-80 h-56 sm:h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Your Personalized Plan ✨
            </h1>
            <p className="text-lg sm:text-xl text-white/80">Based on your preferences, here's your spiritual journey plan</p>
          </div>

        {/* Plan Overview */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Experience Level */}
            <div className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl mb-3">{getExperienceEmoji(userPlan.experienceLevel)}</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Experience Level</h3>
              <p className="text-white/80 capitalize">{userPlan.experienceLevel}</p>
            </div>

            {/* Daily Goal */}
            <div className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl mb-3">{getGoalEmoji(userPlan.dailyGoal)}</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Daily Goal</h3>
              <p className="text-white/80 capitalize">{userPlan.dailyGoal.replace('_', ' ')}</p>
            </div>

            {/* Total Time */}
            <div className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl mb-3">⏰</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Daily Time</h3>
              <p className="text-white/80">{userPlan.prayerTime + userPlan.bibleTime} minutes</p>
            </div>
          </div>
        </div>

        {/* Main Habits */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Meditation Habit */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl mb-4">🧘‍♀️</div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Meditation</h3>
              <div className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text mb-3">{userPlan.prayerTime} min</div>
              <div className="text-sm sm:text-base text-white/80 mb-4">
                Style: {userPlan.prayerStyle?.replace('_', ' ') || 'Contemplative'}
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 h-3 rounded-full shadow-lg shadow-amber-500/25" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>

          {/* Bible Reading Habit */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bible Reading</h3>
              <div className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text mb-3">{userPlan.bibleTime} min</div>
              <div className="text-sm sm:text-base text-white/80 mb-4">
                Topics: {userPlan.bibleTopics.slice(0, 2).join(', ')}
                {userPlan.bibleTopics.length > 2 && '...'}
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 h-3 rounded-full shadow-lg shadow-amber-500/25" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <button
            onClick={handleCustomize}
            className="bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-105"
          >
            ⚙️ Customize Plan
          </button>

          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:from-amber-500 hover:to-yellow-500 transition-all duration-300 transform hover:scale-105 shadow-xl shadow-amber-500/25"
          >
            🚀 Start My Journey
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 border border-white/20">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">💡 Tips for Success</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm sm:text-base text-white/80">
            <div>• Start with shorter sessions and gradually increase</div>
            <div>• Find a quiet, comfortable space for your practice</div>
            <div>• Be consistent - even 5 minutes daily makes a difference</div>
            <div>• Don't worry about perfection, focus on showing up</div>
          </div>
        </div>

        {/* Retake Questionnaire Option */}
        {onRetakeQuestionnaire && (
          <div className="mt-6 text-center">
            <button
              onClick={handleRetakeQuestionnaire}
              className="text-white/60 hover:text-white/80 text-sm underline transition-colors duration-300 hover:no-underline"
            >
              ← Not quite right? Retake the questionnaire
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
