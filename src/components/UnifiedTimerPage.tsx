import React, { useState, useEffect, useRef } from 'react'
import { SharePrayerSession } from './SharePrayerSession'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { DailyProgressReminder } from './DailyProgressReminder'
import ProgressService from '../services/ProgressService'

interface PrayerSession {
  id: string
  date: string
  duration: number
  focus: string
  mood: string
  message: string
  completed: boolean
}

interface UnifiedTimerPageProps {
  timerType: 'prayer' | 'bible' | 'meditation'
  onNavigate?: (page: string) => void;
  onStartQuestionnaire?: () => void;
  onTimerComplete?: () => void;
  userPlan?: {
    prayerTime: number;
    prayerFocus: string[];
  } | null;
  selectedMinutes?: number;
  isFirstTimeUser?: boolean;
}

export const UnifiedTimerPage: React.FC<UnifiedTimerPageProps> = ({ 
  timerType,
  onNavigate, 
  onStartQuestionnaire, 
  onTimerComplete, 
  userPlan, 
  selectedMinutes: propSelectedMinutes,
  isFirstTimeUser = false 
}) => {
  const { user, signInWithGoogle } = useSupabaseAuth();
  console.log('UnifiedTimerPage rendered with propSelectedMinutes:', propSelectedMinutes);
  
  const [selectedMinutes, setSelectedMinutes] = useState(10) // Default to 10 minutes
  const [timeRemaining, setTimeRemaining] = useState(10 * 60) // Default to 10 minutes
  const [isPraying, setIsPraying] = useState(true) // Start with timer running automatically
  const [prayerCompleted, setPrayerCompleted] = useState(false)
  const [prayerMessage, setPrayerMessage] = useState("Lord Jesus, I'm here with You now to talk about...")
  const [prayerFocus, setPrayerFocus] = useState("")
  const [prayerMood, setPrayerMood] = useState("")
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0)
  const [showReminder, setShowReminder] = useState(false)
  const [prayerSessions, setPrayerSessions] = useState<PrayerSession[]>([])
  const [focusReminders, setFocusReminders] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Encouraging titles and subtitles for slideshow
  const encouragingTitles = [
    "Find Peace",
    "Trust in Him",
    "Be Still",
    "Pray Without Ceasing",
    "Cast Your Cares",
    "Walk by Faith",
    "Rejoice Always",
    "Give Thanks"
  ]

  const encouragingSubtitles = [
    "In His presence",
    "He is faithful",
    "Know He is God",
    "In every moment",
    "He cares for you",
    "Not by sight",
    "In all circumstances",
    "In everything"
  ]

  // Scripture verses and references
  const scriptureVerses = [
    "Be still, and know that I am God",
    "Cast your cares on the Lord",
    "Pray without ceasing",
    "Trust in the Lord with all your heart",
    "Rejoice always, pray continually",
    "Walk by faith, not by sight",
    "Give thanks in all circumstances",
    "The Lord is my shepherd"
  ]

  const scriptureReferences = [
    "Psalm 46:10",
    "1 Peter 5:7",
    "1 Thessalonians 5:17",
    "Proverbs 3:5",
    "1 Thessalonians 5:16-17",
    "2 Corinthians 5:7",
    "1 Thessalonians 5:18",
    "Psalm 23:1"
  ]

  // Load prayer sessions from localStorage (simplified)
  useEffect(() => {
    const saved = localStorage.getItem('prayerSessions')
    if (saved) {
      setPrayerSessions(JSON.parse(saved))
    }
  }, [])

  // Update timer when prop changes
  useEffect(() => {
    if (propSelectedMinutes && propSelectedMinutes > 0) {
      console.log('Prop changed, updating timer to:', propSelectedMinutes, 'minutes');
      setSelectedMinutes(propSelectedMinutes);
      setTimeRemaining(propSelectedMinutes * 60);
    }
  }, [propSelectedMinutes]);

  // Define completePrayer function before using it in useEffect
  const completePrayer = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
    
    // Save prayer session locally
    const newSession: PrayerSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: selectedMinutes,
      focus: prayerFocus,
      mood: prayerMood,
      message: prayerMessage,
      completed: true
    };
    setPrayerSessions(prev => [newSession, ...prev]);
    localStorage.setItem('prayerSessions', JSON.stringify([newSession, ...prayerSessions]));
    
    // Record session in database for progress tracking
    if (user) {
      try {
        await ProgressService.saveSession({
          user_id: user.id,
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          duration_minutes: selectedMinutes,
          prayer_type: 'prayer',
          notes: prayerFocus ? `Focus: ${prayerFocus}` : undefined
        });
        console.log('✅ Prayer session recorded successfully');
      } catch (error) {
        console.error('❌ Error recording prayer session:', error);
        // Continue even if database recording fails
      }
    }
    
    setIsPraying(false);
    setPrayerCompleted(true);
    setShowReminder(false);
    
    // Call timer completion handler
    onTimerComplete?.();
  };

  useEffect(() => {
    // Start timer immediately when component mounts
    console.log('Component mounted, starting timer with:', selectedMinutes, 'minutes');
    
    if (isPraying && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completePrayer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPraying, selectedMinutes]);

  // Start reminder interval
  useEffect(() => {
    if (isPraying && timeRemaining > 0) {
      reminderIntervalRef.current = setInterval(() => {
        setShowReminder(true);
        setTimeout(() => setShowReminder(false), 3000);
        setCurrentReminderIndex(prev => (prev + 1) % focusReminders.length);
      }, 30000); // Show reminder every 30 seconds
    }

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [isPraying, timeRemaining, focusReminders.length]);

  // Set focus reminders based on user plan
  useEffect(() => {
    if (userPlan?.prayerFocus) {
      setFocusReminders(userPlan.prayerFocus);
    } else {
      setFocusReminders([
        "Thank God for His love and grace",
        "Ask for guidance in your daily decisions",
        "Pray for your family and friends",
        "Seek forgiveness and renewal",
        "Express gratitude for your blessings"
      ]);
    }
  }, [userPlan]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startPrayer = () => {
    setIsPraying(true);
    setPrayerCompleted(false);
    setTimeRemaining(selectedMinutes * 60);
  };

  const pausePrayer = () => {
    setIsPraying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleTimeSelect = (minutes: number) => {
    setSelectedMinutes(minutes);
    setTimeRemaining(minutes * 60);
    setIsPraying(true); // Start timer automatically when time is selected
    setPrayerCompleted(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white relative overflow-hidden">
      
      {/* Background with subtle patterns - Much darker Osmo-inspired */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 pointer-events-none">
        {/* Subtle gradient overlays - Very subtle */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 via-transparent to-amber-400/5"></div>
        
        {/* Floating particles - More subtle */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400/20 rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-400/15 rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-amber-400/10 rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
      </div>

      {/* Main Timer Content */}
      <div className="flex flex-col items-center justify-center h-screen px-4 py-4 pb-24 relative z-10">

        {/* Time Selection Bar - Osmo Style */}
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            <div className="flex items-center space-x-1">
            {/* 5 Minutes Tab */}
              <button
                onClick={() => handleTimeSelect(5)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedMinutes === 5
                    ? 'bg-amber-400 text-[var(--text-inverse)] shadow-lg shadow-amber-400/25'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                5 min
              </button>
              
            {/* 10 Minutes Tab */}
              <button
                onClick={() => handleTimeSelect(10)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedMinutes === 10
                    ? 'bg-amber-400 text-[var(--text-inverse)] shadow-lg shadow-amber-400/25'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                10 min
              </button>
              
            {/* 30 Minutes Tab */}
              <button
                onClick={() => handleTimeSelect(30)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedMinutes === 30
                    ? 'bg-amber-400 text-[var(--text-inverse)] shadow-lg shadow-amber-400/25'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                30 min
              </button>
            </div>
          </div>
        </div>

        {/* Osmo-Style Timer Display */}
        <div className="text-center w-full relative z-10 pt-2">
          
          {/* Mobile-First Prayer Message Above Timer - Bigger and Closer to App Bar */}
          <div className="text-center mb-2 mt-16 sm:hidden">
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-4 mx-3 shadow-lg">
              <p className="text-base font-black text-white leading-tight">
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent font-black text-lg">Let's pray for {selectedMinutes} minutes</span>
              </p>
            </div>
          </div>
          
          {/* Timer Container - Optimized for Mobile Visibility */}
          <div className="relative flex items-center justify-center mb-4 w-full px-4 sm:px-40 lg:px-48 xl:px-56">
            
            {/* Timer Circle with Enhanced Bold Design - Bigger for Attention */}
            <div className="relative w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] lg:w-[450px] lg:h-[450px] xl:w-[500px] xl:h-[500px]">
              
              {/* Enhanced Background Circle */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-full shadow-2xl"></div>
              
              {/* Progress Ring Animation - Bolder Design */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track - Bolder */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="4"
                />
                {/* Animated Progress Arc - Bolder and More Visible */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - (selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60))}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out drop-shadow-lg"
                  filter="drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))"
                />
              </svg>
              
              {/* Center Display - Timer & Percentage - Much Bigger Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black text-white mb-1 drop-shadow-2xl">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-amber-400 text-lg sm:text-3xl lg:text-4xl font-bold">
                  {Math.round(((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100)}%
                  </div>
                </div>
              </div>

              {/* Left Side - Prayer Message (Hidden on Mobile) */}
              <div className="absolute left-[-140px] sm:left-[-160px] lg:left-[-180px] top-1/2 transform -translate-y-1/2 hidden sm:block">
                <div className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-4 text-center max-w-[120px] sm:max-w-[140px] shadow-lg">
                  <p className="text-sm sm:text-base font-black text-white leading-tight">
                    <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent font-black">Let's pray for {selectedMinutes} minutes</span>
                  </p>
                </div>
              </div>

              {/* Right Side - Prayer Time Title (Hidden on Mobile) */}
              <div className="absolute right-[-140px] sm:right-[-160px] lg:right-[-180px] top-1/2 transform -translate-y-1/2 hidden sm:block">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center max-w-[120px] sm:max-w-[140px]">
                  <div className="text-2xl sm:text-3xl font-black text-white mb-2">
                    Prayer Time
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-amber-400">
                    {selectedMinutes} min
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-First Prayer Time Below Timer */}
          <div className="text-center mt-3 sm:hidden">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 mx-4">
              <div className="text-base font-black text-white mb-1">
                Prayer Time
              </div>
              <div className="text-sm font-bold text-amber-400">
                {selectedMinutes} min
              </div>
            </div>
          </div>

          {/* Reminder - Osmo Style */}
          {showReminder && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-4 rounded-2xl shadow-xl z-40 max-w-sm text-center">
              <p className="text-sm font-medium">{focusReminders[currentReminderIndex]}</p>
          </div>
        )}
        </div>
      </div>

      {/* Simple Bottom Navigation Tabs - Clean Osmo Style */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] pointer-events-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
          <div className="flex items-center space-x-2 sm:space-x-1">
            {/* Community Tab */}
            <button
              onClick={() => onNavigate?.('community')}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <svg className="w-6 h-6 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-2.01A2.5 2.5 0 0 0 8 8H5.46c-.8 0-1.54.37-2.01.99L1 15.5V22h2v-6h2.5l2.5 7.5h2L10 16h4l1.5 7.5h2L18 16h2v6h2zM12 7.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/>
              </svg>
              <span className="text-sm font-medium">Community</span>
            </button>
            
            {/* Bible Quest Tab */}
            <button
              onClick={() => onNavigate?.('runner')}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <svg className="w-6 h-6 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.5 2c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-17c0-.83.67-1.5 1.5-1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span className="text-sm font-medium">Bible Quest</span>
            </button>

            {/* My Prayer Time Tab */}
            <button
              onClick={() => onNavigate?.('prayer-time')}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <svg className="w-6 h-6 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span className="text-sm font-medium">My Prayer Time</span>
            </button>
            
            {/* Home Tab */}
            <button
              onClick={() => {
                console.log('Home tab clicked!')
                console.log('isFirstTimeUser:', isFirstTimeUser)
                console.log('onStartQuestionnaire function:', onStartQuestionnaire)
                console.log('onNavigate function:', onNavigate)
                console.log('localStorage hasCompletedQuestionnaire:', localStorage.getItem('hasCompletedQuestionnaire'))
                
                // Check if user has already completed questionnaire in localStorage
                const hasCompleted = localStorage.getItem('hasCompletedQuestionnaire')
                console.log('localStorage hasCompletedQuestionnaire:', hasCompleted)
                
                if (isFirstTimeUser && !hasCompleted) {
                  console.log('Starting questionnaire...')
                  onStartQuestionnaire?.();
                } else {
                  console.log('Navigating to home...')
                  onNavigate?.('home');
                }
              }}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <svg className="w-6 h-6 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span className="text-sm font-medium">Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};