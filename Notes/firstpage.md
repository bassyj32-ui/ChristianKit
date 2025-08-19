import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
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
  const { user, signInWithGoogle } = useAuth();
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

  // Floating login button
  const FloatingLogin = () => (
    <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-[9999]">
      <button
        onClick={signInWithGoogle}
        className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 sm:px-8 py-2 sm:py-4 rounded-full font-bold hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-2xl hover:scale-110 border-2 border-amber-300/50 backdrop-blur-md text-sm sm:text-lg"
      >
        ✨ Sign In
      </button>
    </div>
  );

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
    <div className="min-h-screen bg-black text-gray-100 relative">
      {/* Floating Login - Outside main container */}
      <FloatingLogin />
      
      {/* Celestial Sky of Prayer - Main Timer Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 pb-24 relative overflow-hidden">
        {/* Anime-Style Night Sky Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-yellow-800/50 to-amber-900 pointer-events-none">
          {/* Milky Way Arc */}
          <div className="absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-12"></div>
          <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -rotate-6"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent transform rotate-3"></div>
        </div>

        {/* Twinkling Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Large Stars */}
          <div className="absolute top-1/6 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDuration: '3s'}}></div>
          <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 left-1/6 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
          <div className="absolute top-2/5 right-1/5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{animationDuration: '2s', animationDelay: '1.5s'}}></div>
          <div className="absolute top-3/5 right-1/4 w-1 h-1 bg-purple-200 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
          <div className="absolute top-2/3 left-1/5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '2.5s'}}></div>
          <div className="absolute top-3/4 right-1/6 w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '1s'}}></div>
          
          {/* Small Stars */}
          <div className="absolute top-1/8 left-1/2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{animationDuration: '2s'}}></div>
          <div className="absolute top-1/5 right-1/8 w-0.5 h-0.5 bg-blue-200 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 left-1/8 w-0.5 h-0.5 bg-purple-200 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
          <div className="absolute top-2/5 right-1/3 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-2/3 w-0.5 h-0.5 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '2s', animationDelay: '1.5s'}}></div>
          <div className="absolute top-3/5 left-1/4 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
          <div className="absolute top-2/3 right-1/5 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '2.5s'}}></div>
          <div className="absolute top-3/4 left-1/3 w-0.5 h-0.5 bg-blue-200 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '1s'}}></div>
        </div>

        {/* Shooting Stars */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-20 h-0.5 bg-gradient-to-r from-white to-transparent transform rotate-45 animate-pulse" style={{animationDuration: '8s', animationDelay: '0s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-0.5 bg-gradient-to-r from-blue-300 to-transparent transform -rotate-30 animate-pulse" style={{animationDuration: '10s', animationDelay: '3s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-12 h-0.5 bg-gradient-to-r from-purple-300 to-transparent transform rotate-60 animate-pulse" style={{animationDuration: '12s', animationDelay: '6s'}}></div>
              </div>

        {/* Christian Cross Constellation */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="relative w-32 h-32">
            {/* Vertical line of cross */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-32 bg-gradient-to-b from-blue-400/60 to-purple-400/60 rounded-full animate-pulse" style={{animationDuration: '4s'}}></div>
            {/* Horizontal line of cross */}
            <div className="absolute top-1/2 left-0 w-32 h-1 bg-gradient-to-r from-blue-400/60 to-purple-400/60 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
            {/* Cross connection points */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDuration: '3s'}}></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}></div>
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '1.5s'}}></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '2s'}}></div>
              </div>
            </div>

        {/* Open Bible Constellation */}
        <div className="absolute bottom-1/4 right-1/4 pointer-events-none">
          <div className="relative w-24 h-32">
            {/* Left page */}
            <div className="absolute top-0 left-0 w-12 h-32 bg-gradient-to-br from-amber-400/40 to-amber-600/40 rounded-l-lg transform -rotate-6 animate-pulse" style={{animationDuration: '5s'}}></div>
            {/* Right page */}
            <div className="absolute top-0 right-0 w-12 h-32 bg-gradient-to-bl from-amber-400/40 to-amber-600/40 rounded-r-lg transform rotate-6 animate-pulse" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
            {/* Bible text lines */}
            <div className="absolute top-4 left-2 w-8 h-0.5 bg-white/60 rounded-full animate-pulse" style={{animationDuration: '3s'}}></div>
            <div className="absolute top-6 left-2 w-6 h-0.5 bg-white/60 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
            <div className="absolute top-8 left-2 w-7 h-0.5 bg-white/60 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
            <div className="absolute top-4 right-2 w-8 h-0.5 bg-white/60 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '1.5s'}}></div>
            <div className="absolute top-6 right-2 w-6 h-0.5 bg-white/60 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '2s'}}></div>
            <div className="absolute top-8 right-2 w-7 h-0.5 bg-white/60 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '2.5s'}}></div>
              </div>
            </div>

        {/* Time Selection Bar - Beautiful Glassmorphism Design */}
        <div className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* 5 Minutes Tab */}
            <button
              onClick={() => handleTimeSelect(5)}
              className="flex flex-col items-center space-y-1 sm:space-y-2 group"
            >
              <div className={`w-12 h-16 sm:w-16 sm:h-20 backdrop-blur-xl rounded-xl sm:rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg border ${
                selectedMinutes === 5
                  ? 'bg-gradient-to-br from-blue-400/30 to-indigo-500/40 border-blue-300/40 group-hover:shadow-blue-400/40'
                  : 'bg-gradient-to-br from-blue-400/10 to-indigo-500/20 border-blue-300/20 group-hover:shadow-blue-400/30'
              }`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 backdrop-blur-xl rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg border mb-1 sm:mb-2 ${
                  selectedMinutes === 5
                    ? 'bg-gradient-to-br from-blue-400/50 to-indigo-500/60 border-blue-300/50'
                    : 'bg-gradient-to-br from-blue-400/30 to-indigo-500/40 border-blue-300/30'
                }`}>
                  <span className="text-lg sm:text-2xl font-bold text-blue-100 group-hover:text-blue-50 transition-colors duration-300">5</span>
                </div>
                <span className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
                  selectedMinutes === 5 ? 'text-blue-100' : 'text-blue-200'
                }`}>min</span>
              </div>
            </button>
            
            {/* 10 Minutes Tab */}
            <button
              onClick={() => handleTimeSelect(10)}
              className="flex flex-col items-center space-y-1 sm:space-y-2 group"
            >
              <div className={`w-12 h-16 sm:w-16 sm:h-20 backdrop-blur-xl rounded-xl sm:rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg border ${
                selectedMinutes === 10
                  ? 'bg-gradient-to-br from-emerald-400/30 to-teal-500/40 border-emerald-300/40 group-hover:shadow-emerald-400/40'
                  : 'bg-gradient-to-br from-emerald-400/10 to-teal-500/20 border-emerald-300/20 group-hover:shadow-emerald-400/30'
              }`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 backdrop-blur-xl rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg border mb-1 sm:mb-2 ${
                  selectedMinutes === 10
                    ? 'bg-gradient-to-br from-emerald-400/50 to-teal-500/60 border-emerald-300/50'
                    : 'bg-gradient-to-br from-emerald-400/30 to-teal-500/40 border-emerald-300/30'
                }`}>
                  <span className="text-lg sm:text-2xl font-bold text-emerald-100 group-hover:text-emerald-50 transition-colors duration-300">10</span>
                </div>
                <span className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
                  selectedMinutes === 10 ? 'text-emerald-100' : 'text-emerald-200'
                }`}>min</span>
              </div>
            </button>
            
            {/* 30 Minutes Tab */}
            <button
              onClick={() => handleTimeSelect(30)}
              className="flex flex-col items-center space-y-1 sm:space-y-2 group"
            >
              <div className={`w-12 h-16 sm:w-16 sm:h-20 backdrop-blur-xl rounded-xl sm:rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg border ${
                selectedMinutes === 30
                  ? 'bg-gradient-to-br from-amber-400/30 to-orange-500/40 border-amber-300/40 group-hover:shadow-amber-400/40'
                  : 'bg-gradient-to-br from-amber-400/10 to-orange-500/20 border-amber-300/20 group-hover:shadow-amber-400/30'
              }`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 backdrop-blur-xl rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg border mb-1 sm:mb-2 ${
                  selectedMinutes === 30
                    ? 'bg-gradient-to-br from-amber-400/50 to-orange-500/60 border-amber-300/50'
                    : 'bg-gradient-to-br from-amber-400/30 to-orange-500/40 border-amber-300/30'
                }`}>
                  <span className="text-lg sm:text-2xl font-bold text-amber-100 group-hover:text-amber-50 transition-colors duration-300">30</span>
                </div>
                <span className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
                  selectedMinutes === 30 ? 'text-amber-100' : 'text-amber-200'
                }`}>min</span>
              </div>
            </button>
          </div>
        </div>

        {/* Massive Timer Display - Takes 3/5 of Screen */}
        <div className="text-center w-full relative z-10 pt-4 sm:pt-8">

          {/* Beautiful Timer with Elegant Ring */}
          <div className="relative w-full h-64 sm:h-96 flex items-center justify-center mb-2 sm:mb-4">
            {/* Multiple Glow Rings for Depth */}
            <div className="absolute w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-emerald-600/30 blur-2xl animate-pulse"></div>
            <div className="absolute w-56 h-56 sm:w-88 sm:h-88 rounded-full bg-gradient-to-r from-purple-500/25 via-blue-500/25 to-emerald-500/25 blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-emerald-400/20 blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
            
            {/* Floating Particles */}
            <div className="absolute w-full h-full">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0s', animationDuration: '2s'}}></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.5s', animationDuration: '2.5s'}}></div>
              <div className="absolute bottom-1/3 left-1/3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
              <div className="absolute top-1/2 right-1/4 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-300 rounded-full animate-bounce" style={{animationDelay: '1.5s', animationDuration: '2.2s'}}></div>
            </div>

            {/* Main Progress Ring with Enhanced Glow */}
            <div className="relative w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-md border border-purple-500/40 flex items-center justify-center shadow-2xl animate-float">
              {/* Inner Glow Effect */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-sm"></div>
              {/* Progress Circle */}
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth="3"
                />
                {/* Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - (selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60))}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out drop-shadow-lg"
                />
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Percentage and Complete text inside circle at bottom */}
              <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-sm sm:text-lg text-purple-300 font-bold">
                  {Math.round(((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100)}%
                </div>
                <div className="text-xs sm:text-sm text-slate-400 font-medium">Complete</div>
              </div>

              {/* Timer Display in Center with Enhanced Effects */}
              <div className="relative z-10 text-center">
                <div className="text-[8rem] sm:text-[16rem] font-black leading-none relative">
                  {/* Main Timer Text */}
                  <div className="relative text-white drop-shadow-2xl">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Beautiful Prayer Message - No Rectangle */}
          <div className="text-center mt-4 sm:mt-8">
            <div className="text-lg sm:text-2xl font-light text-white/90 leading-relaxed tracking-wide px-4">
              <span className="text-amber-300 font-medium">Dear Jesus</span>, I am here today to talk about ...
            </div>
          </div>

          {/* Reminder */}
          {showReminder && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-6 rounded-xl shadow-2xl z-50 animate-pulse text-xl">
              {focusReminders[currentReminderIndex]}
          </div>
        )}
        </div>
      </div>

      {/* Navigation Tabs - Beautiful Glassmorphism Design (Mobile & Web) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-4 sm:pb-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Home Tab */}
          <button
            onClick={() => {
              if (isFirstTimeUser) {
                onStartQuestionnaire?.();
              } else {
                onNavigate?.('dashboard');
              }
            }}
            className="flex flex-col items-center space-y-1 sm:space-y-2 group"
          >
            <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-purple-400/10 to-blue-500/20 backdrop-blur-xl rounded-xl sm:rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-purple-400/30 border border-purple-300/20">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400/30 to-blue-500/40 backdrop-blur-xl rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-purple-400/40 border border-purple-300/30 mb-1 sm:mb-2">
                <span className="text-lg sm:text-2xl group-hover:animate-bounce">🏠</span>
              </div>
              <span className="text-xs font-medium text-purple-100 group-hover:text-purple-50 transition-colors duration-300 tracking-wide">Home</span>
            </div>
          </button>
          
          {/* Restart Tab */}
          <button
            onClick={resetPrayer}
            className="flex flex-col items-center space-y-1 sm:space-y-2 group"
          >
            <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-blue-400/10 to-indigo-500/20 backdrop-blur-xl rounded-xl sm:rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/30 border border-blue-300/20">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400/30 to-indigo-500/40 backdrop-blur-xl rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/40 border border-blue-300/30 mb-1 sm:mb-2">
                <span className="text-lg sm:text-2xl group-hover:animate-spin">🔄</span>
              </div>
              <span className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300 tracking-wide">Restart</span>
            </div>
          </button>
          
          {/* Share Tab */}
          <button
            onClick={() => onNavigate?.('community')}
            className="flex flex-col items-center space-y-1 sm:space-y-2 group"
          >
            <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-emerald-400/10 to-teal-500/20 backdrop-blur-xl rounded-xl sm:rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/30 border border-emerald-300/20">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400/30 to-teal-500/40 backdrop-blur-xl rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/40 border border-emerald-300/30 mb-1 sm:mb-2">
                <span className="text-lg sm:text-2xl group-hover:animate-pulse">🌟</span>
              </div>
              <span className="text-xs font-medium text-emerald-100 group-hover:text-emerald-50 transition-colors duration-300 tracking-wide">Share</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
