import React, { useState, useEffect } from 'react';
import { prayerSystemService, DailyPrayer, UserPrayerProfile } from '../services/PrayerSystemService';
import { useSupabaseAuth } from './SupabaseAuthProvider';
import ProgressService from '../services/ProgressService';

interface PrayerSystemInterfaceProps {
  onNavigate?: (page: string, duration?: number) => void;
  onTimerComplete?: () => void;
  userPlan?: {
    prayerTime: number;
    reflectionTime?: number;
    currentLevel?: string;
  } | null;
  selectedMinutes?: number;
  isFirstTimeUser?: boolean;
}

export const PrayerSystemInterface: React.FC<PrayerSystemInterfaceProps> = ({
  onNavigate,
  onTimerComplete,
  userPlan,
  selectedMinutes: propSelectedMinutes,
  isFirstTimeUser = false
}) => {
  const { user } = useSupabaseAuth();
  const [dailyPrayer, setDailyPrayer] = useState<DailyPrayer | null>(null);
  const [userProfile, setUserProfile] = useState<UserPrayerProfile | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [isStarting, setIsStarting] = useState(false);
  const [showAdvancement, setShowAdvancement] = useState(false);
  const [currentView, setCurrentView] = useState<'prayer' | 'reflection' | 'community'>('prayer');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserPrayerData();
    }
  }, [user?.id]);

  const loadUserPrayerData = async () => {
    if (!user?.id || isLoading) return;

    setIsLoading(true);
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      // Starting prayer data loading for user

      // Set a timeout to ensure loading doesn't hang
      timeoutId = setTimeout(() => {
        // Loading timeout reached, using fallback
        setIsLoading(false);
        // Fallback will be triggered by the catch block
        throw new Error('Loading timeout');
      }, 5000); // 5 second timeout

      // Get or create user profile
      let profile = prayerSystemService.getUserProfile(user.id);
      // Profile status determined

      // If no profile exists, create a default beginner profile
      if (!profile) {
        // Creating default beginner profile
        profile = {
          userId: user.id,
          currentLevel: 'beginner',
          startDate: new Date(),
          completedDays: 0,
          currentStreak: 0,
          favoritePrayers: [],
          personalThemes: [],
          prayerGoals: [],
          advancementRequested: false,
          advancementReady: false,
          communityShared: 0,
          reflectionEntries: 0
        };
        prayerSystemService.savePrayerProgress(user.id, profile);
        // Profile created successfully
      }

      // Get daily prayer
      const prayer = prayerSystemService.getDailyPrayer(user.id);
      // Daily prayer loaded successfully

      // Clear timeout since we succeeded
      clearTimeout(timeoutId);

      setDailyPrayer(prayer);
      setUserProfile(profile);

      // Set duration based on prayer level
      const levelDuration = prayerSystemService.getUserLevel(user.id)?.duration || 5;
      setSelectedMinutes(levelDuration);

      // Prayer data loaded successfully
    } catch (error) {
      console.error('❌ Error loading prayer data:', error);

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Create a fallback prayer for beginners
      // Using fallback prayer content
      const fallbackPrayer = {
        level: 'beginner',
        day: new Date().getDate(),
        week: Math.ceil(new Date().getDate() / 7),
        theme: 'Gratitude & Praise',
        scripture: {
          reference: 'Psalm 100:4-5',
          text: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.',
          inspiration: 'Charles Spurgeon: "Praise is the rehearsal of our eternal song."'
        },
        prayers: {
          opening: 'Heavenly Father, I come to You with a grateful heart...',
          meditation: 'Thank You for Your goodness and mercy that never fail...',
          intercession: 'Please bless my family, friends, and those in need...',
          confession: 'Forgive me for the times I\'ve taken Your blessings for granted...',
          thanksgiving: 'I praise You for Your unfailing love and faithfulness...',
          closing: 'In Jesus\' name, Amen.'
        },
        reflection: {
          questions: [
            'What are three things I\'m grateful for today?',
            'How have I experienced God\'s goodness this week?',
            'What praise can I offer for His faithfulness?'
          ],
          journalPrompt: 'Write a thank-you note to God for His specific blessings in your life.'
        },
        nextSteps: [
          'Spend 2 minutes in silent reflection',
          'Read the suggested scripture passage',
          'Share this prayer with someone in your community'
        ]
      };

      setDailyPrayer(fallbackPrayer);
      setUserProfile({
        userId: user.id,
        currentLevel: 'beginner',
        startDate: new Date(),
        completedDays: 0,
        currentStreak: 0,
        favoritePrayers: [],
        personalThemes: [],
        prayerGoals: [],
        advancementRequested: false,
        advancementReady: false,
        communityShared: 0,
        reflectionEntries: 0
      });
      setSelectedMinutes(5);
      // Fallback prayer loaded successfully
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPrayer = async () => {
    if (!user?.id || !dailyPrayer) return;

    setIsStarting(true);

    try {
      // Record prayer session start
      await ProgressService.saveSession({
        user_id: user.id,
        started_at: new Date().toISOString(),
        duration_minutes: selectedMinutes,
        prayer_type: 'meditation',
        notes: `Prayer System: ${dailyPrayer.theme}`
      });

      // Navigate to timer with prayer content
      onNavigate?.('prayer', selectedMinutes);
    } catch (error) {
      console.error('Error starting prayer session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleRequestAdvancement = async () => {
    if (!user?.id) return;

    const result = prayerSystemService.requestAdvancement(user.id);

    if (result.success) {
      alert(`🎉 ${result.message}`);
      loadUserPrayerData(); // Refresh data
    } else {
      alert(`📋 ${result.message}`);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'from-green-500 to-emerald-600';
      case 'intermediate': return 'from-yellow-500 to-orange-600';
      case 'advanced': return 'from-purple-500 to-indigo-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🌿';
      case 'advanced': return '🌳';
      default: return '🙏';
    }
  };

  if (!dailyPrayer) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-6">
          {/* Animated Sacred Symbol */}
          <div className="relative">
            <div className="text-7xl mb-4 animate-pulse">🙏</div>
            <div className="absolute inset-0 text-7xl text-purple-400/20 animate-ping" style={{animationDuration: '2s'}}>🙏</div>
          </div>

          {/* Enhanced Loading Spinner */}
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500/50 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>

          {/* Loading Messages with Animation */}
          <div className="space-y-2">
            <p className="text-white/90 text-xl font-medium animate-pulse">Preparing your daily prayer...</p>
            <p className="text-white/70 text-base animate-pulse" style={{animationDelay: '0.5s'}}>Connecting with God's word</p>
            <p className="text-white/50 text-sm animate-pulse" style={{animationDelay: '1s'}}>Setting up your sacred space</p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>

          {/* Inspirational Quote */}
          <div className="max-w-md mx-auto mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <p className="text-white/80 text-sm italic">
              "Be still, and know that I am God." - Psalm 46:10
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Osmo-style Background with Animated Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/15 to-blue-900/20">
        {/* Floating Sacred Geometry */}
        <div className="absolute top-20 left-10 w-32 h-32 opacity-10 animate-pulse" style={{animationDuration: '8s'}}>
          <div className="w-full h-full border-2 border-purple-400/30 rounded-full"></div>
          <div className="absolute inset-4 border border-blue-400/20 rounded-full"></div>
          <div className="absolute inset-8 border border-indigo-400/20 rounded-full"></div>
        </div>
        <div className="absolute top-40 right-16 w-24 h-24 opacity-10 animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}}>
          <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full"></div>
        </div>
        <div className="absolute bottom-40 left-20 w-20 h-20 opacity-10 animate-pulse" style={{animationDuration: '10s', animationDelay: '4s'}}>
          <div className="w-full h-full border border-indigo-400/20 rotate-45"></div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto p-6 space-y-8">
        {/* Enhanced Header with Sacred Design */}
        <div className="text-center space-y-6">
          {/* Level Badge with Enhanced Design */}
          <div className="relative inline-block">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getLevelColor(dailyPrayer.level)} opacity-20 blur-xl animate-pulse`}></div>
            <div className={`relative inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${getLevelColor(dailyPrayer.level)} text-white text-sm font-bold shadow-2xl border border-white/20 backdrop-blur-sm`}>
              <span className="text-2xl mr-3 animate-bounce" style={{animationDuration: '3s'}}>{getLevelIcon(dailyPrayer.level)}</span>
              <span className="text-lg tracking-wide">{dailyPrayer.level.charAt(0).toUpperCase() + dailyPrayer.level.slice(1)} Pilgrim</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Sacred Title with Typography Hierarchy */}
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 tracking-tight">
              🙏 My Prayer Time
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full opacity-60"></div>
          </div>

          {/* Session Info with Beautiful Cards */}
          <div className="flex justify-center">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
              <div className="flex items-center space-x-6 text-white/90">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">{selectedMinutes} min</span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📅</span>
                  <span className="font-medium">Day {dailyPrayer.day}</span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌟</span>
                  <span className="font-medium">{dailyPrayer.theme}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Progress Stats */}
          {userProfile && (
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-xl p-3 border border-orange-500/20">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-xl font-bold text-orange-300">{userProfile.currentStreak}</div>
                <div className="text-xs text-orange-200/70">Day Streak</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-xl p-3 border border-blue-500/20">
                <div className="text-2xl mb-1">📚</div>
                <div className="text-xl font-bold text-blue-300">{userProfile.completedDays}</div>
                <div className="text-xs text-blue-200/70">Prayers Done</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-xl p-3 border border-purple-500/20">
                <div className="text-2xl mb-1">🤝</div>
                <div className="text-xl font-bold text-purple-300">{userProfile.communityShared}</div>
                <div className="text-xs text-purple-200/70">Shared</div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-2 border border-white/20 shadow-2xl">
            <button
              onClick={() => setCurrentView('prayer')}
              className={`relative px-8 py-3 rounded-xl font-semibold transition-all duration-500 transform ${
                currentView === 'prayer'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-xl scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-102'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">🙏</span>
                <span className="hidden sm:inline">Daily Prayer</span>
                <span className="sm:hidden">Prayer</span>
              </div>
              {currentView === 'prayer' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              )}
            </button>
            <button
              onClick={() => setCurrentView('reflection')}
              className={`relative px-8 py-3 rounded-xl font-semibold transition-all duration-500 transform ${
                currentView === 'reflection'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-102'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">📝</span>
                <span className="hidden sm:inline">Reflection</span>
                <span className="sm:hidden">Reflect</span>
              </div>
              {currentView === 'reflection' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              )}
            </button>
            <button
              onClick={() => setCurrentView('community')}
              className={`relative px-8 py-3 rounded-xl font-semibold transition-all duration-500 transform ${
                currentView === 'community'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-102'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">👥</span>
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Connect</span>
              </div>
              {currentView === 'community' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              )}
            </button>
          </div>
        </div>

        {/* Prayer Content with Enhanced Osmo Design */}
        {currentView === 'prayer' && (
          <div className="space-y-8">
            {/* Sacred Scripture Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-full px-4 py-2 border border-amber-500/30 mb-4">
                    <span className="text-2xl">📖</span>
                    <span className="text-amber-300 font-semibold">Sacred Scripture</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Divine Wisdom for Today</h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full"></div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/10 to-orange-50/5 rounded-2xl p-6 border border-amber-500/20">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-amber-300 mb-2">
                      {dailyPrayer.scripture.reference}
                    </div>
                    <div className="w-12 h-0.5 bg-amber-400 mx-auto rounded-full"></div>
                  </div>
                  <div className="text-center mb-6">
                    <p className="text-white/90 text-lg italic leading-relaxed font-medium">
                      "{dailyPrayer.scripture.text}"
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center space-x-2 text-amber-300">
                      <span className="text-lg">💭</span>
                      <span className="font-medium italic">{dailyPrayer.scripture.inspiration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prayer Journey Structure */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/15 to-indigo-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-full px-4 py-2 border border-purple-500/30 mb-4">
                    <span className="text-2xl">🙏</span>
                    <span className="text-purple-300 font-semibold">Prayer Journey</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Your Sacred Conversation</h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-4">
                  {Object.entries(dailyPrayer.prayers).map(([key, prayer], index) => (
                    <div key={key} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 group-hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <span className="text-lg">
                              {key === 'opening' && '🕊️'}
                              {key === 'meditation' && '🤔'}
                              {key === 'intercession' && '🙏'}
                              {key === 'confession' && '💔'}
                              {key === 'thanksgiving' && '🙌'}
                              {key === 'closing' && '✨'}
                            </span>
                          </div>
                          <div className="text-lg font-semibold text-purple-300 capitalize">
                            {key === 'opening' && 'Opening Prayer'}
                            {key === 'meditation' && 'Meditation'}
                            {key === 'intercession' && 'Intercession'}
                            {key === 'confession' && 'Confession'}
                            {key === 'thanksgiving' && 'Thanksgiving'}
                            {key === 'closing' && 'Closing Blessing'}
                          </div>
                        </div>
                        <p className="text-white/90 leading-relaxed text-base pl-11">
                          {prayer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Start Prayer Button */}
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                <button
                  onClick={handleStartPrayer}
                  disabled={isStarting}
                  className={`relative px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-105 shadow-2xl ${
                    isStarting
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : `bg-gradient-to-r ${getLevelColor(dailyPrayer.level)} text-white hover:shadow-3xl hover:from-purple-600 hover:to-blue-600`
                  }`}
                >
                  {isStarting ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Beginning Your Sacred Journey...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🙏</span>
                      <span>Begin {selectedMinutes}-Minute Prayer Session</span>
                      <span className="text-lg">✨</span>
                    </div>
                  )}
                </button>
              </div>
              <p className="text-white/60 text-sm">Take this sacred time to connect with God</p>
            </div>
          </div>
        )}

        {/* Reflection Content with Enhanced Design */}
        {currentView === 'reflection' && (
          <div className="space-y-8">
            {/* Sacred Reflection Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-full px-4 py-2 border border-emerald-500/30 mb-4">
                    <span className="text-2xl">📝</span>
                    <span className="text-emerald-300 font-semibold">Sacred Reflection</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Heart & Soul Examination</h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-6">
                  {/* Reflection Questions */}
                  <div className="bg-gradient-to-br from-emerald-50/10 to-teal-50/5 rounded-2xl p-6 border border-emerald-500/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                        <span className="text-xl">🤔</span>
                      </div>
                      <h4 className="text-xl font-bold text-emerald-300">Reflection Questions</h4>
                    </div>
                    <div className="space-y-3">
                      {dailyPrayer.reflection.questions.map((question, index) => (
                        <div key={index} className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors duration-300">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-emerald-400 font-bold text-sm">{index + 1}</span>
                          </div>
                          <p className="text-white/90 leading-relaxed">{question}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Journal Prompt */}
                  <div className="bg-gradient-to-br from-cyan-50/10 to-blue-50/5 rounded-2xl p-6 border border-cyan-500/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <span className="text-xl">✍️</span>
                      </div>
                      <h4 className="text-xl font-bold text-cyan-300">Journal Prompt</h4>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-white/90 italic text-lg leading-relaxed">
                        {dailyPrayer.reflection.journalPrompt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spiritual Growth Path */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-purple-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-500/20 to-pink-500/20 backdrop-blur-xl rounded-full px-4 py-2 border border-rose-500/30 mb-4">
                    <span className="text-2xl">🎯</span>
                    <span className="text-rose-300 font-semibold">Growth Path</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Your Spiritual Journey Continues</h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-rose-500 to-pink-500 mx-auto rounded-full"></div>
                </div>

                <div className="grid gap-4">
                  {dailyPrayer.nextSteps.map((step, index) => (
                    <div key={index} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center space-x-4 bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 group-hover:border-rose-500/30 transition-all duration-300">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">
                            {index === 0 && '🌅'}
                            {index === 1 && '📖'}
                            {index === 2 && '🤝'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white/90 text-base leading-relaxed">{step}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                          <span className="text-rose-400 text-lg">→</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Content with Enhanced Design */}
        {currentView === 'community' && (
          <div className="space-y-8">
            {/* Community Connection Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-pink-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-full px-4 py-2 border border-indigo-500/30 mb-4">
                    <span className="text-2xl">👥</span>
                    <span className="text-indigo-300 font-semibold">Community</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">United in Prayer</h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
                </div>

                <p className="text-white/80 text-center text-lg mb-6 leading-relaxed">
                  Share your prayer journey and encourage fellow believers in their spiritual growth.
                  Together, we build a stronger faith community.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <button className="relative w-full bg-gradient-to-br from-blue-50/10 to-indigo-50/5 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300 text-left">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                          <span className="text-2xl">📤</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-blue-300 mb-1">Share Today's Prayer</h4>
                          <p className="text-blue-200/70 text-sm">Share your prayer experience with the community</p>
                        </div>
                      </div>
                      <div className="ml-16">
                        <div className="flex items-center space-x-2 text-blue-300/80">
                          <span className="text-sm">💫</span>
                          <span className="text-sm">Inspire others on their journey</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <button className="relative w-full bg-gradient-to-br from-purple-50/10 to-pink-50/5 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 group-hover:border-purple-500/40 transition-all duration-300 text-left">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <span className="text-2xl">🤝</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-purple-300 mb-1">Find Prayer Partner</h4>
                          <p className="text-purple-200/70 text-sm">Connect with someone for mutual prayer support</p>
                        </div>
                      </div>
                      <div className="ml-16">
                        <div className="flex items-center space-x-2 text-purple-300/80">
                          <span className="text-sm">❤️</span>
                          <span className="text-sm">Grow together in faith</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Spiritual Advancement Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/15 to-red-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-full px-4 py-2 border border-yellow-500/30 mb-4">
                    <span className="text-2xl">🎯</span>
                    <span className="text-yellow-300 font-semibold">Advancement</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Spiritual Growth Milestones</h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto rounded-full"></div>
                </div>

                {userProfile?.advancementReady ? (
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                      <div className="relative text-6xl mb-4 animate-bounce">🎉</div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-bold text-yellow-300">Congratulations!</h4>
                      <p className="text-white/90 text-lg leading-relaxed">
                        You're ready to advance to the next level of your spiritual journey.
                        Your dedication and growth have been recognized!
                      </p>
                      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
                        <p className="text-yellow-300 text-center font-medium">
                          🌟 New level unlocked with deeper prayer experiences and spiritual insights
                        </p>
                      </div>
                    </div>
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                      <button
                        onClick={handleRequestAdvancement}
                        className="relative bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                      >
                        🚀 Advance to Next Level
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-white/80 text-center text-lg">
                      Keep growing in your prayer life! Here's your progress toward the next level:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-5 border border-orange-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-orange-300 font-semibold">Prayer Days</span>
                          <span className="text-2xl">🔥</span>
                        </div>
                        <div className="text-3xl font-bold text-orange-300 mb-1">
                          {userProfile?.completedDays || 0}<span className="text-orange-200/70 text-lg">/60</span>
                        </div>
                        <div className="w-full bg-orange-500/20 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, ((userProfile?.completedDays || 0) / 60) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-300 font-semibold">Community Shares</span>
                          <span className="text-2xl">🤝</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-300 mb-1">
                          {userProfile?.communityShared || 0}<span className="text-blue-200/70 text-lg">/5</span>
                        </div>
                        <div className="w-full bg-blue-500/20 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, ((userProfile?.communityShared || 0) / 5) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300 font-semibold">Reflections</span>
                          <span className="text-2xl">📝</span>
                        </div>
                        <div className="text-3xl font-bold text-purple-300 mb-1">
                          {userProfile?.reflectionEntries || 0}<span className="text-purple-200/70 text-lg">/30</span>
                        </div>
                        <div className="w-full bg-purple-500/20 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, ((userProfile?.reflectionEntries || 0) / 30) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">💡</span>
                        <p className="text-amber-300 font-medium">
                          Keep praying consistently, sharing your journey, and reflecting deeply.
                          Advancement opportunities will appear as you grow in faith!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Quick Actions Footer */}
        <div className="flex justify-center space-x-3 pt-8 border-t border-white/20">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
            <button
              onClick={() => setCurrentView('prayer')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 rounded-xl text-purple-300 hover:text-white transition-all duration-300 font-medium flex items-center space-x-2"
            >
              <span>🙏</span>
              <span className="hidden sm:inline">Daily Prayer</span>
            </button>
            <button
              onClick={() => setCurrentView('reflection')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 rounded-xl text-emerald-300 hover:text-white transition-all duration-300 font-medium flex items-center space-x-2"
            >
              <span>📝</span>
              <span className="hidden sm:inline">Reflection</span>
            </button>
            <button
              onClick={() => setCurrentView('community')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 rounded-xl text-indigo-300 hover:text-white transition-all duration-300 font-medium flex items-center space-x-2"
            >
              <span>👥</span>
              <span className="hidden sm:inline">Community</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
