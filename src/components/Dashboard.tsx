import React, { useState, useEffect } from 'react'
import { HabitGrid } from './HabitGrid'
import { WeeklyProgress } from './WeeklyProgress'
import { DailyVerse } from './DailyVerse'
import { CommunitySection } from './CommunitySection'
import { DailyProgressReminder } from './DailyProgressReminder'
import { prayerService } from '../services/prayerService'

interface DashboardProps {
  onNavigate?: (page: string, duration?: number) => void;
  userPlan?: {
    prayerTime: number;
    bibleTime: number;
    prayerStyle: string;
    prayerFocus: string[];
    bibleTopics: string[];
  } | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userPlan }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [todayProgress, setTodayProgress] = useState({
    prayer: 0,
    bible: 0,
    meditation: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTodayProgress = async () => {
      try {
        setLoading(true)
        const sessions = await prayerService.getPrayerSessions()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const todaySessions = sessions.filter(session => {
          const sessionDate = new Date(session.date)
          sessionDate.setHours(0, 0, 0, 0)
          return sessionDate.getTime() === today.getTime() && session.completed
        })
        
        // Calculate today's progress
        let prayerProgress = 0
        let bibleProgress = 0
        let meditationProgress = 0
        
        todaySessions.forEach(session => {
          const targetDuration = 30 // 30 minutes target
          const percentage = Math.min(100, Math.round((session.duration / targetDuration) * 100))
          
          if (session.focus && session.focus.toLowerCase().includes('bible')) {
            bibleProgress = Math.max(bibleProgress, percentage)
          } else if (session.focus && session.focus.toLowerCase().includes('meditation')) {
            meditationProgress = Math.max(meditationProgress, percentage)
          } else {
            prayerProgress = Math.max(prayerProgress, percentage)
          }
        })
        
        setTodayProgress({
          prayer: prayerProgress,
          bible: bibleProgress,
          meditation: meditationProgress
        })
      } catch (error) {
        console.error('Error loading today\'s progress:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadTodayProgress()
  }, [])

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Main Spiritual Habits Section - AT THE TOP */}
        <div 
          className="mb-8 sm:mb-10 transition-all duration-500 ease-out"
          onMouseEnter={() => setActiveSection('habits')}
        >
          <div className="text-center mb-2 sm:mb-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-100 mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Transform your spirit today
            </h2>
            <p className="text-gray-400 text-lg">Your personalized spiritual journey</p>
          </div>
          
          {/* Main 3 Habits - Tab Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 mb-6">
            {/* Prayer Tab */}
            <div 
              onClick={() => {
                // Start timer with prayer time from user plan
                const prayerTime = userPlan?.prayerTime || 10;
                onNavigate?.('prayer', prayerTime);
              }}
              className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group border border-neutral-800 hover:border-green-500/30 hover:shadow-green-500/20"
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🙏</div>
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-100">Prayer</h3>
                <div className="text-xl sm:text-2xl font-bold mb-2 text-green-400">{userPlan?.prayerTime || 10} min</div>
                <div className="text-xs text-gray-400 mb-3">Focus: {userPlan?.prayerFocus?.slice(0, 2).join(', ') || 'Daily prayer'}</div>
                
                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${todayProgress.prayer}%` }}></div>
                </div>
                <div className="text-xs text-gray-400 mb-4">{todayProgress.prayer}% complete today</div>
                
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-3 shadow-lg group-hover:shadow-green-500/30">
                  <div className="text-sm font-bold group-hover:scale-105 transition-transform">
                    Start Prayer →
                  </div>
                </div>
              </div>
            </div>

            {/* Bible Reading Tab */}
            <div 
              onClick={() => {
                // Start timer with bible time from user plan
                const bibleTime = userPlan?.bibleTime || 20;
                onNavigate?.('prayer', bibleTime);
              }}
              className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group border border-neutral-800 hover:border-blue-500/30 hover:shadow-blue-500/20"
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">📖</div>
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-100">Bible Reading</h3>
                <div className="text-xl sm:text-2xl font-bold mb-2 text-blue-400">{userPlan?.bibleTime || 20} min</div>
                <div className="text-xs text-gray-400 mb-3">Topics: {userPlan?.bibleTopics?.slice(0, 2).join(', ') || 'Scripture study'}</div>
                
                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${todayProgress.bible}%` }}></div>
                </div>
                <div className="text-xs text-gray-400 mb-4">{todayProgress.bible}% complete today</div>
                
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl p-3 shadow-lg group-hover:shadow-blue-500/30">
                  <div className="text-sm font-bold group-hover:scale-105 transition-transform">
                    Start Reading →
                  </div>
                </div>
              </div>
            </div>

            {/* Meditation Tab */}
            <div 
              onClick={() => {
                // Start timer with prayer time from user plan (same as prayer tab)
                const prayerTime = userPlan?.prayerTime || 10;
                onNavigate?.('prayer', prayerTime);
              }}
              className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group border border-neutral-800 hover:border-emerald-500/30 hover:shadow-emerald-500/20"
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🧘‍♀️</div>
                <div className="text-base sm:text-lg font-bold mb-2 text-gray-100">Meditation</div>
                <div className="text-xl sm:text-2xl font-bold mb-2 text-emerald-400">{userPlan?.prayerTime || 10} min</div>
                <div className="text-xs text-gray-400 mb-3">Style: {userPlan?.prayerStyle?.replace('_', ' ') || 'Contemplative'}</div>
                
                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${todayProgress.meditation}%` }}></div>
                </div>
                <div className="text-xs text-gray-400 mb-4">{todayProgress.meditation}% complete today</div>
                
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-3 shadow-lg group-hover:shadow-emerald-500/30">
                  <div className="text-sm font-bold group-hover:scale-105 transition-transform">
                    Start Meditation →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Encouraging Stats Section */}
        <div className="bg-gradient-to-r from-neutral-900/80 to-neutral-800/80 backdrop-blur-sm border border-neutral-700 rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold text-green-400 mb-4 text-center">
            🌟 Join Our Growing Community
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">847</div>
              <div className="text-sm text-gray-400">Monthly Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">2,392</div>
              <div className="text-sm text-gray-400">Active Pray Warriors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">156</div>
              <div className="text-sm text-gray-400">Daily Sessions</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-gray-300 text-sm">
              "ChristianKit has transformed my daily spiritual routine. I've never felt more connected to my faith!" 
              <span className="text-green-400 font-medium"> - Sarah M.</span>
            </p>
          </div>
        </div>

        {/* Weekly Progress */}
        <div 
          className="mb-8 sm:mb-10 transition-all duration-500 ease-out"
          onMouseEnter={() => setActiveSection('progress')}
        >
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <WeeklyProgress showSummary={true} />
          </div>
        </div>

        {/* Community Section */}
        <div 
          className="mb-8 sm:mb-10 transition-all duration-500 ease-out"
          onMouseEnter={() => setActiveSection('community')}
        >
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <CommunitySection />
          </div>
        </div>

        {/* Daily Progress Reminder */}
        <div 
          className="mb-8 sm:mb-10 transition-all duration-500 ease-out"
          onMouseEnter={() => setActiveSection('daily-progress-reminder')}
        >
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <DailyProgressReminder />
          </div>
        </div>

        {/* Spiritual Habits Section - MOVED TO BOTTOM */}
        <div 
          className="mb-8 sm:mb-10 transition-all duration-500 ease-out"
          onMouseEnter={() => setActiveSection('habits')}
        >
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <HabitGrid />
          </div>
        </div>



        {/* Daily Verse Section */}
        <div 
          className="mb-8 sm:mb-10 transition-all duration-500 ease-out"
          onMouseEnter={() => setActiveSection('daily-verse')}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-4 text-center">
            Daily Verse
          </h2>
          <DailyVerse />
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 sm:mt-10 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-neutral-900/80 backdrop-blur-sm rounded-2xl px-6 sm:px-8 py-4 border border-neutral-800 shadow-lg">
            <button
              onClick={() => onNavigate?.('prayer')}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🙏 Start Prayer
            </button>
            <span className="hidden sm:inline text-gray-500">|</span>
            <button
              onClick={() => onNavigate?.('bible')}
              className="flex items-center gap-2 bg-neutral-800 text-green-400 px-4 sm:px-6 py-3 rounded-xl font-bold border-2 border-neutral-700 hover:bg-neutral-700 transition-all duration-200 transform hover:scale-105"
            >
              📖 Read Bible
            </button>
            <span className="hidden sm:inline text-gray-500">|</span>
            <button
              onClick={() => onNavigate?.('meditation')}
              className="flex items-center gap-2 bg-neutral-800 text-green-400 px-4 sm:px-6 py-3 rounded-xl font-bold border-2 border-neutral-700 hover:bg-neutral-700 transition-all duration-200 transform hover:scale-105"
            >
              🧘 Meditate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
