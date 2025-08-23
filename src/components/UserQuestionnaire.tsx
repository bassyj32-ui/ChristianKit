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
  notificationPreferences: {
    pushEnabled: boolean
    emailEnabled: boolean
    preferredTime: string
    urgencyLevel: 'gentle' | 'moderate' | 'aggressive' | 'ruthless'
    frequency: 'hourly' | 'daily' | 'constant'
  }
}

export const UserQuestionnaire: React.FC<QuestionnaireProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState({
    experience: '',
    dailyTime: '',
    prayerFocus: [] as string[],
    bibleTopics: [] as string[],
    prayerStyle: '',
    dailyGoal: '',
    pushEnabled: true,
    emailEnabled: true,
    preferredTime: '9:00 AM',
    urgencyLevel: 'moderate' as 'gentle' | 'moderate' | 'aggressive' | 'ruthless',
    frequency: 'daily' as 'hourly' | 'daily' | 'constant'
  })

  const handleAnswer = (question: string, answer: string | string[] | boolean) => {
    setAnswers(prev => ({ ...prev, [question]: answer }))
  }

  const nextStep = () => {
    if (currentStep < 7) {
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
      experienceLevel,
      notificationPreferences: {
        pushEnabled: answers.pushEnabled,
        emailEnabled: answers.emailEnabled,
        preferredTime: answers.preferredTime,
        urgencyLevel: answers.urgencyLevel,
        frequency: answers.frequency
      }
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
      case 7: return true // Notification preferences are optional
      default: return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Welcome to Your Spiritual Journey! 🙏
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-8 sm:mb-10 px-4">Let's create a personalized plan just for you</p>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">What's your experience level?</h3>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { value: 'beginner', label: '🌱 Beginner', desc: 'Just starting my spiritual journey' },
                  { value: 'intermediate', label: '🌿 Growing', desc: 'I have some experience with spiritual practices' },
                  { value: 'advanced', label: '🌳 Experienced', desc: 'I have a strong spiritual foundation' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('experience', option.value)}
                    className={`w-full p-6 sm:p-8 rounded-2xl text-left transition-all duration-300 border ${
                      answers.experience === option.value
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{option.label}</div>
                    <div className="text-sm opacity-90">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Daily Time Commitment ⏰
            </h2>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">How much time can you dedicate daily?</h3>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { value: '5min', label: '5 minutes', desc: 'Perfect for busy schedules' },
                  { value: '10min', label: '10 minutes', desc: 'Good balance of time and depth' },
                  { value: '30min', label: '30 minutes', desc: 'Dedicated spiritual practice time' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('dailyTime', option.value)}
                    className={`w-full p-6 sm:p-8 rounded-2xl text-left transition-all duration-300 border ${
                      answers.dailyTime === option.value
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{option.label}</div>
                    <div className="text-sm opacity-90">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Prayer Focus Areas 🙏
            </h2>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">What areas do you want to focus on in prayer?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                    className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 border ${
                      answers.prayerFocus.includes(focus)
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Bible Study Topics 📖
            </h2>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Which Bible topics interest you most?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                    className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 border ${
                      answers.bibleTopics.includes(topic)
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Prayer Style 🙏
            </h2>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">What prayer style resonates with you?</h3>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { value: 'contemplative', label: 'Contemplative', desc: 'Quiet reflection and listening to God' },
                  { value: 'intercessory', label: 'Intercessory', desc: 'Praying for others and their needs' },
                  { value: 'worship', label: 'Worship', desc: 'Praising and adoring God' },
                  { value: 'confession', label: 'Confession', desc: 'Seeking forgiveness and repentance' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('prayerStyle', option.value)}
                    className={`w-full p-6 sm:p-8 rounded-2xl text-left transition-all duration-300 border ${
                      answers.prayerStyle === option.value
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{option.label}</div>
                    <div className="text-sm opacity-90">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Daily Spiritual Goal 🎯
            </h2>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">What's your main spiritual goal?</h3>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { value: 'closer-to-god', label: 'Closer to God', desc: 'Deepen my relationship with God' },
                  { value: 'inner-peace', label: 'Inner Peace', desc: 'Find peace and calm in daily life' },
                  { value: 'spiritual-growth', label: 'Spiritual Growth', desc: 'Grow in faith and understanding' },
                  { value: 'guidance', label: 'Divine Guidance', desc: 'Seek direction for life decisions' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('dailyGoal', option.value)}
                    className={`w-full p-6 sm:p-8 rounded-2xl text-left transition-all duration-300 border ${
                      answers.dailyGoal === option.value
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{option.label}</div>
                    <div className="text-sm opacity-90">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Notification Preferences 🔔
            </h2>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">How would you like to stay connected?</h3>
              
              <div className="space-y-6">
                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                  <div className="text-left">
                    <div className="text-lg font-semibold text-white">Push Notifications</div>
                    <div className="text-sm text-white/70">Get prayer reminders on your device</div>
                  </div>
                  <button
                    onClick={() => handleAnswer('pushEnabled', !answers.pushEnabled)}
                    className={`w-14 h-7 rounded-full transition-colors duration-300 ${
                      answers.pushEnabled 
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
                        : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${
                      answers.pushEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                  <div className="text-left">
                    <div className="text-lg font-semibold text-white">Email Reminders</div>
                    <div className="text-sm text-white/70">Receive spiritual guidance via email</div>
                  </div>
                  <button
                    onClick={() => handleAnswer('emailEnabled', !answers.emailEnabled)}
                    className={`w-14 h-7 rounded-full transition-colors duration-300 ${
                      answers.emailEnabled 
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
                        : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${
                      answers.emailEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Preferred Time */}
                <div className="space-y-3">
                  <label className="block text-left text-lg font-semibold text-white">Preferred Reminder Time</label>
                  <select
                    value={answers.preferredTime}
                    onChange={(e) => handleAnswer('preferredTime', e.target.value)}
                    className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-lg border border-white/20 focus:outline-none focus:border-amber-400"
                  >
                    <option value="6:00 AM">6:00 AM - Early Bird</option>
                    <option value="9:00 AM">9:00 AM - Morning Start</option>
                    <option value="12:00 PM">12:00 PM - Midday Break</option>
                    <option value="6:00 PM">6:00 PM - Evening Wind-down</option>
                    <option value="9:00 PM">9:00 PM - Night Reflection</option>
                  </select>
                </div>

                {/* Urgency Level */}
                <div className="space-y-3">
                  <label className="block text-left text-lg font-semibold text-white">Reminder Intensity</label>
                  <select
                    value={answers.urgencyLevel}
                    onChange={(e) => handleAnswer('urgencyLevel', e.target.value as any)}
                    className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-lg border border-white/20 focus:outline-none focus:border-amber-400"
                  >
                    <option value="gentle">Gentle - Soft reminders</option>
                    <option value="moderate">Moderate - Balanced approach</option>
                    <option value="aggressive">Aggressive - Keep me motivated</option>
                    <option value="ruthless">Ruthless - Maximum accountability</option>
                  </select>
                </div>

                {/* Frequency */}
                <div className="space-y-3">
                  <label className="block text-left text-lg font-semibold text-white">Reminder Frequency</label>
                  <select
                    value={answers.frequency}
                    onChange={(e) => handleAnswer('frequency', e.target.value as any)}
                    className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-lg border border-white/20 focus:outline-none focus:border-amber-400"
                  >
                    <option value="daily">Daily - Once per day</option>
                    <option value="hourly">Hourly - Regular check-ins</option>
                    <option value="constant">Constant - Maximum support</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Osmosis-inspired Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] pointer-events-none">
        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-yellow-500/5"></div>
        
        {/* Minimal Glow Effects */}
        <div className="absolute top-1/6 left-1/6 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/6 right-1/6 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-8 sm:mb-10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-white/70">Step {currentStep} of 7</span>
              <span className="text-sm font-medium text-white/70">{Math.round((currentStep / 7) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all duration-500 shadow-lg shadow-amber-500/25"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 sm:mt-10 max-w-2xl mx-auto px-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold transition-all duration-300 ${
                currentStep === 1
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/10 transform hover:scale-105'
              }`}
            >
              ← Previous
            </button>

            {currentStep < 7 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl ${
                  canProceed()
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-500 shadow-lg shadow-amber-500/25'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                }`}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className={`px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl ${
                  canProceed()
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-500 shadow-lg shadow-amber-500/25'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                }`}
              >
                Create My Plan ✨
              </button>
            )}
          </div>

          {/* Back to Timer Option */}
          {onBack && (
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={onBack}
                className="text-white/70 hover:text-white text-sm underline transition-colors duration-300 hover:no-underline"
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
