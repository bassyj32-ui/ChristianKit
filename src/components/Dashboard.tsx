import React, { useState, useEffect } from 'react'
import { WeeklyProgress } from './WeeklyProgress'
import { CommunityPage } from './CommunityPage'
import { WeeklyProgressBot } from './WeeklyProgressBot'
import { DailyReEngagementCard } from './DailyReEngagementCard'
import { AdvancedWeeklyProgress } from './AdvancedWeeklyProgress'
import { MonthlyHabitBuilder } from './MonthlyHabitBuilder'
import { CommunityPrayerRequests } from './CommunityPrayerRequests'
import { ProFeatureGate } from './ProFeatureGate'
import { BibleReadingPage } from './BibleReadingPage'
import { MeditationPage } from './MeditationPage'
import { FloatingAuthTab } from './FloatingAuthTab'
import { PrayerSystemInterface } from './PrayerSystemInterface'

import { prayerService } from '../services/prayerService'
import { subscriptionService } from '../services/subscriptionService'
import { dailyReEngagementService } from '../services/dailyReEngagementService'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import ProgressService from '../services/ProgressService'

interface DashboardProps {
  onNavigate?: (page: string, duration?: number) => void;
  userPlan?: {
    prayerTime: number;
    bibleTime: number;
    prayerStyle: string;
    prayerFocus: string[];
    bibleTopics: string[];
    customPlan?: {
      prayer: {
        title: string;
        description: string;
        duration: number;
        focus: string[];
        style: string;
        tips: string[];
      };
      reading: {
        title: string;
        description: string;
        duration: number;
        topics: string[];
        approach: string;
        tips: string[];
      };
      reflection: {
        title: string;
        description: string;
        duration: number;
        method: string;
        prompts: string[];
        tips: string[];
      };
    };
  } | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userPlan }) => {
  console.log('🔍 Dashboard: Component initialized with props:', { onNavigate: !!onNavigate, userPlan: !!userPlan })
  
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'dashboard' | 'prayerSystem'>('dashboard')
  const [todayProgress, setTodayProgress] = useState({
    prayer: 0,
    bible: 0,
    meditation: 0
  })
  const [prayerProgress, setPrayerProgress] = useState({
    currentStreak: 0,
    totalPrayers: 0,
    currentLevel: 'beginner',
    daysThisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const { user, signOut: logout } = useSupabaseAuth()

  useEffect(() => {
    const loadTodayProgress = async () => {
      try {
        console.log('🔍 Dashboard: Loading today\'s progress...')
        setLoading(true)
        
        // Initialize subscription service if user is logged in
        if (user?.id) {
          console.log('🔍 Dashboard: Initializing services for user:', user.id)
          await subscriptionService.initializeUserSubscription(user.id)
          await dailyReEngagementService.initialize()
        }
        
        console.log('🔍 Dashboard: Getting prayer sessions...')
        const sessions = await prayerService.getPrayerSessions()
        console.log('🔍 Dashboard: Prayer sessions loaded:', sessions.length)
        
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

        // Load prayer system progress
        if (user?.id) {
          try {
            const { prayerSystemService } = await import('../services/PrayerSystemService')
            const userProfile = prayerSystemService.getUserProfile(user.id)
            if (userProfile) {
              setPrayerProgress({
                currentStreak: userProfile.currentStreak,
                totalPrayers: userProfile.completedDays,
                currentLevel: userProfile.currentLevel,
                daysThisMonth: userProfile.completedDays % 30 // Approximate monthly count
              })
            }
          } catch (error) {
            console.log('Prayer system not yet initialized for this user')
          }
        }
        
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
        
        console.log('🔍 Dashboard: Progress calculated:', { prayer: prayerProgress, bible: bibleProgress, meditation: meditationProgress })
        
        setTodayProgress({
          prayer: prayerProgress,
          bible: bibleProgress,
          meditation: meditationProgress
        })
      } catch (error) {
        console.error('🚨 Dashboard Error loading today\'s progress:', error)
        // Set default progress on error
        setTodayProgress({
          prayer: 0,
          bible: 0,
          meditation: 0
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadTodayProgress()
  }, [user?.id])

  // Simple test render first
  console.log('🔍 Dashboard: Attempting to render...')
  
  // Show Prayer System Interface if selected
  if (currentView === 'prayerSystem') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden font-sans">
        {/* Back to Dashboard Button */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-white/10 backdrop-blur-xl hover:bg-white/20 rounded-xl p-3 text-white transition-all duration-300 hover:scale-105 border border-white/20"
          >
            ← Back to Dashboard
          </button>
        </div>

        <PrayerSystemInterface
          onNavigate={onNavigate}
          userPlan={userPlan}
        />
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden font-sans">
      {/* Osmo-inspired Minimal Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] pointer-events-none">
        {/* Subtle Gradient Overlays - Osmo Style */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/3 via-transparent to-[var(--accent-primary)]/3"></div>
        
        {/* Minimal Glow Effects */}
        <div className="absolute top-1/6 left-1/6 w-96 h-96 bg-[var(--accent-primary)]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-primary-500)]/3 rounded-full blur-3xl"></div>
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
        <div className="absolute top-1/6 left-1/4 w-2 h-2 bg-[var(--color-primary-500)] rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-[var(--color-info-500)] rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 left-1/6 w-1 h-1 bg-[var(--color-success-500)] rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-2/5 right-1/5 w-1.5 h-1.5 bg-[var(--color-primary-500)]/80 rounded-full animate-bounce" style={{animationDuration: '3.5s', animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-[var(--color-info-500)]/80 rounded-full animate-bounce" style={{animationDuration: '2s', animationDelay: '1.5s'}}></div>
        <div className="absolute top-3/5 right-1/4 w-1 h-1 bg-[var(--color-success-500)]/80 rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
      </div>



      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Hero Section - Osmo Style */}
        <div className="pt-8 pb-12">
          <div className="text-center max-w-4xl mx-auto">
            
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-[var(--color-neutral-50)]">
              Grow{' '}
              <span className="bg-gradient-to-r from-[var(--color-warning-500)] via-[var(--color-warning-600)] to-[var(--color-warning-500)] bg-clip-text text-transparent">
                Closer to God
              </span>
              {' '}Every Day with ChristianKit
            </h1>

            <p className="text-lg text-[var(--color-neutral-400)] max-w-3xl mx-auto mb-8 hidden md:block">
              ChristianKit helps believers grow in faith through daily prayer, Bible reading, and community connection. Join thousands building consistent spiritual practices.
            </p>
          </div>
        </div>


        {/* Main Actions - Compact Responsive Grid */}
        <div className="w-full mb-16">
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-3 xl:gap-4 max-w-7xl mx-auto">
                        {/* Personalized Prayer Card */}
            <div className="bg-[var(--color-neutral-800)]/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-[var(--color-neutral-700)]/10 hover:border-[var(--color-neutral-700)]/20 transition-all duration-300 group cursor-pointer"
            onClick={async () => {
              const prayerTime = userPlan?.customPlan?.prayer?.duration || userPlan?.prayerTime || 15;
              
              // Record session start for progress tracking
              if (user) {
                try {
                  await ProgressService.saveSession({
                    user_id: user.id,
                    started_at: new Date().toISOString(),
                    duration_minutes: prayerTime,
                    prayer_type: 'prayer',
                    notes: userPlan?.customPlan?.prayer?.focus?.join(', ') || undefined
                  });
                  console.log('✅ Prayer session started and recorded');
                } catch (error) {
                  console.error('❌ Error recording prayer session start:', error);
                  // Continue even if database recording fails
                }
              }
              
              onNavigate?.('prayer', prayerTime);
            }}>
              {/* Prayer Images - Animated Slideshow */}
              <div className="h-16 sm:h-20 md:h-28 lg:h-32 bg-gradient-to-br from-[var(--color-primary-500)]/20 to-[var(--color-info-500)]/20 relative overflow-hidden">
                {/* Image 1 - Golden light through stained glass */}
                <img 
                  src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=200&fit=crop&crop=center"
                  alt="Divine golden light through stained glass"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-all duration-500 absolute inset-0 animate-pulse"
                  style={{animationDuration: '4s'}}
                />
                {/* Image 2 - Angelic prayer hands with golden glow */}
                <img 
                  src="https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=200&fit=crop&crop=center"
                  alt="Angelic prayer hands with divine light"
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all duration-700 absolute inset-0 animate-pulse"
                  style={{animationDuration: '6s', animationDelay: '2s'}}
                />
                {/* Image 3 - Heavenly clouds with light rays */}
                <img 
                  src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop&crop=center"
                  alt="Heavenly clouds with divine light rays"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-all duration-1000 absolute inset-0 animate-pulse"
                  style={{animationDuration: '8s', animationDelay: '4s'}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <div className="w-8 h-8 bg-[var(--color-neutral-50)]/30 backdrop-blur-sm rounded-lg flex items-center justify-center animate-bounce group-hover:scale-110 transition-transform duration-300" style={{animationDuration: '3s'}}>
                    <svg className="w-4 h-4 text-[var(--color-neutral-50)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-2 md:p-6">
                <h3 className="text-sm md:text-lg font-semibold text-[var(--color-neutral-50)] mb-0.5 md:mb-1">
                  My Prayer
                </h3>
                <p className="text-[var(--color-neutral-400)] text-xs mb-1 md:mb-2 hidden md:block">
                  Your daily prayer practice
                </p>
                {userPlan?.customPlan?.prayer?.focus && (
                  <div className="hidden md:flex flex-wrap gap-1 mb-1 md:mb-2">
                    {userPlan.customPlan.prayer.focus.slice(0, 2).map((focus: string, index: number) => (
                      <span key={index} className="px-1.5 py-0.5 bg-[var(--color-primary-500)]/20 text-[var(--color-primary-400)] text-xs rounded-full animate-pulse" style={{animationDelay: `${index * 0.2}s`}}>
                        {focus}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-neutral-400)]">
                    {userPlan?.customPlan?.prayer?.duration || userPlan?.prayerTime || 15} min
                  </span>
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[var(--color-neutral-50)]/10 flex items-center justify-center">
                    <svg className="w-2 h-2 md:w-3 md:h-3 text-[var(--color-neutral-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  </div>
                </div>
              </div>
            </div>

                        {/* Personalized Bible Reading Card */}
            <div className="bg-[var(--color-neutral-800)]/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-[var(--color-neutral-700)]/10 hover:border-[var(--color-neutral-700)]/20 transition-all duration-300 group cursor-pointer"
            onClick={async () => {
              const bibleTime = userPlan?.customPlan?.reading?.duration || userPlan?.bibleTime || 20;
              
              // Record session start for progress tracking
              if (user) {
                try {
                  await ProgressService.saveSession({
                    user_id: user.id,
                    started_at: new Date().toISOString(),
                    duration_minutes: bibleTime,
                    prayer_type: 'bible',
                    notes: userPlan?.customPlan?.reading?.topics?.join(', ') || undefined
                  });
                  console.log('✅ Bible reading session started and recorded');
                } catch (error) {
                  console.error('❌ Error recording bible reading session start:', error);
                  // Continue even if database recording fails
                }
              }
              
              onNavigate?.('bible', bibleTime);
            }}>
              {/* Bible Images - Animated Collection */}
              <div className="h-16 sm:h-20 md:h-28 lg:h-32 bg-gradient-to-br from-[var(--color-warning-500)]/20 to-[var(--color-warning-600)]/20 relative overflow-hidden">
                {/* Image 1 - Ancient scrolls with divine light */}
                <img 
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop&crop=center"
                  alt="Ancient scrolls with divine light"
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-95 transition-all duration-500 absolute inset-0 animate-pulse"
                  style={{animationDuration: '5s'}}
                />
                {/* Image 2 - Golden Bible with heavenly glow */}
                <img 
                  src="https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=400&h=200&fit=crop&crop=center"
                  alt="Golden Bible with heavenly glow"
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all duration-700 absolute inset-0 animate-pulse"
                  style={{animationDuration: '7s', animationDelay: '2.5s'}}
                />
                {/* Image 3 - Sacred texts with angelic light */}
                <img 
                  src="https://images.unsplash.com/photo-1571043733612-d5444db4e10b?w=400&h=200&fit=crop&crop=faces"
                  alt="Sacred texts with angelic light"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-all duration-1000 absolute inset-0 animate-pulse"
                  style={{animationDuration: '9s', animationDelay: '5s'}}
                />
                {/* Image 4 - Divine wisdom scrolls */}
                <img 
                  src="https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=200&fit=crop&crop=center"
                  alt="Divine wisdom scrolls"
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-all duration-1200 absolute inset-0 animate-pulse"
                  style={{animationDuration: '11s', animationDelay: '7s'}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <div className="w-8 h-8 bg-[var(--color-warning-500)]/30 backdrop-blur-sm rounded-lg flex items-center justify-center animate-bounce group-hover:scale-110 transition-transform duration-300" style={{animationDuration: '4s'}}>
                    <svg className="w-4 h-4 text-[var(--color-neutral-50)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM3 19V6h8v13H3zm18 0h-8V6h8v13zm-7-9.5h6V11h-6V9.5zm0 2.5h6v1.5h-6V12zm0 2.5h6V16h-6v-1.5z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-2 md:p-6">
                <h3 className="text-sm md:text-lg font-semibold text-[var(--color-neutral-50)] mb-0.5 md:mb-1">
                  My Bible Study
                </h3>
                <p className="text-[var(--color-neutral-400)] text-xs mb-1 md:mb-2 hidden md:block">
                  Your scripture reading time
                </p>
                {userPlan?.customPlan?.reading?.topics && (
                  <div className="hidden md:flex flex-wrap gap-1 mb-1 md:mb-2">
                    {userPlan.customPlan.reading.topics.slice(0, 2).map((topic: string, index: number) => (
                      <span key={index} className="px-1.5 py-0.5 bg-[var(--color-success-500)]/20 text-[var(--color-success-400)] text-xs rounded-full animate-pulse" style={{animationDelay: `${index * 0.2}s`}}>
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-neutral-400)]">
                    {userPlan?.customPlan?.reading?.duration || userPlan?.bibleTime || 20} min
                  </span>
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[var(--color-neutral-50)]/10 flex items-center justify-center">
                    <svg className="w-2 h-2 md:w-3 md:h-3 text-[var(--color-neutral-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  </div>
                </div>
              </div>
            </div>

                        {/* Core Prayer System Card - SECOND MOST IMPORTANT FEATURE */}
            <div className="bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-indigo-500/20 backdrop-blur-xl rounded-2xl overflow-hidden border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-500 group cursor-pointer shadow-lg hover:shadow-purple-500/25"
            onClick={() => {
              setCurrentView('prayerSystem');
            }}>
              {/* Meditation Images - Peaceful Animation */}
              <div className="h-16 sm:h-20 md:h-28 lg:h-32 bg-gradient-to-br from-[var(--color-success-500)]/20 to-[var(--color-info-500)]/20 relative overflow-hidden">
                {/* Image 1 - Heavenly light through clouds */}
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=center"
                  alt="Heavenly light breaking through clouds"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-all duration-500 absolute inset-0 animate-pulse"
                  style={{animationDuration: '6s'}}
                />
                {/* Image 2 - Divine peace and tranquility */}
                <img 
                  src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop&crop=center"
                  alt="Divine peace and tranquility"
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all duration-700 absolute inset-0 animate-pulse"
                  style={{animationDuration: '8s', animationDelay: '3s'}}
                />
                {/* Image 3 - Angelic meditation space */}
                <img 
                  src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&h=200&fit=crop&crop=faces"
                  alt="Angelic meditation space"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-all duration-1000 absolute inset-0 animate-pulse"
                  style={{animationDuration: '10s', animationDelay: '6s'}}
                />
                {/* Image 4 - Sacred reflection garden */}
                <img 
                  src="https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&h=200&fit=crop&crop=center"
                  alt="Sacred reflection garden"
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-all duration-1200 absolute inset-0 animate-pulse"
                  style={{animationDuration: '12s', animationDelay: '9s'}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <div className="w-8 h-8 bg-[var(--color-success-500)]/30 backdrop-blur-sm rounded-lg flex items-center justify-center animate-bounce group-hover:scale-110 transition-transform duration-300" style={{animationDuration: '5s'}}>
                    <svg className="w-4 h-4 text-[var(--color-neutral-50)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-2 md:p-6">
                <h3 className="text-sm md:text-lg font-semibold text-[var(--color-neutral-50)] mb-0.5 md:mb-1">
                  My Prayer Time
                </h3>
                <p className="text-[var(--color-neutral-400)] text-xs mb-1 md:mb-2 hidden md:block">
                  Your daily prayer journey
                </p>
                {userPlan?.customPlan?.reflection?.prompts && (
                  <div className="hidden md:flex flex-wrap gap-1 mb-1 md:mb-2">
                    {userPlan.customPlan.reflection.prompts.slice(0, 2).map((prompt: string, index: number) => (
                      <span key={index} className="px-1.5 py-0.5 bg-[var(--color-warning-500)]/20 text-[var(--color-warning-400)] text-xs rounded-full animate-pulse" style={{animationDelay: `${index * 0.2}s`}}>
                        {prompt}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-neutral-400)]">
                    {userPlan?.customPlan?.reflection?.duration || userPlan?.prayerTime || 10} min
                  </span>
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[var(--color-neutral-50)]/10 flex items-center justify-center">
                    <svg className="w-2 h-2 md:w-3 md:h-3 text-[var(--color-neutral-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

                {/* SPIRITUAL GROWTH PROGRESS - CORE FEATURE #2 */}
                <div className="mt-8 mb-8 w-full">
                  <div className="bg-gradient-to-r from-purple-500/20 via-blue-500/15 to-indigo-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 shadow-lg">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center justify-center">
                        <span className="text-3xl mr-3">🙏</span>
                        Your Spiritual Journey
                      </h2>
                      <p className="text-white/70">Grow in faith through daily prayer</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      {/* Prayer Streak */}
                      <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                        <div className="text-3xl mb-2">🔥</div>
                        <div className="text-2xl font-bold text-amber-400">{prayerProgress.currentStreak}</div>
                        <div className="text-white/70 text-sm">Day Streak</div>
                      </div>

                      {/* Total Prayers */}
                      <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                        <div className="text-3xl mb-2">📚</div>
                        <div className="text-2xl font-bold text-blue-400">{prayerProgress.totalPrayers}</div>
                        <div className="text-white/70 text-sm">Total Prayers</div>
                      </div>

                      {/* Current Level */}
                      <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                        <div className="text-3xl mb-2">
                          {prayerProgress.currentLevel === 'beginner' ? '🌱' :
                           prayerProgress.currentLevel === 'intermediate' ? '🌿' : '🌳'}
                        </div>
                        <div className="text-lg font-bold text-purple-400 capitalize">{prayerProgress.currentLevel}</div>
                        <div className="text-white/70 text-sm">Prayer Level</div>
                      </div>

                      {/* Monthly Progress */}
                      <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                        <div className="text-3xl mb-2">📅</div>
                        <div className="text-2xl font-bold text-green-400">{prayerProgress.daysThisMonth}</div>
                        <div className="text-white/70 text-sm">This Month</div>
                      </div>
                    </div>

                    {/* Quick Prayer Access */}
                    <div className="text-center">
                      <button
                        onClick={() => setCurrentView('prayerSystem')}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
                      >
                        🙏 Start Today's Prayer Journey
                      </button>
                      <p className="text-white/60 text-sm mt-2">5-20 minutes • Scripture + Reflection + Growth</p>
                    </div>
                  </div>
                </div>

                {/* Weekly Analysis - Polished Osmo Style */}
        <div className="mt-12 mb-12 w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-neutral-50)] mb-2">
              Your Weekly Progress
            </h2>
            <p className="text-[var(--color-neutral-400)] text-sm max-w-xl mx-auto">
              Track your spiritual journey with detailed insights
            </p>
          </div>
          
          <div className="bg-[var(--color-neutral-800)]/5 backdrop-blur-xl border border-[var(--color-neutral-700)]/10 rounded-2xl p-4 md:p-6 hover:bg-[var(--color-neutral-800)]/8 transition-all duration-300">
            <WeeklyProgress showSummary={true} embedded={true} />
          </div>
        </div>

        {/* Pro Features - Osmo Style */}
        <div className="mt-12 w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-warning-500)]/10 to-[var(--color-warning-600)]/10 border border-[var(--color-warning-500)]/20 backdrop-blur-sm mb-4">
              <span className="text-[var(--color-warning-500)] mr-2">⭐</span>
              <span className="text-sm font-medium text-[var(--color-warning-600)]">Pro Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--color-neutral-50)]">
              Unlock your{' '}
              <span className="bg-gradient-to-r from-[var(--color-warning-500)] to-[var(--color-warning-600)] bg-clip-text text-transparent">
                spiritual potential
              </span>
            </h2>
            <p className="text-[var(--color-neutral-400)] max-w-2xl mx-auto">
              Access advanced tools designed to deepen your faith journey and build lasting spiritual habits.
            </p>
          </div>
        </div>

                        {/* Pro Features - Compact Osmo Style with SVG */}
        <div className="mb-12">
          <div className="bg-[var(--color-neutral-800)]/5 backdrop-blur-xl border border-[var(--color-neutral-700)]/10 rounded-2xl p-6 hover:bg-[var(--color-neutral-800)]/8 transition-all duration-300 group">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              
              {/* Left: Price & Title */}
              <div className="text-center lg:text-left lg:w-1/3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-warning-500)]/20 border border-[var(--color-warning-500)]/30 text-xs font-semibold text-[var(--color-warning-600)] mb-3">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  PRO
                </div>
                <div className="text-3xl font-bold text-[var(--color-neutral-50)] mb-1">$2.50</div>
                <div className="text-[var(--color-warning-600)] text-sm mb-2">per month</div>
                <p className="text-[var(--color-neutral-400)] text-sm">All spiritual growth tools</p>
              </div>

              {/* Center: Features with SVG Icons */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Daily Messages */}
                <div className="text-center p-3 rounded-lg bg-[var(--color-neutral-800)]/5 border border-[var(--color-neutral-700)]/10 hover:bg-[var(--color-neutral-800)]/10 transition-all duration-300 group/feature">
                  <div className="w-8 h-8 mx-auto mb-2 text-[var(--color-warning-500)] group-hover/feature:scale-110 transition-transform duration-300">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="animate-pulse">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-[var(--color-neutral-50)]">Daily Messages</div>
                </div>

                {/* Analytics */}
                <div className="text-center p-3 rounded-lg bg-[var(--color-neutral-800)]/5 border border-[var(--color-neutral-700)]/10 hover:bg-[var(--color-neutral-800)]/10 transition-all duration-300 group/feature">
                  <div className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary-500)] group-hover/feature:scale-110 transition-transform duration-300">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="animate-bounce" style={{animationDuration: '3s'}}>
                      <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-[var(--color-neutral-50)]">Analytics</div>
                </div>

                {/* Habit Builder */}
                <div className="text-center p-3 rounded-lg bg-[var(--color-neutral-800)]/5 border border-[var(--color-neutral-700)]/10 hover:bg-[var(--color-neutral-800)]/10 transition-all duration-300 group/feature">
                  <div className="w-8 h-8 mx-auto mb-2 text-[var(--color-info-500)] group-hover/feature:scale-110 transition-transform duration-300">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="animate-pulse" style={{animationDelay: '1s'}}>
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-[var(--color-neutral-50)]">Habits</div>
                </div>

                {/* Community */}
                <div className="text-center p-3 rounded-lg bg-[var(--color-neutral-800)]/5 border border-[var(--color-neutral-700)]/10 hover:bg-[var(--color-neutral-800)]/10 transition-all duration-300 group/feature">
                  <div className="w-8 h-8 mx-auto mb-2 text-[var(--color-success-500)] group-hover/feature:scale-110 transition-transform duration-300">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="animate-bounce" style={{animationDuration: '4s', animationDelay: '2s'}}>
                      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-[var(--color-neutral-50)]">Community</div>
                </div>
              </div>
              
              {/* Right: CTA */}
              <div className="lg:w-1/4 text-center">
                <button 
                  onClick={() => onNavigate?.('subscription')}
                  className="bg-gradient-to-r from-[var(--color-warning-500)] to-[var(--color-warning-600)] text-[var(--color-neutral-50)] py-3 px-6 rounded-lg font-semibold hover:from-[var(--color-warning-600)] hover:to-[var(--color-warning-500)] transition-all duration-300 shadow-lg shadow-[var(--color-warning-500)]/25 transform hover:scale-105 w-full lg:w-auto group-hover:shadow-[var(--color-warning-500)]/40"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Upgrade Pro
              </button>
                <p className="text-[var(--color-neutral-400)] text-xs mt-2">2,847 believers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call-to-Action Banner */}
        <div className="bg-gradient-to-r from-[var(--color-warning-500)]/10 via-[var(--color-warning-600)]/10 to-[var(--color-warning-500)]/10 border border-[var(--color-warning-500)]/20 rounded-2xl p-6 text-center mb-12">
          <h3 className="text-2xl font-bold text-[var(--color-neutral-50)] mb-3">
            Join thousands growing their faith with Pro features
          </h3>
          <p className="text-[var(--color-neutral-400)] mb-6 max-w-2xl mx-auto">
            Unlock all advanced spiritual growth tools and join a community of believers committed to consistent faith development.
          </p>
          <button 
            onClick={() => onNavigate?.('subscription')}
            className="bg-gradient-to-r from-[var(--color-warning-500)] to-[var(--color-warning-600)] text-[var(--color-neutral-50)] py-3 px-8 rounded-xl font-bold hover:from-[var(--color-warning-600)] hover:to-[var(--color-warning-500)] transition-all duration-300 shadow-lg shadow-[var(--color-warning-500)]/25 transform hover:scale-105"
          >
            🚀 Start Your Pro Journey - $2.50/month
          </button>
        </div>




          
                {/* Community Engagement - User Proof */}
        <div className="mt-16 w-full">
          <div className="bg-[var(--color-neutral-800)]/5 backdrop-blur-xl rounded-2xl p-6 text-[var(--color-neutral-50)] border border-[var(--color-neutral-700)]">
            <h3 className="text-lg font-semibold text-center text-[var(--color-neutral-50)] mb-4">Join 2,847 believers worldwide</h3>
            
            {/* User Avatar Grid - Compact Circles */}
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {/* Row 1 - 8 users */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-500)]/60 border-2 border-[var(--color-primary-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                S
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-success-500)] to-[var(--color-success-500)]/60 border-2 border-[var(--color-success-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                M
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-info-500)] to-[var(--color-info-500)]/60 border-2 border-[var(--color-info-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                J
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-error-500)] to-[var(--color-error-500)]/60 border-2 border-[var(--color-error-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                A
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-warning-500)] to-[var(--color-warning-500)]/60 border-2 border-[var(--color-warning-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                D
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-info-500)] to-[var(--color-info-500)]/60 border-2 border-[var(--color-info-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                L
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-500)]/60 border-2 border-[var(--color-primary-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                R
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-error-500)] to-[var(--color-error-500)]/60 border-2 border-[var(--color-error-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                K
              </div>
              
              {/* Row 2 - 6 more users */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-info-500)] to-[var(--color-info-500)]/60 border-2 border-[var(--color-info-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                E
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-warning-500)] to-[var(--color-warning-500)]/60 border-2 border-[var(--color-warning-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                T
                </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-success-500)] to-[var(--color-success-500)]/60 border-2 border-[var(--color-success-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                C
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-info-500)] to-[var(--color-info-500)]/60 border-2 border-[var(--color-info-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                N
            </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-500)]/60 border-2 border-[var(--color-primary-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                B
          </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-error-500)] to-[var(--color-error-500)]/60 border-2 border-[var(--color-error-500)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                H
            </div>

              {/* "+" indicator for more users */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-neutral-400)] to-[var(--color-neutral-400)]/70 border-2 border-[var(--color-neutral-400)]/40 flex items-center justify-center text-xs font-bold text-[var(--color-neutral-50)]">
                +
            </div>
          </div>
          
            <p className="text-center text-[var(--color-neutral-400)] text-sm">
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
            <CommunityPage />
          </div>
        </div>





        {/* Theme Showcase */}
        <div className="mt-16 w-full">
          <div className="bg-[var(--color-neutral-800)]/5 backdrop-blur-xl rounded-2xl p-8 text-[var(--color-neutral-50)] border border-[var(--color-neutral-700)] text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[var(--color-warning-500)] to-[var(--color-warning-600)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🎨</span>
        </div>
            <h3 className="text-2xl font-bold mb-4 text-[var(--color-neutral-50)]">Experience our new design</h3>
            <p className="text-[var(--color-neutral-400)] mb-6 max-w-md mx-auto">
              Inspired by world-class design, crafted for your spiritual journey
            </p>
            <button
              onClick={() => onNavigate?.('osmo-landing')}
              className="bg-gradient-to-r from-[var(--color-warning-500)] to-[var(--color-warning-600)] text-[var(--color-neutral-50)] py-3 px-8 rounded-lg font-semibold hover:from-[var(--color-warning-600)] hover:to-[var(--color-warning-500)] transition-all duration-300 shadow-lg shadow-[var(--color-warning-500)]/25"
            >
              View Landing Page
            </button>
          </div>
        </div>



        {/* Legal Footer */}
        <div className="mt-8 sm:mt-12 pb-8">
          <div className="border-t border-[var(--color-warning-500)]/30 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <div className="text-[var(--color-warning-600)] text-sm">
                © 2024 ChristianKit. All rights reserved.
              </div>

              {/* Legal Links */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
                <a 
                  href="/privacy.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--color-warning-600)] hover:text-[var(--color-warning-500)] transition-colors duration-200"
                >
                  Privacy Policy
                </a>
                <a 
                  href="/terms.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--color-warning-600)] hover:text-[var(--color-warning-500)] transition-colors duration-200"
                >
                  Terms of Service
                </a>
                <a 
                  href="/refund.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--color-warning-600)] hover:text-[var(--color-warning-500)] transition-colors duration-200"
                >
                  Refund Policy
                </a>
                <a 
                  href="mailto:support@christiankit.app"
                  className="text-[var(--color-warning-600)] hover:text-[var(--color-warning-500)] transition-colors duration-200"
                >
                  Contact Support
                </a>
              </div>

              {/* Payment Info */}
              <div className="text-[var(--color-warning-600)] text-xs text-center sm:text-right">
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
      <div className="lg:hidden fixed bottom-20 right-3 z-40 transform scale-75 origin-bottom-right">
        <WeeklyProgressBot position="bottom-right" showNotifications={true} />
      </div>



      {/* Main Navigation Tabs - Beautiful Osmo Style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-4">
        <div className="flex items-center space-x-2 bg-[var(--color-neutral-800)]/80 backdrop-blur-xl rounded-2xl p-2 border border-[var(--color-neutral-700)] shadow-2xl">
          {/* Analysis Tab */}
          <button
            onClick={() => onNavigate?.('analysis')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary-500)]/30 to-[var(--color-info-500)]/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-[var(--color-primary-500)]/50 border-2 border-blue-500/80 group-hover:border-blue-500">
              <span className="text-lg">📊</span>
            </div>
            <span className="text-xs font-bold text-[var(--color-neutral-50)] group-hover:text-[var(--color-primary-500)] transition-colors duration-300">
              Analysis
            </span>
          </button>
          
          {/* Prayer Tab - CORE FEATURE #2 */}
          <button
            onClick={() => setCurrentView('prayerSystem')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/30 to-blue-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/50 border-2 border-purple-500/80 group-hover:border-purple-500">
              <span className="text-lg">🙏</span>
            </div>
            <span className="text-xs font-bold text-[var(--color-neutral-50)] group-hover:text-purple-400 transition-colors duration-300">
              Prayer
            </span>
          </button>
          
          {/* Community Tab */}
          <button
            onClick={() => onNavigate?.('community')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-warning-500)]/30 to-[var(--color-warning-600)]/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-[var(--color-warning-500)]/50 border-2 border-amber-500/80 group-hover:border-amber-500">
              <span className="text-lg">👥</span>
            </div>
            <span className="text-xs font-bold text-[var(--color-neutral-50)] group-hover:text-[var(--color-warning-500)] transition-colors duration-300">
              Community
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

