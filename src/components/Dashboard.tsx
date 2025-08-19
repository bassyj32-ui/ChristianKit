import React, { useState, useEffect } from 'react'
import { HabitGrid } from './HabitGrid'
import { WeeklyProgress } from './WeeklyProgress'
import { DailyVerse } from './DailyVerse'
import { CommunitySection } from './CommunitySection'
import { DailyProgressReminder } from './DailyProgressReminder'
import { WeeklyProgressBot } from './WeeklyProgressBot'
import { prayerService } from '../services/prayerService'
import { useAuth } from './AuthProvider'

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { user, logout } = useAuth()

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
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      {/* Interactive Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black pointer-events-none">
        {/* Dynamic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Interactive Geometric Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Dynamic Diagonal Lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent transform rotate-12 animate-pulse"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent transform -rotate-6 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent transform rotate-3 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        
        {/* Interactive Glow Effects */}
        <div className="absolute top-1/6 left-1/6 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Interactive Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Floating Interactive Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/6 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 left-1/6 w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-2/5 right-1/5 w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{animationDuration: '3.5s', animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-bounce" style={{animationDuration: '2s', animationDelay: '1.5s'}}></div>
        <div className="absolute top-3/5 right-1/4 w-1 h-1 bg-emerald-300 rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
      </div>

      {/* App Bar - Interactive Dark */}
      <div className="relative z-50 bg-black/90 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Interactive Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-xs sm:text-sm">CK</span>
              </div>
              <div className="text-base sm:text-lg font-semibold text-white group-hover:text-blue-300 transition-colors duration-300">ChristianKit</div>
            </div>

            {/* Interactive Navigation */}
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="px-4 py-2 rounded-lg font-medium text-white bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <span className="text-blue-300">🏠</span>
                <span>Home</span>
              </button>
              <button
                onClick={() => onNavigate?.('prayer')}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <span>✨</span>
                <span>Prayer</span>
              </button>
              <button
                onClick={() => onNavigate?.('community')}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <span>👥</span>
                <span>Community</span>
              </button>
              <button
                onClick={() => onNavigate?.('subscription')}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <span>⭐</span>
                <span>Pro</span>
              </button>
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <span>👤</span>
                <span>Profile</span>
                <span className={`transform transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="sm:hidden">
              <button 
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 border border-gray-600/30 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Drawer - Interactive Dark */}
      {isDrawerOpen && (
        <div className="relative z-40 bg-black/95 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="py-4 sm:py-6">
              {/* Interactive User Info */}
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800/50 rounded-xl border border-gray-600/50 hover:bg-gray-700/50 transition-all duration-300">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold hover:scale-110 transition-transform duration-300">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">{user?.displayName || 'User'}</div>
                  <div className="text-gray-400 text-xs sm:text-sm">{user?.email}</div>
                </div>
              </div>

              {/* Interactive Drawer Navigation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    onNavigate?.('settings')
                    setIsDrawerOpen(false)
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 border border-gray-600/50 hover:border-blue-500/50 hover:scale-105"
                >
                  <span className="text-lg sm:text-xl">⚙️</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-300">Settings</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate?.('analytics')
                    setIsDrawerOpen(false)
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 border border-gray-600/50 hover:border-purple-500/50 hover:scale-105"
                >
                  <span className="text-lg sm:text-xl">📊</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-300">Analytics</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate?.('history')
                    setIsDrawerOpen(false)
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 border border-gray-600/50 hover:border-emerald-500/50 hover:scale-105"
                >
                  <span className="text-lg sm:text-xl">📅</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-300">History</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate?.('achievements')
                    setIsDrawerOpen(false)
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 border border-gray-600/50 hover:border-yellow-500/50 hover:scale-105"
                >
                  <span className="text-lg sm:text-xl">🏆</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-300">Achievements</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate?.('goals')
                    setIsDrawerOpen(false)
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 border border-gray-600/50 hover:border-orange-500/50 hover:scale-105"
                >
                  <span className="text-lg sm:text-xl">🎯</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-300">Goals</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate?.('notifications')
                    setIsDrawerOpen(false)
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 border border-gray-600/50 hover:border-pink-500/50 hover:scale-105"
                >
                  <span className="text-lg sm:text-xl">🔔</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-300">Notifications</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate?.('help')
                    setIsDrawerOpen(false)
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 border border-gray-600/50 hover:border-cyan-500/50 hover:scale-105"
                >
                  <span className="text-lg sm:text-xl">❓</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-300">Help</span>
                </button>
                <button
                  onClick={() => {
                    logout()
                    setIsDrawerOpen(false)
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 transition-all duration-300 flex flex-col items-center space-y-1 sm:space-y-2 border border-red-500/50 hover:border-red-400/50 hover:scale-105"
                >
                  <span className="text-lg sm:text-xl">🚪</span>
                  <span className="text-xs sm:text-sm font-medium text-red-300">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section - Interactive Dark */}
        <div className="py-8 sm:py-12">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                Your spiritual journey
              </span>
            </h1>

          </div>
        </div>

        {/* Main Content Grid - Interactive Dark */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
          
          {/* Prayer Card - Interactive Dark */}
          <div 
            onClick={() => {
              const prayerTime = userPlan?.prayerTime || 10;
              onNavigate?.('prayer', prayerTime);
            }}
            className="group bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 cursor-pointer hover:border-blue-500/50 hover:scale-105 overflow-hidden relative"
          >
            {/* Interactive Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDuration: '2s'}}></div>
              <div className="absolute top-3 sm:top-6 right-3 sm:right-6 w-0.5 h-0.5 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
              <div className="absolute bottom-2 sm:bottom-4 left-3 sm:left-6 w-0.5 h-0.5 bg-blue-200 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg sm:text-xl">🙏</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-blue-300 bg-blue-600/20 px-2 sm:px-3 py-1 rounded-full border border-blue-500/30">
                  {userPlan?.prayerTime || 10} min
                </div>
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">Prayer</h3>
              <p className="text-gray-300 mb-4 sm:mb-6 leading-relaxed group-hover:text-gray-200 transition-colors duration-300 text-sm sm:text-base">
                Focus on {userPlan?.prayerFocus?.slice(0, 2).join(', ') || 'daily prayer'} with guided sessions.
              </p>
              
              {/* Interactive Progress Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Today's progress</span>
                  <span className="text-xs sm:text-sm font-medium text-blue-300">{todayProgress.prayer}%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full animate-pulse"></div>
                  <div 
                    className="relative bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 shadow-lg" 
                    style={{ width: `${todayProgress.prayer}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Interactive Action Button */}
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 font-medium hover:from-blue-500 hover:to-blue-600 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105 shadow-lg hover:shadow-blue-500/30 border border-blue-500/30 text-sm sm:text-base">
                <span>Start Prayer</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>
          </div>

          {/* Bible Reading Card - Interactive Dark */}
          <div 
            onClick={() => {
              const bibleTime = userPlan?.bibleTime || 20;
              onNavigate?.('prayer', bibleTime);
            }}
            className="group bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 cursor-pointer hover:border-purple-500/50 hover:scale-105 overflow-hidden relative"
          >
            {/* Interactive Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDuration: '2s'}}></div>
              <div className="absolute top-3 sm:top-6 right-3 sm:right-6 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
              <div className="absolute bottom-2 sm:bottom-4 left-3 sm:left-6 w-0.5 h-0.5 bg-purple-200 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg sm:text-xl">📖</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-purple-300 bg-purple-600/20 px-2 sm:px-3 py-1 rounded-full border border-purple-500/30">
                  {userPlan?.bibleTime || 20} min
                </div>
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">Bible Reading</h3>
              <p className="text-gray-300 mb-4 sm:mb-6 leading-relaxed group-hover:text-gray-200 transition-colors duration-300 text-sm sm:text-base">
                Study {userPlan?.bibleTopics?.slice(0, 2).join(', ') || 'scripture'} with structured reading plans.
              </p>
              
              {/* Interactive Progress Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Today's progress</span>
                  <span className="text-xs sm:text-sm font-medium text-purple-300">{todayProgress.bible}%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-full animate-pulse"></div>
                  <div 
                    className="relative bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000 shadow-lg" 
                    style={{ width: `${todayProgress.bible}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Interactive Action Button */}
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 font-medium hover:from-purple-500 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105 shadow-lg hover:shadow-purple-500/30 border border-purple-500/30 text-sm sm:text-base">
                <span>Start Reading</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>
          </div>

          {/* Meditation Card - Interactive Dark */}
          <div 
            onClick={() => {
              const prayerTime = userPlan?.prayerTime || 10;
              onNavigate?.('prayer', prayerTime);
            }}
            className="group bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 cursor-pointer hover:border-emerald-500/50 hover:scale-105 overflow-hidden relative md:col-span-2 lg:col-span-1"
          >
            {/* Interactive Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" style={{animationDuration: '2s'}}></div>
              <div className="absolute top-3 sm:top-6 right-3 sm:right-6 w-0.5 h-0.5 bg-emerald-300 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
              <div className="absolute bottom-2 sm:bottom-4 left-3 sm:left-6 w-0.5 h-0.5 bg-emerald-200 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg sm:text-xl">🧘‍♀️</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-emerald-300 bg-emerald-600/20 px-2 sm:px-3 py-1 rounded-full border border-emerald-500/30">
                  {userPlan?.prayerTime || 10} min
                </div>
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors duration-300">Meditation</h3>
              <p className="text-gray-300 mb-4 sm:mb-6 leading-relaxed group-hover:text-gray-200 transition-colors duration-300 text-sm sm:text-base">
                Practice {userPlan?.prayerStyle?.replace('_', ' ') || 'contemplative'} meditation for inner peace.
              </p>
              
              {/* Interactive Progress Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Today's progress</span>
                  <span className="text-xs sm:text-sm font-medium text-emerald-300">{todayProgress.meditation}%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-full animate-pulse"></div>
                  <div 
                    className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-1000 shadow-lg" 
                    style={{ width: `${todayProgress.meditation}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Interactive Action Button */}
              <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105 shadow-lg hover:shadow-emerald-500/30 border border-emerald-500/30 text-sm sm:text-base">
                <span>Start Meditation</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pro Feature Promotion - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-purple-900/80 via-pink-900/80 to-indigo-900/80 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-3">⭐</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Unlock Your Full Spiritual Potential</h3>
              <p className="text-purple-200 text-sm sm:text-base mb-4">
                Get unlimited prayer sessions, advanced analytics, and premium support
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-2xl mb-1">♾️</div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Unlimited Sessions</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Advanced Analytics</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-2xl mb-1">☁️</div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Cloud Sync</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">$2.50</div>
                  <div className="text-xs sm:text-sm text-purple-200">per month</div>
                </div>
                <div className="text-purple-200 text-xs sm:text-sm">or</div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">$30</div>
                  <div className="text-xs sm:text-sm text-purple-200">per year (save 50%)</div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate?.('subscription')}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 Upgrade to Pro
              </button>
              
              <div className="mt-3 text-xs text-purple-200">
                30-day money-back guarantee • Cancel anytime
              </div>
            </div>
          </div>
        </div>

        {/* Encouraging Stats Section */}
        <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-2 border-amber-500/30 rounded-2xl p-6 mb-6 shadow-2xl">
          <h3 className="text-xl font-bold text-amber-400 mb-4 text-center">
            🌟 Join Our Growing Community
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400 mb-1">847</div>
              <div className="text-sm text-amber-200">Monthly Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">2,392</div>
              <div className="text-sm text-blue-200">Active Pray Warriors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">156</div>
              <div className="text-sm text-purple-200">Daily Sessions</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-amber-200 text-sm">
              "ChristianKit has transformed my daily spiritual routine. I've never felt more connected to my faith!" 
              <span className="text-amber-400 font-medium"> - Sarah M.</span>
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
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">
            Daily Verse
          </h2>
          <DailyVerse />
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 sm:mt-10 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-2xl px-6 sm:px-8 py-4 border-2 border-amber-500/30 shadow-2xl">
            <button
              onClick={() => onNavigate?.('prayer')}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 sm:px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🙏 Start Prayer
            </button>
            <span className="hidden sm:inline text-amber-400">|</span>
            <button
              onClick={() => onNavigate?.('bible')}
              className="flex items-center gap-2 bg-slate-800/80 text-amber-400 px-4 sm:px-6 py-3 rounded-xl font-bold border-2 border-amber-500/30 hover:bg-amber-500/20 transition-all duration-200 transform hover:scale-105"
            >
              📖 Read Bible
            </button>
            <span className="hidden sm:inline text-amber-400">|</span>
            <button
              onClick={() => onNavigate?.('meditation')}
              className="flex items-center gap-2 bg-slate-800/80 text-amber-400 px-4 sm:px-6 py-3 rounded-xl font-bold border-2 border-amber-500/30 hover:bg-amber-500/20 transition-all duration-200 transform hover:scale-105"
            >
              🧘 Meditate
            </button>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-8 sm:mt-12 pb-8">
          <div className="border-t border-amber-500/30 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <div className="text-amber-200 text-sm">
                © 2024 ChristianKit. All rights reserved.
              </div>

              {/* Legal Links */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
                <a 
                  href="/privacy.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-200 hover:text-amber-400 transition-colors duration-200"
                >
                  Privacy Policy
                </a>
                <a 
                  href="/terms.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-200 hover:text-amber-400 transition-colors duration-200"
                >
                  Terms of Service
                </a>
                <a 
                  href="/refund.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-200 hover:text-amber-400 transition-colors duration-200"
                >
                  Refund Policy
                </a>
                <a 
                  href="mailto:support@christiankit.app"
                  className="text-amber-200 hover:text-amber-400 transition-colors duration-200"
                >
                  Contact Support
                </a>
              </div>

              {/* Payment Info */}
              <div className="text-amber-200 text-xs text-center sm:text-right">
                Payment processed securely through Paddle
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress Bot */}
      <WeeklyProgressBot position="bottom-right" showNotifications={true} />
    </div>
  )
}
