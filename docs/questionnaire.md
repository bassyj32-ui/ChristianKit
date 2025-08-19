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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Welcome to Your Spiritual Journey! 🙏</h2>
            <p className="text-lg sm:text-xl text-amber-200 mb-6 sm:mb-8 px-4">Let's create a personalized plan just for you</p>
            
            <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-2xl p-4 sm:p-8 border-2 border-amber-500/50 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-4 sm:mb-6">What's your experience level?</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { value: 'beginner', label: '🌱 Beginner', desc: 'Just starting my spiritual journey' },
                  { value: 'intermediate', label: '🌿 Growing', desc: 'I have some experience with spiritual practices' },
                  { value: 'advanced', label: '🌳 Experienced', desc: 'I have a strong spiritual foundation' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('experience', option.value)}
                    className={`w-full p-4 sm:p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                      answers.experience === option.value
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-300 shadow-lg'
                        : 'bg-slate-800/80 text-white border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{option.label}</div>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Daily Time Commitment ⏰</h2>
            
            <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-2xl p-4 sm:p-8 border-2 border-amber-500/50 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-4 sm:mb-6">How much time can you dedicate daily?</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { value: '5min', label: '5 minutes', desc: 'Perfect for busy schedules' },
                  { value: '10min', label: '10 minutes', desc: 'Good balance of time and depth' },
                  { value: '30min', label: '30 minutes', desc: 'Dedicated spiritual practice time' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('dailyTime', option.value)}
                    className={`w-full p-4 sm:p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                      answers.dailyTime === option.value
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-300 shadow-lg'
                        : 'bg-slate-800/80 text-white border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{option.label}</div>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Prayer Focus Areas 🙏</h2>
            
            <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-2xl p-4 sm:p-8 border-2 border-amber-500/50 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-4 sm:mb-6">What areas do you want to focus on in prayer?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    className={`p-3 sm:p-4 rounded-xl transition-all duration-300 border-2 ${
                      answers.prayerFocus.includes(focus)
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-300 shadow-lg'
                        : 'bg-slate-800/80 text-white border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50'
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Bible Study Topics 📖</h2>
            
            <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-2xl p-4 sm:p-8 border-2 border-amber-500/50 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-4 sm:mb-6">Which Bible topics interest you most?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    className={`p-3 sm:p-4 rounded-xl transition-all duration-300 border-2 ${
                      answers.bibleTopics.includes(topic)
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-300 shadow-lg'
                        : 'bg-slate-800/80 text-white border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50'
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Prayer Style 🧘‍♀️</h2>
            
            <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-2xl p-4 sm:p-8 border-2 border-amber-500/50 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-4 sm:mb-6">What prayer style resonates with you?</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { value: 'mindfulness', label: 'Mindfulness', desc: 'Present moment awareness and breathing' },
                  { value: 'loving-kindness', label: 'Loving-Kindness', desc: 'Cultivating compassion and love' },
                  { value: 'body-scan', label: 'Body Scan', desc: 'Progressive body awareness and relaxation' },
                  { value: 'transcendental', label: 'Transcendental', desc: 'Deep meditation and inner peace' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('prayerStyle', option.value)}
                    className={`w-full p-4 sm:p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                      answers.prayerStyle === option.value
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-300 shadow-lg'
                        : 'bg-slate-800/80 text-white border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{option.label}</div>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Daily Spiritual Goal 🎯</h2>
            
            <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-2xl p-4 sm:p-8 border-2 border-amber-500/50 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-4 sm:mb-6">What's your main spiritual goal?</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { value: 'closer-to-god', label: 'Closer to God', desc: 'Deepen my relationship with God' },
                  { value: 'inner-peace', label: 'Inner Peace', desc: 'Find peace and calm in daily life' },
                  { value: 'spiritual-growth', label: 'Spiritual Growth', desc: 'Grow in faith and understanding' },
                  { value: 'guidance', label: 'Divine Guidance', desc: 'Seek direction for life decisions' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('dailyGoal', option.value)}
                    className={`w-full p-4 sm:p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                      answers.dailyGoal === option.value
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-300 shadow-lg'
                        : 'bg-slate-800/80 text-white border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{option.label}</div>
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
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      {/* Celestial Background - Same as Prayer Timer */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-yellow-800/50 to-amber-900 pointer-events-none">
        {/* Milky Way Arc */}
        <div className="absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-12"></div>
        <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -rotate-6"></div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent transform rotate-3"></div>
      </div>

      {/* Twinkling Stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/6 left-1/4 w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 left-1/6 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-purple-300 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-2/5 right-1/5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-200 rounded-full animate-pulse" style={{animationDuration: '2s', animationDelay: '1.5s'}}></div>
        <div className="absolute top-3/5 right-1/4 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-purple-200 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-2/3 left-1/5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '2.5s'}}></div>
        <div className="absolute top-3/4 right-1/6 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '1s'}}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-amber-200">Step {currentStep} of 6</span>
              <span className="text-sm font-medium text-amber-200">{Math.round((currentStep / 6) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 sm:mt-8 max-w-2xl mx-auto px-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 sm:px-8 py-2 sm:py-3 rounded-2xl font-bold transition-all duration-300 ${
                currentStep === 1
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-800/80 text-white hover:bg-slate-700/80 transform hover:scale-105 border border-amber-500/30'
              }`}
            >
              ← Previous
            </button>

            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`px-4 sm:px-8 py-2 sm:py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl ${
                  canProceed()
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className={`px-4 sm:px-8 py-2 sm:py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl ${
                  canProceed()
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                Create My Plan ✨
              </button>
            )}
          </div>

          {/* Back to Timer Option */}
          {onBack && (
            <div className="text-center mt-4 sm:mt-6">
              <button
                onClick={onBack}
                className="text-amber-300 hover:text-amber-200 text-sm underline transition-colors duration-300"
              >
                ← Back to Timer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
