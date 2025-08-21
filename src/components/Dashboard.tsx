import React, { useState, useEffect } from 'react'
import { WeeklyProgress } from './WeeklyProgress'
import { CommunitySection } from './CommunitySection'
import { WeeklyProgressBot } from './WeeklyProgressBot'
import { DailyReEngagementCard } from './DailyReEngagementCard'
import { AdvancedWeeklyProgress } from './AdvancedWeeklyProgress'
import { MonthlyHabitBuilder } from './MonthlyHabitBuilder'
import { CommunityPrayerRequests } from './CommunityPrayerRequests'
import { ProFeatureGate } from './ProFeatureGate'

import { prayerService } from '../services/prayerService'
import { subscriptionService } from '../services/subscriptionService'
import { dailyReEngagementService } from '../services/dailyReEngagementService'
import { useSupabaseAuth } from './SupabaseAuthProvider'

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
  const { user, signOut: logout } = useSupabaseAuth()

  useEffect(() => {
    const loadTodayProgress = async () => {
      try {
        setLoading(true)
        
        // Initialize subscription service if user is logged in
        if (user?.id) {
          await subscriptionService.initializeUserSubscription(user.id)
          await dailyReEngagementService.initialize()
        }
        
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
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden font-sans">
      {/* Osmo-inspired Minimal Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] pointer-events-none">
        {/* Subtle Gradient Overlays - Osmo Style */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 via-transparent to-amber-500/3"></div>
        
        {/* Minimal Glow Effects */}
        <div className="absolute top-1/6 left-1/6 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl"></div>
      </div>

      {/* Subtle Grid Pattern - Very Minimal */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
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

      {/* App Bar - Osmo Style */}
      <div className="relative z-50 bg-black/50 backdrop-blur-xl border-b border-white/10 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Osmo-style Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/25">
                <span className="text-black font-bold text-xs sm:text-sm">✝</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors duration-300">
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Christian</span>
                <span className="text-white">Kit</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-3">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="px-4 py-2 rounded-lg font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all duration-300 flex items-center space-x-2"
              >
                <span>🏠</span>
                <span>Home</span>
              </button>
              <button
                onClick={() => onNavigate?.('prayer')}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center space-x-2"
              >
                <span>✨</span>
                <span>Prayer</span>
              </button>
              <button
                onClick={() => onNavigate?.('community')}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center space-x-2"
              >
                <span>👥</span>
                <span>Community</span>
              </button>
              <button
                onClick={() => onNavigate?.('subscription')}
                className="px-4 py-2 rounded-lg font-semibold text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-amber-500/25"
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
                  {user?.user_metadata?.display_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">{user?.user_metadata?.display_name || 'User'}</div>
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section - Osmo Style */}
        <div className="pt-8 pb-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <span className="text-amber-400 mr-2">⭐</span>
              <span className="text-sm font-medium text-gray-300">Your daily spiritual growth continues</span>
            </div>
            
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Grow{' '}
              <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
                Closer to God
              </span>
              {' '}Every Day with ChristianKit
            </h1>

            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
              ChristianKit helps believers grow in faith through daily prayer, Bible reading, and community connection. Join thousands building consistent spiritual practices.
            </p>
          </div>
        </div>

        {/* Main Actions - Osmo Style Grid */}
        <div className="w-full mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Prayer Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer"
            onClick={() => {
                   const prayerTime = userPlan?.prayerTime || 15;
              onNavigate?.('prayer', prayerTime);
                 }}>
              {/* Prayer Images - Animated Slideshow */}
              <div className="h-32 bg-gradient-to-br from-blue-500/20 to-purple-600/20 relative overflow-hidden">
                {/* Image 1 - Person praying with peaceful expression */}
                <img 
                  src="https://images.unsplash.com/photo-1609234656388-0ff363894fbe?w=400&h=200&fit=crop&crop=faces"
                  alt="Person in peaceful prayer"
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all duration-500 absolute inset-0 animate-pulse"
                  style={{animationDuration: '4s'}}
                />
                {/* Image 2 - Praying hands with candle */}
                <img 
                  src="https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=200&fit=crop&crop=center"
                  alt="Praying hands with candle light"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 absolute inset-0 animate-pulse"
                  style={{animationDuration: '6s', animationDelay: '2s'}}
                />
                {/* Image 3 - Church prayer scene */}
                <img 
                  src="https://images.unsplash.com/photo-1605629921711-cc52d0872d1e?w=400&h=200&fit=crop&crop=center"
                  alt="Peaceful church prayer scene"
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-all duration-1000 absolute inset-0 animate-pulse"
                  style={{animationDuration: '8s', animationDelay: '4s'}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <div className="w-8 h-8 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center animate-bounce" style={{animationDuration: '3s'}}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">Prayer Time</h3>
                <p className="text-gray-400 text-sm mb-4">Begin your daily prayer and meditation</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">15 min session</span>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  </div>
                </div>
              </div>
            </div>

                        {/* Bible Reading Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer"
            onClick={() => {
              const bibleTime = userPlan?.bibleTime || 20;
              onNavigate?.('prayer', bibleTime);
                 }}>
              {/* Bible Images - Animated Collection */}
              <div className="h-32 bg-gradient-to-br from-amber-500/20 to-orange-600/20 relative overflow-hidden">
                {/* Image 1 - Open Bible with golden light */}
                <img 
                  src="https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=400&h=200&fit=crop&crop=center"
                  alt="Open Bible with golden divine light"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-all duration-500 absolute inset-0 animate-pulse"
                  style={{animationDuration: '5s'}}
                />
                {/* Image 2 - Person reading Bible */}
                <img 
                  src="https://images.unsplash.com/photo-1571043733612-d5444db4e10b?w=400&h=200&fit=crop&crop=faces"
                  alt="Person peacefully reading Bible"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-all duration-700 absolute inset-0 animate-pulse"
                  style={{animationDuration: '7s', animationDelay: '2.5s'}}
                />
                {/* Image 3 - Bible study group */}
                <img 
                  src="https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=200&fit=crop&crop=center"
                  alt="Bible study group gathering"
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-all duration-1000 absolute inset-0 animate-pulse"
                  style={{animationDuration: '9s', animationDelay: '5s'}}
                />
                {/* Image 4 - Ancient scripture */}
                <img 
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop&crop=center"
                  alt="Ancient scripture with warm candlelight"
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-70 transition-all duration-1200 absolute inset-0 animate-pulse"
                  style={{animationDuration: '11s', animationDelay: '7s'}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <div className="w-8 h-8 bg-amber-400/30 backdrop-blur-sm rounded-lg flex items-center justify-center animate-bounce" style={{animationDuration: '4s'}}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM3 19V6h8v13H3zm18 0h-8V6h8v13zm-7-9.5h6V11h-6V9.5zm0 2.5h6v1.5h-6V12zm0 2.5h6V16h-6v-1.5z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">Bible Study</h3>
                <p className="text-gray-400 text-sm mb-4">Read and reflect on God's word</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">20 min reading</span>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  </div>
                </div>
              </div>
            </div>

                        {/* Meditation Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer"
            onClick={() => {
              const prayerTime = userPlan?.prayerTime || 10;
              onNavigate?.('prayer', prayerTime);
                 }}>
              {/* Meditation Images - Peaceful Animation */}
              <div className="h-32 bg-gradient-to-br from-green-500/20 to-teal-600/20 relative overflow-hidden">
                {/* Image 1 - Person meditating in nature */}
                <img 
                  src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&h=200&fit=crop&crop=faces"
                  alt="Person meditating peacefully in nature"
                  className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-all duration-500 absolute inset-0 animate-pulse"
                  style={{animationDuration: '6s'}}
                />
                {/* Image 2 - Serene lake reflection */}
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=center"
                  alt="Peaceful mountain lake reflection"
                  className="w-full h-full object-cover opacity-55 group-hover:opacity-80 transition-all duration-700 absolute inset-0 animate-pulse"
                  style={{animationDuration: '8s', animationDelay: '3s'}}
                />
                {/* Image 3 - Lotus and zen stones */}
                <img 
                  src="https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&h=200&fit=crop&crop=center"
                  alt="Lotus flower and zen stones"
                  className="w-full h-full object-cover opacity-45 group-hover:opacity-70 transition-all duration-1000 absolute inset-0 animate-pulse"
                  style={{animationDuration: '10s', animationDelay: '6s'}}
                />
                {/* Image 4 - Peaceful forest path */}
                <img 
                  src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop&crop=center"
                  alt="Peaceful forest meditation path"
                  className="w-full h-full object-cover opacity-35 group-hover:opacity-65 transition-all duration-1200 absolute inset-0 animate-pulse"
                  style={{animationDuration: '12s', animationDelay: '9s'}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <div className="w-8 h-8 bg-green-400/30 backdrop-blur-sm rounded-lg flex items-center justify-center animate-bounce" style={{animationDuration: '5s'}}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">Meditation</h3>
                <p className="text-gray-400 text-sm mb-4">Find peace through mindful reflection</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">10 min session</span>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

                {/* Weekly Analysis - Polished Osmo Style */}
        <div className="mt-12 mb-12 w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Your Weekly Progress
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              Track your spiritual journey with detailed insights
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 hover:bg-white/8 transition-all duration-300">
            <WeeklyProgress showSummary={true} />
          </div>
        </div>

        {/* Pro Features - Osmo Style */}
        <div className="mt-12 w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-400/10 to-yellow-500/10 border border-amber-400/20 backdrop-blur-sm mb-4">
              <span className="text-amber-400 mr-2">⭐</span>
              <span className="text-sm font-medium text-amber-300">Pro Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Unlock your{' '}
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                spiritual potential
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Access advanced tools designed to deepen your faith journey and build lasting spiritual habits.
            </p>
          </div>
        </div>

                        {/* Pro Features - Compact Osmo Style with SVG */}
        <div className="mb-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300 group">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              
              {/* Left: Price & Title */}
              <div className="text-center lg:text-left lg:w-1/3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-xs font-semibold text-amber-300 mb-3">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  PRO
                </div>
                <div className="text-3xl font-bold text-white mb-1">$2.50</div>
                <div className="text-amber-300 text-sm mb-2">per month</div>
                <p className="text-gray-400 text-sm">All spiritual growth tools</p>
              </div>

              {/* Center: Features with SVG Icons */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Daily Messages */}
                <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group/feature">
                  <div className="w-8 h-8 mx-auto mb-2 text-amber-400 group-hover/feature:scale-110 transition-transform duration-300">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="animate-pulse">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-white">Daily Messages</div>
                </div>

                {/* Analytics */}
                <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group/feature">
                  <div className="w-8 h-8 mx-auto mb-2 text-blue-400 group-hover/feature:scale-110 transition-transform duration-300">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="animate-bounce" style={{animationDuration: '3s'}}>
                      <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-white">Analytics</div>
                </div>

                {/* Habit Builder */}
                <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group/feature">
                  <div className="w-8 h-8 mx-auto mb-2 text-purple-400 group-hover/feature:scale-110 transition-transform duration-300">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="animate-pulse" style={{animationDelay: '1s'}}>
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-white">Habits</div>
                </div>

                {/* Community */}
                <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group/feature">
                  <div className="w-8 h-8 mx-auto mb-2 text-green-400 group-hover/feature:scale-110 transition-transform duration-300">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="animate-bounce" style={{animationDuration: '4s', animationDelay: '2s'}}>
                      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-white">Community</div>
                </div>
              </div>
              
              {/* Right: CTA */}
              <div className="lg:w-1/4 text-center">
                <button 
                  onClick={() => onNavigate?.('subscription')}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black py-3 px-6 rounded-lg font-semibold hover:from-amber-300 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-amber-500/25 transform hover:scale-105 w-full lg:w-auto group-hover:shadow-amber-500/40"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Upgrade Pro
              </button>
                <p className="text-gray-500 text-xs mt-2">2,847 believers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call-to-Action Banner */}
        <div className="bg-gradient-to-r from-amber-400/10 via-yellow-500/10 to-amber-400/10 border border-amber-400/20 rounded-2xl p-6 text-center mb-12">
          <h3 className="text-2xl font-bold text-white mb-3">
            Join thousands growing their faith with Pro features
          </h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Unlock all advanced spiritual growth tools and join a community of believers committed to consistent faith development.
          </p>
          <button 
            onClick={() => onNavigate?.('subscription')}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black py-3 px-8 rounded-xl font-bold hover:from-amber-300 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-amber-500/25 transform hover:scale-105"
          >
            🚀 Start Your Pro Journey - $2.50/month
          </button>
        </div>




          
                {/* Community Engagement - User Proof */}
        <div className="mt-16 w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-white border border-white/10">
            <h3 className="text-lg font-semibold text-center text-white mb-4">Join 2,847 believers worldwide</h3>
            
            {/* User Avatar Grid - Compact Circles */}
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {/* Row 1 - 8 users */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-300/50 flex items-center justify-center text-xs font-bold text-white">
                S
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-green-300/50 flex items-center justify-center text-xs font-bold text-white">
                M
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-purple-300/50 flex items-center justify-center text-xs font-bold text-white">
                J
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-pink-300/50 flex items-center justify-center text-xs font-bold text-white">
                A
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300/50 flex items-center justify-center text-xs font-bold text-white">
                D
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 border-2 border-teal-300/50 flex items-center justify-center text-xs font-bold text-white">
                L
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 border-2 border-indigo-300/50 flex items-center justify-center text-xs font-bold text-white">
                R
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-rose-300/50 flex items-center justify-center text-xs font-bold text-white">
                K
              </div>
              
              {/* Row 2 - 6 more users */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 border-2 border-cyan-300/50 flex items-center justify-center text-xs font-bold text-white">
                E
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-orange-300/50 flex items-center justify-center text-xs font-bold text-white">
                T
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-emerald-300/50 flex items-center justify-center text-xs font-bold text-white">
                C
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 border-2 border-violet-300/50 flex items-center justify-center text-xs font-bold text-white">
                N
            </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 border-2 border-sky-300/50 flex items-center justify-center text-xs font-bold text-white">
                B
          </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-red-300/50 flex items-center justify-center text-xs font-bold text-white">
                H
            </div>

              {/* "+" indicator for more users */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 border-2 border-gray-400/50 flex items-center justify-center text-xs font-bold text-white">
                +
            </div>
          </div>
          
            <p className="text-center text-gray-400 text-sm">
              Growing together in faith, one day at a time
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





        {/* Theme Showcase */}
        <div className="mt-16 w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-white border border-white/10 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🎨</span>
        </div>
            <h3 className="text-2xl font-bold mb-4">Experience our new design</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Inspired by world-class design, crafted for your spiritual journey
            </p>
            <button
              onClick={() => onNavigate?.('osmo-landing')}
              className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black py-3 px-8 rounded-lg font-semibold hover:from-amber-300 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-amber-500/25"
            >
              View Landing Page
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

