import React, { useState } from 'react'

interface QuestionnaireProps {
  onComplete: (userPlan: UserPlan) => void
  onBack?: () => void
}

export interface UserPlan {
  // Core user profile
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  dailyTimeCommitment: string
  prayerFocus: string[]
  bibleTopics: string[]
  
  // Personalized recommendations
  prayerTime: number
  bibleTime: number
  prayerStyle: string
  dailyGoal: string
  
  // Custom plan sections
  customPlan: {
    prayer: {
      title: string
      description: string
      duration: number
      focus: string[]
      style: string
      tips: string[]
    }
    reading: {
      title: string
      description: string
      duration: number
      topics: string[]
      approach: string
      tips: string[]
    }
    reflection: {
      title: string
      description: string
      duration: number
      method: string
      prompts: string[]
      tips: string[]
    }
  }
  
  // Progress tracking
  progress: {
    prayerStreak: number
    readingStreak: number
    reflectionStreak: number
    totalSessions: number
    lastActivity: string
  }
  
  // Notification preferences
  notificationPreferences: {
    pushEnabled: boolean
    emailEnabled: boolean
    preferredTime: string
    customTime?: string
    urgencyLevel: 'gentle' | 'motivating' | 'aggressive'
    frequency: 'daily' | 'twice' | 'hourly'
  }
  
