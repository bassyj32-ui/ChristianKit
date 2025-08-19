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
      <div className="relative z-50 bg-gradient-to-r from-black/95 via-gray-900/95 to-black/95 backdrop-blur-xl border-b border-gray-600/30 shadow-2xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Interactive Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold text-xs sm:text-sm">CK</span>
              </div>
              <div className="text-base sm:text-lg font-semibold text-white group-hover:text-blue-300 transition-colors duration-300">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Christian</span>
                <span className="text-white">Kit</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-3">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="px-4 py-2 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500/30 to-blue-600/30 hover:from-blue-500/40 hover:to-blue-600/40 border border-blue-400/40 hover:border-blue-300/60 transition-all duration-300 flex items-center space-x-2 hover:scale-105 shadow-lg"
              >
                <span className="text-blue-300">🏠</span>
                <span>Home</span>
              </button>
              <button
                onClick={() => onNavigate?.('prayer')}
                className="px-4 py-2 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-purple-600/30 border border-gray-600/30 hover:border-purple-400/40 transition-all duration-300 flex items-center space-x-2 hover:scale-105 shadow-lg"
              >
                <span>✨</span>
                <span>Prayer</span>
              </button>
              <button
                onClick={() => onNavigate?.('community')}
                className="px-4 py-2 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-emerald-500/30 hover:to-emerald-600/30 border border-gray-600/30 hover:border-emerald-400/40 transition-all duration-300 flex items-center space-x-2 hover:scale-105 shadow-lg"
              >
                <span>👥</span>
                <span>Community</span>
              </button>
              <button
                onClick={() => onNavigate?.('subscription')}
                className="px-4 py-2 rounded-xl font-medium text-yellow-300 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-400/40 hover:border-yellow-300/60 transition-all duration-300 flex items-center space-x-2 hover:scale-105 shadow-lg"
              >
                <span>⭐</span>
                <span>Pro</span>
              </button>
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="px-4 py-2 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-500/30 hover:to-gray-600/30 border border-gray-600/30 hover:border-gray-400/40 transition-all duration-300 flex items-center space-x-2 hover:scale-105 shadow-lg"
              >
                <span>👤</span>
                <span>Profile</span>
                <span className={`transform transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>

            {/* Mobile Right Side - Pro Button + Menu */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* Pro Button */}
              <button
                onClick={() => onNavigate?.('subscription')}
                className="px-3 py-2 rounded-xl text-yellow-300 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/40 hover:border-yellow-300/60 transition-all duration-300 hover:scale-105 group shadow-lg"
              >
                <span className="text-sm font-medium">⭐ Pro</span>
              </button>
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-500/20 hover:to-gray-600/20 border border-gray-600/30 transition-all duration-300 hover:scale-105 shadow-lg"
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
              <span className="text-white font-mono tracking-wider">
                Your Session Today
              </span>
            </h1>

          </div>
        </div>

        {/* Main Content - Modern Beautiful Tab Interface */}
        <div className="w-full mb-8 sm:mb-12 lg:mb-16 mt-4">
          {/* Tab Navigation */}
          <div className="flex w-full bg-gradient-to-r from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-2xl rounded-3xl border border-gray-600/30 shadow-2xl overflow-hidden relative">
            {/* Background Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5 rounded-3xl"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent"></div>
            
            {/* Prayer Tab */}
            <button
            onClick={() => {
              const prayerTime = userPlan?.prayerTime || 10;
              onNavigate?.('prayer', prayerTime);
            }}
              className="flex-1 flex flex-col items-center justify-center py-8 px-6 bg-gradient-to-br from-slate-600/10 via-blue-700/10 to-blue-800/10 hover:from-slate-600/20 hover:via-blue-700/20 hover:to-blue-800/20 border-r-2 border-gray-600/40 hover:border-blue-600/50 transition-all duration-500 group relative overflow-hidden"
          >
              {/* Tab Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500/40 rounded-full animate-pulse" style={{animationDuration: '3s'}}></div>
                <div className="absolute top-6 right-6 w-1 h-1 bg-blue-400/60 rounded-full animate-pulse" style={{animationDuration: '2s', animationDelay: '1s'}}></div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-blue-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-2xl group-hover:shadow-blue-600/30 border border-blue-600/30">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors duration-300">Prayer</h3>
                
                <button className="w-full bg-gradient-to-r from-slate-600 to-blue-700 text-white rounded-2xl py-3 px-5 text-sm font-semibold hover:from-slate-500 hover:to-blue-600 transition-all duration-300 group-hover:scale-105 shadow-lg hover:shadow-blue-600/40 border border-blue-600/30 hover:border-blue-500/50 transform hover:-translate-y-0.5">
                  Start
                </button>
              </div>
              </button>

            {/* Bible Reading Tab */}
            <button
            onClick={() => {
              const bibleTime = userPlan?.bibleTime || 20;
              onNavigate?.('prayer', bibleTime);
            }}
              className="flex-1 flex flex-col items-center justify-center py-8 px-6 bg-gradient-to-br from-gray-600/10 via-gray-700/10 to-slate-800/10 hover:from-gray-600/20 hover:via-gray-700/20 hover:to-slate-800/20 border-r-2 border-gray-600/40 hover:border-gray-500/50 transition-all duration-500 group relative overflow-hidden"
          >
              {/* Tab Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-2 h-2 bg-gray-500/40 rounded-full animate-pulse" style={{animationDuration: '3s'}}></div>
                <div className="absolute top-6 right-6 w-1 h-1 bg-gray-400/60 rounded-full animate-pulse" style={{animationDuration: '2s', animationDelay: '1s'}}></div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-slate-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-2xl group-hover:shadow-gray-600/30 border border-gray-600/30">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM3 19V6h8v13H3zm18 0h-8V6h8v13zm-7-9.5h6V11h-6V9.5zm0 2.5h6v1.5h-6V12zm0 2.5h6V16h-6v-1.5z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-6 group-hover:text-gray-300 transition-colors duration-300">Bible</h3>
                
                <button className="w-full bg-gradient-to-r from-gray-600 to-slate-700 text-white rounded-2xl py-3 px-5 text-sm font-semibold hover:from-gray-500 hover:to-slate-600 transition-all duration-300 group-hover:scale-105 shadow-lg hover:shadow-gray-600/40 border border-gray-600/30 hover:border-gray-500/50 transform hover:-translate-y-0.5">
                  Start
                </button>
              </div>
              </button>

            {/* Meditation Tab */}
            <button
            onClick={() => {
              const prayerTime = userPlan?.prayerTime || 10;
              onNavigate?.('prayer', prayerTime);
            }}
              className="flex-1 flex flex-col items-center justify-center py-8 px-6 bg-gradient-to-br from-emerald-600/10 via-teal-700/10 to-teal-800/10 hover:from-emerald-600/20 hover:via-teal-700/20 hover:to-teal-800/20 hover:border-teal-600/50 transition-all duration-500 group relative overflow-hidden"
          >
              {/* Tab Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-2 h-2 bg-teal-500/40 rounded-full animate-pulse" style={{animationDuration: '3s'}}></div>
                <div className="absolute top-6 right-6 w-1 h-1 bg-teal-400/60 rounded-full animate-pulse" style={{animationDuration: '2s', animationDelay: '1s'}}></div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-2xl group-hover:shadow-teal-600/30 border border-teal-600/30">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-6 group-hover:text-teal-300 transition-colors duration-300">Meditation</h3>
                
                <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl py-3 px-5 text-sm font-semibold hover:from-emerald-500 hover:to-teal-600 transition-all duration-300 group-hover:scale-105 shadow-lg hover:shadow-teal-600/40 border border-teal-600/30 hover:border-teal-500/50 transform hover:-translate-y-0.5">
                  Start
                </button>
              </div>
              </button>
          </div>
        </div>

        {/* Weekly Progress Section */}
        <div className="mt-8 w-full">
          <WeeklyProgress showSummary={true} />
        </div>

        {/* Pro Version Section - Compact & Mobile Optimized */}
        <div className="mt-8 w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Pro Features
            </h2>
            <p className="text-blue-400 text-lg mt-3 font-bold tracking-wider uppercase bg-gray-800 px-4 py-2 rounded border-2 border-blue-500">
              Today's Session Awaits
            </p>
          </div>
          
          {/* Pro Features Grid - Compact Mobile Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            
            {/* Community Feature */}
            <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-600/10 to-indigo-700/10 backdrop-blur-xl rounded-2xl border border-indigo-500/30 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 group p-4 sm:p-5">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto">
                  <span className="text-xl sm:text-2xl">👥</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Community</h3>
                <p className="text-xs text-gray-400 mb-3 hidden sm:block">Connect with believers</p>
                <button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl py-2 px-3 text-xs font-medium hover:from-indigo-500 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-indigo-500/40 border border-indigo-500/30 hover:border-indigo-400/50 transform hover:-translate-y-0.5">
                  Join
                </button>
              </div>
                </div>

            {/* Weekly Analysis Feature */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/10 to-amber-700/10 backdrop-blur-xl rounded-2xl border border-amber-500/30 shadow-lg hover:shadow-amber-500/30 transition-all duration-300 group p-4 sm:p-5">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Weekly Analysis</h3>
                <p className="text-xs text-gray-400 mb-3 hidden sm:block">Track your progress</p>
                <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl py-2 px-3 text-xs font-medium hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-md hover:shadow-amber-500/40 border border-amber-500/30 hover:border-amber-400/50 transform hover:-translate-y-0.5">
                  View
                </button>
                </div>
              </div>
              
            {/* Daily Devotionals Feature */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/10 to-emerald-700/10 backdrop-blur-xl rounded-2xl border border-emerald-500/30 shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 group p-4 sm:p-5">
                <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto">
                  <span className="text-xl sm:text-2xl">📅</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">30-Day Devotionals</h3>
                <p className="text-xs text-gray-400 mb-3 hidden sm:block">Daily spiritual guidance</p>
                <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl py-2 px-3 text-xs font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-emerald-500/40 border border-emerald-500/30 hover:border-emerald-400/50 transform hover:-translate-y-0.5">
                  Start
              </button>
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

      {/* Weekly Progress Bot - Desktop Version (Original Size) */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-40">
        <WeeklyProgressBot position="bottom-right" showNotifications={true} />
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="h-24 lg:hidden"></div>

      {/* Weekly Progress Bot - Mobile Version (Smaller & Compact) */}
      <div className="lg:hidden fixed bottom-32 right-3 z-40 transform scale-75 origin-bottom-right">
        <WeeklyProgressBot position="bottom-right" showNotifications={true} />
      </div>

      {/* Mobile Navigation Tabs - Floating Glass Tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-6">
        <div className="flex items-center space-x-4">
          {/* Weekly Analysis Tab */}
          <button
            onClick={() => window.location.href = '/weekly-analysis'}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-20 bg-gradient-to-br from-amber-400/10 to-orange-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-amber-400/30 border border-amber-300/20">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400/30 to-orange-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-amber-400/40 border border-amber-300/30 mb-2">
                <svg className="w-5 h-5 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-amber-100 group-hover:text-amber-50 transition-colors duration-300 tracking-wide">Analysis</span>
            </div>
          </button>
          
          {/* Prayer Tab */}
          <button
            onClick={() => window.location.href = '/prayer'}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/30 border border-blue-300/20">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-indigo-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/40 border border-blue-300/30 mb-2">
                <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300 tracking-wide">Prayer</span>
            </div>
          </button>
          
          {/* Community Tab */}
          <button
            onClick={() => window.location.href = '/community'}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-20 bg-gradient-to-br from-emerald-400/10 to-teal-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/30 border border-emerald-300/20">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/30 to-teal-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/40 border border-emerald-300/30 mb-2">
                <svg className="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-100 group-hover:text-emerald-50 transition-colors duration-300 tracking-wide">Community</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

