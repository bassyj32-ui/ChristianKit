import React, { useState } from 'react'

interface QuestionnaireProps {
  onComplete: (userPlan: UserPlan) => void
  onBack?: () => void
}

export interface UserPlan {
  prayerTime: number
  bibleTime: number
  prayerStyle: string
  prayerFocus: string[]
  bibleTopics: string[]
  dailyGoal: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

export const UserQuestionnaire: React.FC<QuestionnaireProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState({
    experience: '',
    dailyTime: '',
    prayerFocus: [] as string[],
    bibleTopics: [] as string[],
    prayerStyle: '',
    dailyGoal: ''
  })

  const handleAnswer = (question: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [question]: answer }))
  }

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generatePlan = (): UserPlan => {
    const experienceLevel = answers.experience as 'beginner' | 'intermediate' | 'advanced'
    
    // Generate personalized plan based on answers
    const plan: UserPlan = {
      prayerTime: experienceLevel === 'beginner' ? 10 : experienceLevel === 'intermediate' ? 20 : 30,
      bibleTime: experienceLevel === 'beginner' ? 20 : experienceLevel === 'intermediate' ? 30 : 45,
      prayerStyle: answers.prayerStyle as string,
      prayerFocus: answers.prayerFocus as string[],
      bibleTopics: answers.bibleTopics as string[],
      dailyGoal: answers.dailyGoal as string,
      experienceLevel
    }
    
    return plan
  }

  const handleComplete = () => {
    const userPlan = generatePlan()
    onComplete(userPlan)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return answers.experience !== ''
      case 2: return answers.dailyTime !== ''
      case 3: return answers.prayerFocus.length > 0
      case 4: return answers.bibleTopics.length > 0
      case 5: return answers.prayerStyle !== ''
      case 6: return answers.dailyGoal !== ''
      default: return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Your Spiritual Journey! 🙏</h2>
            <p className="text-xl text-gray-600 mb-8">Let's create a personalized plan just for you</p>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">What's your experience level?</h3>
              <div className="space-y-4">
                {[
                  { value: 'beginner', label: '🌱 Beginner', desc: 'Just starting my spiritual journey' },
                  { value: 'intermediate', label: '🌿 Growing', desc: 'I have some experience with spiritual practices' },
                  { value: 'advanced', label: '🌳 Experienced', desc: 'I have a strong spiritual foundation' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('experience', option.value)}
                    className={`w-full p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                      answers.experience === option.value
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg'
                        : 'bg-white/80 text-gray-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-2xl font-bold mb-2">{option.label}</div>
                    <div className="text-sm opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Daily Time Commitment ⏰</h2>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">How much time can you dedicate daily?</h3>
              <div className="space-y-4">
                {[
                  { value: '5min', label: '5 minutes', desc: 'Perfect for busy schedules' },
                  { value: '10min', label: '10 minutes', desc: 'Good balance of time and depth' },
                  { value: '30min', label: '30 minutes', desc: 'Dedicated spiritual practice time' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('dailyTime', option.value)}
                    className={`w-full p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                      answers.dailyTime === option.value
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg'
                        : 'bg-white/80 text-gray-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-2xl font-bold mb-2">{option.label}</div>
                    <div className="text-sm opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Prayer Focus Areas 🙏</h2>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">What areas do you want to focus on in prayer?</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Gratitude', 'Healing', 'Guidance', 'Forgiveness', 
                  'Strength', 'Peace', 'Family', 'Community'
                ].map((focus) => (
                  <button
                    key={focus}
                    onClick={() => {
                      const current = answers.prayerFocus
                      if (current.includes(focus)) {
                        handleAnswer('prayerFocus', current.filter(f => f !== focus))
                      } else {
                        handleAnswer('prayerFocus', [...current, focus])
                      }
                    }}
                    className={`p-4 rounded-xl transition-all duration-300 border-2 ${
                      answers.prayerFocus.includes(focus)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg'
                        : 'bg-white/80 text-gray-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Bible Study Topics 📖</h2>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Which Bible topics interest you most?</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Psalms', 'Gospels', 'Proverbs', 'Epistles', 
                  'Old Testament', 'New Testament', 'Wisdom Books', 'Historical Books'
                ].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      const current = answers.bibleTopics
                      if (current.includes(topic)) {
                        handleAnswer('bibleTopics', current.filter(t => t !== topic))
                      } else {
                        handleAnswer('bibleTopics', [...current, topic])
                      }
                    }}
                    className={`p-4 rounded-xl transition-all duration-300 border-2 ${
                      answers.bibleTopics.includes(topic)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg'
                        : 'bg-white/80 text-gray-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Meditation Style 🧘‍♀️</h2>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">What meditation style resonates with you?</h3>
              <div className="space-y-4">
                {[
                  { value: 'mindfulness', label: 'Mindfulness', desc: 'Present moment awareness and breathing' },
                  { value: 'loving-kindness', label: 'Loving-Kindness', desc: 'Cultivating compassion and love' },
                  { value: 'body-scan', label: 'Body Scan', desc: 'Progressive body awareness and relaxation' },
                  { value: 'transcendental', label: 'Transcendental', desc: 'Deep meditation and inner peace' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('prayerStyle', option.value)}
                    className={`w-full p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                      answers.prayerStyle === option.value
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg'
                        : 'bg-white/80 text-gray-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-2xl font-bold mb-2">{option.label}</div>
                    <div className="text-sm opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Daily Spiritual Goal 🎯</h2>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">What's your main spiritual goal?</h3>
              <div className="space-y-4">
                {[
                  { value: 'closer-to-god', label: 'Closer to God', desc: 'Deepen my relationship with God' },
                  { value: 'inner-peace', label: 'Inner Peace', desc: 'Find peace and calm in daily life' },
                  { value: 'spiritual-growth', label: 'Spiritual Growth', desc: 'Grow in faith and understanding' },
                  { value: 'guidance', label: 'Divine Guidance', desc: 'Seek direction for life decisions' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('dailyGoal', option.value)}
                    className={`w-full p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                      answers.dailyGoal === option.value
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg'
                        : 'bg-white/80 text-gray-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-2xl font-bold mb-2">{option.label}</div>
                    <div className="text-sm opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of 6</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((currentStep / 6) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${
              currentStep === 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-500 text-white hover:bg-gray-600 transform hover:scale-105'
            }`}
          >
            ← Previous
          </button>

          {currentStep < 6 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl ${
                canProceed()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl ${
                canProceed()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create My Plan ✨
            </button>
          )}
        </div>

        {/* Back to Timer Option */}
        {onBack && (
          <div className="text-center mt-6">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              ← Back to Timer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