  // Raw questionnaire responses (for future reference)
  questionnaireResponses: {
    experience: string
    dailyTime: string
    prayerFocus: string[]
    bibleTopics: string[]
    prayerStyle: string
    dailyGoal: string
    pushEnabled: boolean
    emailEnabled: boolean
    preferredTime: string
    customTime: string
    urgencyLevel: string
    frequency: string
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
    customTime: '',
    urgencyLevel: 'motivating' as 'gentle' | 'motivating' | 'aggressive',
    frequency: 'twice' as 'daily' | 'twice' | 'hourly',
    intensityOpen: false,
    frequencyOpen: false
  })
  const [showValidationError, setShowValidationError] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  const handleAnswer = (question: string, answer: string | string[] | boolean) => {
    setAnswers(prev => ({ ...prev, [question]: answer }))
    // Clear validation error when user makes a selection
    if (showValidationError) {
      setShowValidationError(false)
      setValidationMessage('')
    }
  }

  const getValidationMessage = (step: number): string => {
    switch (step) {
      case 1: return 'Please select your experience level to continue.'
      case 2: return 'Please choose how much time you can dedicate daily.'
      case 3: return 'Please select at least one prayer focus area.'
      case 4: return 'Please select at least one Bible topic.'
      case 5: return 'Please choose your preferred prayer style.'
      case 6: return 'Please select your daily spiritual goal.'
      case 7: return 'Please complete all required selections.'
      default: return 'Please make a selection to continue.'
    }
  }

  const nextStep = () => {
    if (!canProceed()) {
      setShowValidationError(true)
      setValidationMessage(getValidationMessage(currentStep))
      return
    }

    if (currentStep < 7) {
      setCurrentStep(currentStep + 1)
      setShowValidationError(false)
      setValidationMessage('')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setShowValidationError(false)
      setValidationMessage('')
    }
  }

  const generatePlan = (): UserPlan => {
    const experienceLevel = answers.experience as 'beginner' | 'intermediate' | 'advanced'
    
    // Generate personalized plan based on answers
    const plan: UserPlan = {
      // Core user profile
      experienceLevel,
      dailyTimeCommitment: answers.dailyTime,
      prayerFocus: answers.prayerFocus as string[],
      bibleTopics: answers.bibleTopics as string[],
      
      // Personalized recommendations
      prayerTime: experienceLevel === 'beginner' ? 10 : experienceLevel === 'intermediate' ? 20 : 30,
      bibleTime: experienceLevel === 'beginner' ? 20 : experienceLevel === 'intermediate' ? 30 : 45,
      prayerStyle: answers.prayerStyle,
      dailyGoal: answers.dailyGoal,

      // Custom plan sections
      customPlan: {
        prayer: {
          title: `${experienceLevel === 'beginner' ? 'Gentle' : experienceLevel === 'intermediate' ? 'Focused' : 'Deep'} Prayer Practice`,
          description: `A ${experienceLevel} prayer routine tailored to your spiritual journey`,
          duration: experienceLevel === 'beginner' ? 10 : experienceLevel === 'intermediate' ? 20 : 30,
          focus: answers.prayerFocus as string[],
          style: answers.prayerStyle,
          tips: [
            'Find a quiet space where you feel comfortable',
            'Start with gratitude for the day',
            'Focus on one prayer area at a time',
            'Don\'t rush - quality over quantity'
          ]
        },
        reading: {
          title: `${experienceLevel === 'beginner' ? 'Introduction to' : experienceLevel === 'intermediate' ? 'Exploring' : 'Deep Dive into'} Scripture`,
          description: `Bible study approach perfect for your ${experienceLevel} level`,
          duration: experienceLevel === 'beginner' ? 20 : experienceLevel === 'intermediate' ? 30 : 45,
          topics: answers.bibleTopics as string[],
          approach: experienceLevel === 'beginner' ? 'verse-by-verse' : experienceLevel === 'intermediate' ? 'chapter-study' : 'thematic-study',
          tips: [
            'Read slowly and reflect on each verse',
            'Ask questions about what you read',
            'Connect scripture to your daily life',
            'Keep a journal of insights'
          ]
        },
        reflection: {
          title: `${experienceLevel === 'beginner' ? 'Simple' : experienceLevel === 'intermediate' ? 'Guided' : 'Advanced'} Spiritual Reflection`,
          description: `Daily reflection practice to deepen your spiritual awareness`,
          duration: experienceLevel === 'beginner' ? 5 : experienceLevel === 'intermediate' ? 10 : 15,
          method: experienceLevel === 'beginner' ? 'gratitude-journal' : experienceLevel === 'intermediate' ? 'guided-reflection' : 'contemplative-prayer',
          prompts: [
            'What am I grateful for today?',
            'How did I see God working in my life?',
            'What challenged me spiritually today?',
            'How can I grow closer to God tomorrow?'
          ],
          tips: [
            'Be honest with yourself',
            'Write freely without judgment',
            'Look for patterns over time',
            'Celebrate small spiritual victories'
          ]
        }
      },
      
      // Progress tracking
      progress: {
        prayerStreak: 0,
        readingStreak: 0,
        reflectionStreak: 0,
        totalSessions: 0,
        lastActivity: new Date().toISOString()
      },
      
      // Notification preferences
      notificationPreferences: {
        pushEnabled: answers.pushEnabled,
        emailEnabled: answers.emailEnabled,
        preferredTime: answers.preferredTime === 'custom' ? answers.customTime : answers.preferredTime,
        customTime: answers.preferredTime === 'custom' ? answers.customTime : undefined,
        urgencyLevel: answers.urgencyLevel,
        frequency: answers.frequency
      },
      
      // Raw questionnaire responses
      questionnaireResponses: {
        experience: answers.experience,
        dailyTime: answers.dailyTime,
        prayerFocus: answers.prayerFocus as string[],
        bibleTopics: answers.bibleTopics as string[],
        prayerStyle: answers.prayerStyle,
        dailyGoal: answers.dailyGoal,
        pushEnabled: answers.pushEnabled,
        emailEnabled: answers.emailEnabled,
        preferredTime: answers.preferredTime,
        customTime: answers.customTime,
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
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Welcome to Your Spiritual Journey! 🙏
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-6 sm:mb-8">Let's create a personalized plan just for you</p>
            <div className="text-xs text-amber-300 mb-4">* Required selection</div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">What's your experience level?</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { value: 'beginner', label: '🌱 Beginner', desc: 'Just starting my spiritual journey' },
                  { value: 'intermediate', label: '🌿 Growing', desc: 'I have some experience with spiritual practices' },
                  { value: 'advanced', label: '🌳 Experienced', desc: 'I have a strong spiritual foundation' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('experience', option.value)}
                    className={`w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl text-left transition-all duration-300 border ${
                      answers.experience === option.value
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    <div className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{option.label}</div>
                    <div className="text-xs sm:text-sm opacity-90">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Daily Time Commitment ⏰
            </h2>
            <div className="text-xs text-amber-300 mb-4">* Required selection</div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">How much time can you dedicate daily?</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { value: '5min', label: '5 minutes', desc: 'Perfect for busy schedules' },
                  { value: '10min', label: '10 minutes', desc: 'Good balance of time and depth' },
                  { value: '30min', label: '30 minutes', desc: 'Dedicated spiritual practice time' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('dailyTime', option.value)}
                    className={`w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl text-left transition-all duration-300 border ${
                      answers.dailyTime === option.value
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    <div className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{option.label}</div>
                    <div className="text-xs sm:text-sm opacity-90">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Prayer Focus Areas 🙏
            </h2>
            <div className="text-xs text-amber-300 mb-4">* Select at least one</div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">What areas do you want to focus on in prayer?</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 border text-sm sm:text-base ${
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
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Bible Study Topics 📖
            </h2>
            <div className="text-xs text-amber-300 mb-4">* Select at least one</div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Which Bible topics interest you most?</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 border text-sm sm:text-base ${
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
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Prayer Style 🧘‍♀️
            </h2>
            <div className="text-xs text-amber-300 mb-4">* Required selection</div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">What prayer style resonates with you?</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { value: 'mindfulness', label: 'Mindfulness', desc: 'Present moment awareness and breathing', emoji: '🧘‍♀️' },
                  { value: 'loving-kindness', label: 'Loving-Kindness', desc: 'Cultivating compassion and love', emoji: '💝' },
                  { value: 'body-scan', label: 'Body Scan', desc: 'Progressive body awareness and relaxation', emoji: '🌊' },
                  { value: 'transcendental', label: 'Transcendental', desc: 'Deep meditation and inner peace', emoji: '✨' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('prayerStyle', option.value)}
                    className={`w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl text-left transition-all duration-300 border ${
                      answers.prayerStyle === option.value
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div className="flex-1">
                        <div className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{option.label}</div>
                        <div className="text-xs sm:text-sm opacity-90">{option.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Daily Spiritual Goal 🎯
            </h2>
            <div className="text-xs text-amber-300 mb-4">* Required selection</div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">What's your main spiritual goal?</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { value: 'closer-to-god', label: 'Closer to God', desc: 'Deepen my relationship with God', emoji: '❤️' },
                  { value: 'inner-peace', label: 'Inner Peace', desc: 'Find peace and calm in daily life', emoji: '🕊️' },
                  { value: 'spiritual-growth', label: 'Spiritual Growth', desc: 'Grow in faith and understanding', emoji: '🌱' },
                  { value: 'guidance', label: 'Divine Guidance', desc: 'Seek direction for life decisions', emoji: '🧭' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer('dailyGoal', option.value)}
                    className={`w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl text-left transition-all duration-300 border ${
                      answers.dailyGoal === option.value
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                        : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div className="flex-1">
                        <div className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{option.label}</div>
                        <div className="text-xs sm:text-sm opacity-90">{option.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Notification Preferences 🔔
            </h2>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">How would you like to stay connected?</h3>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Push Notifications */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl border border-white/20">
                  <div className="text-left">
                    <div className="text-base sm:text-lg font-semibold text-white">Push Notifications</div>
                    <div className="text-xs sm:text-sm text-white/70">Get prayer reminders on your device</div>
                  </div>
                  <button
                    onClick={() => handleAnswer('pushEnabled', !answers.pushEnabled)}
                    className={`w-12 sm:w-14 h-6 sm:h-7 rounded-full transition-colors duration-300 ${
                      answers.pushEnabled 
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
                        : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full transition-transform duration-300 transform ${
                      answers.pushEnabled ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl border border-white/20">
                  <div className="text-left">
                    <div className="text-base sm:text-lg font-semibold text-white">Email Reminders</div>
                    <div className="text-xs sm:text-sm text-white/70">Receive spiritual guidance via email</div>
                  </div>
                  <button
                    onClick={() => handleAnswer('emailEnabled', !answers.emailEnabled)}
                    className={`w-12 sm:w-14 h-6 sm:h-7 rounded-full transition-colors duration-300 ${
                      answers.emailEnabled 
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
                        : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full transition-transform duration-300 transform ${
                      answers.emailEnabled ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Preferred Time */}
                <div className="space-y-2 sm:space-y-3">
                  <label className="block text-left text-base sm:text-lg font-semibold text-white">Preferred Reminder Time</label>
                  
                  {/* Preset Times */}
                  <select
                    value={answers.preferredTime}
                    onChange={(e) => handleAnswer('preferredTime', e.target.value)}
                    className="w-full bg-white/10 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-white/20 focus:outline-none focus:border-amber-400"
                    style={{
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <option value="6:00 AM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>6:00 AM - Early Bird</option>
                    <option value="7:00 AM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>7:00 AM - Sunrise Start</option>
                    <option value="8:00 AM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>8:00 AM - Morning Routine</option>
                    <option value="9:00 AM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>9:00 AM - Work Start</option>
                    <option value="12:00 PM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>12:00 PM - Midday Break</option>
                    <option value="3:00 PM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>3:00 PM - Afternoon Pick-me-up</option>
                    <option value="6:00 PM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>6:00 PM - Evening Wind-down</option>
                    <option value="8:00 PM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>8:00 PM - Night Reflection</option>
                    <option value="9:00 PM" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>9:00 PM - Bedtime Prep</option>
                    <option value="custom" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Custom Time</option>
                  </select>
                  
                  {/* Custom Time Input */}
                  {answers.preferredTime === 'custom' && (
                    <div className="mt-3">
                      <input
                        type="time"
                        value={answers.customTime}
                        onChange={(e) => handleAnswer('customTime', e.target.value)}
                        className="w-full bg-white/10 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-white/20 focus:outline-none focus:border-amber-400"
                        placeholder="Enter your preferred time"
                        style={{
                          color: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                      />
                      <p className="text-xs text-white/60 mt-1">Choose any time that works best for your schedule</p>
                    </div>
                  )}
                </div>

                {/* Reminder Settings Drawer */}
                <div className="space-y-4">
                  {/* Intensity Drawer */}
                  <div className="bg-white/5 rounded-xl border border-white/20 overflow-hidden">
                    <button
                      onClick={() => setAnswers(prev => ({ ...prev, intensityOpen: !prev.intensityOpen }))}
                      className="w-full p-3 sm:p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-300"
                    >
                      <div>
                        <div className="text-base sm:text-lg font-semibold text-white">Reminder Intensity</div>
                        <div className="text-xs sm:text-sm text-white/70">
                          {answers.urgencyLevel === 'gentle' && '🌱 Gentle - Soft, encouraging reminders'}
                          {answers.urgencyLevel === 'motivating' && '💪 Motivating - Energetic and inspiring'}
                          {answers.urgencyLevel === 'aggressive' && '🔥 Aggressive - Keep me accountable'}
                        </div>
                      </div>
                      <div className="text-white/60 transform transition-transform duration-300">
                        {answers.intensityOpen ? '▼' : '▶'}
                      </div>
                    </button>
                    
                    {answers.intensityOpen && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
                        {[
                          { value: 'gentle', label: '🌱 Gentle', desc: 'Soft, encouraging reminders' },
                          { value: 'motivating', label: '💪 Motivating', desc: 'Energetic and inspiring' },
                          { value: 'aggressive', label: '🔥 Aggressive', desc: 'Keep me accountable' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleAnswer('urgencyLevel', option.value as any)}
                            className={`w-full p-3 rounded-xl text-left transition-all duration-300 border ${
                              answers.urgencyLevel === option.value
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                                : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="text-sm font-bold mb-1">{option.label}</div>
                            <div className="text-xs opacity-90">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Frequency Drawer */}
                  <div className="bg-white/5 rounded-xl border border-white/20 overflow-hidden">
                    <button
                      onClick={() => setAnswers(prev => ({ ...prev, frequencyOpen: !prev.frequencyOpen }))}
                      className="w-full p-3 sm:p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-300"
                    >
                      <div>
                        <div className="text-base sm:text-lg font-semibold text-white">Reminder Frequency</div>
                        <div className="text-xs sm:text-sm text-white/70">
                          {answers.frequency === 'daily' && '📅 Daily - Once per day reminder'}
                          {answers.frequency === 'twice' && '🕐 Twice Daily - Morning and evening check-ins'}
                          {answers.frequency === 'hourly' && '⏰ Hourly - Regular hourly reminders'}
                        </div>
                      </div>
                      <div className="text-white/60 transform transition-transform duration-300">
                        {answers.frequencyOpen ? '▼' : '▶'}
                      </div>
                    </button>
                    
                    {answers.frequencyOpen && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
                        {[
                          { value: 'daily', label: '📅 Daily', desc: 'Once per day reminder' },
                          { value: 'twice', label: '🕐 Twice Daily', desc: 'Morning and evening check-ins' },
                          { value: 'hourly', label: '⏰ Hourly', desc: 'Regular hourly reminders' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleAnswer('frequency', option.value as any)}
                            className={`w-full p-3 rounded-xl text-left transition-all duration-300 border ${
                              answers.frequency === option.value
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/25'
                                : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="text-sm font-bold mb-1">{option.label}</div>
                            <div className="text-xs opacity-90">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
        <div className="absolute top-1/6 left-1/6 w-64 sm:w-96 h-64 sm:h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/6 right-1/6 w-56 sm:w-80 h-56 sm:h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md sm:max-w-lg">
          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-medium text-white/70">Step {currentStep} of 7</span>
              <span className="text-xs sm:text-sm font-medium text-white/70">{Math.round((currentStep / 7) * 100)}% Complete</span>
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

          {/* Validation Error */}
          {showValidationError && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-lg">⚠️</span>
                <p className="text-red-300 text-sm sm:text-base font-medium">{validationMessage}</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 sm:mt-8 max-w-md mx-auto px-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 text-sm sm:text-base ${
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
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base ${
                  canProceed()
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-500 shadow-lg shadow-amber-500/25'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                }`}
              >
                Next →
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleComplete}
                  disabled={!canProceed()}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base ${
                    canProceed()
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-500 shadow-lg shadow-amber-500/25'
                      : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                  }`}
                >
                  Create My Plan ✨
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-white/60 hover:text-white/80 text-sm underline transition-colors duration-300 hover:no-underline"
                >
                  ← Start Over
                </button>
              </div>
            )}
          </div>

          {/* Navigation Options */}
          {(onBack || currentStep > 1) && (
            <div className="text-center mt-4 sm:mt-6 space-y-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-white/70 hover:text-white text-xs sm:text-sm underline transition-colors duration-300 hover:no-underline block"
                >
                  ← Back to Timer
                </button>
              )}
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-white/60 hover:text-white/80 text-xs sm:text-sm underline transition-colors duration-300 hover:no-underline block"
                >
                  🔄 Start Questionnaire Over
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
