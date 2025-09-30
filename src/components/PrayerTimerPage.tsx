import React, { useState, useEffect, useRef } from 'react'
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
  // PrayerTimerPage rendered
  
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
      // Prop changed, updating timer
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
        // Prayer session recorded successfully
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
    // Component mounted, starting timer
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      
      {/* Main Timer Content - Osmo Supply Dark Theme */}
      <div className="px-4 py-8 relative z-10">

        {/* Header - Osmo Style Dark */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Prayer Time
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Find peace and connection in your daily prayer practice
            </p>
          </div>
        </div>

        {/* Time Selection - Osmo Style Dark Cards */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-xl shadow-black/20">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Choose your prayer duration</h2>
              <p className="text-slate-300">Select how long you'd like to spend in prayer today</p>
            </div>
            
            <div className="flex justify-center space-x-3">
              {/* 5 Minutes */}
              <button
                onClick={() => handleTimeSelect(5)}
                className={`px-8 py-4 rounded-2xl font-medium transition-all duration-500 transform hover:scale-105 ${
                  selectedMinutes === 5
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm opacity-80">minutes</div>
              </button>
              
              {/* 10 Minutes */}
              <button
                onClick={() => handleTimeSelect(10)}
                className={`px-8 py-4 rounded-2xl font-medium transition-all duration-500 transform hover:scale-105 ${
                  selectedMinutes === 10
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                <div className="text-2xl font-bold">10</div>
                <div className="text-sm opacity-80">minutes</div>
              </button>
              
              {/* 30 Minutes */}
              <button
                onClick={() => handleTimeSelect(30)}
                className={`px-8 py-4 rounded-2xl font-medium transition-all duration-500 transform hover:scale-105 ${
                  selectedMinutes === 30
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                <div className="text-2xl font-bold">30</div>
                <div className="text-sm opacity-80">minutes</div>
              </button>
            </div>
          </div>
        </div>

        {/* Timer Display - Osmo Supply Dark Style */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl shadow-black/20">
            
            {/* Timer Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-white mb-2">Your Prayer Session</h3>
              <p className="text-slate-300">Take time to connect with God</p>
            </div>

            {/* Timer Circle - Modern Dark Design */}
            <div className="flex justify-center mb-8">
              <div className="relative w-80 h-80">
                {/* Background Circle */}
                <div className="absolute inset-0 bg-slate-700 rounded-full border border-slate-600"></div>
                
                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgb(71 85 105)"
                    strokeWidth="3"
                  />
                  {/* Animated Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgb(59 130 246)"
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - (selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60))}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                
                {/* Center Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      {Math.round(((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100)}% complete
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prayer Message Card */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 border border-slate-600 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <p className="text-lg text-slate-200 font-medium mb-2">Focus for today</p>
                <p className="text-slate-300">{prayerMessage}</p>
              </div>
            </div>

            {/* Control Buttons - Osmo Style */}
            <div className="flex justify-center space-x-4">
              {!prayerCompleted ? (
                <button
                  onClick={() => setIsPraying(!isPraying)}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    isPraying
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                  }`}
                >
                  {isPraying ? 'Pause Prayer' : 'Continue Prayer'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setPrayerCompleted(false);
                    setTimeRemaining(selectedMinutes * 60);
                    setIsPraying(true);
                  }}
                  className="px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  Start New Prayer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reminder - Osmo Dark Style */}
        {showReminder && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800/90 backdrop-blur-xl border border-slate-600 text-white px-8 py-6 rounded-2xl shadow-xl z-40 max-w-sm text-center">
            <p className="text-base font-medium">{focusReminders[currentReminderIndex]}</p>
          </div>
        )}



      {/* Bottom Navigation - Osmo Supply Dark Style */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60] pointer-events-auto">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 shadow-xl shadow-black/20">
          <div className="flex items-center space-x-2">
            {/* Community Tab */}
            <button
              onClick={() => onNavigate?.('community')}
              className="flex flex-col items-center space-y-1 px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-700 transition-all duration-300 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">👥</span>
              <span className="text-xs font-medium">Community</span>
            </button>
            
            {/* Bible Quest Tab */}
            <button
              onClick={() => onNavigate?.('runner')}
              className="flex flex-col items-center space-y-1 px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-700 transition-all duration-300 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">📖</span>
              <span className="text-xs font-medium">Bible Quest</span>
            </button>
            
            {/* Home Tab */}
            <button
              onClick={() => {
                // Home tab clicked
                
                // Check if user has already completed questionnaire in localStorage
                const hasCompleted = localStorage.getItem('hasCompletedQuestionnaire')
                // Check if user has already completed questionnaire
                if (isFirstTimeUser && !hasCompleted) {
                  onStartQuestionnaire?.();
                } else {
                  onNavigate?.('dashboard');
                }
              }}
              className="flex flex-col items-center space-y-1 px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-700 transition-all duration-300 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">🏠</span>
              <span className="text-xs font-medium">Home</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
