import React, { useState } from 'react'
import { UserPlan } from './UserQuestionnaire'

interface PersonalizedPlanProps {
  plan: UserPlan
  onComplete: () => void
  onCustomize: () => void
}

export const PersonalizedPlan: React.FC<PersonalizedPlanProps> = ({ 
  plan, 
  onComplete, 
  onCustomize 
}) => {
  const [userPlan, setUserPlan] = useState<UserPlan>(plan)

  const handleCustomize = () => {
    onCustomize()
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Your Personalized Plan ✨</h1>
          <p className="text-xl text-gray-600">Based on your preferences, here's your spiritual journey plan</p>
        </div>

        {/* Plan Overview */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Experience Level */}
            <div className="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl border border-green-200">
              <div className="text-4xl mb-3">{getExperienceEmoji(userPlan.experienceLevel)}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Experience Level</h3>
              <p className="text-gray-600 capitalize">{userPlan.experienceLevel}</p>
            </div>

            {/* Daily Goal */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl border border-blue-200">
              <div className="text-4xl mb-3">{getGoalEmoji(userPlan.dailyGoal)}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Daily Goal</h3>
              <p className="text-gray-600 capitalize">{userPlan.dailyGoal.replace('_', ' ')}</p>
            </div>

            {/* Total Time */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border border-purple-200">
              <div className="text-4xl mb-3">⏰</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Daily Time</h3>
              <p className="text-gray-600">{userPlan.prayerTime + userPlan.bibleTime} minutes</p>
            </div>
          </div>
        </div>

        {/* Main Habits */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Meditation Habit */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl mb-4">🧘‍♀️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Meditation</h3>
              <div className="text-3xl font-bold text-green-600 mb-3">{userPlan.prayerTime} min</div>
              <div className="text-sm text-gray-600 mb-4">
                Style: {userPlan.prayerStyle?.replace('_', ' ') || 'Contemplative'}
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>

          {/* Bible Reading Habit */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Bible Reading</h3>
              <div className="text-3xl font-bold text-green-600 mb-3">{userPlan.bibleTime} min</div>
              <div className="text-sm text-gray-600 mb-4">
                Topics: {userPlan.bibleTopics.slice(0, 2).join(', ')}
                {userPlan.bibleTopics.length > 2 && '...'}
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <button
            onClick={handleCustomize}
            className="bg-white/80 backdrop-blur-sm border-2 border-green-300 text-green-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-green-50 transition-all duration-300"
          >
            ⚙️ Customize Plan
          </button>
          
          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            🚀 Start My Journey
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl p-6 border border-green-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">💡 Tips for Success</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>• Start with shorter sessions and gradually increase</div>
            <div>• Find a quiet, comfortable space for your practice</div>
            <div>• Be consistent - even 5 minutes daily makes a difference</div>
            <div>• Don't worry about perfection, focus on showing up</div>
          </div>
        </div>
      </div>
    </div>
  )
}
