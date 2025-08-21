import React, { useState, useEffect, useRef } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { DailyProgressReminder } from './DailyProgressReminder'

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
  const completePrayer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
    
    // Save prayer session (simplified)
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

  // Floating login button - Osmo Style
  const FloatingLogin = () => {
    // Don't render if user is logged in
    if (user) {
      return null;
    }

    return (
      <div className="fixed top-6 right-6 z-[9999]">
        <button
          onClick={signInWithGoogle}
          className="bg-amber-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-all duration-300 shadow-lg shadow-amber-400/25 hover:scale-105"
        >
          Sign In
        </button>
      </div>
    );
  };

  // Bottom action buttons - Beautiful Glassmorphism Design
  const BottomActionButtons = () => (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-6">
      <div className="flex items-center space-x-4">
        {/* Home Tab */}
        <button
          onClick={() => {
            if (isFirstTimeUser) {
              onStartQuestionnaire?.();
            } else {
              onNavigate?.('dashboard');
            }
          }}
          className="flex flex-col items-center space-y-2 group"
        >
          <div className="w-16 h-20 bg-gradient-to-br from-purple-400/10 to-blue-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-purple-400/30 border border-purple-300/20">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400/30 to-blue-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-purple-400/40 border border-purple-300/30 mb-2">
              <span className="text-2xl group-hover:animate-bounce">🏠</span>
            </div>
            <span className="text-xs font-medium text-purple-100 group-hover:text-purple-50 transition-colors duration-300 tracking-wide">Home</span>
          </div>
        </button>
        
        {/* Restart Tab */}
        <button
          onClick={resetPrayer}
          className="flex flex-col items-center space-y-2 group"
        >
          <div className="w-16 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/30 border border-blue-300/20">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-indigo-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/40 border border-blue-300/30 mb-2">
              <span className="text-2xl group-hover:animate-spin">🔄</span>
            </div>
            <span className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300 tracking-wide">Restart</span>
          </div>
        </button>
        
        {/* Share Tab */}
        <button
          onClick={() => onNavigate?.('community')}
          className="flex flex-col items-center space-y-2 group"
        >
          <div className="w-16 h-20 bg-gradient-to-br from-emerald-400/10 to-teal-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/30 border border-emerald-300/20">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/30 to-teal-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/40 border border-emerald-300/30 mb-2">
              <span className="text-2xl group-hover:animate-pulse">🌟</span>
            </div>
            <span className="text-xs font-medium text-emerald-100 group-hover:text-emerald-50 transition-colors duration-300 tracking-wide">Share</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 relative">
      {/* Floating Login - Outside main container */}
      <FloatingLogin />
      
      {/* Osmo-Style Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-amber-400/5"></div>
        
        {/* Minimal grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-amber-400/30 rounded-full animate-pulse" style={{animationDuration: '4s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-0.5 h-0.5 bg-amber-300/20 rounded-full animate-pulse" style={{animationDuration: '5s', animationDelay: '2s'}}></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white/10 rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}></div>
        </div>
              </div>

      {/* Main Timer Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-4 pb-24 relative z-10">

        {/* Time Selection Bar - Osmo Style */}
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            <div className="flex items-center space-x-1">
            {/* 5 Minutes Tab */}
              <button
                onClick={() => handleTimeSelect(5)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedMinutes === 5
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/25'
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
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/25'
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
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/25'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                30 min
              </button>
            </div>
          </div>
        </div>

        {/* Osmo-Style Timer Display */}
        <div className="text-center w-full relative z-10 pt-8">
          
          {/* Timer Container - Extra Width for Side Elements */}
          <div className="relative flex items-center justify-center mb-2 w-full px-32 sm:px-40 lg:px-48 xl:px-56">
            
                        {/* Timer Circle with Animation */}
            <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] lg:w-[400px] lg:h-[400px] xl:w-[450px] xl:h-[450px]">
              
              {/* Background Circle */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl"></div>
              
              {/* Progress Ring Animation */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="3"
                />
                {/* Animated Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - (selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60))}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out drop-shadow-lg"
                />
              </svg>
              
              {/* Center Display - Timer & Percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-2 drop-shadow-2xl">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-amber-400 text-lg sm:text-xl lg:text-2xl font-bold">
                  {Math.round(((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100)}%
                  </div>
                </div>
              </div>

              {/* Left Side - Prayer Message */}
              <div className="absolute left-[-140px] sm:left-[-160px] lg:left-[-180px] top-1/2 transform -translate-y-1/2">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center max-w-[120px] sm:max-w-[140px]">
                  <p className="text-sm sm:text-base font-bold text-white leading-tight">
                    <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent font-black">Dear Jesus</span>, <span className="font-black">thank You for listening to me right now</span>
                  </p>
                </div>
              </div>

              {/* Right Side - Prayer Time Title */}
              <div className="absolute right-[-140px] sm:right-[-160px] lg:right-[-180px] top-1/2 transform -translate-y-1/2">
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



          {/* Reminder - Osmo Style */}
          {showReminder && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-4 rounded-2xl shadow-xl z-50 max-w-sm text-center">
              <p className="text-sm font-medium">{focusReminders[currentReminderIndex]}</p>
          </div>
        )}
        </div>
      </div>

      {/* Navigation Tabs - Osmo Style */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
          <div className="flex items-center space-x-1">
          {/* Home Tab */}
          <button
            onClick={() => {
              if (isFirstTimeUser) {
                onStartQuestionnaire?.();
              } else {
                onNavigate?.('dashboard');
              }
            }}
              className="flex items-center space-x-2 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">🏠</span>
              <span className="text-sm font-medium">Home</span>
          </button>
          
          {/* Restart Tab */}
          <button
            onClick={resetPrayer}
              className="flex items-center space-x-2 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">🔄</span>
              <span className="text-sm font-medium">Restart</span>
          </button>
          
          {/* Share Tab */}
          <button
            onClick={() => onNavigate?.('community')}
              className="flex items-center space-x-2 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">🌟</span>
              <span className="text-sm font-medium">Share</span>
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};
