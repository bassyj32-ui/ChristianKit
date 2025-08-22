import React, { useState, useEffect } from 'react'
import { ProFeatureGate } from './ProFeatureGate'

interface MonthlyTheme {
  id: string
  title: string
  subtitle: string
  description: string
  emoji: string
  color: string
  verseOfTheMonth: {
    text: string
    reference: string
  }
  weeklyFocus: {
    week1: { title: string; description: string; activities: string[] }
    week2: { title: string; description: string; activities: string[] }
    week3: { title: string; description: string; activities: string[] }
    week4: { title: string; description: string; activities: string[] }
  }
  dailyPractices: string[]
  reflectionPrompts: string[]
  resources: { title: string; type: 'article' | 'video' | 'book'; url?: string }[]
}

interface MonthlyHabitBuilderProps {
  compact?: boolean
}

export const MonthlyHabitBuilder: React.FC<MonthlyHabitBuilderProps> = ({ compact = false }) => {
  const [currentTheme, setCurrentTheme] = useState<MonthlyTheme | null>(null)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set())
  const [showWeeklyView, setShowWeeklyView] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'weekly' | 'progress' | 'resources'>('overview')

  const monthlyThemes: MonthlyTheme[] = [
    {
      id: 'fear-of-god',
      title: 'Fear of the Lord',
      subtitle: 'Developing Reverent Awe',
      description: 'This month, we focus on cultivating a proper reverent fear and awe of God - the foundation of all wisdom and spiritual growth.',
      emoji: '👑',
      color: 'from-purple-500 to-indigo-600',
      verseOfTheMonth: {
        text: 'The fear of the Lord is the beginning of wisdom; all who follow his precepts have good understanding.',
        reference: 'Psalm 111:10'
      },
      weeklyFocus: {
        week1: {
          title: 'Understanding God\'s Holiness',
          description: 'Explore what it means for God to be holy and set apart.',
          activities: [
            'Read Isaiah 6:1-8 and reflect on the holiness of God',
            'Spend 10 minutes in silent worship daily',
            'Journal about what God\'s holiness means to you'
          ]
        },
        week2: {
          title: 'Recognizing God\'s Sovereignty',
          description: 'Acknowledge God\'s ultimate authority over all creation.',
          activities: [
            'Study verses about God\'s sovereignty (Dan 4:35, Rom 9:20-21)',
            'Practice surrendering daily decisions to God',
            'Pray for world leaders and acknowledge God\'s ultimate rule'
          ]
        },
        week3: {
          title: 'Embracing Humility',
          description: 'Learn to approach God with proper humility and reverence.',
          activities: [
            'Practice confession and repentance daily',
            'Read about biblical examples of humility (Moses, David)',
            'Examine areas of pride in your life'
          ]
        },
        week4: {
          title: 'Walking in Wisdom',
          description: 'Apply the fear of the Lord in practical daily decisions.',
          activities: [
            'Make decisions based on biblical wisdom',
            'Seek counsel from mature believers',
            'Reflect on how fear of God impacts your choices'
          ]
        }
      },
      dailyPractices: [
        'Begin prayer with worship and acknowledgment of God\'s holiness',
        'Read one Psalm focusing on God\'s attributes',
        'Practice gratitude for God\'s mercy and grace',
        'End the day examining your heart before God'
      ],
      reflectionPrompts: [
        'How does understanding God\'s holiness change how I approach Him?',
        'In what areas of my life do I need to submit more fully to God\'s authority?',
        'What does it mean to "fear God" in practical terms?',
        'How can I cultivate more reverence in my daily spiritual practices?'
      ],
      resources: [
        { title: 'The Knowledge of the Holy by A.W. Tozer', type: 'book' },
        { title: 'What is the Fear of the Lord?', type: 'article' },
        { title: 'Worship and the Fear of God', type: 'video' }
      ]
    },
    {
      id: 'gratitude-thanksgiving',
      title: 'Gratitude & Thanksgiving',
      subtitle: 'Cultivating a Thankful Heart',
      description: 'Develop a lifestyle of gratitude that transforms your perspective and strengthens your relationship with God.',
      emoji: '🙏',
      color: 'from-amber-500 to-orange-600',
      verseOfTheMonth: {
        text: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.',
        reference: '1 Thessalonians 5:18'
      },
      weeklyFocus: {
        week1: {
          title: 'Recognizing God\'s Blessings',
          description: 'Open your eyes to see God\'s goodness in daily life.',
          activities: [
            'Keep a daily gratitude journal with 5 specific items',
            'Share one blessing with someone each day',
            'Pray thanksgiving prayers instead of petition prayers'
          ]
        },
        week2: {
          title: 'Gratitude in Difficulties',
          description: 'Learn to find God\'s presence even in challenging times.',
          activities: [
            'Practice finding one good thing in difficult situations',
            'Study biblical examples of gratitude in trials (Job, Paul)',
            'Write thank you notes to people who\'ve helped you'
          ]
        },
        week3: {
          title: 'Expressing Gratitude to Others',
          description: 'Show appreciation to the people God has placed in your life.',
          activities: [
            'Send appreciation messages to family and friends',
            'Serve others as an expression of gratitude',
            'Encourage someone who has been a blessing to you'
          ]
        },
        week4: {
          title: 'Living from Gratitude',
          description: 'Make gratitude your default response to life.',
          activities: [
            'Practice gratitude breathing exercises',
            'Replace complaining with thanksgiving',
            'Plan ways to make gratitude a permanent habit'
          ]
        }
      },
      dailyPractices: [
        'Start each morning by thanking God for 3 specific things',
        'Practice gratitude before meals',
        'End each day reflecting on God\'s faithfulness',
        'Look for opportunities to express gratitude to others'
      ],
      reflectionPrompts: [
        'What blessings have I been taking for granted?',
        'How does gratitude change my perspective on difficulties?',
        'Who in my life deserves more appreciation?',
        'How can I make gratitude a more natural response?'
      ],
      resources: [
        { title: 'One Thousand Gifts by Ann Voskamp', type: 'book' },
        { title: 'The Science of Gratitude', type: 'article' },
        { title: 'Gratitude: A Biblical Perspective', type: 'video' }
      ]
    }
  ]

  useEffect(() => {
    // Set current month's theme (or cycle through for demo)
    const currentMonth = new Date().getMonth()
    const themeIndex = currentMonth % monthlyThemes.length
    setCurrentTheme(monthlyThemes[themeIndex])

    // Calculate current week of the month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const dayOfMonth = now.getDate()
    const week = Math.ceil(dayOfMonth / 7)
    setCurrentWeek(Math.min(week, 4))

    // Load completed activities from localStorage
    const saved = localStorage.getItem('monthlyHabitProgress')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setCompletedActivities(new Set(data.completedActivities || []))
      } catch (error) {
        console.error('Error loading monthly habit progress:', error)
      }
    }
  }, [])

  const saveProgress = () => {
    const data = {
      completedActivities: Array.from(completedActivities),
      lastUpdated: new Date().toISOString(),
      currentMonth: new Date().getMonth()
    }
    localStorage.setItem('monthlyHabitProgress', JSON.stringify(data))
  }

  const toggleActivity = (activity: string) => {
    const newCompleted = new Set(completedActivities)
    if (newCompleted.has(activity)) {
      newCompleted.delete(activity)
    } else {
      newCompleted.add(activity)
    }
    setCompletedActivities(newCompleted)
    saveProgress()
  }

  const getCurrentWeekFocus = () => {
    if (!currentTheme) return null
    const weekKey = `week${currentWeek}` as keyof typeof currentTheme.weeklyFocus
    return currentTheme.weeklyFocus[weekKey]
  }

  const getOverallProgress = () => {
    if (!currentTheme) return 0
    const totalActivities = Object.values(currentTheme.weeklyFocus).reduce(
      (total, week) => total + week.activities.length, 0
    )
    const completedCount = Array.from(completedActivities).length
    return Math.round((completedCount / totalActivities) * 100)
  }

  const getWeekProgress = (weekNum: number) => {
    if (!currentTheme) return 0
    const weekKey = `week${weekNum}` as keyof typeof currentTheme.weeklyFocus
    const weekActivities = currentTheme.weeklyFocus[weekKey].activities
    const completedInWeek = weekActivities.filter(activity => completedActivities.has(activity)).length
    return Math.round((completedInWeek / weekActivities.length) * 100)
  }

  if (!currentTheme) {
    return (
      <ProFeatureGate feature="monthlyHabitBuilder">
        <div className="osmo-card animate-pulse">
          <div className="h-6 bg-[var(--glass-medium)] rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-[var(--glass-medium)] rounded"></div>
        </div>
      </ProFeatureGate>
    )
  }

  return (
    <ProFeatureGate feature="monthlyHabitBuilder">
      <div className={`osmo-card ${compact ? 'max-w-md' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 bg-gradient-to-r ${currentTheme.color} rounded-xl flex items-center justify-center text-2xl`}>
              {currentTheme.emoji}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{currentTheme.title}</h3>
              <p className="text-slate-300 text-sm">{currentTheme.subtitle}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{getOverallProgress()}%</div>
            <div className="text-xs text-slate-400">Monthly Progress</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-slate-700/30 backdrop-blur-sm rounded-lg p-1">
          {(['overview', 'weekly', 'progress', 'resources'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedTab === tab
                  ? 'bg-white/10 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold text-white mb-2">This Month's Focus</h4>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {currentTheme.description}
              </p>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                <p className="text-white/90 italic text-sm leading-relaxed mb-2">
                  "{currentTheme.verseOfTheMonth.text}"
                </p>
                <p className="text-slate-300 text-xs font-medium">
                  — {currentTheme.verseOfTheMonth.reference}
                </p>
              </div>
            </div>

            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold text-white mb-3">Daily Practices</h4>
              <div className="space-y-2">
                {currentTheme.dailyPractices.map((practice, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-slate-300 text-sm">{practice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'weekly' && (
          <div className="space-y-4">
            {/* Week selector */}
            <div className="flex space-x-2 mb-4">
              {[1, 2, 3, 4].map((week) => (
                <button
                  key={week}
                  onClick={() => setCurrentWeek(week)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentWeek === week
                      ? `bg-gradient-to-r ${currentTheme.color} text-white shadow-md`
                      : 'bg-slate-700/30 text-slate-400 hover:text-white'
                  }`}
                >
                  Week {week}
                  <div className="text-xs mt-1">{getWeekProgress(week)}%</div>
                </button>
              ))}
            </div>

            {/* Current week content */}
            {(() => {
              const weekFocus = getCurrentWeekFocus()
              return weekFocus ? (
                <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-2">{weekFocus.title}</h4>
                  <p className="text-slate-300 text-sm mb-4">{weekFocus.description}</p>
                  
                  <div className="space-y-3">
                    <h5 className="text-white text-sm font-medium">This Week's Activities:</h5>
                    {weekFocus.activities.map((activity, index) => (
                      <label key={index} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={completedActivities.has(activity)}
                          onChange={() => toggleActivity(activity)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className={`text-sm ${
                          completedActivities.has(activity) 
                            ? 'text-slate-400 line-through' 
                            : 'text-slate-300'
                        }`}>
                          {activity}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
          </div>
        )}

        {selectedTab === 'progress' && (
          <div className="space-y-4">
            {/* Overall progress */}
            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold text-white mb-3">Monthly Progress</h4>
              <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                <div
                  className={`bg-gradient-to-r ${currentTheme.color} h-3 rounded-full transition-all duration-1000`}
                  style={{ width: `${getOverallProgress()}%` }}
                ></div>
              </div>
              <p className="text-slate-300 text-sm">{getOverallProgress()}% Complete</p>
            </div>

            {/* Weekly breakdown */}
            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold text-white mb-3">Weekly Breakdown</h4>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((week) => {
                  const weekKey = `week${week}` as keyof typeof currentTheme.weeklyFocus
                  const weekData = currentTheme.weeklyFocus[weekKey]
                  const progress = getWeekProgress(week)
                  
                  return (
                    <div key={week} className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">Week {week}: {weekData.title}</p>
                        <p className="text-slate-400 text-xs">{progress}% Complete</p>
                      </div>
                      <div className="w-20 bg-slate-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${currentTheme.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Reflection prompts */}
            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold text-white mb-3">Reflection Questions</h4>
              <div className="space-y-2">
                {currentTheme.reflectionPrompts.map((prompt, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-slate-300 text-sm">{prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'resources' && (
          <div className="space-y-4">
            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold text-white mb-3">Recommended Resources</h4>
              <div className="space-y-3">
                {currentTheme.resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm">
                        {resource.type === 'book' ? '📚' : resource.type === 'video' ? '🎥' : '📄'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{resource.title}</p>
                        <p className="text-slate-400 text-xs capitalize">{resource.type}</p>
                      </div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 text-sm">
                      View →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pro badge */}
        <div className="flex justify-center mt-4">
          <span className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-sm text-amber-200 px-3 py-1 rounded-full text-xs font-medium border border-amber-400/30">
            ⭐ Pro Feature
          </span>
        </div>
      </div>
    </ProFeatureGate>
  )
}
