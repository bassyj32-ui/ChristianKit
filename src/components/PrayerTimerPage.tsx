import React, { useState, useEffect, useRef } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { DailyProgressReminder } from './DailyProgressReminder'
import { ProgressService } from '../services/ProgressService'

interface PrayerSession {
  id: string
  date: string
  duration: number
  focus: string
  mood: string
  message: string
  completed: boolean
}

interface PrayerTimerPageProps {
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

export const PrayerTimerPage: React.FC<PrayerTimerPageProps> = ({ 
  onNavigate, 
  onStartQuestionnaire, 
  onTimerComplete, 
  userPlan, 
  selectedMinutes: propSelectedMinutes,
  isFirstTimeUser = false 
}) => {
  const { user, signInWithGoogle } = useSupabaseAuth();
  console.log('PrayerTimerPage rendered with propSelectedMinutes:', propSelectedMinutes);
  
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
        await ProgressService.recordSession({
          user_id: user.id,
          activity_type: 'prayer',
          duration_minutes: selectedMinutes,
          completed: true,
          completed_duration: selectedMinutes, // Full duration completed
          session_date: new Date().toISOString().split('T')[0],
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

  const resetPrayer = () => {
    // Clear existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
    
    // Reset state
    setTimeRemaining(selectedMinutes * 60);
    setPrayerCompleted(false);
    setShowReminder(false);
    
    // Force restart by briefly setting isPraying to false then true
    setIsPraying(false);
    setTimeout(() => {
      setIsPraying(true);
    }, 10);
  };

  const handleTimeSelect = (minutes: number) => {
    setSelectedMinutes(minutes);
    setTimeRemaining(minutes * 60);
    setIsPraying(true); // Start timer automatically when time is selected
    setPrayerCompleted(false);
  };

  return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden">
      
      {/* Background with subtle patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] pointer-events-none">
        {/* Subtle gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/2 via-transparent to-[var(--accent-primary)]/2"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[var(--spiritual-blue)] rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-[var(--spiritual-purple)] rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-[var(--spiritual-green)] rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
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
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent font-black text-lg">Dear Jesus</span>, <span className="font-black text-white drop-shadow-lg">thank You for listening to me right now</span>
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
                    <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent font-black">Dear Jesus</span>, <span className="font-black text-white drop-shadow-lg">thank You for listening to me right now</span>
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
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-4 rounded-2xl shadow-xl z-50 max-w-sm text-center">
              <p className="text-sm font-medium">{focusReminders[currentReminderIndex]}</p>
          </div>
        )}
        </div>
      </div>



      {/* Simple Bottom Navigation Tabs - Clean Osmo Style */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
          <div className="flex items-center space-x-2 sm:space-x-1">
            {/* Home Tab */}
            <button
              onClick={() => {
                console.log('Home tab clicked!')
                console.log('isFirstTimeUser:', isFirstTimeUser)
                console.log('onStartQuestionnaire function:', onStartQuestionnaire)
                console.log('onNavigate function:', onNavigate)
                
                if (isFirstTimeUser) {
                  console.log('Starting questionnaire...')
                  onStartQuestionnaire?.();
                } else {
                  console.log('Navigating to dashboard...')
                  onNavigate?.('dashboard');
                }
              }}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <span className="text-xl sm:text-lg group-hover:scale-110 transition-transform duration-300">🏠</span>
              <span className="text-sm font-medium">Home</span>
            </button>
            
            {/* Restart Tab */}
            <button
              onClick={resetPrayer}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <span className="text-xl sm:text-lg group-hover:scale-110 transition-transform duration-300">🔄</span>
              <span className="text-sm font-medium">Restart</span>
            </button>
            
            {/* Share Tab */}
            <button
              onClick={() => onNavigate?.('community')}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <span className="text-xl sm:text-lg group-hover:scale-110 transition-transform duration-300">🌟</span>
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
